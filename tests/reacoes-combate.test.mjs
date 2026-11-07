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
  const resultado = prepararContraAtaque({ economia: economiaAcoesInicial(3), defesaBemSucedida: true, ataqueCorpoACorpo: true, mesmaReacaoAutorizada: true });
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
