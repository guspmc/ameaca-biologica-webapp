import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarJanelaReacao, resolverTesteDefensivo, prepararContraAtaque } from '../src/reacoesCombate.ts';
import { economiaAcoesInicial, consumirRecursoNormal, encerrarTurnoAcoes } from '../src/economiaAcoes.ts';

test('20 natural fecha a janela defensiva, independentemente de margem ampliada', () => {
  const janela = avaliarJanelaReacao({ resultadoAtaque: 19, dadoNaturalAtaque: 20, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: true });
  assert.equal(janela.aberta, false);
  assert.equal(janela.podeAparar, false);
  assert.equal(janela.podeEsquivar, false);
});

test('19 natural não fecha janela; precisa alcançar Defesa e conserva reação', () => {
  const janela = avaliarJanelaReacao({ resultadoAtaque: 19, dadoNaturalAtaque: 19, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false });
  assert.equal(janela.aberta, true);
  assert.equal(janela.podeAparar, true);
});

test('Aparar só é universal contra Ataque corpo a corpo bem-sucedido e aparável', () => {
  const base = { resultadoAtaque: 14, dadoNaturalAtaque: 14, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false };
  assert.equal(avaliarJanelaReacao(base).podeAparar, true);
  assert.equal(avaliarJanelaReacao({ ...base, ataqueCorpoACorpo: false }).podeAparar, false);
  assert.equal(avaliarJanelaReacao({ ...base, ataqueAcertou: false }).podeAparar, false);
  assert.equal(avaliarJanelaReacao({ ...base, ataqueAparavel: false }).podeAparar, false);
});

test('Esquiva exige gatilho autorizado por Habilidade ou regra', () => {
  const janela = avaliarJanelaReacao({ resultadoAtaque: 14, dadoNaturalAtaque: 14, ataqueCorpoACorpo: false, ataqueAcertou: false, ataqueAparavel: false, gatilhoEsquivaAutorizado: true });
  assert.equal(janela.podeEsquivar, true);
  assert.equal(janela.podeAparar, false);
});

test('Aparar usa Luta e Esquivar usa Reflexos contra resultado do Ataque', () => {
  assert.equal(resolverTesteDefensivo({ tipo: 'aparar', valorLuta: 5, resultadoAtaque: 14, dado1: 9 }).estado, 'sucesso');
  assert.equal(resolverTesteDefensivo({ tipo: 'esquivar', valorReflexos: 4, resultadoAtaque: 14, dado1: 9 }).estado, 'falha');
  assert.equal(resolverTesteDefensivo({ tipo: 'aparar', valorLuta: 5, resultadoAtaque: 14, dado1: 20 }).estado, 'critico-sucesso');
});

test('Contra-Ataque exige defesa bem-sucedida e gasta 1 SA em Manobra', () => {
  assert.throws(() => prepararContraAtaque({ economia: economiaAcoesInicial(3), defesaBemSucedida: false, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: false }), /bem-sucedido/);
  const economiaComReacao = consumirRecursoNormal(economiaAcoesInicial(3), 'reacao');
  const resultado = prepararContraAtaque({ economia: economiaComReacao, defesaBemSucedida: true, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: true });
  assert.equal(resultado.economia.saAtual, 2);
  assert.equal(resultado.economia.saGastaNaJanela, 1);
  assert.equal(resultado.reacaoAdicionalComprada, false);
});

test('Contra-Ataque normal exige Reação; se já usada, compra Reação adicional por Esforço', () => {
  let economia = consumirRecursoNormal(economiaAcoesInicial(3), 'reacao');
  const resultado = prepararContraAtaque({ economia, defesaBemSucedida: true, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: false });
  assert.equal(resultado.economia.saAtual, 1);
  assert.equal(resultado.economia.saGastaNaJanela, 2);
  assert.equal(resultado.reacaoAdicionalComprada, true);
  assert.equal(resultado.custoSA, 2);
});

test('Contra-Ataque Instintivo pode usar a mesma Reação, conforme Habilidade', () => {
  let economia = consumirRecursoNormal(economiaAcoesInicial(2), 'reacao');
  economia = encerrarTurnoAcoes(economia);
  const resultado = prepararContraAtaque({ economia, defesaBemSucedida: true, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: true });
  assert.equal(resultado.economia.saAtual, 1);
  assert.equal(resultado.economia.normaisUsados.reacao, true);
});

test('Aparar reduz 1 de Durabilidade quando a automação está habilitada', async () => {
  const { registrarUsoAparar } = await import('../src/reacoesCombate.ts');
  assert.deepEqual(registrarUsoAparar({ item: { durabilidadeAtual: 3, indestrutivel: false }, automacaoAtiva: true }), { durabilidadeAtual: 2, indestrutivel: false });
});

test('Aparar não reduz Durabilidade no modo Manual ou quando Misto está desligado', async () => {
  const { registrarUsoAparar } = await import('../src/reacoesCombate.ts');
  const item = { durabilidadeAtual: 3, indestrutivel: false };
  assert.deepEqual(registrarUsoAparar({ item, automacaoAtiva: false }), item);
});

test('Indestrutível não perde Durabilidade e Durabilidade 0 impede Aparar', async () => {
  const { registrarUsoAparar } = await import('../src/reacoesCombate.ts');
  const item = { durabilidadeAtual: null, indestrutivel: true };
  assert.deepEqual(registrarUsoAparar({ item, automacaoAtiva: true }), item);
  assert.throws(() => registrarUsoAparar({ item: { durabilidadeAtual: 0, indestrutivel: false }, automacaoAtiva: true }), /não pode Aparar/);
});

test('Reação defensiva usa a Reação normal disponível', async () => {
  const { registrarReacaoDefensiva } = await import('../src/reacoesCombate.ts');
  const janela = avaliarJanelaReacao({ resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false });
  const resultado = registrarReacaoDefensiva({ economia: economiaAcoesInicial(3), manobra: 'aparar', janela });
  assert.equal(resultado.economia.normaisUsados.reacao, true);
  assert.equal(resultado.economia.saAtual, 3);
  assert.equal(resultado.reacaoAdicionalComprada, false);
});

test('Reação defensiva compra outra Reação por Esforço quando a normal já foi usada', async () => {
  const { registrarReacaoDefensiva } = await import('../src/reacoesCombate.ts');
  const janela = avaliarJanelaReacao({ resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false });
  const economia = consumirRecursoNormal(economiaAcoesInicial(3), 'reacao');
  const resultado = registrarReacaoDefensiva({ economia, manobra: 'aparar', janela });
  assert.equal(resultado.economia.saAtual, 2);
  assert.equal(resultado.economia.comprasEsforco.reacao, 1);
  assert.equal(resultado.reacaoAdicionalComprada, true);
});

test('Reação defensiva não pode ser registrada com janela fechada ou manobra indisponível', async () => {
  const { registrarReacaoDefensiva } = await import('../src/reacoesCombate.ts');
  const fechada = avaliarJanelaReacao({ resultadoAtaque: 20, dadoNaturalAtaque: 20, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: true });
  assert.throws(() => registrarReacaoDefensiva({ economia: economiaAcoesInicial(3), manobra: 'aparar', janela: fechada }), /janela.*fechada/);
  const semAparar = avaliarJanelaReacao({ resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: false, ataqueAcertou: true, ataqueAparavel: false, gatilhoEsquivaAutorizado: false });
  assert.throws(() => registrarReacaoDefensiva({ economia: economiaAcoesInicial(3), manobra: 'aparar', janela: semAparar }), /não está disponível/);
});

test('Contra-Ataque não responde a Ataque à distância sem exceção específica', () => {
  assert.throws(() => prepararContraAtaque({ economia: economiaAcoesInicial(3), defesaBemSucedida: true, ataqueCorpoACorpo: false, mesmaReacaoAutorizada: false }), /apenas a Ataques Corpo a Corpo/);
  const autorizado = prepararContraAtaque({ economia: economiaAcoesInicial(3), defesaBemSucedida: true, ataqueCorpoACorpo: false, excecaoContraAtaqueADistancia: true, mesmaReacaoAutorizada: false });
  assert.equal(autorizado.economia.saAtual, 2);
});


test('gatilhos e autorizações de Reação rejeitam booleanos ou tipos inválidos', () => {
  const base = { resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false };
  assert.throws(() => avaliarJanelaReacao({ ...base, ataqueAcertou: 'sim' }), /válidos/);
  assert.throws(() => avaliarJanelaReacao({ ...base, gatilhoEsquivaAutorizado: 1 }), /válidos/);
  assert.throws(() => resolverTesteDefensivo({ tipo: 'aparar', valorLuta: -1, resultadoAtaque: 12, dado1: 12 }), /Perícia defensiva/);
  assert.throws(() => resolverTesteDefensivo({ tipo: 'bloquear', valorLuta: 2, resultadoAtaque: 12, dado1: 12 }), /desconhecida/);
  assert.throws(() => prepararContraAtaque({ economia: economiaAcoesInicial(2), defesaBemSucedida: true, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: 'sim' }), /autorização.*inválidos/);
});


test('Reação normal disponível pode ser usada fora do próprio turno sem gastar SA', async () => {
  const { registrarReacaoDefensiva } = await import('../src/reacoesCombate.ts');
  const janela = avaliarJanelaReacao({ resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true, ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false });
  const economia = encerrarTurnoAcoes(economiaAcoesInicial(3));
  const resultado = registrarReacaoDefensiva({ economia, manobra: 'aparar', janela });
  assert.equal(resultado.economia.normaisUsados.reacao, true);
  assert.equal(resultado.economia.saAtual, 3);
  assert.equal(resultado.reacaoAdicionalComprada, false);
});

test('Contra-Ataque fora do próprio turno usa Reação normal disponível antes de comprar outra', () => {
  const economia = encerrarTurnoAcoes(economiaAcoesInicial(3));
  const resultado = prepararContraAtaque({ economia, defesaBemSucedida: true, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: false });
  assert.equal(resultado.economia.normaisUsados.reacao, true);
  assert.equal(resultado.economia.saAtual, 2);
  assert.equal(resultado.reacaoAdicionalComprada, false);
  assert.equal(resultado.custoSA, 1);
});

test('Reação defensiva rejeita janela forjada, contraditória ou com campos extras', async () => {
  const { registrarReacaoDefensiva } = await import('../src/reacoesCombate.ts');
  const economia = economiaAcoesInicial(3);
  const valida = avaliarJanelaReacao({
    resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
  });
  assert.throws(() => registrarReacaoDefensiva({
    economia, manobra: 'aparar', janela: { aberta: true, podeAparar: true, podeEsquivar: false },
  }), /Janela de Reação inválida/);
  assert.throws(() => registrarReacaoDefensiva({
    economia, manobra: 'aparar', janela: { ...valida, fechadaPor20Natural: true },
  }), /Janela de Reação inválida/);
  assert.throws(() => registrarReacaoDefensiva({
    economia, manobra: 'aparar', janela: { ...valida, campoExtra: true },
  }), /Janela de Reação inválida/);
  assert.equal(registrarReacaoDefensiva({ economia, manobra: 'aparar', janela: valida }).economia.normaisUsados.reacao, true);
});

test('registro de Reação e Contra-Ataque rejeita economia malformada sem TypeError acidental', async () => {
  const janela = avaliarJanelaReacao({
    resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
  });
  const economiaInvalida = { saAtual: 3, normaisUsados: null };
  assert.throws(() => prepararContraAtaque({
    economia: economiaInvalida, defesaBemSucedida: true,
    ataqueCorpoACorpo: true, mesmaReacaoAutorizada: false,
  }), /economia de ações inválido/);
  const { registrarReacaoDefensiva } = await import('../src/reacoesCombate.ts');
  assert.throws(() => registrarReacaoDefensiva({ economia: economiaInvalida, manobra: 'aparar', janela }), /economia de ações inválido/);
});


test('gatilho de Reação, Teste defensivo e item de Aparar rejeitam estruturas malformadas', async () => {
  const { registrarUsoAparar } = await import('../src/reacoesCombate.ts');
  assert.throws(() => avaliarJanelaReacao(null), /Gatilho de Reação inválido/);
  assert.throws(() => avaliarJanelaReacao({}), /Gatilho de Reação inválido/);
  const gatilho = {
    resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
  };
  assert.throws(() => avaliarJanelaReacao({ ...gatilho, inesperado: true }), /Gatilho de Reação inválido/);
  assert.throws(() => resolverTesteDefensivo({
    tipo: 'aparar', valorLuta: 3, resultadoAtaque: 0, dado1: 10,
  }), /Resultado do Ataque inválido para o Teste defensivo/);
  assert.throws(() => resolverTesteDefensivo({
    tipo: 'aparar', valorLuta: 3, resultadoAtaque: 12, dado1: 10, vantagem: 'qualquer',
  }), /Vantagem\/Desvantagem inválido/);
  assert.throws(() => resolverTesteDefensivo(null), /Dados do Teste defensivo inválidos/);
  assert.throws(() => registrarUsoAparar({
    item: { durabilidadeAtual: 3, indestrutivel: false, propriedadeExtra: true },
    automacaoAtiva: true,
  }), /Estado de Aparar inválido/);
  assert.throws(() => registrarUsoAparar({
    item: null, automacaoAtiva: true,
  }), /Estado de Aparar inválido/);
  assert.deepEqual(registrarUsoAparar({
    item: { durabilidadeAtual: 2, indestrutivel: false }, automacaoAtiva: true,
  }), { durabilidadeAtual: 1, indestrutivel: false });
});


test('Ataque de Oportunidade exige saída voluntária de quadrado ameaçado sem proteção', async () => {
  const { avaliarAtaqueOportunidade } = await import('../src/reacoesCombate.ts');
  assert.equal(avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  }).disponivel, true);
  assert.equal(avaliarAtaqueOportunidade({
    saiuVoluntariamente: false, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  }).disponivel, false);
  assert.equal(avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: false, protegidoContraGatilho: false,
  }).disponivel, false);
  assert.equal(avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: true,
  }).disponivel, false);
});

test('Ataque de Oportunidade consome Reação e nunca interrompe o Movimento por si só', async () => {
  const { avaliarAtaqueOportunidade, registrarAtaqueOportunidade } = await import('../src/reacoesCombate.ts');
  const gatilho = avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  });
  const resultado = registrarAtaqueOportunidade({ economia: economiaAcoesInicial(3), gatilho });
  assert.equal(resultado.economia.normaisUsados.reacao, true);
  assert.equal(resultado.reacaoAdicionalComprada, false);
  assert.equal(resultado.interrompeMovimento, false);
  assert.equal(resultado.interrompeMovimento, false);
});

test('Ataque de Oportunidade compra Reação adicional por Esforço se a normal já foi usada', async () => {
  const { avaliarAtaqueOportunidade, registrarAtaqueOportunidade } = await import('../src/reacoesCombate.ts');
  const gatilho = avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  });
  const economia = consumirRecursoNormal(economiaAcoesInicial(3), 'reacao');
  const resultado = registrarAtaqueOportunidade({ economia, gatilho });
  assert.equal(resultado.economia.saAtual, 2);
  assert.equal(resultado.economia.comprasEsforco.reacao, 1);
  assert.equal(resultado.reacaoAdicionalComprada, true);
  assert.equal(resultado.interrompeMovimento, false);
});

test('Ataque de Oportunidade rejeita gatilhos malformados ou indisponíveis', async () => {
  const { avaliarAtaqueOportunidade, registrarAtaqueOportunidade } = await import('../src/reacoesCombate.ts');
  assert.throws(() => avaliarAtaqueOportunidade(null), /Gatilho de Ataque de Oportunidade inválido/);
  assert.throws(() => avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: false, extra: true,
  }), /Gatilho de Ataque de Oportunidade inválido/);
  const indisponivel = avaliarAtaqueOportunidade({
    saiuVoluntariamente: false, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  });
  assert.throws(() => registrarAtaqueOportunidade({
    economia: economiaAcoesInicial(3), gatilho: indisponivel,
  }), /não está disponível/);
});


test('Contra-Ataque Instintivo autoriza a mesma Reação e Retaliação aplica efeitos somente após defesa bem-sucedida', async () => {
  const { contraAtaqueUsaMesmaReacao, consultarRetaliacao } = await import('../src/reacoesCombate.ts');
  const habilidades = { contraAtaqueInstintivo: true, retaliacao: false, naoVaiEscapar: false, naMinhaMira: false, voceAparouUmMissil: false };
  assert.equal(contraAtaqueUsaMesmaReacao(habilidades), true);
  assert.equal(consultarRetaliacao({ habilidadeAtiva: true, defesaBemSucedida: true }).dadosAdicionaisNoAcerto, 1);
  assert.equal(consultarRetaliacao({ habilidadeAtiva: true, defesaBemSucedida: true }).atordoaAgressor, true);
  assert.deepEqual(consultarRetaliacao({ habilidadeAtiva: true, defesaBemSucedida: false }), { atordoaAgressor: false, contraAtaqueComVantagem: false, dadosAdicionaisNoAcerto: 0 });
});

test('Não Vai Escapar exige provocação em combate Corpo a Corpo para você ou aliado', async () => {
  const { avaliarNaoVaiEscapar } = await import('../src/reacoesCombate.ts');
  const valido = avaliarNaoVaiEscapar({ habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true, gatilhoFoiParaVoceOuAliado: true, combateCorpoACorpo: true });
  assert.equal(valido.disponivel, true);
  assert.equal(valido.deslocamentoMaximoMetros, 3);
  assert.equal(valido.deveTerminarAdjacente, true);
  assert.equal(avaliarNaoVaiEscapar({ habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true, gatilhoFoiParaVoceOuAliado: false, combateCorpoACorpo: true }).disponivel, false);
});

test('Na Minha Mira só dispara com nova Condição penalizante em alvo percebido até Alcance Médio', async () => {
  const { avaliarNaMinhaMira } = await import('../src/reacoesCombate.ts');
  const base = { habilidadeAtiva: true, usoDisponivelNaRodada: true, inimigoPercebido: true, dentroDeAlcanceMedio: true, adquiriuNovaCondicaoPenalizante: true };
  assert.equal(avaliarNaMinhaMira(base).ataqueDeOportunidadeADistancia, true);
  assert.equal(avaliarNaMinhaMira({ ...base, adquiriuNovaCondicaoPenalizante: false }).disponivel, false);
  assert.equal(avaliarNaMinhaMira({ ...base, dentroDeAlcanceMedio: false }).disponivel, false);
});

test('VOCÊ APAROU UM MÍSSIL!? separa interceptação narrativa, Aparar livre e bônus de dano', async () => {
  const { consultarVoceAparouUmMissil } = await import('../src/reacoesCombate.ts');
  const base = { habilidadeAtiva: true, narrativaPermiteInterceptacao: true, gatilhoValidoParaAparar: true, facaOuHatchet: true, turnoProprio: true, acaoLivreJaUsadaNoTurno: false, apararCorpoACorpoBemSucedido: true, contraAtaqueDeclarado: true };
  const efeito = consultarVoceAparouUmMissil(base);
  assert.equal(efeito.podeApararQualquerAtaque, true);
  assert.equal(efeito.apararComAcaoLivre, true);
  assert.equal(efeito.danoApararAdicional, '2d4');
  assert.equal(efeito.finalizarContraAtaqueSemSA, true);
  assert.equal(efeito.danoContraAtaqueAdicional, '2d4');
  assert.equal(consultarVoceAparouUmMissil({ ...base, acaoLivreJaUsadaNoTurno: true }).apararComAcaoLivre, false);
  assert.equal(consultarVoceAparouUmMissil({ ...base, facaOuHatchet: false }).danoApararAdicional, null);
});


test('Contra-Ataque Instintivo não permite ignorar uma Reação que ainda não foi consumida', () => {
  assert.throws(() => prepararContraAtaque({
    economia: economiaAcoesInicial(3), defesaBemSucedida: true,
    ataqueCorpoACorpo: true, mesmaReacaoAutorizada: true,
  }), /Reação usada na defesa já esteja registrada/);
});

test('helpers de Habilidades de Reação rejeitam campos ausentes ou extras', async () => {
  const { contraAtaqueUsaMesmaReacao, consultarRetaliacao, avaliarNaoVaiEscapar, avaliarNaMinhaMira, consultarVoceAparouUmMissil } = await import('../src/reacoesCombate.ts');
  assert.throws(() => contraAtaqueUsaMesmaReacao({ contraAtaqueInstintivo: true }), /Habilidades de Reação inválidas/);
  assert.throws(() => consultarRetaliacao({ habilidadeAtiva: true }), /Dados de Retaliação inválidos/);
  assert.throws(() => avaliarNaoVaiEscapar({ habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true, gatilhoFoiParaVoceOuAliado: true, combateCorpoACorpo: true, extra: true }), /Gatilho de Não Vai Escapar inválido/);
  assert.throws(() => avaliarNaMinhaMira({ habilidadeAtiva: true, usoDisponivelNaRodada: true, inimigoPercebido: true, dentroDeAlcanceMedio: true }), /Gatilho de Na Minha Mira inválido/);
  assert.throws(() => consultarVoceAparouUmMissil({ habilidadeAtiva: true }), /Dados de VOCÊ APAROU UM MÍSSIL/);
});


test('registro de Ataque de Oportunidade rejeita gatilho forjado ou payload com campos extras', async () => {
  const { registrarAtaqueOportunidade } = await import('../src/reacoesCombate.ts');
  const economia = economiaAcoesInicial(3);
  assert.throws(() => registrarAtaqueOportunidade({
    economia, gatilho: { disponivel: true, interrompeMovimento: false, motivo: 'válido', extra: true },
  }), /Dados de registro do Ataque de Oportunidade inválidos/);
  assert.throws(() => registrarAtaqueOportunidade({
    economia, gatilho: { disponivel: true, interrompeMovimento: false, motivo: '   ' },
  }), /Dados de registro do Ataque de Oportunidade inválidos/);
  assert.throws(() => registrarAtaqueOportunidade({
    economia, gatilho: { disponivel: false, interrompeMovimento: false, motivo: 'gatilho indisponível' },
  }), /não está disponível/);
});

test('registro de Durabilidade rejeita payload externo com campos extras', async () => {
  const { registrarUsoAparar } = await import('../src/reacoesCombate.ts');
  assert.throws(() => registrarUsoAparar({
    item: { durabilidadeAtual: 2, indestrutivel: false },
    automacaoAtiva: true, custoExtra: 0,
  }), /Estado de Aparar inválido/);
});


test('Não Vai Escapar registra Reação e deslocamento adjacente de até 3 m', async () => {
  const { avaliarNaoVaiEscapar, registrarNaoVaiEscapar } = await import('../src/reacoesCombate.ts');
  const avaliacao = avaliarNaoVaiEscapar({
    habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true,
    gatilhoFoiParaVoceOuAliado: true, combateCorpoACorpo: true,
  });
  const resultado = registrarNaoVaiEscapar({ economia: economiaAcoesInicial(3), avaliacao });
  assert.equal(resultado.economia.normaisUsados.reacao, true);
  assert.equal(resultado.economia.saAtual, 3);
  assert.equal(resultado.deslocamentoMaximoMetros, 3);
  assert.equal(resultado.deveTerminarAdjacente, true);
});

test('Não Vai Escapar compra Reação adicional quando a normal já foi usada', async () => {
  const { avaliarNaoVaiEscapar, registrarNaoVaiEscapar } = await import('../src/reacoesCombate.ts');
  const avaliacao = avaliarNaoVaiEscapar({
    habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true,
    gatilhoFoiParaVoceOuAliado: true, combateCorpoACorpo: true,
  });
  const economia = consumirRecursoNormal(economiaAcoesInicial(3), 'reacao');
  const resultado = registrarNaoVaiEscapar({ economia, avaliacao });
  assert.equal(resultado.economia.saAtual, 2);
  assert.equal(resultado.economia.comprasEsforco.reacao, 1);
  assert.equal(resultado.reacaoAdicionalComprada, true);
});

test('Não Vai Escapar rejeita gatilho inválido e avaliação forjada', async () => {
  const { avaliarNaoVaiEscapar, registrarNaoVaiEscapar } = await import('../src/reacoesCombate.ts');
  const invalida = avaliarNaoVaiEscapar({
    habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true,
    gatilhoFoiParaVoceOuAliado: false, combateCorpoACorpo: true,
  });
  assert.throws(() => registrarNaoVaiEscapar({ economia: economiaAcoesInicial(3), avaliacao: invalida }), /não está disponível/);
  assert.throws(() => registrarNaoVaiEscapar({
    economia: economiaAcoesInicial(3),
    avaliacao: { disponivel: true, deslocamentoMaximoMetros: 4, deveTerminarAdjacente: true, motivo: 'forjado' },
  }), /Dados de registro de Não Vai Escapar inválidos/);
});
