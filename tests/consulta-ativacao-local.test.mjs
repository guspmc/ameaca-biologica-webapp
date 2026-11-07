import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {A,B,M,X,T,op,uid,setup,criar,get,pedido,ativar,asRole} from './helpers/ciclo-fixture.mjs';
async function banco(){const db=await setup();await db.exec(await readFile(new URL('../supabase/proposals/consulta-ativacao-local.sql',import.meta.url),'utf8'));return db;}
const consultar=(db,id,operacao=null)=>(db.query('select public.consultar_resultado_ativacao($1,$2) r',[id,operacao])).then(r=>r.rows[0].r);
const snapshot=async(db)=>{
 const r={};for(const t of ['public.personagens','app_private.ativacoes_ficha','app_private.inventario_instancias','app_private.contextos_criacao_mesa'])r[t]=(await db.query('select to_jsonb(x) r from '+t+' x order by to_jsonb(x)::text')).rows;
 return r;
};
test('consulta local: rascunho sem recibo e leitura sem escrita, reserva ou materializacao',async()=>{
 const db=await banco();try{const id=await criar(db),antes=await snapshot(db);
 await asRole(db,A,async()=>{assert.deepEqual(await consultar(db,id),{situacao:'sem_recibo',estadoFicha:'rascunho',pedido:null,recibo:null});assert.equal((await consultar(db,id,op(1))).situacao,'sem_recibo');});
 assert.deepEqual(await snapshot(db),antes);
 }finally{await db.close();}
});
test('consulta local: autoria recupera recibo por ficha sem referencia local e por operacao original',async()=>{
 const db=await banco();try{const id=await criar(db),args=await pedido(db,id),recibo=await ativar(db,args);
 await db.query("update app_private.ativacoes_ficha set resposta=resposta||'{\"historia\":\"SEGREDO\"}' where personagem_id=$1",[id]);
 await db.query('update public.personagens set pv_atual=1 where id=$1',[id]);const antes=await snapshot(db);
 await asRole(db,A,async()=>{for(const operacao of [null,args[1]]){const r=await consultar(db,id,operacao);assert.deepEqual(r,{situacao:'confirmada',estadoFicha:'completa',pedido:{personagemId:id,operacaoId:args[1],revisaoFicha:args[2],revisaoMesa:args[3]},recibo});assert.ok(!JSON.stringify(r).includes('SEGREDO'));}});
 assert.deepEqual(await snapshot(db),antes);assert.equal((await get(db,id)).pv_atual,1);
 }finally{await db.close();}
});
test('consulta local: Mestre, outra autoria, nao membro, removido e anon nao leem recibo',async()=>{
 const db=await banco();try{const id=await criar(db);await ativar(db,await pedido(db,id));
 for(const who of [M,B,X])await assert.rejects(asRole(db,who,()=>consultar(db,id)),e=>e.code==='42501');
 await assert.rejects(asRole(db,null,()=>consultar(db,id),'anon'),/permission denied/);
 await asRole(db,A,async()=>assert.equal((await db.query('select app_private.consultar_resultado_ativacao_autorizado($1,null) r',[id])).rows[0].r.situacao,'confirmada'));
 await uid(db,M);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
 await assert.rejects(asRole(db,A,()=>consultar(db,id)),e=>e.code==='42501');
 await assert.rejects(asRole(db,M,()=>db.query('select app_private.consultar_resultado_ativacao_autorizado($1,null)',[id])),e=>e.code==='42501');
 await assert.rejects(asRole(db,A,()=>db.query('select * from app_private.ativacoes_ficha')),/permission denied/);
 }finally{await db.close();}
});
test('consulta local: operacao divergente e recibo corrompido recusados sem alterar dados',async()=>{
 const db=await banco();try{const id=await criar(db);await ativar(db,await pedido(db,id));const antes=await snapshot(db);
 await assert.rejects(asRole(db,A,()=>consultar(db,id,op(99))),e=>e.code==='PT409'&&e.detail==='AB_PEDIDO_DIVERGENTE');assert.deepEqual(await snapshot(db),antes);
 await db.query("update app_private.ativacoes_ficha set resposta=jsonb_set(resposta,'{quantidadeInstancias}','\"SEGREDO\"') where personagem_id=$1",[id]);
 await assert.rejects(asRole(db,A,()=>consultar(db,id)),e=>e.code==='PT422'&&!e.message.includes('SEGREDO'));
 }finally{await db.close();}
});
test('consulta local: completa legada sem recibo nao e declarada rascunho; arquivamento/retomada nao vaza operacao antiga',async()=>{
 const db=await banco();try{const legada=await criar(db);await db.query("update public.personagens set estado_ficha='completa' where id=$1",[legada]);
 await asRole(db,A,async()=>assert.deepEqual(await consultar(db,legada),{situacao:'sem_recibo',estadoFicha:'completa',pedido:null,recibo:null}));
 const id=await criar(db);await ativar(db,await pedido(db,id));await uid(db,M);const rev=(await get(db,id)).revisao_criacao;
 await db.query("select app_private.executar_ciclo_ficha_local($1,$2,$3,'arquivar')",[id,op(50),rev]);await assert.rejects(asRole(db,A,()=>consultar(db,id)),e=>e.code==='42501');
 await uid(db,B);await db.query("select app_private.executar_ciclo_ficha_local($1,$2,$3,'assumir')",[id,op(51),(await get(db,id)).revisao_criacao]);
 await asRole(db,B,async()=>assert.deepEqual(await consultar(db,id),{situacao:'sem_recibo',estadoFicha:'completa',pedido:null,recibo:null}));
 await assert.rejects(asRole(db,A,()=>consultar(db,id)),e=>e.code==='42501');
 }finally{await db.close();}
});
