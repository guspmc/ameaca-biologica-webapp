import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002',M='00000000-0000-4000-8000-000000000003',X='00000000-0000-4000-8000-000000000004',T='10000000-0000-4000-8000-000000000001';
const inicial=()=>({modo:'misto',preferenciasMisto:{municao:true,inventario:true,duracaoEfeitos:true,biInfectante:null,durabilidadeAparar:null}});
async function setup(){
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create publication supabase_realtime;");
 const dir=new URL('../supabase/migrations/',import.meta.url);
 for(const f of(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3),($4)',[A,B,M,X]);
 await db.query("insert into public.mesas(id,nome,mestre_id) values($1,'Fixture',$2)",[T,M]);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador'),($1,$3,'jogador')",[T,A,B]);
 return db;
}
async function as(db,user,sql,args=[],role='authenticated'){
 await db.exec('begin');try{
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user??'']);await db.exec('set local role '+role);
 const r=await db.query(sql,args);await db.exec('commit');return r.rows;
 }catch(e){await db.exec('rollback');throw e;}
}
const create=async(db,user=A)=>(await as(db,user,"select public.criar_personagem_rascunho($1,'Fixture','Agente',2,2,2,1) id",[T]))[0].id;
const get=async(db,id)=>(await db.query('select * from public.personagens where id=$1',[id])).rows[0];
const save=async(db,id,c,rev=0,user=A)=>(await as(db,user,'select public.salvar_funcionamento_rascunho($1,$2::jsonb,$3) rev',[id,JSON.stringify(c),rev]))[0].rev;
test('funcionamento proposto: padrao, repeticao e alteracao preservam recursos e demais escolhas',async()=>{
 const db=await setup();try{
 const id=await create(db),before=await get(db,id);
 assert.deepEqual(before.configuracao_funcionamento,inicial());assert.equal(await save(db,id,inicial()),0);
 const c=inicial();c.modo='manual';c.preferenciasMisto.municao=false;c.preferenciasMisto.biInfectante=true;
 assert.equal(await save(db,id,c),1);assert.equal(await save(db,id,c),1);
 const after=await get(db,id);assert.deepEqual(after.configuracao_funcionamento,c);
 assert.deepEqual({...after,configuracao_funcionamento:before.configuracao_funcionamento,revisao_funcionamento:0},before);
 c.modo='automatico';assert.equal(await save(db,id,c,1),2);c.modo='misto';assert.equal(await save(db,id,c,2),3);
 assert.deepEqual((await get(db,id)).configuracao_funcionamento.preferenciasMisto,c.preferenciasMisto);
 }finally{await db.close();}
});
test('funcionamento proposto: payload estrito e revisao antiga/futura recusados atomicamente',async()=>{
 const db=await setup();try{
 const id=await create(db),before=await get(db,id);
 const invalidos=[null,[],{},'misto',{...inicial(),modo:'Manual'},{...inicial(),extra:true},{...inicial(),preferenciasMisto:null},{...inicial(),preferenciasMisto:[]},{modo:'misto',preferenciasMisto:{municao:true}}];
 for(const key of ['municao','inventario','duracaoEfeitos'])invalidos.push({...inicial(),preferenciasMisto:{...inicial().preferenciasMisto,[key]:null}});
 for(const v of [1,'true',{},[]])invalidos.push({...inicial(),preferenciasMisto:{...inicial().preferenciasMisto,biInfectante:v}});
 invalidos.push({...inicial(),preferenciasMisto:{...inicial().preferenciasMisto,intruso:true}});
 for(const c of invalidos)await assert.rejects(save(db,id,c),/invalida/);
 for(const rev of [null,-1,99])await assert.rejects(save(db,id,inicial(),rev),/invalida|desatualizada/);
 assert.deepEqual(await get(db,id),before);
 const c={...inicial(),modo:'manual'};await save(db,id,c);
 await assert.rejects(save(db,id,{...inicial(),modo:'automatico'},0),/desatualizada/);
 assert.deepEqual((await get(db,id)).configuracao_funcionamento,c);
 }finally{await db.close();}
});
test('funcionamento proposto: autor admitido em rascunho nivel 1; Mestre, anon e escrita direta negados',async()=>{
 const db=await setup();try{
 const id=await create(db);
 for(const user of [B,M,X]){await assert.rejects(save(db,id,inicial(),0,user),/negado/);assert.deepEqual(await as(db,user,'select configuracao_funcionamento from public.personagens where id=$1',[id]),[]);}
 await assert.rejects(save(db,id,inicial(),0,null),/Autenticacao/);
 await assert.rejects(as(db,null,"select public.salvar_funcionamento_rascunho($1,'{}',0)",[id],'anon'),/permission denied/);
 for(const field of ["configuracao_funcionamento='{}'","revisao_funcionamento=7"])await assert.rejects(as(db,A,'update public.personagens set '+field+' where id=$1',[id]),/permission denied/);
 await db.query("update public.personagens set estado_ficha='completa' where id=$1",[id]);await assert.rejects(save(db,id,inicial()),/negado/);
 await db.query("update public.personagens set estado_ficha='rascunho',nivel=2 where id=$1",[id]);await assert.rejects(save(db,id,inicial()),/nivel 1/);
 await db.query('update public.personagens set nivel=1 where id=$1',[id]);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);await assert.rejects(save(db,id,inicial()),/negado/);
 }finally{await db.close();}
});
test('funcionamento proposto: preferencias independentes entre fichas e indefinidos preservados',async()=>{
 const db=await setup();try{
 const a=await create(db),b=await create(db),outro=await create(db,B);
 const c=inicial();c.preferenciasMisto.durabilidadeAparar=false;await save(db,a,c);
 for(const id of [b,outro])assert.deepEqual((await get(db,id)).configuracao_funcionamento,inicial());
 assert.equal((await get(db,a)).configuracao_funcionamento.preferenciasMisto.biInfectante,null);
 }finally{await db.close();}
});

test('funcionamento proposto: smoke transacional pronto para TESTE passa localmente com rollback',async()=>{const db=await setup();try{await db.exec(await readFile(new URL('staging-funcionamento.sql',import.meta.url),'utf8'));}finally{await db.close();}});
