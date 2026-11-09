import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const paths = ['equipamento.ts', 'inventarioExpansao.ts'];
let source = '';
for (const path of paths) {
  source += (await readFile(new URL('../src/' + path, import.meta.url), 'utf8')).replace(/^import .*;$/gm, '') + '\n';
}
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { capacidadeInventarioAtiva, avaliarUpgradeExpansao, blocoMoedasValido } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('capacidade ativa soma FOR, Mochileiro e uma única expansão dedicada', () => {
  assert.equal(capacidadeInventarioAtiva(2, null, null), 6);
  assert.equal(capacidadeInventarioAtiva(2, 'Mochileiro', null), 7);
  assert.equal(capacidadeInventarioAtiva(2, null, 'pochete'), 8);
  assert.equal(capacidadeInventarioAtiva(2, null, 'bolsa'), 9);
  assert.equal(capacidadeInventarioAtiva(2, 'Mochileiro', 'bolsa'), 10);
});

test('Pochete pode evoluir para Bolsa e retorna como item comum de 1 Espaço', () => {
  assert.deepEqual(avaliarUpgradeExpansao(null, 'pochete'), {
    permitido: true, alterou: true, expansaoEquipada: 'pochete', itemComumRetornado: null,
  });
  assert.deepEqual(avaliarUpgradeExpansao('pochete', 'bolsa'), {
    permitido: true, alterou: true, expansaoEquipada: 'bolsa',
    itemComumRetornado: { id: 'pochete', nome: 'Pochete', espacos: 1 },
  });
});

test('expansão vinculada não pode ser removida nem sofrer downgrade', () => {
  assert.equal(avaliarUpgradeExpansao('bolsa', 'pochete').permitido, false);
  assert.equal(avaliarUpgradeExpansao('bolsa', null).permitido, false);
  assert.equal(avaliarUpgradeExpansao('pochete', null).permitido, false);
  assert.equal(avaliarUpgradeExpansao('bolsa', 'bolsa').alterou, false);
});

test('bloco de moedas aceita de uma a três unidades sem transbordamento', () => {
  assert.equal(blocoMoedasValido(1), true);
  assert.equal(blocoMoedasValido(3), true);
  assert.equal(blocoMoedasValido(0), false);
  assert.equal(blocoMoedasValido(4), false);
  assert.equal(blocoMoedasValido(1.5), false);
});

test('capacidade rejeita FOR inválida', () => {
  assert.throws(() => capacidadeInventarioAtiva(-1, null, null), /FOR/);
  assert.throws(() => capacidadeInventarioAtiva(1.2, null, null), /FOR/);
});
