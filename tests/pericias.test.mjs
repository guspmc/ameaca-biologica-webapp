import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/pericias.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {grauPericia,bonusTreinamento,bonusTentativaErro,totalPontos,ATRIBUTO_PERICIA,valorBasePericia,valorPassivoPericia}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
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

test('treinamentos de Origem e Tentativa e Erro são fontes distintas, limitadas a Mestre',()=>{
  const atributos={forca:1,agilidade:2,vigor:2,astucia:2};
  assert.equal(grauPericia('Medicina',null,{},'Medicina'),0);
  assert.equal(valorBasePericia('Medicina',atributos,null,{},'Medicina'),2);
  assert.equal(grauPericia('Medicina','Medicina',{Medicina:1},'Medicina','Medicina'),2);
  assert.equal(bonusTentativaErro('Medicina',null,{}),1);
  assert.equal(bonusTentativaErro('Medicina','Medicina',{}),0);
  assert.equal(bonusTentativaErro('Medicina',null,{Medicina:1}),0);
  assert.equal(bonusTentativaErro('Medicina',null,{},null,'Medicina'),0);
});

test('valor base da Perícia soma seu Atributo associado e o Treinamento uma única vez',()=>{
  const atributos={forca:1,agilidade:2,vigor:2,astucia:2};
  assert.equal(ATRIBUTO_PERICIA['Acrobacia'], 'agilidade');
  assert.equal(valorBasePericia('Acrobacia',atributos,null,{}),2);
  assert.equal(valorBasePericia('Luta',atributos,'Luta',{}),3);
  assert.equal(valorBasePericia('Medicina',atributos,null,{Medicina:2}),5);
  assert.equal(valorPassivoPericia('Medicina',atributos,null,{Medicina:2}),15);
  assert.throws(()=>valorBasePericia('Perícia inventada',atributos,null,{}),/Perícia desconhecida/);
});

test('segunda Perícia do Amnésico amplia opções, mas não concede Treinamento na Ficha', async () => {
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /const grau = Math\.min\(2, Math\.max\(0, numero\(distribuicao\[pericia\]\) \+ \(pericia === treinada \? 1 : 0\) \+ \(pericia === extraTentativa \? 1 : 0\)\)\);/);
  assert.doesNotMatch(ficha, /pericia === extra \? 1 : 0/);
  assert.equal(grauPericia('Medicina', null, {}, 'Medicina'), 0);
});
