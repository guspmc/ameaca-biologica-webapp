import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularAtrasoReconexao } from '../src/reconexaoLocal.ts';

test('reconexão aumenta a espera progressivamente até o teto de 30 segundos', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 20].map(calcularAtrasoReconexao),
    [3000, 6000, 12000, 24000, 30000, 30000, 30000],
  );
});

test('tentativas inválidas ou negativas usam a espera inicial', () => {
  assert.equal(calcularAtrasoReconexao(-1), 3000);
  assert.equal(calcularAtrasoReconexao(Number.NaN), 3000);
});
