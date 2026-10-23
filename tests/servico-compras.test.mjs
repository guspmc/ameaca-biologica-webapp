import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const {outputText}=ts.transpileModule(await readFile(new URL('../src/servicoCompras.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {salvarPlanoCompras}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('servico de compras envia somente ID, plano copiado e versao; nenhum preco confiado ao cliente',async()=>{
 let chamada;const fake={rpc:async(nome,args)=>{chamada={nome,args};return {data:1,error:null};}};
 const plano={faca:1};const result=await salvarPlanoCompras(fake,'fixture',plano,0);plano.faca=3;
 assert.equal(result,1);assert.deepEqual(chamada,{nome:'salvar_compras_rascunho',args:{p_personagem:'fixture',p_plano:{faca:1},p_revisao:0}});
});
test('servico de compras preserva erro do servidor e rejeita resposta ambigua sem anunciar sucesso',async()=>{
 for(const message of ['Revisao desatualizada.','Item indisponivel para compra nesta Mesa.','Rascunho indisponivel ou acesso negado.'])
  await assert.rejects(salvarPlanoCompras({rpc:async()=>({data:null,error:{message}})},'fixture',{faca:1},0),e=>e.message===message);
 for(const data of [null,'1',-1,0.5,undefined])
  await assert.rejects(salvarPlanoCompras({rpc:async()=>({data,error:null})},'fixture',{},0),/Resposta inesperada/);
});
