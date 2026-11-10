import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarFormulaDanoEspecial } from '../src/variantesDanoArmas.ts';

test('Spark Shot distingue disparo normal e carregado', () => {
  assert.equal(consultarFormulaDanoEspecial('spark-shot', 'normal'), '1d4');
  assert.equal(consultarFormulaDanoEspecial('spark-shot', 'carregado'), '4d4');
});

test('Lança-Chamas preserva progressão manual de 3d6 até 6d6', () => {
  assert.equal(consultarFormulaDanoEspecial('lanca-chamas-quimico', 'chama-3'), '3d6');
  assert.equal(consultarFormulaDanoEspecial('lanca-chamas-quimico', 'chama-4'), '4d6');
  assert.equal(consultarFormulaDanoEspecial('lanca-chamas-quimico', 'chama-5'), '5d6');
  assert.equal(consultarFormulaDanoEspecial('lanca-chamas-quimico', 'chama-6'), '6d6');
});

test('armas sem variante implementada continuam sem fórmula especial', () => {
  assert.equal(consultarFormulaDanoEspecial('jmb-hp3', 'normal'), null);
  assert.equal(consultarFormulaDanoEspecial('rpg-7', 'normal'), null);
});
