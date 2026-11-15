import test from 'node:test';
import assert from 'node:assert/strict';
import { rolarFormulaDanoVirtual } from '../src/rolagemDano.ts';

test('rola fórmulas convencionais com mais de um grupo de dados', () => {
  const valores = [0, 1, 2, 3, 4, 5];
  const resultado = rolarFormulaDanoVirtual('2d4 + 1d6', false, () => valores.shift() ?? 0);
  assert.deepEqual(resultado.resultados, [1, 2, 3]);
  assert.equal(resultado.total, 6);
  assert.equal(resultado.dadosExtrasEncadeados, 0);
});

test('Motosserra gera um dado extra por cada 6 e permite encadeamento', () => {
  const valores = [5, 0, 5, 5, 0];
  const resultado = rolarFormulaDanoVirtual('2d6', true, () => valores.shift() ?? 0);
  assert.deepEqual(resultado.resultados, [6, 1, 6, 6, 1]);
  assert.equal(resultado.total, 20);
  assert.equal(resultado.dadosExtrasEncadeados, 3);
});

test('não aceita fórmulas inválidas ou quantidades excessivas', () => {
  assert.throws(() => rolarFormulaDanoVirtual('3d20'), /não reconhecida/);
  assert.throws(() => rolarFormulaDanoVirtual('101d6'), /entre 1 e 100/);
});
