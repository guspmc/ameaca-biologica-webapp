import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const calculadora = await readFile(new URL('../src/CalculadoraTesteLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Criminoso só oferece Vantagem em Investigação para procurar itens ou recursos', () => {
  assert.match(calculadora, /criminosoAplicavel = escopo === 'testes' && criminosoDisponivel && origem === 'Criminoso'/);
  assert.match(calculadora, /tipo === 'pericia' && periciaEfetiva === 'Investigação' && finalidadeCriminoso === 'procurar_itens_recursos'/);
  assert.match(calculadora, /Procurar itens ou recursos/);
  assert.match(calculadora, /Usar benefício do Criminoso neste Teste · Vantagem/);
});

test('O benefício do Criminoso respeita o limite de uso e não acumula Vantagem', () => {
  assert.match(ficha, /\['origem:criminoso'\] !== true/);
  assert.match(calculadora, /criminosoAplicavel && usarBeneficioCriminoso/);
  assert.match(calculadora, /Vantagem não acumula com outra fonte/);
  assert.match(calculadora, /marque o consumo no painel Benefícios limitados a Descanso Completo/);
});

test('A disponibilidade do benefício é vinculada ao registro persistido e à Origem', () => {
  assert.match(ficha, /criminosoDisponivel=\{criminosoDisponivel\}/);
  assert.match(ficha, /usosDescansoCompletoValido\(usosDescanso\)/);
});
