import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { listaCondicoesValida } from '../src/condicoesFicha.ts';

const ui = await readFile(new URL('../src/CondicoesFichaLocal.tsx', import.meta.url), 'utf8');

test('registro ausente de Condições é tratado como lista vazia válida', () => {
  assert.equal(listaCondicoesValida([]), true);
});

test('registro inválido de Condições não é convertido em lista vazia editável', () => {
  assert.match(ui, /const condicoesRegistradas = dados\.condicoes \?\? \[\]/);
  assert.match(ui, /const registroValido = listaCondicoesValida\(condicoesRegistradas\)/);
  assert.match(ui, /const itens = registroValido \? condicoesRegistradas : \[\]/);
  assert.match(ui, /if \(!registroValido \|\| !fonte\.trim\(\) \|\| salvando\) return/);
  assert.match(ui, /O histórico de Condições está inválido\. Os dados originais foram preservados/);
  assert.match(ui, /disabled=\{salvando \|\| !registroValido \|\| !fonte\.trim\(\)\}/);
});
