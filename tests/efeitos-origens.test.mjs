import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/efeitosOrigens.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { bonusCondicionalOrigemTeste } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

const contexto = (alteracoes = {}) => ({
  tipo: 'pericia', pericia: 'Atletismo', atributo: 'forca',
  finalidade: 'outra', saDisponivel: 1, gastoSAConfirmado: true, ...alteracoes,
});

test('Atleta recebe +5 apenas em Perícia baseada em FOR ou AGI, exceto Luta e Pontaria', () => {
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto()), 5);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ atributo: 'agilidade', pericia: 'Acrobacia' })), 5);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ pericia: 'Luta' })), 0);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ pericia: 'Pontaria', atributo: 'agilidade' })), 0);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ atributo: 'astucia' })), 0);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ tipo: 'atributo' })), 0);
});

test('Investigador recebe +5 somente em Investigação para procurar uma pista', () => {
  assert.equal(bonusCondicionalOrigemTeste('Investigador', contexto({ pericia: 'Investigação', atributo: 'astucia', finalidade: 'procurar_pista' })), 5);
  assert.equal(bonusCondicionalOrigemTeste('Investigador', contexto({ pericia: 'Investigação', finalidade: 'outra' })), 0);
  assert.equal(bonusCondicionalOrigemTeste('Investigador', contexto({ pericia: 'Percepção', finalidade: 'procurar_pista' })), 0);
});

test('bônus condicionado exige gasto de 1 SA confirmado e aceita saldo zero após o gasto', () => {
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ gastoSAConfirmado: false })), 0);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ saDisponivel: 0 })), 5);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ saDisponivel: -1 })), 0);
  assert.equal(bonusCondicionalOrigemTeste('Atleta', contexto({ saDisponivel: 1.5 })), 0);
});

test('origens sem esse benefício não recebem bônus por esta regra', () => {
  assert.equal(bonusCondicionalOrigemTeste('Acadêmico', contexto()), 0);
  assert.equal(bonusCondicionalOrigemTeste('Operário', contexto()), 0);
});
