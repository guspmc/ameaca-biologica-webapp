import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const source=(await Promise.all(['origens','equipamento','comprasIniciais','inventarioCriacao'].map(n=>readFile(new URL('../src/'+n+'.ts',import.meta.url),'utf8')))).map(s=>s.replace(/^import .*;\r?$/gm,'')).join('\n');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {planejarInventarioCriacao}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const A='00000000-0000-4000-8000-000000000001',M='00000000-0000-4000-8000-000000000002',T='10000000-0000-4000-8000-000000000001';
async function setup(){
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create publication supabase_realtime;");
 const dir=new URL('../supabase/migrations/',import.meta.url);
 for(const f of(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 await db.exec(await readFile(new URL('../supabase/proposals/inventario-instancias.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2)',[A,M]);
 await db.query("insert into public.mesas(id,nome,mestre_id) values($1,'Fixture',$2)",[T,M]);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador')",[T,A]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
 const id=(await db.query("select public.criar_personagem_rascunho($1,'Fixture','Agente',3,2,1,1) id",[T])).rows[0].id;
 return {db,id};
}
const materializar=(db,id)=>db.query('select app_private.persistir_inventario_criacao($1) total',[id]);
const itens=async(db,id)=>(await db.query('select id,dados from app_private.inventario_instancias where personagem_id=$1 order by chave_criacao',[id])).rows;
const preparar=(db,id,classe='Agente',kit='C',compras={},forca=3)=>db.query('update public.personagens set classe=$2,equipamento_inicial=$3,compras_iniciais=$4::jsonb,forca=$5 where id=$1',[id,classe,kit,JSON.stringify(compras),forca]);
const count=async(db,table)=>(await db.query('select count(*)::int n from app_private.'+table)).rows[0].n;
test('inventario SQL local: nove kits e estados iguais ao planejador TypeScript, sem alterar personagem',async()=>{
 const {db,id}=await setup();try{
 for(const classe of ['Agente','Autodidata','Operador'])for(const kit of ['A','B','C']){
 await preparar(db,id,classe,kit);
 const f=(await db.query('select * from public.personagens where id=$1',[id])).rows[0];
 const esperado=planejarInventarioCriacao(f).itens.sort((a,b)=>a.chaveCriacao.localeCompare(b.chaveCriacao));
 await materializar(db,id);
 const atual=(await itens(db,id)).map(r=>r.dados).sort((a,b)=>a.chaveCriacao.localeCompare(b.chaveCriacao));
 assert.deepEqual(atual,esperado);
 assert.deepEqual((await db.query('select * from public.personagens where id=$1',[id])).rows[0],f);
 await db.query('delete from app_private.materializacoes_inventario where personagem_id=$1',[id]);
 }
 }finally{await db.close();}
});
test('inventario SQL local: repeticao preserva IDs e item ja alterado; fonte diferente recusada',async()=>{
 const {db,id}=await setup();try{
 await preparar(db,id,'Agente','C',{faca:2});await materializar(db,id);
 const antes=await itens(db,id);
 await db.query("update app_private.inventario_instancias set dados=jsonb_set(dados,'{estado,durabilidadeAtual}','0') where id=$1",[antes.find(r=>r.dados.catalogoId==='faca').id]);
 const alterados=await itens(db,id);await materializar(db,id);assert.deepEqual(await itens(db,id),alterados);
 await db.query('update public.personagens set forca=2 where id=$1',[id]);
 await assert.rejects(materializar(db,id),/Fonte alterada/);assert.deepEqual(await itens(db,id),alterados);
 }finally{await db.close();}
});
test('inventario SQL local: falha intermediaria reverte registro e todos os itens',async()=>{
 const {db,id}=await setup();try{
 await preparar(db,id,'Agente','C',{faca:1});
 await db.exec("create function app_private.falha_fixture() returns trigger language plpgsql as $$begin if new.dados->>'catalogoId'='faca' then raise exception 'Falha fixture';end if;return new;end$$;create trigger falha_fixture before insert on app_private.inventario_instancias for each row execute function app_private.falha_fixture();");
 await assert.rejects(materializar(db,id),/Falha fixture/);
 assert.equal(await count(db,'materializacoes_inventario'),0);assert.equal(await count(db,'inventario_instancias'),0);
 await db.exec('drop trigger falha_fixture on app_private.inventario_instancias');
 await materializar(db,id);assert.equal(await count(db,'materializacoes_inventario'),1);
 }finally{await db.close();}
});
test('inventario SQL local: pilhas e moedas conservadas; excesso recusado sem persistencia parcial',async()=>{
 const {db,id}=await setup();try{
 await preparar(db,id,'Agente','C',{'municao-9mm':3},0);await materializar(db,id);
 const dados=(await itens(db,id)).map(r=>r.dados);
 assert.deepEqual(dados.filter(i=>i.catalogoId==='municao-9mm').map(i=>i.quantidade),[30,15]);
 assert.equal(dados.some(i=>i.catalogoId==='moedas'),false);
 await db.query('delete from app_private.materializacoes_inventario where personagem_id=$1',[id]);
 await preparar(db,id,'Agente','C',{faca:2},0);await assert.rejects(materializar(db,id),/Capacidade/);
 assert.equal(await count(db,'materializacoes_inventario'),0);assert.equal(await count(db,'inventario_instancias'),0);
 }finally{await db.close();}
});
test('inventario SQL local: funcao interna e tabelas negadas aos clientes; autoria e admissao revalidadas',async()=>{
 const {db,id}=await setup();try{
 await preparar(db,id);
 for(const role of ['anon','authenticated']){
 await db.exec('begin');try{await db.exec('set local role '+role);await assert.rejects(materializar(db,id),/permission denied/);}finally{await db.exec('rollback');}
 await db.exec('begin');try{await db.exec('set local role '+role);await assert.rejects(db.query('select * from app_private.inventario_instancias'),/permission denied/);}finally{await db.exec('rollback');}
 }
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[M]);await assert.rejects(materializar(db,id),/Acesso negado/);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);await assert.rejects(materializar(db,id),/Acesso negado/);
 assert.equal(await count(db,'materializacoes_inventario'),0);
 }finally{await db.close();}
});
