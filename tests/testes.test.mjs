import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/testes.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { calcularTesteManual, calcularRolagemTesteManual } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

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


test('CODE VERONICA converte resultados naturais de 2 a 9 em 10, preservando 1 e 20', () => {
  const baixo = calcularTesteManual({ valorBase: 0, dt: 10, dado1: 2, naturalDe2a9Como10: true });
  const alto = calcularTesteManual({ valorBase: 0, dt: 10, dado1: 9, naturalDe2a9Como10: true });
  const dez = calcularTesteManual({ valorBase: 0, dt: 10, dado1: 10, naturalDe2a9Como10: true });
  const falhaCritica = calcularTesteManual({ valorBase: 20, dt: 10, dado1: 1, naturalDe2a9Como10: true });
  const critico = calcularTesteManual({ valorBase: 0, dt: 25, dado1: 20, naturalDe2a9Como10: true });
  assert.equal(baixo.total, 10);
  assert.match(baixo.detalhe, /Natural 2 conta como 10 por CODE VERONICA/);
  assert.equal(alto.total, 10);
  assert.equal(dez.total, 10);
  assert.equal(falhaCritica.estado, 'falha-critica');
  assert.equal(critico.estado, 'critico-sucesso');
});

test('CODE VERONICA aplica o ajuste ao resultado escolhido com Vantagem', () => {
  const resultado = calcularTesteManual({ valorBase: 0, dt: 10, dado1: 2, dado2: 8, vantagem: 'vantagem', naturalDe2a9Como10: true });
  assert.equal(resultado.dadoEscolhido, 8);
  assert.equal(resultado.total, 10);
  assert.match(resultado.detalhe, /Natural 8 conta como 10 por CODE VERONICA/);
});


test('Rolagem de Perícia e Atributo calcula total sem avaliar DT ou declarar sucesso/falha comum', () => {
  const resultado = calcularRolagemTesteManual({ valorBase: 5, modificador: 2, dado1: 9 });
  assert.equal(resultado.estado, 'rolagem-teste');
  assert.equal(resultado.total, 16);
  assert.equal(resultado.dt, null);
  assert.match(resultado.detalhe, /Mestre avalia a DT e o resultado/);
});

test('Rolagem de Teste preserva Vantagem, Desvantagem e CODE VERONICA', () => {
  const vantagem = calcularRolagemTesteManual({ valorBase: 3, dado1: 4, dado2: 15, vantagem: 'vantagem' });
  const desvantagem = calcularRolagemTesteManual({ valorBase: 3, dado1: 4, dado2: 15, vantagem: 'desvantagem' });
  const code = calcularRolagemTesteManual({ valorBase: 2, dado1: 8, naturalDe2a9Como10: true });
  assert.equal(vantagem.dadoEscolhido, 15);
  assert.equal(vantagem.total, 18);
  assert.equal(desvantagem.dadoEscolhido, 4);
  assert.equal(desvantagem.total, 7);
  assert.equal(code.total, 12);
  assert.match(code.detalhe, /CODE VERONICA/);
});

test('Rolagem de Teste preserva 20 natural e 1 natural sem depender de DT', () => {
  const vinte = calcularRolagemTesteManual({ valorBase: -50, dado1: 20 });
  const um = calcularRolagemTesteManual({ valorBase: 50, dado1: 1 });
  assert.equal(vinte.estado, 'critico-sucesso');
  assert.equal(um.estado, 'falha-critica');
  assert.equal(vinte.dt, null);
  assert.equal(um.dt, null);
});

test('Rolagem de Teste exige os dois d20 quando há Vantagem ou Desvantagem', () => {
  const incompleto = calcularRolagemTesteManual({ valorBase: 2, dado1: 10, vantagem: 'vantagem' });
  assert.equal(incompleto.estado, 'incompleto');
  assert.throws(() => calcularRolagemTesteManual({ valorBase: 2, dado1: 21 }), /entre 1 e 20/);
});
