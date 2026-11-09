import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ficha = readFileSync(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Ficha exibe apenas o modificador de Iniciativa derivado de AGI', () => {
  assert.match(ficha, /MODIFICADOR DE INICIATIVA/);
  assert.match(ficha, /\+\{numero\(atributos\.agilidade\)\}/);
  assert.doesNotMatch(ficha, /IniciativaFichaLocal/);
});

test('Ficha não solicita rolagem nem resultado natural de Iniciativa', () => {
  assert.doesNotMatch(ficha, /resultado natural do d20/i);
  assert.match(ficha, /rolagem e a ordem do Encontro pertencem ao Painel do Mestre/);
});
