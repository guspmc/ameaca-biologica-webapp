import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/testes.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { calcularTesteManual } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('Teste de Perícia usa o valor que já inclui Atributo e Treinamento', () => {
  const r = calcularTesteManual({ valorBase: 5, modificador: 1, dt: 15, dado1: 9 });
  assert.equal(r.total, 15);
  assert.equal(r.estado, 'sucesso');
});

test('Teste puro de Atributo aceita o valor base informado sem adicionar Perícia', () => {
  const r = calcularTesteManual({ valorBase: 2, modificador: 0, dt: 13, dado1: 10 });
  assert.equal(r.total, 12);
  assert.equal(r.estado, 'falha');
});

test('Vantagem usa o melhor e Desvantagem usa o pior entre dois d20', () => {
  const vantagem = calcularTesteManual({ valorBase: 0, dt: 15, dado1: 5, dado2: 17, vantagem: 'vantagem' });
  const desvantagem = calcularTesteManual({ valorBase: 0, dt: 15, dado1: 5, dado2: 17, vantagem: 'desvantagem' });
  assert.equal(vantagem.dadoEscolhido, 17);
  assert.equal(vantagem.estado, 'sucesso');
  assert.equal(desvantagem.dadoEscolhido, 5);
  assert.equal(desvantagem.estado, 'falha');
});

test('20 natural é sucesso automático e 1 natural é Falha Crítica', () => {
  const sucesso = calcularTesteManual({ valorBase: -20, dt: 25, dado1: 20 });
  const falha = calcularTesteManual({ valorBase: 30, dt: 5, dado1: 1 });
  assert.equal(sucesso.estado, 'critico-sucesso');
  assert.equal(falha.estado, 'falha-critica');
  assert.match(falha.detalhe, /Exposto/);
});

test('Impossível não solicita nem calcula rolagem', () => {
  const r = calcularTesteManual({ valorBase: 99, dt: null, dado1: 20 });
  assert.equal(r.estado, 'impossivel');
  assert.equal(r.total, null);
});

test('Vantagem e Desvantagem exigem os dois resultados físicos', () => {
  const r = calcularTesteManual({ valorBase: 3, dt: 12, dado1: 10, vantagem: 'vantagem' });
  assert.equal(r.estado, 'incompleto');
  assert.match(r.detalhe, /dois d20/);
});

test('recusa faces, DT e modificadores inválidos', () => {
  assert.throws(() => calcularTesteManual({ valorBase: 0, dt: 12, dado1: 21 }), /entre 1 e 20/);
  assert.throws(() => calcularTesteManual({ valorBase: 0, dt: 0, dado1: 10 }), /DT/);
  assert.throws(() => calcularTesteManual({ valorBase: 0.5, dt: 12, dado1: 10 }), /inteiros/);
});
