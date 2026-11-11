import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estadoTurnoCombateInicial, estadoTurnoCombateValido, carregarEstadoTurnoCombate, estadoTurnoCombateCompostoLegadoReconhecido, aplicarReacaoDefensivaCombate,
  iniciarTurnoCombate, encerrarTurnoCombate,
  aplicarManobraCombate, aplicarReacaoCombate, registrarFinalizacaoDupla,
} from '../src/estadoTurnoCombate.ts';
import { registrarDisparada, registrarFuga, registrarMirar, registrarAtaque } from '../src/manobrasOperacionais.ts';
import { registrarReacaoDefensiva, avaliarJanelaReacao, avaliarAtaqueOportunidade, registrarAtaqueOportunidade, prepararContraAtaque } from '../src/reacoesCombate.ts';

test('estado integrado nasce versionado e valida sua estrutura completa', () => {
  const estado = estadoTurnoCombateInicial(4);
  assert.equal(estado.versao, 1);
  assert.equal(estado.movimentosAdicionaisConcedidos, 0);
  assert.equal(estado.ataqueAdicionalAutorizado, false);
  assert.equal(estado.proximoTurnoComprometido, false);
  assert.equal(estado.reacaoDefensivaRegistrada, false);
  assert.equal(estadoTurnoCombateValido(estado), true);
  assert.equal(estadoTurnoCombateValido({ ...estado, campoExtra: true }), false);
  assert.equal(estadoTurnoCombateValido({ ...estado, manobras: { ...estado.manobras, fugaUsada: true } }), false);
});

test('transições de turno renovam marcadores por turno e preservam Mirar até o próximo Ataque', () => {
  let estado = estadoTurnoCombateInicial(4);
  estado = aplicarManobraCombate(estado, registrarMirar).estado;
  estado = aplicarManobraCombate(estado, registrarDisparada).estado;
  estado = encerrarTurnoCombate(estado);
  assert.equal(estado.manobras.disparadaUsada, true);
  estado = iniciarTurnoCombate(estado);
  assert.equal(estado.manobras.disparadaUsada, false);
  assert.equal(estado.manobras.fugaUsada, false);
  assert.equal(estado.manobras.mirarPreparado, true);
  estado = aplicarManobraCombate(estado, registrarAtaque).estado;
  assert.equal(estado.manobras.mirarPreparado, false);
});

test('Manobras encadeadas preservam Economia e marcadores no mesmo estado', () => {
  let estado = estadoTurnoCombateInicial(5);
  estado = aplicarManobraCombate(estado, registrarDisparada).estado;
  estado = aplicarManobraCombate(estado, registrarFuga).estado;
  assert.equal(estado.economia.saAtual, 4);
  assert.equal(estado.economia.saGastaNaJanela, 1);
  assert.equal(estado.manobras.disparadaUsada, true);
  assert.equal(estado.manobras.fugaUsada, true);
  assert.equal(estado.movimentosAdicionaisConcedidos, 2);
});

test('Reação defensiva fica identificada no estado persistente para Contra-Ataque Instintivo', () => {
  let estado = estadoTurnoCombateInicial(4);
  const janela = avaliarJanelaReacao({
    resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: true,
  });
  estado = aplicarReacaoDefensivaCombate(estado, economia =>
    registrarReacaoDefensiva({ economia, manobra: 'esquivar', janela }),
  ).estado;
  assert.equal(estado.reacaoDefensivaRegistrada, true);
  const recarregado = carregarEstadoTurnoCombate(estado, null, 4);
  assert.equal(recarregado.valido, true);
  assert.equal(recarregado.estado.reacaoDefensivaRegistrada, true);
  const proximoTurno = iniciarTurnoCombate(encerrarTurnoCombate(recarregado.estado));
  assert.equal(proximoTurno.reacaoDefensivaRegistrada, false);
});

test('Reação defensiva atualiza Economia sem apagar estado das Manobras', () => {
  let estado = estadoTurnoCombateInicial(4);
  estado = aplicarManobraCombate(estado, registrarDisparada).estado;
  const janela = avaliarJanelaReacao({
    resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
  });
  const aplicado = aplicarReacaoCombate(estado, economia =>
    registrarReacaoDefensiva({ economia, manobra: 'aparar', janela }),
  );
  estado = aplicado.estado;
  assert.equal(estado.economia.normaisUsados.reacao, true);
  assert.equal(estado.manobras.disparadaUsada, true);
});

test('transição inválida falha sem alterar o estado original', () => {
  const estado = estadoTurnoCombateInicial(3);
  assert.throws(() => aplicarManobraCombate(estado, () => ({
    economia: { saAtual: -1 }, manobras: estado.manobras,
    movimentosAdicionais: 0, ataqueAdicionalAutorizado: false,
  })), /Resultado da Manobra inválido/);
  assert.equal(estado.economia.saAtual, 3);
  assert.equal(estadoTurnoCombateValido(estado), true);
});

test('não inicia dois turnos próprios nem encerra turno inativo', () => {
  const estado = estadoTurnoCombateInicial(3);
  assert.throws(() => iniciarTurnoCombate(estado), /já está em andamento/);
  assert.throws(() => encerrarTurnoCombate(encerrarTurnoCombate(estado)), /Não há turno próprio/);
});


test('migração legada preserva a Economia e cria marcadores de Manobras sem gravar automaticamente', () => {
  const legado = estadoTurnoCombateInicial(5).economia;
  const resultado = carregarEstadoTurnoCombate(null, legado, 4);
  assert.equal(resultado.valido, true);
  assert.equal(resultado.origem, 'legado');
  assert.equal(resultado.estado.economia.saAtual, 4);
  assert.equal(resultado.estado.economia.turnoEmAndamento, true);
  assert.equal(resultado.estado.manobras.disparadaUsada, false);
  assert.equal(resultado.estado.movimentosAdicionaisConcedidos, 0);
  assert.equal(resultado.estado.ataqueAdicionalAutorizado, false);
  assert.equal(legado.saAtual, 5);
});

test('registro composto inválido bloqueia fallback para legado, sem sobrescrever dados', () => {
  const legado = estadoTurnoCombateInicial(5).economia;
  const resultado = carregarEstadoTurnoCombate({ versao: 99 }, legado, 5);
  assert.equal(resultado.valido, false);
  assert.equal(resultado.origem, 'composto');
  assert.equal(legado.saAtual, 5);
});

test('sincronização de SA externo preserva gastos e marcadores integrados', () => {
  let estado = estadoTurnoCombateInicial(5);
  estado = aplicarManobraCombate(estado, registrarDisparada).estado;
  const carregado = carregarEstadoTurnoCombate(estado, null, 3);
  assert.equal(carregado.valido, true);
  assert.equal(carregado.estado.economia.saAtual, 3);
  assert.equal(carregado.estado.economia.saGastaNaJanela, 0);
  assert.equal(carregado.estado.manobras.disparadaUsada, true);
});


test('Combate com Duas Armas mantém autorização do Ataque adicional no estado composto', async () => {
  const { registrarCombateDuasArmas } = await import('../src/manobrasOperacionais.ts');
  let estado = estadoTurnoCombateInicial(3);
  estado = aplicarManobraCombate(estado, registrarAtaque).estado;
  estado = aplicarManobraCombate(estado, (economia, manobras) => registrarCombateDuasArmas(economia, manobras, true)).estado;
  assert.equal(estado.ataqueAdicionalAutorizado, true);
  assert.equal(estado.economia.normaisUsados.acaoBonus, true);
});


test('registrar resolução do Ataque adicional consome apenas a autorização, sem gastar outra Ação', async () => {
  const { registrarCombateDuasArmas } = await import('../src/manobrasOperacionais.ts');
  const { registrarResolucaoAtaqueAdicional } = await import('../src/estadoTurnoCombate.ts');
  let estado = estadoTurnoCombateInicial(3);
  estado = aplicarManobraCombate(estado, registrarAtaque).estado;
  estado = aplicarManobraCombate(estado, (economia, manobras) => registrarCombateDuasArmas(economia, manobras, true)).estado;
  const antes = estado.economia;
  const resolvido = registrarResolucaoAtaqueAdicional(estado);
  assert.equal(resolvido.ataqueAdicionalAutorizado, false);
  assert.equal(resolvido.manobras.combateDuasArmasUsado, true);
  assert.deepEqual(resolvido.economia, antes);
  assert.throws(() => registrarResolucaoAtaqueAdicional(resolvido), /Não há Ataque adicional/);
});


test('Ataque adicional não pode ser registrado depois do encerramento do turno', async () => {
  const { registrarCombateDuasArmas } = await import('../src/manobrasOperacionais.ts');
  const { registrarResolucaoAtaqueAdicional } = await import('../src/estadoTurnoCombate.ts');
  let estado = estadoTurnoCombateInicial(3);
  estado = aplicarManobraCombate(estado, registrarAtaque).estado;
  estado = aplicarManobraCombate(estado, (economia, manobras) => registrarCombateDuasArmas(economia, manobras, true)).estado;
  estado = encerrarTurnoCombate(estado);
  assert.throws(() => registrarResolucaoAtaqueAdicional(estado), /durante o próprio turno/);
});

test('migra formatos compostos históricos conhecidos sem descartar economia ou marcadores existentes', () => {
  const atual = estadoTurnoCombateInicial(5);
  const antigoSemMarcadores = {
    versao: 1,
    economia: atual.economia,
    manobras: { disparadaUsada: true, fugaUsada: true, mirarPreparado: true, combateDuasArmasUsado: false },
  };
  const antigoComMarcadores = {
    ...antigoSemMarcadores,
    movimentosAdicionaisConcedidos: 2,
    ataqueAdicionalAutorizado: true,
  };
  const antigoComMarcadoresEAtaque = {
    ...antigoComMarcadores,
    manobras: { ...antigoComMarcadores.manobras, ataqueNormalRealizado: true },
  };

  for (const legado of [antigoSemMarcadores, antigoComMarcadores, antigoComMarcadoresEAtaque]) {
    assert.equal(estadoTurnoCombateCompostoLegadoReconhecido(legado), true);
    const carregado = carregarEstadoTurnoCombate(legado, null, 4);
    assert.equal(carregado.valido, true);
    assert.equal(carregado.origem, 'composto');
    assert.equal(carregado.estado.economia.saAtual, 4);
    assert.equal(carregado.estado.manobras.ataqueNormalRealizado, 'ataqueNormalRealizado' in legado.manobras ? true : false);
    assert.equal(legado.economia.saAtual, 5);
  }

  const comMarcadores = carregarEstadoTurnoCombate(antigoComMarcadores, null, 5).estado;
  assert.equal(comMarcadores.movimentosAdicionaisConcedidos, 2);
  assert.equal(comMarcadores.ataqueAdicionalAutorizado, true);
  const semMarcadores = carregarEstadoTurnoCombate(antigoSemMarcadores, null, 5).estado;
  assert.equal(semMarcadores.movimentosAdicionaisConcedidos, 0);
  assert.equal(semMarcadores.ataqueAdicionalAutorizado, false);
});

test('não migra estado composto histórico com estrutura ou tipos desconhecidos', () => {
  const atual = estadoTurnoCombateInicial(3);
  const extra = { versao: 1, economia: atual.economia, manobras: { ...atual.manobras }, campoNovo: true };
  const tipoInvalido = { versao: 1, economia: atual.economia, manobras: { disparadaUsada: false, fugaUsada: false, mirarPreparado: false, combateDuasArmasUsado: false } };
  tipoInvalido.manobras.disparadaUsada = 'sim';
  assert.equal(estadoTurnoCombateCompostoLegadoReconhecido(extra), false);
  assert.equal(estadoTurnoCombateCompostoLegadoReconhecido(tipoInvalido), false);
  assert.equal(carregarEstadoTurnoCombate(extra, null, 3).valido, false);
});



test('Finalização Dupla consome Reação + 3 SA e compromete Ação e Movimento do próximo turno', () => {
  let estado = estadoTurnoCombateInicial(6);
  const contexto = { aliadoFinalizou: true, alvoSobreviveu: true, personagemAindaNaoAgioNaRodada: true };
  estado = registrarFinalizacaoDupla(estado, contexto);
  assert.equal(estado.economia.saAtual, 3);
  assert.equal(estado.economia.saGastaNaJanela, 3);
  assert.equal(estado.economia.normaisUsados.reacao, true);
  assert.equal(estado.economia.normaisUsados.acao, false);
  assert.equal(estado.economia.normaisUsados.movimento, false);
  assert.equal(estado.proximoTurnoComprometido, true);
  const recarregado = carregarEstadoTurnoCombate(estado, null, 3);
  assert.equal(recarregado.valido, true);
  assert.equal(recarregado.estado.proximoTurnoComprometido, true);
  estado = recarregado.estado;

  estado = encerrarTurnoCombate(estado);
  estado = iniciarTurnoCombate(estado);
  assert.equal(estado.economia.normaisUsados.acao, true);
  assert.equal(estado.economia.normaisUsados.movimento, true);
  assert.equal(estado.economia.normaisUsados.acaoBonus, false);
  assert.equal(estado.economia.interacaoGratuitaUsada, false);
  assert.equal(estado.proximoTurnoComprometido, false);
});

test('Finalização Dupla exige contexto explícito, Reação disponível e 3 SA na janela', () => {
  const estado = estadoTurnoCombateInicial(6);
  const contexto = { aliadoFinalizou: true, alvoSobreviveu: true, personagemAindaNaoAgioNaRodada: true };
  assert.throws(() => registrarFinalizacaoDupla(estado, { ...contexto, alvoSobreviveu: false }), /exige confirmação/);
  assert.throws(() => registrarFinalizacaoDupla(estado, { ...contexto, extra: true }), /exige confirmação/);
  const reacaoUsada = { ...estado, economia: { ...estado.economia, normaisUsados: { ...estado.economia.normaisUsados, reacao: true } } };
  assert.throws(() => registrarFinalizacaoDupla(reacaoUsada, contexto), /Reação disponível/);
  const SAInsuficiente = { ...estado, economia: { ...estado.economia, saAtual: 5, saGastaNaJanela: 1 } };
  assert.throws(() => registrarFinalizacaoDupla(SAInsuficiente, contexto), /limite de 3 SA/);
  assert.equal(estado.economia.saAtual, 6);
  assert.equal(estado.proximoTurnoComprometido, false);
});

test('migração de estado composto anterior adiciona compromisso falso sem perder marcadores', () => {
  const atual = estadoTurnoCombateInicial(5);
  const legado = {
    versao: 1,
    economia: atual.economia,
    manobras: { ...atual.manobras },
    movimentosAdicionaisConcedidos: 2,
    ataqueAdicionalAutorizado: true,
  };
  assert.equal(estadoTurnoCombateCompostoLegadoReconhecido(legado), true);
  const migrado = carregarEstadoTurnoCombate(legado, null, 5);
  assert.equal(migrado.valido, true);
  assert.equal(migrado.estado.movimentosAdicionaisConcedidos, 2);
  assert.equal(migrado.estado.ataqueAdicionalAutorizado, true);
  assert.equal(migrado.estado.proximoTurnoComprometido, false);
  assert.equal(migrado.estado.reacaoDefensivaRegistrada, false);
});


test('Ataque de Oportunidade integra a Reação ao estado persistente sem interromper Movimento', () => {
  let estado = estadoTurnoCombateInicial(4);
  const gatilho = avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  });
  estado = aplicarReacaoCombate(estado, economia =>
    registrarAtaqueOportunidade({ economia, gatilho }),
  ).estado;
  assert.equal(estado.economia.normaisUsados.reacao, true);
  assert.equal(estado.economia.saAtual, 4);
  const recarregado = carregarEstadoTurnoCombate(estado, null, 4);
  assert.equal(recarregado.valido, true);
  assert.equal(recarregado.estado.economia.normaisUsados.reacao, true);
  assert.equal(recarregado.estado.economia.saAtual, 4);
  assert.equal(gatilho.interrompeMovimento, false);
});

test('Ataque de Oportunidade após Reação normal compra Reação adicional e persiste o gasto de SA', () => {
  let estado = estadoTurnoCombateInicial(3);
  estado = aplicarReacaoCombate(estado, economia =>
    registrarReacaoDefensiva({
      economia,
      manobra: 'aparar',
      janela: avaliarJanelaReacao({
        resultadoAtaque: 12, dadoNaturalAtaque: 12, ataqueCorpoACorpo: true,
        ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
      }),
    }),
  ).estado;
  const gatilho = avaliarAtaqueOportunidade({
    saiuVoluntariamente: true, saiuQuadradoAmeacado: true, protegidoContraGatilho: false,
  });
  estado = aplicarReacaoCombate(estado, economia =>
    registrarAtaqueOportunidade({ economia, gatilho }),
  ).estado;
  assert.equal(estado.economia.saAtual, 2);
  assert.equal(estado.economia.saGastaNaJanela, 1);
  assert.equal(estado.economia.comprasEsforco.reacao, 1);
  const recarregado = carregarEstadoTurnoCombate(estado, null, 2);
  assert.equal(recarregado.valido, true);
  assert.equal(recarregado.estado.economia.comprasEsforco.reacao, 1);
});


test('Contra-Ataque integra Reação normal + 1 SA e persiste o registro', () => {
  const janela = avaliarJanelaReacao({
    resultadoAtaque: 13, dadoNaturalAtaque: 13, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
  });
  let estado = estadoTurnoCombateInicial(4);
  estado = aplicarReacaoCombate(estado, economia =>
    registrarReacaoDefensiva({ economia, manobra: 'aparar', janela }),
  ).estado;
  estado = aplicarReacaoCombate(estado, economia =>
    prepararContraAtaque({
      economia, defesaBemSucedida: true, ataqueCorpoACorpo: true,
      mesmaReacaoAutorizada: false,
    }),
  ).estado;
  assert.equal(estado.economia.saAtual, 3);
  assert.equal(estado.economia.saGastaNaJanela, 1);
  assert.equal(estado.economia.normaisUsados.reacao, true);
  const recarregado = carregarEstadoTurnoCombate(estado, null, 3);
  assert.equal(recarregado.valido, true);
  assert.equal(recarregado.estado.economia.saAtual, 3);
  assert.equal(recarregado.estado.economia.saGastaNaJanela, 1);
});

test('Contra-Ataque Instintivo reutiliza a Reação da defesa confirmada sem comprar outra', () => {
  const janela = avaliarJanelaReacao({
    resultadoAtaque: 13, dadoNaturalAtaque: 13, ataqueCorpoACorpo: true,
    ataqueAcertou: true, ataqueAparavel: true, gatilhoEsquivaAutorizado: false,
  });
  let estado = estadoTurnoCombateInicial(4);
  estado = aplicarReacaoCombate(estado, economia =>
    registrarReacaoDefensiva({ economia, manobra: 'aparar', janela }),
  ).estado;
  estado = aplicarReacaoCombate(estado, economia =>
    prepararContraAtaque({
      economia, defesaBemSucedida: true, ataqueCorpoACorpo: true,
      mesmaReacaoAutorizada: true,
    }),
  ).estado;
  assert.equal(estado.economia.saAtual, 3);
  assert.equal(estado.economia.saGastaNaJanela, 1);
  assert.equal(estado.economia.comprasEsforco.reacao, 0);
});

test('Contra-Ataque padrão compra Reação adicional se a normal já foi usada', () => {
  let estado = estadoTurnoCombateInicial(4);
  estado = aplicarReacaoCombate(estado, economia => ({
    economia: { ...economia, normaisUsados: { ...economia.normaisUsados, reacao: true } },
  })).estado;
  estado = aplicarReacaoCombate(estado, economia =>
    prepararContraAtaque({
      economia, defesaBemSucedida: true, ataqueCorpoACorpo: true,
      mesmaReacaoAutorizada: false,
    }),
  ).estado;
  assert.equal(estado.economia.saAtual, 2);
  assert.equal(estado.economia.saGastaNaJanela, 2);
  assert.equal(estado.economia.comprasEsforco.reacao, 1);
});


test('Não Vai Escapar integra Reação, custo opcional e estado persistente', async () => {
  const { avaliarNaoVaiEscapar, registrarNaoVaiEscapar } = await import('../src/reacoesCombate.ts');
  let estado = estadoTurnoCombateInicial(3);
  const avaliacao = avaliarNaoVaiEscapar({
    habilidadeAtiva: true, criaturaProvocouAtaqueDeOportunidade: true,
    gatilhoFoiParaVoceOuAliado: true, combateCorpoACorpo: true,
  });
  estado = aplicarReacaoCombate(estado, economia =>
    registrarNaoVaiEscapar({ economia, avaliacao }),
  ).estado;
  assert.equal(estado.economia.normaisUsados.reacao, true);
  const recarregado = carregarEstadoTurnoCombate(estado, null, 3);
  assert.equal(recarregado.valido, true);
  assert.equal(recarregado.estado.economia.normaisUsados.reacao, true);
});
