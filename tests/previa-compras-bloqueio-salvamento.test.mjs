import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const previa = await readFile(new URL('../src/PreviaCompras.tsx', import.meta.url), 'utf8');
const editor = await readFile(new URL('../src/EditorInventarioLocal.tsx', import.meta.url), 'utf8');

test('prévia de compras bloqueia alterações enquanto o rascunho está sendo salvo', () => {
  assert.match(previa, /bloqueado\?: boolean/);
  assert.match(previa, /bloqueado \|\| salvando \|\| !quantidade/);
  assert.match(previa, /bloqueado \|\| salvando \|\| !!motivo/);
  assert.match(previa, /bloqueado \|\| salvando \|\| !Object\.keys\(planoAtual\)\.length/);
  assert.match(editor, /<PreviaCompras[\s\S]*?bloqueado=\{ocupado\}/);
});
