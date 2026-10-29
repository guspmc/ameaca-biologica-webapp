import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),mods={},require=createRequire(import.meta.url);
for(const [nome,arquivo]of [['inventarioConsulta','../src/inventarioConsulta.ts'],['estadoInventario','./ui/estadoInventario.ts'],['organizacaoInventario','../src/organizacaoInventario.ts'],['estadoOrganizacao','./ui/estadoOrganizacao.ts'],['PainelOrganizacaoLocal','../src/PainelOrganizacaoLocal.tsx']]){
 let s=ts.transpileModule(await readFile(new URL(arquivo,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 s=s.replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 for(const [n,u]of Object.entries(mods))for(const prefixo of ['./','../../src/'])s=s.replaceAll("'"+prefixo+n+"'",JSON.stringify(u));mods[nome]=uri(s);
}
const {planejarOrganizacao:planejar,prepararOrganizacaoLocal:controle,lerPedidoOrganizacao:lerPedido,lerReciboOrganizacao:lerRecibo}=await import(mods.organizacaoInventario);
const {prepararOrganizacaoQA:servidor,FICHAS_ORGANIZACAO:F}=await import(mods.estadoOrganizacao),{prepararInventarioQA}=await import(mods.estadoInventario),{default:Painel}=await import(mods.PainelOrganizacaoLocal);
const id=n=>`f6000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const bruto=async(m='normal')=>prepararInventarioQA(m).carregar(F.A);
async function preparar(m='normal'){const s=await servidor(m);let n=0;const c=controle(s.porta,()=>id(++n));return {s,c};}
async function pronto(c){c.selecionar(F.A);await c.consultar();const v=c.estado().valor;c.preparar(v.itens[3].instanciaId,6);return v;}
const semPos=v=>({...v,revisao:0,itens:v.itens.map(({posicao,...i})=>i)});

test('organização: prévia para espaço livre só altera posição e revisão na cópia',async()=>{
 const v=await bruto(),original=structuredClone(v),p=planejar(v,v.itens[3].instanciaId,6);assert.deepEqual(v,original);assert.equal(p.depois.itens[3].posicao,6);assert.equal(p.depois.revisao,8);assert.equal(p.trocadoId,null);assert.deepEqual(semPos(p.depois),semPos(v));
});
test('organização: troca duas facas preservando identidades e durabilidades distintas',async()=>{
 const v=await bruto(),p=planejar(v,v.itens[3].instanciaId,4);assert.deepEqual(p.depois.itens.slice(3,5).map(i=>[i.posicao,i.estado.durabilidadeAtual]),[[4,1],[3,2]]);assert.equal(p.trocadoId,v.itens[4].instanciaId);assert.deepEqual(semPos(p.depois),semPos(v));
});
test('organização: pilhas e estados gastos não são fundidos, reparados ou reabastecidos',async()=>{
 for(const modo of ['pilhas','estados']){const v=await bruto(modo),p=planejar(v,v.itens[2].instanciaId,0);assert.deepEqual(semPos(p.depois),semPos(v));}
});
test('organização: recusa mesmo espaço, Característico, ID ausente e destinos inválidos',async()=>{
 const v=await bruto();for(const [i,d]of [[v.itens[3].instanciaId,3],[v.itens[6].instanciaId,6],[id(999),6],[v.itens[3].instanciaId,-1],[v.itens[3].instanciaId,7],[v.itens[3].instanciaId,1.5],[v.itens[3].instanciaId,NaN]])assert.throws(()=>planejar(v,i,d));
});
test('organização: excesso e revisão fora do limite seguro não são corrigidos silenciosamente',async()=>{
 const v=await bruto('excesso');assert.throws(()=>planejar(v,v.itens[0].instanciaId,1),/capacidade/);const q=await bruto();q.revisao=Number.MAX_SAFE_INTEGER;assert.throws(()=>planejar(q,q.itens[0].instanciaId,1),/Revisão/);
});
test('organização: pedido fechado não aceita campos extras, frações ou identificadores inválidos',()=>{
 const p={id:id(1),usuarioId:F.A.usuarioId,mesaId:F.A.mesaId,personagemId:F.A.personagemId,revisao:7,instanciaId:id(2),destino:6};assert.deepEqual(lerPedido(p),p);
 for(const v of [{...p,historia:'SEGREDO'},{...p,destino:1.2},{...p,revisao:-1},{...p,id:'x'}])assert.throws(()=>lerPedido(v));
});
test('organização: selecionar, consultar e preparar não enviam, confirmação falsa e cancelamento são inertes',async()=>{
 const {s,c}=await preparar();c.selecionar(F.A);assert.deepEqual(s.estado(),{envios:0,alteracoes:0,consultas:0,aguardando:false});await pronto(c);await c.confirmar(false);assert.equal(s.estado().envios,0);assert.equal(c.estado().valor.itens[3].posicao,3);c.cancelar();assert.equal(c.estado().previa,null);await c.confirmar(true);assert.equal(s.estado().envios,0);
});
test('organização: confirmação explícita aplica uma vez; novo clique sem prévia não envia',async()=>{
 const {s,c}=await preparar();const v=await pronto(c);await Promise.all([c.confirmar(true),c.confirmar(true)]);assert.equal(s.estado().envios,1);assert.equal(s.estado().alteracoes,1);assert.equal(c.estado().valor.itens[3].posicao,6);assert.deepEqual(semPos(c.estado().valor),semPos(v));await c.confirmar(true);assert.equal(s.estado().envios,1);
});
test('organização: recibo é verificado contra pedido, estado completo e plano esperado',async()=>{
 const v=await bruto(),previa=planejar(v,v.itens[3].instanciaId,6),p={id:id(1),usuarioId:F.A.usuarioId,mesaId:F.A.mesaId,personagemId:F.A.personagemId,revisao:7,instanciaId:v.itens[3].instanciaId,destino:6},r={pedido:p,resultado:previa.depois};assert.deepEqual(lerRecibo(r,p,previa),r);
 const alterado=structuredClone(r);alterado.resultado.itens[2].estado.carregada=10;
 for(const a of [{...r,pedido:{...p,id:id(2)}},alterado,{...r,segredo:'x'}])assert.throws(()=>lerRecibo(a,p,previa));
});
test('organização: servidor fictício trata repetição do mesmo pedido sem outra alteração',async()=>{
 const s=await servidor('normal'),v=(await s.porta.consultar(F.A,null)).inventario,p={id:id(1),usuarioId:F.A.usuarioId,mesaId:F.A.mesaId,personagemId:F.A.personagemId,revisao:7,instanciaId:v.itens[3].instanciaId,destino:6};const a=await s.porta.enviar(p),b=await s.porta.enviar(p);assert.deepEqual(a,b);assert.equal(s.estado().alteracoes,1);await assert.rejects(s.porta.enviar({...p,destino:0}));assert.equal(s.estado().alteracoes,1);await assert.rejects(s.porta.consultar({...F.A,usuarioId:id(999)},null));
});
test('organização: falha antes de gravar exige consulta e repetição explícita com mesmo pedido',async()=>{
 const {s,c}=await preparar('antes');await pronto(c);await c.confirmar(true);const pedido=c.estado().pendente;assert.equal(c.estado().valor,null);assert.equal(s.estado().alteracoes,0);await c.repetir();assert.equal(s.estado().envios,1);await c.consultar();assert.equal(c.estado().podeRepetir,true);assert.equal(c.estado().pendente,pedido);await c.repetir();assert.equal(s.estado().envios,2);assert.equal(s.estado().alteracoes,1);assert.equal(c.estado().pendente,null);
});
test('organização: perda após gravação recupera resultado por consulta sem reenviar',async()=>{
 const {s,c}=await preparar('depois');await pronto(c);await c.confirmar(true);assert.equal(s.estado().alteracoes,1);assert.ok(c.estado().pendente);await c.consultar();assert.equal(c.estado().pendente,null);assert.match(c.estado().mensagem,/recuperada/);assert.equal(c.estado().valor.itens[3].posicao,6);await c.repetir();assert.equal(s.estado().envios,1);
});
test('organização: revisão alterada preserva pedido e bloqueia nova organização/repetição',async()=>{
 const {s,c}=await preparar('conflito');await pronto(c);await c.confirmar(true);await c.consultar();assert.equal(c.estado().valor.revisao,8);assert.equal(c.estado().valor.itens[3].posicao,3);assert.equal(c.estado().podeRepetir,false);assert.ok(c.estado().pendente);assert.match(c.estado().mensagem,/Reconciliação/);assert.throws(()=>c.preparar(c.estado().valor.itens[3].instanciaId,6));await c.repetir();assert.equal(s.estado().envios,1);assert.equal(s.estado().alteracoes,0);
});
test('organização: confirmação de outro pedido não é sucesso, consulta recupera recibo legítimo',async()=>{
 const {s,c}=await preparar('recibo');await pronto(c);await c.confirmar(true);assert.equal(c.estado().valor,null);assert.ok(c.estado().pendente);assert.match(c.estado().mensagem,/não confirmada/);await c.consultar();assert.equal(c.estado().pendente,null);assert.equal(s.estado().envios,1);assert.equal(s.estado().alteracoes,1);
});
test('organização: confirmação atrasada não contamina B; voltar A permite consulta do pedido preservado',async()=>{
 const {s,c}=await preparar('atraso');await pronto(c);const p=c.confirmar(true);c.selecionar(F.B);await c.consultar();s.entregar();await p;assert.equal(c.estado().valor.personagemId,F.B.personagemId);assert.equal(c.estado().valor.itens[3].posicao,3);c.selecionar(F.A);assert.ok(c.estado().pendente);await c.consultar();assert.equal(c.estado().valor.itens[3].posicao,6);assert.equal(c.estado().pendente,null);assert.equal(s.estado().envios,1);
});
test('organização: encerramento e retorno aos mesmos IDs invalidam respostas antigas',async()=>{
 const {s,c}=await preparar('atraso');await pronto(c);const p=c.confirmar(true);c.encerrar();s.entregar();await p;assert.equal(c.estado().valor,null);assert.equal(c.estado().selecao,null);c.selecionar(F.A);await c.consultar();assert.equal(c.estado().valor.itens[3].posicao,6);assert.equal(s.estado().alteracoes,1);
});
test('organização: consulta recusada e falha tardia não oferecem alteração com dados incertos',async()=>{
 const {s,c}=await preparar('recusa');c.selecionar(F.A);await c.consultar();assert.equal(c.estado().valor,null);assert.ok(!c.estado().mensagem.includes('SEGREDO'));assert.throws(()=>c.preparar(id(1),1));await c.consultar();assert.equal(c.estado().valor.itens.length,8);assert.equal(s.estado().envios,0);
 let rejeitar;const d=controle({consultar:()=>new Promise((_,r)=>rejeitar=r),enviar:async()=>{throw Error();}},()=>id(1));d.selecionar(F.A);const p=d.consultar();d.selecionar(F.B);rejeitar(Error('SEGREDO'));await p;assert.equal(d.estado().selecao.personagemId,F.B.personagemId);assert.equal(d.estado().ocupado,false);
});
test('organização: cópias e apresentação não alteram controle nem enviam ao renderizar',async()=>{
 const {s,c}=await preparar();await pronto(c);const e=c.estado();e.valor.itens[3].nome='<script>x</script>';e.previa.depois.itens[3].estado.durabilidadeAtual=999;assert.equal(c.estado().previa.depois.itens[3].estado.durabilidadeAtual,1);
 const h=renderToStaticMarkup(React.createElement(Painel,{estado:e,aoPreparar:()=>{},aoCancelar:()=>{},aoConfirmar:()=>{throw Error();},aoConsultar:()=>{throw Error();},aoRepetir:()=>{throw Error();}}));assert.ok(!h.includes('<script>'));assert.ok(h.includes('&lt;script&gt;'));assert.match(h,/Confirmar organização fictícia/);assert.equal(s.estado().envios,0);
});
