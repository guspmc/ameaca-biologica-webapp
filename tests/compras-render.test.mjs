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
const modulos=['comprasIniciais','PreviaCompras','servicoCompras','equipamento','EquipamentoRascunho'];
test('previa React renderiza sem compra real e com controles iniciais consistentes',async()=>{
 const destino=await mkdtemp(join(tmpdir(),'ab-compras-render-'));
 try{
  for(const nome of modulos){
   const ext=['PreviaCompras','EquipamentoRascunho'].includes(nome)?'.tsx':'.ts';
   let {outputText}=ts.transpileModule(await readFile(new URL('../src/'+nome+ext,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
   outputText=outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href)).replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll("'./comprasIniciais'","'./comprasIniciais.mjs'");
   for(const alvo of modulos)outputText=outputText.replaceAll(`'./${alvo}'`,`'./${alvo}.mjs'`);
   await writeFile(join(destino,nome+'.mjs'),outputText);
  }
  const {default:Previa}=await import(pathToFileURL(join(destino,'PreviaCompras.mjs')).href);
  const html=renderToStaticMarkup(React.createElement(Previa,{capacidade:4}));
  assert.match(html,/prévia não salva/);assert.match(html,/3\/3 Moedas restantes/);assert.match(html,/3\/4 Espaços/);
  assert.match(html,/Munição 9 mm/);assert.match(html,/Buscar neste catálogo/);
  assert.equal((html.match(/Adicionar .*? à prévia/g)||[]).length,6);
  assert.equal((html.match(/ disabled=""/g)||[]).length,6);
  assert.ok(!html.includes('<form'));
  let chamadas=0;
  const salvo=renderToStaticMarkup(React.createElement(Previa,{capacidade:4,planoSalvo:{'municao-9mm':3},revisaoSalva:2,aoSalvar:async()=>{chamadas++;return 3;}}));
  assert.match(salvo,/Salvar Plano de Compras/);assert.match(salvo,/45 unidade/);assert.match(salvo,/Versão carregada: 2/);assert.ok(salvo.includes('0/3 Moedas restantes'));assert.equal(chamadas,0);
  const {default:Equipamento}=await import(pathToFileURL(join(destino,'EquipamentoRascunho.mjs')).href);
  const grade=renderToStaticMarkup(React.createElement(Equipamento,{supabase:{rpc:async()=>{throw Error('Nao deve chamar RPC ao renderizar');}},ficha:{id:'fixture',classe:'Operador',forca:0,origem:null,nivel:1,estado_ficha:'rascunho',equipamento_inicial:'C',compras_iniciais:{'municao-9mm':3},revisao_compras:2},dona:true,recarregar:async()=>{}}));
  assert.ok(grade.includes('4 / 4 ESPAÇOS'));assert.match(grade,/grid-column:span 2/);assert.match(grade,/45 unidade/);
  const slots=grade.split('<div class="ficha-inventario">')[1].split('<p class="ficha-dica">')[0];
  assert.ok(!slots.includes('Moedas Antigas'));

 }finally{
  // Somente os arquivos temporarios criados acima; sem exclusao recursiva.
  for(const nome of modulos.map(m=>m+'.mjs'))await unlink(join(destino,nome)).catch(e=>{if(e.code!=='ENOENT')throw e;});
  await rmdir(destino);
 }
});
