import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
test('previa React renderiza sem compra real e com controles iniciais consistentes',async()=>{
 const destino=await mkdtemp(join(tmpdir(),'ab-compras-render-'));
 try{
  for(const nome of ['comprasIniciais','PreviaCompras']){
   const ext=nome==='PreviaCompras'?'.tsx':'.ts';
   let {outputText}=ts.transpileModule(await readFile(new URL('../src/'+nome+ext,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
   outputText=outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href)).replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll("'./comprasIniciais'","'./comprasIniciais.mjs'");
   await writeFile(join(destino,nome+'.mjs'),outputText);
  }
  const {default:Previa}=await import(pathToFileURL(join(destino,'PreviaCompras.mjs')).href);
  const html=renderToStaticMarkup(React.createElement(Previa,{capacidade:4}));
  assert.match(html,/prévia não salva/);assert.match(html,/3\/3 Moedas restantes/);assert.match(html,/3\/4 Espaços/);
  assert.match(html,/Munição 9 mm/);assert.match(html,/Buscar neste catálogo/);
  assert.equal((html.match(/Adicionar .*? à prévia/g)||[]).length,6);
  assert.equal((html.match(/ disabled=""/g)||[]).length,6);
  assert.ok(!html.includes('<form'));
 }finally{
  // Somente os dois arquivos temporarios criados acima; sem exclusao recursiva.
  for(const nome of ['comprasIniciais.mjs','PreviaCompras.mjs'])await unlink(join(destino,nome)).catch(e=>{if(e.code!=='ENOENT')throw e;});
  await rmdir(destino);
 }
});
