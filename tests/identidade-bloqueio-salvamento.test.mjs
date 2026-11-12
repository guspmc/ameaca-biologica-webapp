import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const identidade = await readFile(new URL('../src/IdentidadeLocal.tsx', import.meta.url), 'utf8');

test('campos de Identificação ficam bloqueados durante salvamento em andamento', () => {
  assert.match(identidade, /<input value=\{nome\} disabled=\{ocupado\}/);
  assert.match(identidade, /<textarea disabled=\{ocupado\}/);
  assert.match(identidade, /: <input disabled=\{ocupado\} maxLength=\{campo\.limite\}/);
});
