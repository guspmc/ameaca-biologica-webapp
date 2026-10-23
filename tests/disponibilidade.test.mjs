import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const M='00000000-0000-4000-8000-000000000001',J='00000000-0000-4000-8000-000000000002',X='00000000-0000-4000-8000-000000000003';
const T='10000000-0000-4000-8000-000000000001',U='10000000-0000-4000-8000-000000000002';
async function setup(){
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create publication supabase_realtime;");
 const dir=new URL('../supabase/migrations/',import.meta.url);
 for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 await db.exec(await readFile(new URL('../supabase/proposals/disponibilidade-mestre.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3)',[M,J,X]);
 await db.query("insert into public.mesas(id,nome,mestre_id) values($1,'Fixture M', $2),($3,'Fixture X',$4)",[T,M,U,X]);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador')",[T,J]);
 return db;
}
async function as(db,user,sql,args=[],role='authenticated'){
 await db.exec('begin');try{
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user??'']);await db.exec('set local role '+role);
 const r=await db.query(sql,args);await db.exec('commit');return r.rows;
 }catch(e){await db.exec('rollback');throw e;}
}
const set=(db,user,item,value,expected=false,mesa=T)=>as(db,user,'select public.definir_disponibilidade_inicial($1,$2,$3,$4) ok',[mesa,item,value,expected]);
const list=(db,user,mesa=T)=>as(db,user,'select * from public.listar_disponibilidade_inicial($1)',[mesa]);
test('Disponibilidade proposta: somente Mestre da Mesa configura e lista; anon e escrita direta negados',async()=>{
 const db=await setup();try{
 assert.deepEqual(await list(db,M),[]);
 for(const user of [J,X,null]){
 await assert.rejects(set(db,user,'faca',true),/negado|Autenticacao/);
 await assert.rejects(list(db,user),/negado/);
 }
 await assert.rejects(as(db,null,'select * from public.listar_disponibilidade_inicial($1)',[T],'anon'),/permission denied/);
 await assert.rejects(as(db,null,"select public.definir_disponibilidade_inicial($1,'faca',true,false)",[T],'anon'),/permission denied/);
 await assert.rejects(as(db,M,"insert into app_private.disponibilidade_compra_inicial values($1,'faca')",[T]),/permission denied/);
 await set(db,M,'faca',true);assert.deepEqual(await list(db,M),[{item_id:'faca'}]);
 assert.deepEqual(await list(db,X,U),[]);
 }finally{await db.close();}
});
test('Disponibilidade proposta: estados e entradas validos, sem liberar outros itens ou Mesas',async()=>{
 const db=await setup();try{
 for(const args of [['inexistente',true,false],[null,true,false],['faca',null,false],['faca',true,null]])await assert.rejects(set(db,M,...args),/invalida/);
 await set(db,M,'faca',true);
 await assert.rejects(set(db,M,'faca',false,false),/desatualizada/);
 await set(db,M,'faca',false,true);assert.deepEqual(await list(db,M),[]);
 assert.equal((await set(db,M,'faca',false,false))[0].ok,false);
 await assert.rejects(set(db,M,'faca',true,false,U),/negado/);
 }finally{await db.close();}
});
test('Disponibilidade proposta: bloquear preserva compras salvas e impede novo plano com item bloqueado',async()=>{
 const db=await setup();try{
 const id=(await as(db,J,"select public.criar_personagem_rascunho($1,'Fixture','Agente',2,2,2,1) id",[T]))[0].id;
 await as(db,J,"select public.definir_equipamento_rascunho($1,'C')",[id]);
 await set(db,M,'faca',true);
 await as(db,J,"select public.salvar_compras_rascunho($1,'{\"faca\":1}',0)",[id]);
 await set(db,M,'faca',false,true);
 assert.deepEqual((await db.query('select compras_iniciais from public.personagens where id=$1',[id])).rows[0].compras_iniciais,{faca:1});
 await assert.rejects(as(db,J,"select public.salvar_compras_rascunho($1,'{\"faca\":2}',1)",[id]),/indisponivel/);
 await as(db,J,"select public.salvar_compras_rascunho($1,'{}',1)",[id]);
 }finally{await db.close();}
});
