import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {A,B,M,X,T,U,op,uid,setup,criar,get,pedido,asRole,assertVazio} from './helpers/ciclo-fixture.mjs';
async function banco(){const db=await setup();for(const f of ['consulta-ativacao-local.sql','gateway-ativacao-local.sql','contexto-criacao-local.sql'])await db.exec(await readFile(new URL('../supabase/proposals/'+f,import.meta.url),'utf8'));return db;}
const ler=async(db,mesa=T)=>(await db.query('select public.consultar_contexto_criacao($1) r',[mesa])).rows[0].r;
const salvar=async(db,permitir,rev,mesa=T)=>(await db.query('select public.salvar_contexto_criacao($1,$2,$3) r',[mesa,permitir,rev])).rows[0].r;
test('contexto: leitura fechada sem inicializar nem conceder acesso alheio',async()=>{
 const db=await banco();try{await db.query('delete from app_private.contextos_criacao_mesa where mesa_id=$1',[T]);
 for(const who of [A,M])assert.deepEqual(await asRole(db,who,()=>ler(db)),{mesaId:T,preparado:false,metodo:null,nivelInicial:null,permiteFinalizar:false,revisao:null});
 assert.equal((await db.query('select count(*)::int n from app_private.contextos_criacao_mesa')).rows[0].n,0);
 await assert.rejects(asRole(db,X,()=>ler(db)),e=>e.code==='42501');await assert.rejects(asRole(db,A,()=>ler(db,U)),e=>e.code==='42501');await assert.rejects(asRole(db,null,()=>ler(db),'anon'),/permission denied/);
 }finally{await db.close();}
});
test('contexto: somente Mestre prepara explicitamente Mesa vazia; parametros nao mudam metodo ou nivel',async()=>{
 const db=await banco();try{await db.query('delete from app_private.contextos_criacao_mesa where mesa_id=$1',[T]);
 for(const who of [A,B,X,null])await assert.rejects(asRole(db,who,()=>salvar(db,true,null)),e=>e.code==='42501');
 await asRole(db,M,async()=>{const c=await salvar(db,true,null);assert.equal(c.metodo,'padrao');assert.equal(c.nivelInicial,1);assert.equal(c.revisao,0);assert.equal(c.permiteFinalizar,true);});
 await assert.rejects(asRole(db,A,()=>db.query('select app_private.salvar_contexto_criacao_autorizado($1,true,null)',[T])),e=>e.code==='42501');
 }finally{await db.close();}
});
test('contexto: pausa preserva rascunho e recursos; reabrir disponibilidade invalida conferencia antiga',async()=>{
 const db=await banco();try{const id=await criar(db),f=await get(db,id),args=await pedido(db,id);await uid(db,M);
 await db.exec('set role authenticated');assert.equal((await salvar(db,false,0)).revisao,1);await db.exec('reset role');assert.deepEqual(await get(db,id),f);
 await asRole(db,A,async()=>{const c=(await db.query('select public.conferir_ativacao_personagem($1) r',[id])).rows[0].r;assert.ok(c.pendencias.length);await assert.rejects(db.query('select public.ativar_personagem($1,$2,$3,$4)',args),e=>e.code==='PT409');});
 await uid(db,M);await db.exec('set role authenticated');assert.equal((await salvar(db,true,1)).revisao,2);assert.equal((await salvar(db,true,2)).revisao,2);await db.exec('reset role');assert.deepEqual(await get(db,id),f);await assertVazio(db,id);
 await assert.rejects(asRole(db,A,()=>db.query('select public.ativar_personagem($1,$2,$3,$4)',args)),e=>e.code==='PT409'&&e.detail==='AB_REVISAO');
 }finally{await db.close();}
});
test('contexto: revisao antiga nao sobrescreve e contexto sem preparacao nao migra legadas',async()=>{
 const db=await banco();try{const id=await criar(db);await asRole(db,M,async()=>{await assert.rejects(salvar(db,false,null),e=>e.code==='PT409');});
 await db.query('delete from app_private.contextos_criacao_mesa where mesa_id=$1',[T]);await assert.rejects(asRole(db,M,()=>salvar(db,true,null)),e=>e.code==='PT422');assert.equal((await get(db,id)).metodo_criacao,null);
 }finally{await db.close();}
});
test('contexto: metodo Casa e nivel experiente nao sao alterados por esta API',async()=>{
 const db=await banco();try{for(const patch of ["metodo='casa'","metodo='padrao',nivel_inicial=2"]){await db.exec('update app_private.contextos_criacao_mesa set '+patch);const c=await asRole(db,M,()=>ler(db));await assert.rejects(asRole(db,M,()=>salvar(db,false,c.revisao)),e=>e.code==='PT422');assert.deepEqual(await asRole(db,M,()=>ler(db)),c);}
 await assert.rejects(asRole(db,A,()=>db.query('select * from app_private.contextos_criacao_mesa')),/permission denied/);
 }finally{await db.close();}
});
