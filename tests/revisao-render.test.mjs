import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),modulos={};
for(const nome of ['textoPersonagem','origens','habilidades','pericias','equipamento','comprasIniciais','conferenciaCriacao','RevisaoCriacao']){
 const ext=nome==='RevisaoCriacao'?'.tsx':'.ts';
 let {outputText:s}=ts.transpileModule(await readFile(new URL('../src/'+nome+ext,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 s=s.replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 for(const [n,uri] of Object.entries(modulos))s=s.replaceAll("'./"+n+"'",JSON.stringify(uri));
 modulos[nome]='data:text/javascript;base64,'+Buffer.from(s).toString('base64');
}
const {default:Revisao}=await import(modulos.RevisaoCriacao);
const ficha={nome:'Fixture',classe:'Operador',nivel:1,forca:3,agilidade:1,vigor:3,astucia:0,origem:'Investigador',pericia_origem_treinada:'Investigação',pericia_origem_extra:null,pontos_pericia_classe:{Atletismo:1,Luta:2},habilidade_basica:'parrudo',equipamento_inicial:'B',pv_maximo:20,sa_maximo:1,bi_maximo:9,defesa:11};
test('revisao renderizada resume escolhas, destaca pendencias e mantem rascunho sem efeitos',()=>{
 let chamadas=0;const render=f=>renderToStaticMarkup(React.createElement(Revisao,{ficha:f,irPara:()=>chamadas++}));
 const completo=render(ficha);
 assert.ok(completo.includes('12/12 itens conferidos'));
 assert.ok(completo.includes('A personagem continua em rascunho'));
 assert.ok(!completo.includes('aria-label="Pendências da criação"'));
 const pendente=render({...ficha,habilidade_basica:null,pv_maximo:15,bi_maximo:6});
 assert.ok(pendente.includes('11/12 itens conferidos'));
 assert.ok(pendente.includes('aria-label="Pendências da criação"'));
 assert.ok(pendente.includes('Habilidade Básica · Pendente'));
 assert.equal(chamadas,0);
 const vazio=render({...ficha,equipamento_inicial:'C',compras_iniciais:{},revisao_compras:0});
 assert.ok(vazio.includes('Plano inicial sem compras'));
 assert.ok(!vazio.includes('Salve o plano para confirmar'));
});
