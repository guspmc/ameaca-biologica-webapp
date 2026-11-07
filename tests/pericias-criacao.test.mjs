import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const files=['pericias','origens','periciasCriacao'];
const source=(await Promise.all(files.map(f=>readFile(new URL('../src/'+f+'.ts',import.meta.url),'utf8'))))
  .map(s=>s.replace(/^import .*;\r?$/gm,'')).join('\n');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {periciasPermitidasNaCriacao,distribuicaoPericiasValida}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));

test('Perícias permitidas combinam Classe e treinamento gratuito da Origem sem duplicar opções',()=>{
  assert.deepEqual(periciasPermitidasNaCriacao('Agente','Acadêmico','Investigação'),[
    'Acrobacia','Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência'
  ]);
  assert.ok(periciasPermitidasNaCriacao('Operador','Policial','Pontaria').includes('Pontaria'));
  assert.deepEqual(periciasPermitidasNaCriacao('Classe falsa','Acadêmico','Medicina'),[]);
});

test('Amnésico escolhe duas Perícias distintas e ambas podem receber distribuição',()=>{
  assert.equal(distribuicaoPericiasValida('Agente','Amnésico','Medicina',{Luta:1,Reflexos:1},'Luta'),true);
  assert.equal(distribuicaoPericiasValida('Agente','Amnésico','Medicina',{Medicina:1},'Medicina'),false);
  assert.equal(distribuicaoPericiasValida('Agente','Amnésico','Medicina',{Medicina:1,Vontade:1},'Vontade'),false);
});

test('distribuição respeita limite por Classe, grau Mestre e Perícias permitidas',()=>{
  assert.equal(distribuicaoPericiasValida('Agente','Acadêmico','Investigação',{Luta:2,Medicina:2}),true);
  assert.equal(distribuicaoPericiasValida('Agente','Acadêmico','Investigação',{Luta:2,Medicina:3}),false);
  assert.equal(distribuicaoPericiasValida('Agente','Acadêmico','Investigação',{Vontade:1}),false);
  assert.equal(distribuicaoPericiasValida('Agente','Acadêmico','Investigação',{Investigação:2}),false);
  assert.equal(distribuicaoPericiasValida('Agente','Acadêmico','Investigação',{Luta:3}),false);
});
