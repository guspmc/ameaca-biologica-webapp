import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002',M='00000000-0000-4000-8000-000000000003',X='00000000-0000-4000-8000-000000000004';
const T='10000000-0000-4000-8000-000000000001',U='10000000-0000-4000-8000-000000000002';
const op=n=>'20000000-0000-4000-8000-'+String(n).padStart(12,'0');
const uid=(db,id)=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);
async function setup({integrada=false}={}){
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create publication supabase_realtime;");
 const dir=new URL('../../supabase/migrations/',import.meta.url);
 for(const f of(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 if(integrada)await db.exec(await readFile(new URL('../../supabase/proposals/ativacao-integrada-local.sql',import.meta.url),'utf8'));
 else for(const f of ['inventario-instancias.sql','ativacao-local.sql','resumo-operacional-local.sql','ciclo-ficha-local.sql'])await db.exec(await readFile(new URL('../../supabase/proposals/'+f,import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3),($4)',[A,B,M,X]);
 await db.query("insert into public.mesas(id,nome,mestre_id) values($1,'Fixture',$3),($2,'Outra',$4)",[T,U,M,X]);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador'),($1,$3,'jogador')",[T,A,B]);
 await db.query("insert into app_private.contextos_criacao_mesa(mesa_id,metodo,nivel_inicial,permite_criacao) values($1,'padrao',1,true)",[T]);
 await uid(db,A);return db;
}
const get=async(db,id)=>(await db.query('select * from public.personagens where id=$1',[id])).rows[0];
const instances=async(db,id)=>(await db.query('select id,dados from app_private.inventario_instancias where personagem_id=$1 order by chave_criacao',[id])).rows;
async function criar(db,owner=A,classe='Agente',kit='C',habilidade){
 await uid(db,owner);
 const id=(await db.query("select public.criar_personagem_rascunho($1,'Fixture privada',$2,3,2,1,1) id",[T,classe])).rows[0].id;
 await db.query("select public.definir_origem_rascunho($1,'Investigador','Investigação',null)",[id]);
 const pontos=classe==='Operador'?{Luta:2,Atletismo:1}:classe==='Autodidata'?{Luta:2,Pontaria:2,Medicina:1}:{Luta:2,Pontaria:2};
 await db.query('select public.definir_pericias_rascunho($1,$2)',[id,JSON.stringify(pontos)]);
 await db.query('select public.definir_habilidade_rascunho($1,$2)',[id,habilidade??(classe==='Operador'?'armeiro':classe==='Autodidata'?'herbalista':'rolamento')]);
 await db.query('select public.definir_equipamento_rascunho($1,$2)',[id,kit]);
 const cfg=(await get(db,id)).configuracao_funcionamento;cfg.modo='manual';
 await db.query('select public.salvar_funcionamento_rascunho($1,$2,0)',[id,JSON.stringify(cfg)]);
 await db.query('select public.definir_identidade_rascunho($1,$2,$3)',[id,'Fixture privada',JSON.stringify({historia:'HISTORIA PRIVADA',medo:'MEDO PRIVADO'})]);
 await db.query('update public.personagens set pv_atual=3,sa_atual=1,bi_atual=4 where id=$1',[id]);
 return id;
}
async function pedido(db,id,operacao=op(1)){
 const f=await get(db,id);const c=(await db.query('select revisao from app_private.contextos_criacao_mesa where mesa_id=$1',[f.mesa_id])).rows[0];
 return [id,operacao,f.revisao_criacao,c?.revisao??0];
}
const ativar=async(db,args)=>(await db.query('select app_private.ativar_ficha_local($1,$2,$3,$4) resultado',args)).rows[0].resultado;
async function asRole(db,who,fn,role='authenticated'){
 await db.exec('begin');
 try{await db.exec('set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[who??'']);return await fn();}
 finally{await db.exec('rollback');}
}
async function assertVazio(db,id){
 assert.equal((await get(db,id)).estado_ficha,'rascunho');assert.equal((await instances(db,id)).length,0);
 assert.equal((await db.query('select count(*)::int n from app_private.ativacoes_ficha where personagem_id=$1',[id])).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from app_private.materializacoes_inventario where personagem_id=$1',[id])).rows[0].n,0);
}


export {A,B,M,X,T,U,op,uid,setup,criar,get,instances,pedido,ativar,asRole,assertVazio};

