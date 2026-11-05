import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/bioInfeccao.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { calcularFaseBioInfeccao } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('BI abaixo do máximo calcula as cinco fases nos limites oficiais', () => {
  assert.equal(calcularFaseBioInfeccao(0, 10).fase, 1);
  assert.equal(calcularFaseBioInfeccao(1, 10).fase, 1);
  assert.equal(calcularFaseBioInfeccao(2, 10).fase, 2);
  assert.equal(calcularFaseBioInfeccao(4, 10).fase, 3);
  assert.equal(calcularFaseBioInfeccao(6, 10).fase, 4);
  assert.equal(calcularFaseBioInfeccao(8, 10).fase, 5);
});

test('atingir ou ultrapassar BI Máxima representa Colapso Viral, não uma sexta fase', () => {
  assert.deepEqual(calcularFaseBioInfeccao(10, 10), {
    estado: 'colapso', fase: null,
    efeito: 'Colapso Viral: personagem Desacordada; Reanimação específica.',
  });
  assert.equal(calcularFaseBioInfeccao(12, 10).estado, 'colapso');
});

test('fases derivam modificadores numéricos sem aplicar efeitos à ficha', () => {
  const fase1 = calcularFaseBioInfeccao(0, 10);
  const fase2 = calcularFaseBioInfeccao(2, 10);
  const fase3 = calcularFaseBioInfeccao(4, 10);
  const fase4 = calcularFaseBioInfeccao(6, 10);
  const fase5 = calcularFaseBioInfeccao(8, 10);
  assert.equal(fase1.modificadorMovimento, 0);
  assert.equal(fase2.modificadorMovimento, 3);
  assert.equal(fase3.bonusTesteAtaque, 2);
  assert.equal(fase4.bonusTesteAtaque, 3);
  assert.equal(fase4.danoCorpoACorpoAdicional, '1d4');
  assert.equal(fase5.modificadorMovimento, -6);
  assert.equal(fase5.desvantagemAtaquesETestes, true);
  assert.equal(calcularFaseBioInfeccao(10, 10).modificadorMovimento, null);
});

test('fases informam efeitos canônicos sem executar alterações', () => {
  assert.match(calcularFaseBioInfeccao(2, 10).efeito, /Movimento \+3 m/);
  assert.match(calcularFaseBioInfeccao(4, 10).efeito, /Testes de Ataque \+2/);
  assert.match(calcularFaseBioInfeccao(6, 10).efeito, /\+1d4/);
  assert.match(calcularFaseBioInfeccao(8, 10).efeito, /Desvantagem/);
});

test('valores inválidos não geram fase presumida', () => {
  assert.equal(calcularFaseBioInfeccao(-1, 10).estado, 'indefinido');
  assert.equal(calcularFaseBioInfeccao(0, 0).estado, 'indefinido');
  assert.equal(calcularFaseBioInfeccao(1.5, 10).estado, 'indefinido');
});
