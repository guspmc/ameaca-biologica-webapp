import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarProcedimentoGM79 } from '../src/procedimentosGM79.ts';

test('GM 79 Ácido direto preserva respingo e Reflexos DT 10', () => {
  const p = consultarProcedimentoGM79('acido', 'direto');
  assert.equal(p.usaAtaque, true);
  assert.equal(p.danoEmArea, false);
  assert.match(p.descricao, /1d6 de Dano de respingo/);
  assert.match(p.descricao, /Reflexos DT 10/);
});

test('GM 79 Ácido em área não faz ataque e não causa Crítico', () => {
  const p = consultarProcedimentoGM79('acido', 'area');
  assert.equal(p.usaAtaque, false);
  assert.equal(p.danoEmArea, true);
  assert.match(p.descricao, /raio de 1,5 m/);
  assert.match(p.descricao, /Não há Acerto Crítico/);
});

test('GM 79 Explosivo usa raio de 3 m e Reflexos DT 10', () => {
  const p = consultarProcedimentoGM79('explosivo', 'direto');
  assert.equal(p.usaAtaque, false);
  assert.match(p.descricao, /raio de 3 m/);
  assert.match(p.descricao, /Reflexos DT 10/);
});

test('GM 79 Incendiário direto inclui Fortitude e Queimadura', () => {
  const p = consultarProcedimentoGM79('incendiario', 'direto');
  assert.equal(p.usaAtaque, true);
  assert.match(p.descricao, /Fortitude DT 10/);
  assert.match(p.descricao, /Queimadura de 1d6 por 1 turno/);
});

test('GM 79 Incendiário em área não permite Crítico', () => {
  const p = consultarProcedimentoGM79('incendiario', 'area');
  assert.equal(p.usaAtaque, false);
  assert.equal(p.danoEmArea, true);
  assert.match(p.descricao, /Não há Acerto Crítico/);
});
