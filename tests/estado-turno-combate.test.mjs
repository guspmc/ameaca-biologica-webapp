import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estadoTurnoCombateInicial, estadoTurnoCombateValido, carregarEstadoTurnoCombate, estadoTurnoCombateCompostoLegadoReconhecido,
  iniciarTurnoCombate, encerrarTurnoCombate,
  aplicarManobraCombate, aplicarReacaoCombate,
} from '../src/estadoTurnoCombate.ts';
import { registrarDisparada, registrarFuga, registrarMirar, registrarAtaque } from '../src/manobrasOperacionais.ts';
import { registrarReacaoDefensiva, avaliarJanelaReacao } from '../src/reacoesCombate.ts';

test('estado integrado nasce versionado e valida sua estrutura completa', () => {
  const estado = estadoTurnoCombateInicial(4);
  assert.equal(estado.versao, 1);
  assert.equal(estado.movimentosAdicionaisConcedidos, 0);
  assert.equal(estado.ataqueAdicionalAutorizado, false);
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


test('migra economias legadas no formato simples e composto sem perder gastos já registrados', () => {
  const atual = estadoTurnoCombateInicial(5);
  const economiaAntiga = {
    saAtual: 4, saGastaNaJanela: 2,
    normaisUsados: { acao: false, movimento: false, acaoBonus: false, reacao: true },
    comprasEsforco: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    interacaoGratuitaUsada: false, turnoEmAndamento: false,
  };
  const simples = carregarEstadoTurnoCombate(null, economiaAntiga, 3);
  assert.equal(simples.valido, true);
  assert.equal(simples.estado.economia.saAtual, 3);
  assert.equal(simples.estado.economia.saGastaNaJanela, 2);
  assert.equal(simples.estado.economia.janelaEsforcoAtiva, true);

  const compostoAntigo = { ...atual, economia: economiaAntiga };
  assert.equal(estadoTurnoCombateCompostoLegadoReconhecido(compostoAntigo), true);
  const migrado = carregarEstadoTurnoCombate(compostoAntigo, null, 3);
  assert.equal(migrado.valido, true);
  assert.equal(migrado.estado.economia.saGastaNaJanela, 2);
  assert.equal(migrado.estado.economia.janelaEsforcoAtiva, true);
  assert.equal(economiaAntiga.saAtual, 4);
});
