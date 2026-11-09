import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const {outputText}=ts.transpileModule(await readFile(new URL('../src/servicoFuncionamento.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {salvarFuncionamento}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('servico funcionamento envia configuracao copiada e revisao, sem campos mecanicos',async()=>{
 let chamada;const config={modo:'misto',preferenciasMisto:{municao:true,inventario:true,duracaoEfeitos:true,biInfectante:null,durabilidadeAparar:null}};
 const esperado=structuredClone(config);
 assert.equal(await salvarFuncionamento({rpc:async(nome,args)=>{chamada={nome,args};return {data:1,error:null};}},'fixture',config,0),1);
 config.preferenciasMisto.municao=false;
 assert.deepEqual(chamada,{nome:'salvar_funcionamento_rascunho',args:{p_personagem:'fixture',p_configuracao:esperado,p_revisao:0}});
});
test('servico funcionamento propaga recusa e nao trata resposta ambigua como salvamento',async()=>{
 const c={modo:'manual',preferenciasMisto:{}};
 for(const message of ['acesso negado','Revisao desatualizada'])await assert.rejects(salvarFuncionamento({rpc:async()=>({error:{message}})},'fixture',c,0),e=>e.message===message);
 for(const data of [null,undefined,'1',-1,0.5])await assert.rejects(salvarFuncionamento({rpc:async()=>({data,error:null})},'fixture',c,0),/Resposta inesperada/);
});
