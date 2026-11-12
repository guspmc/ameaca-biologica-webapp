import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estadoManobrasTurnoInicial, registrarDesengajar, registrarDisparada,
  registrarFuga, registrarMirar, registrarAtaque, registrarAjudar,
  registrarUsarObjeto, registrarCombateDuasArmas, registrarFinalizar,
} from '../src/manobrasOperacionais.ts';
import { economiaAcoesInicial, consumirRecursoNormal } from '../src/economiaAcoes.ts';

test('Desengajar consome Movimento e não simula o deslocamento', () => {
  const r = registrarDesengajar(economiaAcoesInicial(3), estadoManobrasTurnoInicial());
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

test('Ajudar consome Ação sem resolver a tarefa', () => {
  assert.equal(registrarAjudar(economiaAcoesInicial(2), estadoManobrasTurnoInicial()).economia.normaisUsados.acao, true);
});

test('Usar um Objeto exige Interação Gratuita já usada e então consome Ação', () => {
  const economiaInicial = economiaAcoesInicial(2);
  assert.throws(
    () => registrarUsarObjeto(economiaInicial, estadoManobrasTurnoInicial()),
    /Interação Gratuita com Objeto já tenha sido utilizada/,
  );
  const comInteracao = { ...economiaInicial, interacaoGratuitaUsada: true };
  const resultado = registrarUsarObjeto(comInteracao, estadoManobrasTurnoInicial());
  assert.equal(resultado.economia.normaisUsados.acao, true);
  assert.equal(resultado.economia.interacaoGratuitaUsada, true);
});

test('Combate com Duas Armas exige Ação Atacar prévia, turno ativo e elegibilidade', () => {
  const estado = estadoManobrasTurnoInicial();
  const economia = economiaAcoesInicial(3);
  assert.throws(() => registrarCombateDuasArmas(economia, estado, true), /Ação Atacar já tenha sido registrada/);
  const ataqueInelegivel = registrarAtaque(economia, estado);
  assert.throws(() => registrarCombateDuasArmas(ataqueInelegivel.economia, ataqueInelegivel.manobras, false), /não cumpre/);
  const ataqueInicial = registrarAtaque(economia, estado);
  const r = registrarCombateDuasArmas(ataqueInicial.economia, ataqueInicial.manobras, true);
  assert.equal(r.economia.normaisUsados.acaoBonus, true);
  assert.equal(r.ataqueAdicionalAutorizado, true);
  assert.throws(() => registrarCombateDuasArmas(r.economia, r.manobras, true), /já foi utilizado/);
  const turnoEncerrado = { ...ataqueInicial.economia, turnoEmAndamento: false };
  assert.throws(() => registrarCombateDuasArmas(turnoEncerrado, ataqueInicial.manobras, true), /próprio turno/);
});

test('Manobras respeitam disponibilidade e a janela de SA', () => {
  const acaoUsada = consumirRecursoNormal(economiaAcoesInicial(3), 'acao');
  assert.throws(() => registrarDisparada(acaoUsada, estadoManobrasTurnoInicial()), /já foi utilizado/);
  const noLimite = { ...economiaAcoesInicial(3), saAtual: 0, saGastaNaJanela: 3 };
  assert.throws(() => registrarMirar(noLimite, estadoManobrasTurnoInicial()), /SA insuficiente|limite de 3 SA/);
});


test('Finalizar custa 3 SA sem consumir Ação nem Movimento normais', () => {
  const economia = economiaAcoesInicial(5);
  const resultado = registrarFinalizar(economia, estadoManobrasTurnoInicial());
  assert.equal(resultado.economia.saAtual, 2);
  assert.equal(resultado.economia.saGastaNaJanela, 3);
  assert.equal(resultado.economia.normaisUsados.acao, false);
  assert.equal(resultado.economia.normaisUsados.movimento, false);
  assert.equal(resultado.movimentosAdicionais, 0);
  assert.throws(() => registrarFinalizar({ ...economia, saAtual: 2, saGastaNaJanela: 1 }, estadoManobrasTurnoInicial()), /limite de 3 SA/);
  assert.throws(() => registrarFinalizar({ ...economia, turnoEmAndamento: false }, estadoManobrasTurnoInicial()), /próprio turno/);
});
