import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/usosDescansoCompleto.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const api = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('lista somente Habilidades e benefícios de Origem com limite canônico de Descanso Completo', () => {
  assert.deepEqual(api.listarFontesUsosDescansoCompleto('Acadêmico', ['curiosa']).map(x => x.chave), [
    'habilidade:curiosa', 'origem:academico',
  ]);
  assert.deepEqual(api.listarFontesUsosDescansoCompleto('Criminoso', []).map(x => x.chave), ['origem:criminoso']);
  assert.deepEqual(api.listarFontesUsosDescansoCompleto('Mercenário', []).map(x => x.chave), ['origem:mercenario']);
  assert.deepEqual(api.listarFontesUsosDescansoCompleto('Atleta', ['ambidestria']), []);
});

test('registro de uso exige fonte ativa e não permite consumir duas vezes', () => {
  const fontes = api.listarFontesUsosDescansoCompleto('Acadêmico', ['curiosa']);
  const usado = api.registrarUsoDescansoCompleto({}, 'habilidade:curiosa', fontes);
  assert.deepEqual(usado, { 'habilidade:curiosa': true });
  assert.throws(() => api.registrarUsoDescansoCompleto(usado, 'habilidade:curiosa', fontes), /já foi marcado/);
  assert.throws(() => api.registrarUsoDescansoCompleto({}, 'origem:mercenario', fontes), /não está disponível/);
});

test('validador recusa chaves desconhecidas, falsos, arrays e protótipos personalizados', () => {
  assert.equal(api.usosDescansoCompletoValido({}), true);
  assert.equal(api.usosDescansoCompletoValido({ 'origem:criminoso': true }), true);
  assert.equal(api.usosDescansoCompletoValido({ 'origem:falsa': true }), false);
  assert.equal(api.usosDescansoCompletoValido({ 'origem:academico': false }), false);
  assert.equal(api.usosDescansoCompletoValido([]), false);
  assert.equal(api.usosDescansoCompletoValido(Object.assign(Object.create({ admin: true }), { 'origem:academico': true })), false);
});

test('Descanso Completo renova todos os usos e produz registro vazio', () => {
  assert.deepEqual(api.renovarUsosDescansoCompleto(), {});
});
