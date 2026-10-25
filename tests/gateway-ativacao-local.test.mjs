import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {A,B,M,X,T,op,uid,setup,criar,get,pedido,asRole,assertVazio} from './helpers/ciclo-fixture.mjs';
async function banco(){const db=await setup();for(const f of ['consulta-ativacao-local.sql','gateway-ativacao-local.sql'])await db.exec(await readFile(new URL('../supabase/proposals/'+f,import.meta.url),'utf8'));return db;}
const conferir=async(db,id)=>(await db.query('select public.conferir_ativacao_personagem($1) r',[id])).rows[0].r;
const confirmar=async(db,args)=>(await db.query('select public.ativar_personagem($1,$2,$3,$4) r',args)).rows[0].r;
const snapshot=async db=>{const r={};for(const t of ['public.personagens','app_private.contextos_criacao_mesa','app_private.ativacoes_ficha','app_private.materializacoes_inventario','app_private.inventario_instancias'])r[t]=(await db.query('select to_jsonb(x) r from '+t+' x order by to_jsonb(x)::text')).rows;return r;};
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const transpilar=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const pedidoUri=uri(transpilar(await readFile(new URL('../src/pedidoAtivacao.ts',import.meta.url),'utf8')));
const {prepararServicosAtivacao}=await import(uri(transpilar(await readFile(new URL('../src/servicoAtivacao.ts',import.meta.url),'utf8')).replace("'./pedidoAtivacao'",JSON.stringify(pedidoUri))));

test('gateway local: conferencia fechada sem escrita ou narrativa e nove kits coerentes',async()=>{
 const db=await banco();let numero=0;try{for(const classe of ['Agente','Autodidata','Operador'])for(const kit of ['A','B','C']){
  const id=await criar(db,A,classe,kit),antes=await snapshot(db),args=await pedido(db,id,op(++numero));const c=await asRole(db,A,()=>conferir(db,id));
  assert.deepEqual(Object.keys(c).sort(),['personagemId','nome','revisaoFicha','revisaoMesa','ativas','pendencias'].sort());assert.deepEqual(c.pendencias,[]);assert.equal(c.revisaoFicha,args[2]);assert.equal(c.revisaoMesa,args[3]);assert.ok(!JSON.stringify(c).includes('HISTORIA'));assert.deepEqual(await snapshot(db),antes);
  await db.exec('set role authenticated');try{assert.equal((await confirmar(db,args)).estado,'completa');}finally{await db.exec('reset role');}assert.equal((await get(db,id)).estado_ficha,'completa');assert.equal((await get(db,id)).pv_atual,3);
 }}finally{await db.close();}
});
test('gateway local: autoria e vinculo verificados tambem na chamada direta ao servico',async()=>{
 const db=await banco();try{const id=await criar(db),args=await pedido(db,id);
 for(const who of [B,M,X,null])for(const call of [()=>conferir(db,id),()=>confirmar(db,args),()=>db.query('select app_private.conferir_ativacao_autorizada($1)',[id]),()=>db.query('select app_private.ativar_personagem_autorizado($1,$2,$3,$4)',args)])await assert.rejects(asRole(db,who,call),e=>e.code==='42501');
 await assert.rejects(asRole(db,null,()=>conferir(db,id),'anon'),/permission denied/);
 await assert.rejects(asRole(db,A,()=>db.query('select app_private.ativar_ficha_local($1,$2,$3,$4)',args)),/permission denied/);
 await assert.rejects(asRole(db,A,()=>db.query('select * from app_private.inventario_instancias')),/permission denied/);
 await uid(db,M);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);await assert.rejects(asRole(db,A,()=>conferir(db,id)),e=>e.code==='42501');
 }finally{await db.close();}
});
test('gateway local: pendencias e revisao antiga recusam sem efeitos e sem texto interno',async()=>{
 const db=await banco();try{const id=await criar(db);await db.query("update public.personagens set habilidade_basica=null where id=$1",[id]);const args=await pedido(db,id),antes=await snapshot(db);
 const c=await asRole(db,A,()=>conferir(db,id));assert.ok(c.pendencias.length);await assert.rejects(asRole(db,A,()=>confirmar(db,args)),e=>e.code==='PT422'&&e.detail==='AB_REGRA');assert.deepEqual(await snapshot(db),antes);
 await assert.rejects(asRole(db,A,()=>confirmar(db,[id,args[1],args[2]-1,args[3]])),e=>e.code==='PT409'&&e.detail==='AB_REVISAO');await assertVazio(db,id);
 }finally{await db.close();}
});
test('gateway local: confirmacao persistida idempotente e recibo projetado sem restaurar PV',async()=>{
 const db=await banco();try{const id=await criar(db),args=await pedido(db,id);await db.exec('set role authenticated');const r=await confirmar(db,args);await db.exec('reset role');
 assert.equal((await get(db,id)).pv_atual,3);assert.equal((await get(db,id)).estado_ficha,'completa');
 await db.query("update app_private.ativacoes_ficha set resposta=resposta||'{\"historia\":\"SEGREDO\"}' where personagem_id=$1",[id]);await db.query('update public.personagens set pv_atual=1 where id=$1',[id]);const antes=await snapshot(db);
 await asRole(db,A,async()=>{assert.deepEqual(await confirmar(db,args),r);await assert.rejects(confirmar(db,[id,op(99),args[2],args[3]]),e=>e.code==='PT409'&&e.detail==='AB_PEDIDO_DIVERGENTE');});
 assert.deepEqual(await snapshot(db),antes);assert.equal((await get(db,id)).pv_atual,1);
 }finally{await db.close();}
});
test('gateway local: conferencia de capacidade saldo e contexto ausente nao materializa',async()=>{
 const db=await banco();try{const id=await criar(db);await db.query("update public.personagens set compras_iniciais='{\"colete-leve\":2}',revisao_compras=1 where id=$1",[id]);
 assert.ok((await asRole(db,A,()=>conferir(db,id))).pendencias.length);await assertVazio(db,id);
 await db.query('delete from app_private.contextos_criacao_mesa where mesa_id=$1',[T]);const c=await asRole(db,A,()=>conferir(db,id));assert.equal(c.revisaoMesa,0);assert.ok(c.pendencias.some(p=>p.includes('Contexto')));await assertVazio(db,id);
 }finally{await db.close();}
});
test('gateway local: falha tardia e tratada sem vazamento com rollback integral',async()=>{
 const db=await banco();try{const id=await criar(db),args=await pedido(db,id),antes=await snapshot(db);
 await db.exec("create function app_private.falhar_gateway() returns trigger language plpgsql as $$begin raise exception 'SEGREDO NARRATIVO';end;$$;create trigger falhar_gateway before insert on app_private.ativacoes_ficha for each row execute function app_private.falhar_gateway();");
 await assert.rejects(asRole(db,A,()=>confirmar(db,args)),e=>e.code==='PT500'&&e.detail==='AB_INCERTO'&&!e.message.includes('SEGREDO'));assert.deepEqual(await snapshot(db),antes);await assertVazio(db,id);
 }finally{await db.close();}
});

test('gateway local: contrato TypeScript aceita SQL real e classifica revisao e regra',async()=>{
 const db=await banco();try{const id=await criar(db);const chamadas={
 conferir_ativacao_personagem:a=>db.query('select public.conferir_ativacao_personagem($1) r',[a.p_personagem]),
 ativar_personagem:a=>db.query('select public.ativar_personagem($1,$2,$3,$4) r',[a.p_personagem,a.p_operacao,a.p_revisao_ficha,a.p_revisao_mesa]),
 consultar_resultado_ativacao:a=>db.query('select public.consultar_resultado_ativacao($1,$2) r',[a.p_personagem,a.p_operacao])};
 const servico=prepararServicosAtivacao({rpc:async(nome,a)=>{try{return {data:(await chamadas[nome](a)).rows[0].r,error:null};}catch(e){return {data:null,error:{code:e.code,details:e.detail,message:e.message}};}}});
 await asRole(db,A,async()=>{const c=await servico.conferir(id),p={personagemId:id,operacaoId:op(1),revisaoFicha:c.revisaoFicha,revisaoMesa:c.revisaoMesa};
 await assert.rejects(servico.ativar({...p,revisaoFicha:p.revisaoFicha-1}),e=>e.tipo==='revisao');
 });
 await asRole(db,A,async()=>{const c=await servico.conferir(id),p={personagemId:id,operacaoId:op(1),revisaoFicha:c.revisaoFicha,revisaoMesa:c.revisaoMesa};assert.equal((await servico.ativar(p)).estado,'completa');assert.equal((await servico.consultarResultado(id,p)).situacao,'confirmada');});
 }finally{await db.close();}
});
test('gateway local: conferencia mascara erros imprevistos e metadados preservam invoker e search_path',async()=>{
 const db=await banco();try{const id=await criar(db);
 await db.exec("create or replace function app_private.validar_criacao_nivel_um(f public.personagens) returns void language plpgsql as $$begin raise exception using errcode='22023',message='SEGREDO INTERNO';end;$$;");
 await assert.rejects(asRole(db,A,()=>conferir(db,id)),e=>e.code==='PT500'&&!e.message.includes('SEGREDO'));
 const rows=(await db.query("select proname,prosecdef,proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname in('conferir_ativacao_personagem','ativar_personagem')")).rows;
 assert.equal(rows.length,2);for(const r of rows){assert.equal(r.prosecdef,false);assert.ok(r.proconfig.some(v=>v.startsWith('search_path=')));}await assertVazio(db,id);
 }finally{await db.close();}
});
