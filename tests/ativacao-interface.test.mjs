import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url),uris={};
for(const [nome,path] of [['pedidoAtivacao','../src/pedidoAtivacao.ts'],['RevisaoAtivacao','../src/RevisaoAtivacao.tsx'],['ResumoOperacional','../src/ResumoOperacional.tsx'],['estadoAtivacao','./ui/estadoAtivacao.ts']]){
 let {outputText:s}=ts.transpileModule(await readFile(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 s=s.replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 for(const [n,uri] of Object.entries(uris))for(const prefix of ['./','../../src/'])s=s.replaceAll("'"+prefix+n+"'",JSON.stringify(uri));
 uris[nome]='data:text/javascript;base64,'+Buffer.from(s).toString('base64');
}
const {confirmarAtivacao,FalhaAtivacao}=await import(uris.pedidoAtivacao);
const {criarEstadoAtivacao}=await import(uris.estadoAtivacao);
const {default:RevisaoAtivacao}=await import(uris.RevisaoAtivacao);
const {default:ResumoOperacional,CartaoResumo}=await import(uris.ResumoOperacional);

test('interface de ativacao: confirmar exige conferencia valida e bloqueia pendencias ou teto',async()=>{
 const c=await criarEstadoAtivacao().conferir();
 for(const patch of [{pendencias:['Revisar']},{ativas:10},{ativas:-1},{ativas:NaN},{revisaoFicha:-1},{revisaoMesa:0.5},{personagemId:''}]){
  assert.throws(()=>confirmarAtivacao({...c,...patch},()=>{throw Error('Nao gerar pedido');}),e=>e instanceof FalhaAtivacao&&e.tipo==='regra');
 }
});

test('interface de ativacao: clique duplicado compartilha pedido em curso e recibo nao e mutavel por terceiros',async()=>{
 const c=await criarEstadoAtivacao().conferir();let ids=0,chamadas=0,resolver;
 const controle=confirmarAtivacao(c,()=>{ids++;return 'operacao-1';});
 const backend=p=>{chamadas++;return new Promise(r=>{resolver=()=>r({personagemId:p.personagemId,operacaoId:p.operacaoId,estado:'completa',quantidadeInstancias:6,revisaoCriacao:2});});};
 const a=controle.executar(backend),b=controle.executar(backend);assert.strictEqual(a,b);await Promise.resolve();
 assert.equal(chamadas,1);assert.equal(ids,1);resolver();const resposta=await a;resposta.quantidadeInstancias=999;
 assert.equal((await controle.executar(backend)).quantidadeInstancias,6);assert.equal(chamadas,1);
});

test('interface de ativacao: falha antes ou resposta perdida reutilizam mesmo pedido sem duplicar conjunto ou restaurar recursos',async()=>{
 for(const cenario of ['antes','resposta']){
  const banco=criarEstadoAtivacao(cenario),c=await banco.conferir();let ids=0;const pedidos=[];
  const controle=confirmarAtivacao(c,()=>{ids++;return 'pedido-unico';}),backend=p=>{pedidos.push({...p});return banco.ativar(p);};
  await assert.rejects(controle.executar(backend));
  const estadoFalha=banco.estado();assert.equal(estadoFalha.conjuntos,cenario==='resposta'?1:0);
  const r=await controle.executar(backend);assert.equal(r.estado,'completa');assert.equal(ids,1);assert.deepEqual(pedidos[0],pedidos[1]);
  assert.deepEqual(banco.estado(),{ativa:true,tentativas:2,conjuntos:1,pv:7,sa:1,bi:3});
  await controle.executar(backend);assert.equal(banco.estado().tentativas,2);
 }
});

test('interface de ativacao: revisao recusada exige conferencia nova; resposta ambigua nao anuncia conclusao',async()=>{
 const banco=criarEstadoAtivacao('revisao'),c=await banco.conferir(),ctrl=confirmarAtivacao(c,()=> 'antigo');
 await assert.rejects(ctrl.executar(p=>banco.ativar(p)),e=>e.tipo==='revisao');assert.equal(banco.estado().conjuntos,0);
 const novo=confirmarAtivacao(await banco.conferir(),()=> 'novo');await novo.executar(p=>banco.ativar(p));assert.equal(banco.estado().conjuntos,1);
 const ruim=confirmarAtivacao(c,()=> 'x');
 await assert.rejects(ruim.executar(async p=>({personagemId:'outra',operacaoId:p.operacaoId,estado:'completa',quantidadeInstancias:6,revisaoCriacao:2})),e=>e.tipo==='incerto');
});

test('interface de ativacao e resumo: renderizacao inicial sem rede, confirmacao automatica ou dados secretos',()=>{
 let chamadas=0;
 const revisao=renderToStaticMarkup(React.createElement(RevisaoAtivacao,{aoConferir:async()=>{chamadas++;},aoAtivar:async()=>{chamadas++;}}));
 const resumo=renderToStaticMarkup(React.createElement(ResumoOperacional,{mesaNome:'Fixture',aoListar:async()=>{chamadas++;return [];}}));
 assert.equal(chamadas,0);assert.ok(revisao.includes('Conferir criação'));assert.ok(!revisao.includes('Ativação confirmada'));assert.ok(!revisao.includes('Ativar personagem'));
 assert.ok(resumo.includes('Atualizar resumo'));assert.ok(!resumo.includes('Nenhuma personagem ativa disponível'));
 const p={personagemId:'x',nome:'Fixture',classe:'Operadora',nivel:1,pv:{atual:7,maximo:15},sa:{atual:1,maximo:3},bi:{atual:3,maximo:7},defesa:12,condicoes:null,passivos:{Fortitude:11,'Percepção':14},historia:'SEGREDO',inventario:['ITEM SECRETO']};
 const html=renderToStaticMarkup(React.createElement(CartaoResumo,{personagem:p}));
 assert.ok(html.includes('Operadora'));assert.ok(html.includes('7/15'));assert.ok(html.includes('não informadas'));assert.ok(html.includes('Perícias Passivas'));
 assert.ok(!html.includes('SEGREDO'));assert.ok(!html.includes('Editar'));assert.ok(!html.includes('<input'));
});

test('fixture de ativacao: estados independentes, falha de resumo explicita e nenhuma chamada de rede',async()=>{
 const original=globalThis.fetch;let rede=0;globalThis.fetch=async()=>{rede++;throw Error('Rede proibida nesta fixture');};
 try{
  const a=criarEstadoAtivacao(),b=criarEstadoAtivacao(),c=await a.conferir();
  await confirmarAtivacao(c,()=> 'p').executar(p=>a.ativar(p));
  assert.equal((await a.listar()).length,1);assert.equal((await b.listar()).length,0);
  a.falharProximoResumo();await assert.rejects(a.listar(),/recusado/);assert.equal((await a.listar()).length,1);
  assert.equal((await criarEstadoAtivacao('lotada').listar()).length,10);assert.equal(rede,0);
 }finally{globalThis.fetch=original;}
});

