import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ficha = readFileSync(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
const roladores = readFileSync(new URL('../src/RoladoresBasicosLocal.tsx', import.meta.url), 'utf8');

test('Ficha exibe o modificador de Iniciativa derivado de AGI', () => {
  assert.match(ficha, /MODIFICADOR DE INICIATIVA/);
  assert.match(ficha, /\+\{numero\(atributos\.agilidade\)\}/);
});

test('rolagem pontual de Iniciativa fica na Ficha somente no modo Automático', () => {
  assert.match(ficha, /RoladoresBasicosLocal modo=\{configuracaoFuncionamento\.modo\}/);
  assert.match(roladores, /Iniciativa/);
  assert.match(roladores, /1d20 \+ AGI/);
  assert.match(roladores, /if \(modo !== 'automatico'\) return null/);
});

test('Ficha não administra ordem de turnos ou Encontros', () => {
  assert.match(ficha, /a ordem do Encontro pertence ao Painel do Mestre/);
  assert.match(roladores, /não organiza turnos ou Encontros/);
});
