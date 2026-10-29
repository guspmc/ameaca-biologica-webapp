import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),modules={};
for(const nome of ['comprasIniciais','servicoDisponibilidade','DisponibilidadeInicial','Participantes']){
 const ext=['DisponibilidadeInicial','Participantes'].includes(nome)?'.tsx':'.ts';
 let {outputText:s}=ts.transpileModule(await readFile(new URL('../src/'+nome+ext,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 s=s.replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 for(const [n,uri] of Object.entries(modules))s=s.replaceAll("'./"+n+"'",JSON.stringify(uri));
 modules[nome]='data:text/javascript;base64,'+Buffer.from(s).toString('base64');
}
const {default:Participantes}=await import(modules.Participantes);
test('painel conectado: somente Mestre com recurso habilitado; renderizacao nao chama banco',()=>{
 const props={supabase:{rpc:()=>{throw Error('Nao deve chamar durante render');}},usuarioId:'mestre-fixture',mesas:[{id:'mesa-fixture',nome:'Mesa fictícia',mestre_id:'mestre-fixture',criada_em:'2026-10-23T12:00:00Z'}],sinalAtualizacao:0,aoAtualizarMesas:async()=>{}};
 const render=p=>renderToStaticMarkup(React.createElement(Participantes,p));
 assert.ok(render({...props,permitirDisponibilidade:true}).includes('Compras iniciais permitidas'));
 assert.ok(!render({...props,permitirDisponibilidade:false}).includes('Compras iniciais permitidas'));
 assert.ok(!render({...props,permitirDisponibilidade:true,usuarioId:'jogador-fixture'}).includes('Compras iniciais permitidas'));
 assert.ok(!render({...props,permitirDisponibilidade:true,mesas:[]}).includes('Compras iniciais permitidas'));
});
