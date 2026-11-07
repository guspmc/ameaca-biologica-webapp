import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),modulos={},require=createRequire(import.meta.url);
for(const [nome,arquivo] of [['pedidoAtivacao','../src/pedidoAtivacao.ts'],['servicoAtivacao','../src/servicoAtivacao.ts'],['consultaResumoLocal','../src/consultaResumoLocal.ts'],['estadoResumo','./ui/estadoResumo.ts'],['ResumoOperacional','../src/ResumoOperacional.tsx'],['PainelResumoLocal','../src/PainelResumoLocal.tsx']]){
 let s=ts.transpileModule(await readFile(new URL(arquivo,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 s=s.replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 for(const [n,u]of Object.entries(modulos))s=s.replaceAll("'./"+n+"'",JSON.stringify(u));modulos[nome]=uri(s);
}
const {prepararConsultaResumoLocal}=await import(modulos.consultaResumoLocal),{prepararResumoQA,MESAS_RESUMO}=await import(modulos.estadoResumo);
const {default:Painel}=await import(modulos.PainelResumoLocal),{CartaoResumo}=await import(modulos.ResumoOperacional);
const preparar=(cenario='normal')=>{const servidor=prepararResumoQA(cenario),controle=prepararConsultaResumoLocal(servidor.cliente);return {servidor,controle};};
const carregar=async c=>{c.selecionar(MESAS_RESUMO.A);await c.consultar();return c.estado();};

test('resumo: seleção inerte, quatro passivas e recursos gastos preservados em leituras repetidas',async()=>{
 const {servidor,controle:c}=preparar();assert.equal(c.estado().etapa,'sem_contexto');await assert.rejects(c.consultar());c.selecionar(MESAS_RESUMO.A);assert.equal(servidor.estado().consultas,0);
 await c.consultar();const p=c.estado().itens[0];assert.deepEqual(Object.keys(p.passivos).sort(),['Fortitude','Percepção','Reflexos','Vontade']);assert.deepEqual([p.pv.atual,p.sa.atual,p.bi.atual],[7,1,3]);await c.consultar();assert.deepEqual(c.estado().itens[0],p);
});
test('resumo: valor desconhecido não vira zero e condições ausentes, vazias e registradas são distintas',async()=>{
 const a=await carregar(preparar('desconhecidas').controle);assert.equal(a.itens[0].passivos.Fortitude,null);assert.equal(a.itens[0].condicoes,null);
 const b=await carregar(preparar('condicoes').controle);assert.deepEqual(b.itens[0].condicoes,[]);assert.equal(b.itens[1].condicoes.length,1);
 const html=renderToStaticMarkup(React.createElement(CartaoResumo,{personagem:a.itens[0]}));assert.equal((html.match(/A conferir/g)||[]).length,2);assert.ok(html.includes('não informadas'));
 assert.ok(renderToStaticMarkup(React.createElement(CartaoResumo,{personagem:b.itens[0]})).includes('nenhuma registrada'));
});
test('resumo: Mesa vazia é sucesso e teto de dez retorna dez cartões independentes',async()=>{
 const vazia=await carregar(preparar('vazia').controle);assert.equal(vazia.etapa,'carregada');assert.equal(vazia.itens.length,0);assert.ok(vazia.mensagem.includes('Nenhuma'));
 const dez=await carregar(preparar('dez').controle);assert.equal(dez.itens.length,10);assert.equal(new Set(dez.itens.map(x=>x.personagemId)).size,10);
});
test('resumo: recusa e resposta contaminada limpam tudo, sem vazamento ou repetição automática',async()=>{
 for(const modo of ['recusa','invalida']){const {servidor,controle:c}=preparar(modo);const a=await carregar(c);assert.equal(a.etapa,'erro');assert.deepEqual(a.itens,[]);assert.ok(!JSON.stringify(a).includes('SEGREDO'));assert.equal(servidor.estado().consultas,1);await c.consultar();assert.equal(c.estado().itens.length,1);assert.equal(servidor.estado().consultas,2);}
});
test('resumo: cliques simultâneos compartilham consulta; erro na atualização remove cartões anteriores',async()=>{
 let resolver,chamadas=0;const c=prepararConsultaResumoLocal({rpc(){chamadas++;return new Promise(r=>{resolver=r;});}});c.selecionar(MESAS_RESUMO.A);const a=c.consultar(),b=c.consultar();assert.strictEqual(a,b);await Promise.resolve();resolver({data:[],error:null});await a;assert.equal(chamadas,1);
 const s=prepararResumoQA('normal');let falhar=false;const d=prepararConsultaResumoLocal({rpc:(n,a)=>falhar?Promise.reject(Error('SEGREDO')):s.cliente.rpc(n,a)});await carregar(d);falhar=true;const p=d.consultar();assert.deepEqual(d.estado().itens,[]);await p;assert.equal(d.estado().etapa,'erro');
});
test('resumo: resposta A atrasada não substitui cartões B',async()=>{
 const {servidor,controle:c}=preparar('atraso');c.selecionar(MESAS_RESUMO.A);const a=c.consultar();await Promise.resolve();c.selecionar(MESAS_RESUMO.B);await c.consultar();servidor.entregar();assert.equal(await a,'descartada');assert.equal(c.estado().contexto.mesaNome,'Mesa B fictícia');assert.equal(c.estado().itens[0].nome,'Sobrevivente da Mesa B');
});
test('resumo: encerrar ou A-B-A invalida resposta antiga e não ressuscita cartões',async()=>{
 for(const voltar of [false,true]){const {servidor,controle:c}=preparar('atraso');c.selecionar(MESAS_RESUMO.A);const a=c.consultar();await Promise.resolve();c.encerrar();if(voltar){c.selecionar(MESAS_RESUMO.B);c.selecionar(MESAS_RESUMO.A);}servidor.entregar();assert.equal(await a,'descartada');assert.deepEqual(c.estado().itens,[]);assert.equal(c.estado().etapa,voltar?'pronta':'sem_contexto');}
});
test('resumo: estado retornado não permite mutação e rejeição tardia não apaga consulta atual',async()=>{
 const {controle:c}=preparar();await carregar(c);const copia=c.estado();copia.itens[0].passivos.Reflexos=999;copia.contexto.mesaNome='FORJADA';assert.equal(c.estado().itens[0].passivos.Reflexos,12);assert.equal(c.estado().contexto.mesaNome,'Mesa A fictícia');
 let rejeitar,primeira=true;const s=prepararResumoQA('normal');const d=prepararConsultaResumoLocal({rpc:(n,a)=>{if(primeira){primeira=false;return new Promise((_,no)=>{rejeitar=no;});}return s.cliente.rpc(n,a);}});d.selecionar(MESAS_RESUMO.A);const p=d.consultar();await Promise.resolve();d.selecionar(MESAS_RESUMO.B);await d.consultar();rejeitar(Error('SEGREDO'));assert.equal(await p,'descartada');assert.equal(d.estado().etapa,'carregada');
});
test('resumo: apresentação fechada ignora perícia excedente e texto é escapado, sem editor',async()=>{
 const {controle:c}=preparar();const v=await carregar(c);v.itens[0].passivos.Luta=999;v.itens[0].nome='<script>SEGREDO</script>';const html=renderToStaticMarkup(React.createElement(Painel,{estado:v,aoConsultar:()=>{throw Error();}}));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<dt>Luta</dt>'));assert.ok(!html.includes('<input'));assert.ok(html.includes('Percepção'));assert.ok(html.includes('Vontade'));
});
test('resumo: transporte rejeita esquema antigo de doze perícias e preserva resposta zero sem curar',async()=>{
 const s=prepararResumoQA('normal');const c=prepararConsultaResumoLocal({rpc:async(n,a)=>{const r=await s.cliente.rpc(n,a);r.data[0].passivos.Luta=12;return r;}});assert.equal((await carregar(c)).etapa,'erro');
 const d=prepararConsultaResumoLocal({rpc:async(n,a)=>{const r=await s.cliente.rpc(n,a);r.data[0].pv.atual=0;r.data[0].sa.atual=-1;return r;}});const v=await carregar(d);assert.deepEqual([v.itens[0].pv.atual,v.itens[0].sa.atual],[0,-1]);
});
