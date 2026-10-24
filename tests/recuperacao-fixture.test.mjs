import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const code=ts.transpileModule(await readFile(new URL('./ui/estadoRecuperacao.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {prepararServidorRecuperacaoQA,CONTEXTO_QA}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const operacao='20000000-0000-4000-8000-000000000001';
const args=()=>({p_personagem:CONTEXTO_QA.personagemId,p_operacao:operacao,p_revisao_ficha:2,p_revisao_mesa:3});
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
