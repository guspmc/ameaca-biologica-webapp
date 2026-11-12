import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Descanso Completo não renova por cima de um registro inválido de usos', () => {
  assert.match(ficha, /aoPrepararPatchCompleto=\{\(\) => \{[\s\S]*?if \(!usosDescansoCompletoValido\(dados\.usosDescansoCompleto \?\? \{\}\)\)/);
  assert.match(ficha, /registro de usos está inválido e precisa ser revisado/);
  assert.match(ficha, /return \{\};[\s\S]*?pedidoProgressao/);
});
