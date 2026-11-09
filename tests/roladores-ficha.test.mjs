import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sortearDados, validarResultadosFisicos } from '../src/rolagemDados.ts';

test('rolagem virtual usa a fonte aleatória fornecida e respeita os lados do dado', () => {
  const valores = [0, 1, 5, 19];
  const resultado = sortearDados(4, 20, () => valores.shift() ?? 0);
  assert.deepEqual(resultado, [1, 2, 6, 20]);
});

test('rolagem rejeita valores fora do universo para evitar viés de módulo', () => {
  const valores = [4294967295, 0];
  assert.deepEqual(sortearDados(1, 20, () => valores.shift() ?? 0), [1]);
});

test('rolagem valida quantidade, tipo de dado e fonte aleatória', () => {
  assert.throws(() => sortearDados(0, 6, () => 0), /quantidade/);
  assert.throws(() => sortearDados(1, 7 as never, () => 0), /Tipo de dado/);
  assert.throws(() => sortearDados(1, 6, () => -1), /fonte aleatória/);
});

test('entrada física exige quantidade e faces válidas', () => {
  assert.deepEqual(validarResultadosFisicos('4, 2 6', 3, 6), [4, 2, 6]);
  assert.throws(() => validarResultadosFisicos('4 2', 3, 6), /exatamente 3/);
  assert.throws(() => validarResultadosFisicos('7', 1, 6), /entre 1 e 6/);
});

test('roladores integrados só são renderizados no modo Automático e não alteram ficha', async () => {
  const ui = await readFile(new URL('../src/RoladoresBasicosLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /if \(modo !== 'automatico'\) return null/);
  assert.match(ui, /nenhum resultado altera os dados da personagem/);
  assert.doesNotMatch(ui, /localStorage|salvarPatchPersonagem|aoSalvar/);
});
