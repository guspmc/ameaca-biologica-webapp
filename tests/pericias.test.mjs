import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/pericias.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {grauPericia,bonusTreinamento,totalPontos}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('Origem gratuita custa zero; um ponto adicional da Classe alcanca Mestre com +3, nao +5',()=>{
  assert.equal(totalPontos({}),0);
  assert.equal(bonusTreinamento(grauPericia('Pontaria','Pontaria',{})),2);
  assert.equal(totalPontos({Pontaria:1}),1);
  assert.equal(bonusTreinamento(grauPericia('Pontaria','Pontaria',{Pontaria:1})),3);
});
test('Pericia sem treinamento gratuito custa dois pontos para Mestre e nao treina outra Pericia',()=>{
  const pontos={Luta:2};
  assert.equal(totalPontos(pontos),2);
  assert.equal(bonusTreinamento(grauPericia('Luta','Pontaria',pontos)),3);
  assert.equal(bonusTreinamento(grauPericia('Medicina','Pontaria',pontos)),0);
});
