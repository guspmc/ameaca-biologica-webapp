import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estadoTurnoCombateInicial, estadoTurnoCombateValido, carregarEstadoTurnoCombate,
  iniciarTurnoCombate, encerrarTurnoCombate,
  aplicarManobraCombate, aplicarReacaoCombate,
} from '../src/estadoTurnoCombate.ts';
import { registrarDisparada, registrarFuga, registrarMirar, registrarAtaque } from '../src/manobrasOperacionais.ts';
import { registrarReacaoDefensiva, avaliarJanelaReacao } from '../src/reacoesCombate.ts';

test('estado integrado nasce versionado e valida sua estrutura completa', () => {
  const estado = estadoTurnoCombateInicial(4);
  assert.equal(estado.versao, 1);
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
