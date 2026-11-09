import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const code=ts.transpileModule(await readFile(new URL('./ui/estadoRecuperacao.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {prepararServidorRecuperacaoQA,CONTEXTO_QA}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const operacao='20000000-0000-4000-8000-000000000001';
const args=()=>({p_personagem:CONTEXTO_QA.personagemId,p_operacao:operacao,p_revisao_ficha:2,p_revisao_mesa:3});
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const transpilar=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const pedidoUri=uri(transpilar(await readFile(new URL('../src/pedidoAtivacao.ts',import.meta.url),'utf8')));
const {prepararServicosAtivacao}=await import(uri(transpilar(await readFile(new URL('../src/servicoAtivacao.ts',import.meta.url),'utf8')).replace("'./pedidoAtivacao'",JSON.stringify(pedidoUri))));
const pedido=()=>({personagemId:CONTEXTO_QA.personagemId,operacaoId:operacao,revisaoFicha:2,revisaoMesa:3});
test('fixture recuperacao: resposta perdida persiste um conjunto e consulta por ficha nao reenvia',async()=>{
 const s=storage(),a=prepararServidorRecuperacaoQA(s);assert.equal(a.estado().conjuntos,0);
 assert.deepEqual(await a.rpc('ativar_personagem',args()),{data:null,error:null});
 const b=prepararServidorRecuperacaoQA(s),r=await b.rpc('consultar_resultado_ativacao',{p_personagem:CONTEXTO_QA.personagemId,p_operacao:null});
 assert.equal(r.data.situacao,'confirmada');assert.equal(r.data.pedido.operacaoId,operacao);assert.equal(b.estado().envios,1);assert.equal(b.estado().conjuntos,1);
 await b.rpc('ativar_personagem',args());assert.equal(b.estado().conjuntos,1);
});
test('fixture recuperacao: falha antes conserva rascunho e pedido repetido cria apenas um conjunto',async()=>{
 const s=storage(),a=prepararServidorRecuperacaoQA(s);a.reiniciar('antes');await assert.rejects(a.rpc('ativar_personagem',args()));
 const b=prepararServidorRecuperacaoQA(s),r=await b.rpc('consultar_resultado_ativacao',{p_personagem:CONTEXTO_QA.personagemId,p_operacao:operacao});assert.equal(r.data.estadoFicha,'rascunho');assert.equal(b.estado().conjuntos,0);
 await b.rpc('ativar_personagem',args());assert.equal(b.estado().conjuntos,1);assert.equal(b.estado().envios,2);
});
test('fixture recuperacao: acesso ficticio e pedido divergente nao devolvem recibo',async()=>{
 const a=prepararServidorRecuperacaoQA(storage());a.reiniciar('normal');await a.rpc('ativar_personagem',args());
 assert.equal((await a.rpc('consultar_resultado_ativacao',{p_personagem:operacao,p_operacao:null})).error.code,'42501');
 assert.equal((await a.rpc('consultar_resultado_ativacao',{p_personagem:CONTEXTO_QA.personagemId,p_operacao:CONTEXTO_QA.mesaId})).error.code,'PT409');assert.equal(a.estado().conjuntos,1);
});
test('fixture recuperacao: reiniciar e estado separados, sem rede e sem escrita na criacao',async()=>{
 let writes=0;const s=storage(),a=prepararServidorRecuperacaoQA({getItem:s.getItem,setItem:(k,v)=>{writes++;s.setItem(k,v);}});assert.equal(writes,0);
 a.reiniciar('normal');await a.rpc('ativar_personagem',args());const isolado=prepararServidorRecuperacaoQA(storage());assert.equal(isolado.estado().conjuntos,0);a.reiniciar('resposta');assert.equal(a.estado().conjuntos,0);assert.equal(a.estado().envios,0);
});

test('fixture: consulta recusada nao envia e nova consulta explicita recupera',async()=>{
 const a=prepararServidorRecuperacaoQA(storage());a.reiniciar('consulta');const s=prepararServicosAtivacao(a);
 await assert.rejects(s.consultarResultado(CONTEXTO_QA.personagemId));assert.equal(a.estado().envios,0);assert.equal(a.estado().conjuntos,0);
 assert.equal((await s.consultarResultado(CONTEXTO_QA.personagemId)).estadoFicha,'rascunho');assert.equal(a.estado().consultas,2);
});
test('fixture: recibo invalido rejeitado mesmo depois de gravar e consulta recupera sem novo envio',async()=>{
 const a=prepararServidorRecuperacaoQA(storage());a.reiniciar('recibo');const s=prepararServicosAtivacao(a);
 await assert.rejects(s.ativar(pedido()));assert.equal(a.estado().envios,1);assert.equal(a.estado().conjuntos,1);
 assert.equal((await s.consultarResultado(CONTEXTO_QA.personagemId,pedido())).recibo.operacaoId,operacao);assert.equal(a.estado().envios,1);
});
test('fixture: completa sem recibo nao permite nova ativacao',async()=>{
 const a=prepararServidorRecuperacaoQA(storage());a.reiniciar('legado');const s=prepararServicosAtivacao(a);
 assert.equal((await s.consultarResultado(CONTEXTO_QA.personagemId)).estadoFicha,'completa');await assert.rejects(s.consultarPedido(pedido()));await assert.rejects(s.ativar(pedido()));assert.equal(a.estado().envios,0);assert.equal(a.estado().conjuntos,0);
});
test('fixture: consulta de outro pedido rejeitada e pedido original permanece recuperavel',async()=>{
 const a=prepararServidorRecuperacaoQA(storage());a.reiniciar('divergente');const s=prepararServicosAtivacao(a);
 await assert.rejects(s.ativar(pedido()));await assert.rejects(s.consultarResultado(CONTEXTO_QA.personagemId,pedido()));
 assert.equal(a.estado().pedido.operacaoId,operacao);assert.equal((await s.consultarResultado(CONTEXTO_QA.personagemId,pedido())).recibo.operacaoId,operacao);assert.equal(a.estado().envios,1);assert.equal(a.estado().conjuntos,1);
});
