import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const codigo=async p=>ts.transpileModule(await readFile(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {prepararServicoContextoCriacao}=await import(uri(await codigo('../src/contextoCriacao.ts')));
const {prepararContextoQA,MESA_CONTEXTO_QA:id}=await import(uri(await codigo('./ui/estadoContexto.ts')));
const ausente=()=>({mesaId:id,preparado:false,metodo:null,nivelInicial:null,permiteFinalizar:false,revisao:null});
const preparado=()=>({mesaId:id,preparado:true,metodo:'padrao',nivelInicial:1,permiteFinalizar:true,revisao:0});
test('contexto servico: preparacao inerte, entradas invalidas sem envio e argumentos minimos',async()=>{
 let n=0,args;const s=prepararServicoContextoCriacao({rpc:async(nome,a)=>{n++;args=[nome,a];return {data:preparado(),error:null};}});assert.equal(n,0);
 for(const rev of [-1,NaN,Number.MAX_SAFE_INTEGER+1])await assert.rejects(s.salvar(id,true,rev));await assert.rejects(s.consultar('invalido'));assert.equal(n,0);
 await s.salvar(id,true,null);assert.deepEqual(args,['salvar_contexto_criacao',{p_mesa:id,p_permite_finalizar:true,p_revisao:null}]);
});
test('contexto servico: projecao fechada e copia independente',async()=>{
 const dado=preparado(),s=prepararServicoContextoCriacao({rpc:async()=>({data:dado,error:null})});const lido=await s.consultar(id);dado.revisao=999;assert.equal(lido.revisao,0);
 for(const dado of [{...ausente(),permiteFinalizar:true},{...preparado(),segredo:'SEGREDO'},{...preparado(),mesaId:'outra'},{...preparado(),revisao:1.5},{...preparado(),nivelInicial:11},null])await assert.rejects(prepararServicoContextoCriacao({rpc:async()=>({data:dado,error:null})}).consultar(id));
});
test('contexto servico: erros nao mostram mensagens internas nem fazem repeticao automatica',async()=>{
 for(const code of ['PT409','PT422','42501','PT500']){let n=0;const s=prepararServicoContextoCriacao({rpc:async()=>{n++;return {data:preparado(),error:{code,message:'SEGREDO'}};}});await assert.rejects(s.consultar(id),e=>!e.message.includes('SEGREDO'));assert.equal(n,1);}
});
test('contexto fixture: inicializar pausar e permitir preservam recursos e revisoes',async()=>{
 const qa=prepararContextoQA('normal'),s=prepararServicoContextoCriacao(qa);assert.deepEqual(await s.consultar(id),ausente());let c=await s.salvar(id,true,null);assert.equal(c.revisao,0);c=await s.salvar(id,false,c.revisao);assert.equal(c.revisao,1);assert.equal(c.permiteFinalizar,false);c=await s.salvar(id,true,c.revisao);assert.equal(c.revisao,2);assert.equal((await s.salvar(id,true,2)).revisao,2);assert.equal(qa.estado().pv,7);assert.equal(qa.estado().sa,1);assert.equal(qa.estado().bi,3);
});
test('contexto fixture: legado e conflito nao sobrescrevem configuracao',async()=>{
 const legado=prepararContextoQA('legado');await assert.rejects(prepararServicoContextoCriacao(legado).salvar(id,true,null));assert.equal(legado.estado().contexto.preparado,false);assert.equal(legado.estado().personagens,1);
 const qa=prepararContextoQA('conflito'),s=prepararServicoContextoCriacao(qa);await assert.rejects(s.salvar(id,true,null),/desatualizado/);assert.equal((await s.consultar(id)).permiteFinalizar,false);assert.equal(qa.estado().envios,1);
});
test('contexto fixture: resposta perdida exige consulta e nao reenvia configuracao',async()=>{
 const qa=prepararContextoQA('resposta'),s=prepararServicoContextoCriacao(qa);await assert.rejects(s.salvar(id,true,null),/não confirmada/);const c=await s.consultar(id);assert.equal(c.preparado,true);assert.equal(c.permiteFinalizar,true);assert.equal(c.revisao,0);assert.equal(qa.estado().envios,1);
});
