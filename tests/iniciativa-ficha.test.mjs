import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ficha = readFileSync(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
const roladores = readFileSync(new URL('../src/RoladoresBasicosLocal.tsx', import.meta.url), 'utf8');

test('Ficha exibe Iniciativa como cartão derivado de AGI', () => {
  assert.match(ficha, /<small>INICIATIVA<\\/small>/);
  assert.match(ficha, /\\+\\{numero\\(atributos\\.agilidade\\)\\}/);
  assert.doesNotMatch(ficha, /MODIFICADOR DE INICIATIVA/);
});

test('rolagem pontual de Iniciativa fica na Ficha somente no modo Automático', () => {
  assert.match(ficha, /RoladoresBasicosLocal modo=\\{configuracaoFuncionamento\\.modo\\}/);
  assert.match(roladores, /Iniciativa/);
  assert.match(roladores, /1d20 \\+ AGI/);
  assert.match(roladores, /if \\(modo !== 'automatico'\\) return null/);
});

test('Ficha não administra ordem de turnos ou Encontros', () => {
  assert.doesNotMatch(ficha, /estadoTurnoCombate|carregarEstadoTurnoCombate|Iniciar meu turno|Encerrar meu turno/);
  assert.match(roladores, /não organiza turnos ou Encontros/);
});
