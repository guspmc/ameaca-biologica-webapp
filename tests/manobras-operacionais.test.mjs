import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estadoManobrasTurnoInicial, registrarDesengajar, registrarDisparada,
  registrarFuga, registrarMirar, registrarAtaque, registrarAjudar,
  registrarUsarObjeto, registrarCombateDuasArmas,
} from '../src/manobrasOperacionais.ts';
import { economiaAcoesInicial, consumirRecursoNormal } from '../src/economiaAcoes.ts';

test('Desengajar consome Movimento e não simula o deslocamento', () => {
  const r = registrarDesengajar(economiaAcoesInicial(3));
  assert.equal(r.economia.normaisUsados.movimento, true);
  assert.equal(r.movimentosAdicionais, 0);
});

test('Disparada converte Ação em Movimento adicional sem gastar SA', () => {
  const r = registrarDisparada(economiaAcoesInicial(3), estadoManobrasTurnoInicial());
  assert.equal(r.economia.normaisUsados.acao, true);
  assert.equal(r.economia.saAtual, 3);
  assert.equal(r.movimentosAdicionais, 1);
  assert.equal(r.manobras.disparadaUsada, true);
});

test('Fuga exige Disparada, gasta 1 SA e concede o terceiro Movimento', () => {
  const inicial = estadoManobrasTurnoInicial();
  assert.throws(() => registrarFuga(economiaAcoesInicial(3), inicial), /exige Disparada/);
  const disparada = registrarDisparada(economiaAcoesInicial(3), inicial);
  const fuga = registrarFuga(disparada.economia, disparada.manobras);
  assert.equal(fuga.economia.saAtual, 2);
  assert.equal(fuga.economia.saGastaNaJanela, 1);
  assert.equal(fuga.movimentosAdicionais, 1);
  assert.equal(fuga.manobras.fugaUsada, true);
  assert.throws(() => registrarFuga(fuga.economia, fuga.manobras), /já foi utilizada/);
});

test('Mirar gasta 1 SA e prepara bônus sem executar Ataque', () => {
  const r = registrarMirar(economiaAcoesInicial(3), estadoManobrasTurnoInicial());
  assert.equal(r.economia.saAtual, 2);
  assert.equal(r.manobras.mirarPreparado, true);
  assert.equal(r.economia.normaisUsados.acao, false);
});

test('Ataque consome Ação e consome a preparação de Mirar', () => {
  const mirar = registrarMirar(economiaAcoesInicial(3), estadoManobrasTurnoInicial());
  const ataque = registrarAtaque(mirar.economia, mirar.manobras);
  assert.equal(ataque.economia.normaisUsados.acao, true);
  assert.equal(ataque.manobras.mirarPreparado, false);
});

test('Ajudar e Usar um Objeto consomem Ação sem resolver a tarefa', () => {
  assert.equal(registrarAjudar(economiaAcoesInicial(2)).economia.normaisUsados.acao, true);
  assert.equal(registrarUsarObjeto(economiaAcoesInicial(2)).economia.normaisUsados.acao, true);
});

test('Combate com Duas Armas consome Ação Bônus uma vez após Ataque elegível', () => {
  const estado = estadoManobrasTurnoInicial();
  assert.throws(() => registrarCombateDuasArmas(economiaAcoesInicial(3), estado, false), /não cumpre/);
  const r = registrarCombateDuasArmas(economiaAcoesInicial(3), estado, true);
  assert.equal(r.economia.normaisUsados.acaoBonus, true);
  assert.equal(r.ataqueAdicionalAutorizado, true);
  assert.throws(() => registrarCombateDuasArmas(r.economia, r.manobras, true), /já foi utilizado/);
});

test('Manobras respeitam disponibilidade e a janela de SA', () => {
  const acaoUsada = consumirRecursoNormal(economiaAcoesInicial(3), 'acao');
  assert.throws(() => registrarDisparada(acaoUsada, estadoManobrasTurnoInicial()), /já foi utilizado/);
  const noLimite = { ...economiaAcoesInicial(3), saAtual: 0, saGastaNaJanela: 3 };
  assert.throws(() => registrarMirar(noLimite, estadoManobrasTurnoInicial()), /SA insuficiente|limite de 3 SA/);
});
