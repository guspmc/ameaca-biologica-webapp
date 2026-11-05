import {test} from 'node:test';
import assert from 'node:assert/strict';
import {A,B,M,T,op,uid,setup,criar,get,instances,pedido} from './helpers/ciclo-fixture.mjs';

test('pacote integrado: ativa uma ficha uma vez, recupera o recibo e preserva recursos',async()=>{
 const db=await setup({integrada:true});
 try{
  const id=await criar(db,A,'Agente','A');
  const antes=await get(db,id);
  const args=await pedido(db,id,op(701));
  await uid(db,A);
  await db.exec('set role authenticated');
  const conferencia=(await db.query('select public.conferir_ativacao_personagem($1) r',[id])).rows[0].r;
  assert.deepEqual(Object.keys(conferencia).sort(),['personagemId','nome','revisaoFicha','revisaoMesa','ativas','pendencias'].sort());
  assert.equal(conferencia.personagemId,id);
  assert.equal(conferencia.revisaoFicha,args[2]);
  assert.equal(conferencia.revisaoMesa,args[3]);
  assert.deepEqual(conferencia.pendencias,[]);
  const recibo=(await db.query('select public.ativar_personagem($1,$2,$3,$4) r',args)).rows[0].r;
  assert.deepEqual(Object.keys(recibo).sort(),['personagemId','operacaoId','estado','quantidadeInstancias','revisaoCriacao'].sort());
  assert.equal(recibo.personagemId,id);
  assert.equal(recibo.operacaoId,args[1]);
  assert.equal(recibo.estado,'completa');
  assert.ok(recibo.revisaoCriacao>antes.revisao_criacao);
  const repetido=(await db.query('select public.ativar_personagem($1,$2,$3,$4) r',args)).rows[0].r;
  assert.deepEqual(repetido,recibo);
  const recuperado=(await db.query('select public.consultar_resultado_ativacao($1,$2) r',[id,args[1]])).rows[0].r;
  assert.deepEqual(recuperado,{situacao:'confirmada',estadoFicha:'completa',pedido:{personagemId:id,operacaoId:args[1],revisaoFicha:args[2],revisaoMesa:args[3]},recibo});
  await db.exec('reset role');

  const depois=await get(db,id);
  assert.equal(depois.estado_ficha,'completa');
  assert.equal(depois.metodo_criacao,'padrao');
  assert.equal(depois.pv_atual,antes.pv_atual);
  assert.equal(depois.sa_atual,antes.sa_atual);
  assert.equal(depois.bi_atual,antes.bi_atual);
  assert.equal((await instances(db,id)).length,recibo.quantidadeInstancias);
  assert.equal((await db.query('select count(*)::int n from app_private.ativacoes_ficha where personagem_id=$1',[id])).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from app_private.materializacoes_inventario where personagem_id=$1',[id])).rows[0].n,1);
 }finally{await db.close();}
});

test('pacote integrado: contexto explicito e resumo do Mestre sem acesso a ficha privada',async()=>{
 const db=await setup({integrada:true});
 try{
  const id=await criar(db,A,'Operador','B');
  const args=await pedido(db,id,op(702));
  await uid(db,A);await db.exec('set role authenticated');
  await db.query('select public.ativar_personagem($1,$2,$3,$4)',args);
  await db.exec('reset role');

  await uid(db,M);await db.exec('set role authenticated');
  const contexto=(await db.query('select public.consultar_contexto_criacao($1) r',[T])).rows[0].r;
  assert.equal(contexto.preparado,true);
  assert.equal(contexto.metodo,'padrao');
  assert.equal(contexto.nivelInicial,1);
  assert.equal(contexto.permiteFinalizar,true);
  const resumo=(await db.query('select public.resumo_operacional_mesa($1) r',[T])).rows[0].r;
  assert.equal(resumo.length,1);
  assert.deepEqual(Object.keys(resumo[0]).sort(),['personagemId','nome','classe','nivel','pv','sa','bi','defesa','passivos','condicoes'].sort());
  assert.ok(!JSON.stringify(resumo).includes('HISTORIA PRIVADA'));
  assert.ok(!JSON.stringify(resumo).includes('MEDO PRIVADO'));
  assert.equal((await db.query('select count(*)::int n from public.personagens where id=$1',[id])).rows[0].n,0);
  await db.exec('reset role');
 }finally{await db.close();}
});

test('pacote integrado: comandos publicos de ativacao continuam indisponiveis para anonimo',async()=>{
 const db=await setup({integrada:true});
 try{
  const id=await criar(db,A);
  await uid(db,null);await db.exec('set role anon');
  await assert.rejects(db.query('select public.conferir_ativacao_personagem($1)',[id]),/permission denied/);
  await assert.rejects(db.query('select public.ativar_personagem($1,$2,0,0)',[id,op(703)]),/permission denied/);
  await db.exec('reset role');
 }finally{await db.close();}
});

test('ciclo integrado: saida do jogador apaga seus rascunhos, mas preserva fichas completas e inventario',async()=>{
 const db=await setup({integrada:true});
 try{
  const rascunho=await criar(db,A,'Agente','C');
  const completa=await criar(db,A,'Operador','B');
  const args=await pedido(db,completa,op(704));
  await uid(db,A);await db.query('select app_private.ativar_ficha_local($1,$2,$3,$4)',args);
  const antes=await get(db,completa);
  const itensAntes=await instances(db,completa);
  assert.ok(itensAntes.length>0);
  await uid(db,A);
  await db.query('select app_private.sair_mesa_local($1,true)',[T]);
  assert.equal((await get(db,rascunho)),undefined);
  const depois=await get(db,completa);
  assert.equal(depois.estado_ficha,'completa');
  assert.equal(depois.jogador_id,A);
  assert.equal(depois.pv_atual,antes.pv_atual);
  assert.equal(depois.sa_atual,antes.sa_atual);
  assert.equal(depois.bi_atual,antes.bi_atual);
  assert.deepEqual(await instances(db,completa),itensAntes);
  assert.equal((await db.query('select count(*)::int n from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A])).rows[0].n,0);
 }finally{await db.close();}
});

test('ciclo integrado: exclusao da Mesa elimina fichas e dados privados em cascata',async()=>{
 const db=await setup({integrada:true});
 try{
  const id=await criar(db,A,'Agente','C');
  const args=await pedido(db,id,op(705));
  await uid(db,A);await db.query('select app_private.ativar_ficha_local($1,$2,$3,$4)',args);
  assert.ok((await instances(db,id)).length>0);
  await uid(db,M);
  await db.query('delete from public.mesas where id=$1',[T]);
  assert.equal((await get(db,id)),undefined);
  assert.equal((await db.query('select count(*)::int n from app_private.inventario_instancias where mesa_id=$1',[T])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from app_private.materializacoes_inventario where personagem_id=$1',[id])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from app_private.ativacoes_ficha where mesa_id=$1',[T])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from app_private.contextos_criacao_mesa where mesa_id=$1',[T])).rows[0].n,0);
 }finally{await db.close();}
});

test('ciclo integrado: falha na limpeza de rascunhos reverte a saida inteira',async()=>{
 const db=await setup({integrada:true});
 try{
  const id=await criar(db,A,'Agente','C');
  await db.exec(`create function app_private.falhar_limpeza_rascunho() returns trigger language plpgsql as $$begin raise exception 'falha simulada na limpeza';end$$;
    create trigger teste_falha_limpeza before delete on public.personagens for each row when (old.estado_ficha='rascunho') execute function app_private.falhar_limpeza_rascunho();`);
  await uid(db,A);
  await assert.rejects(db.query('select app_private.sair_mesa_local($1,true)',[T]),/falha simulada na limpeza/);
  assert.ok(await get(db,id));
  assert.equal((await db.query('select count(*)::int n from public.mesa_participantes where mesa_id=$1 and usuario_id=$2 and papel=\'jogador\'',[T,A])).rows[0].n,1);
 }finally{await db.close();}
});

test('ciclo integrado: Mestre remove somente o jogador escolhido, limpa apenas seus rascunhos e preserva fichas completas',async()=>{
 const db=await setup({integrada:true});
 try{
  const rascunhoA=await criar(db,A,'Agente','C');
  const rascunhoB=await criar(db,B,'Autodidata','B');
  const completaB=await criar(db,B,'Operador','A');
  const args=await pedido(db,completaB,op(706));
  await uid(db,B);
  await db.query('select app_private.ativar_ficha_local($1,$2,$3,$4)',args);
  const completaAntes=await get(db,completaB);
  const itensAntes=await instances(db,completaB);

  await uid(db,M);
  await db.exec('set role authenticated');
  const removido=await db.query("delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2 and papel='jogador'",[T,B]);
  assert.equal(removido.rowCount,1);
  await db.exec('reset role');

  assert.equal((await get(db,rascunhoB)),undefined);
  assert.ok(await get(db,rascunhoA));
  const completaDepois=await get(db,completaB);
  assert.equal(completaDepois.estado_ficha,'completa');
  assert.equal(completaDepois.jogador_id,B);
  assert.equal(completaDepois.pv_atual,completaAntes.pv_atual);
  assert.equal(completaDepois.sa_atual,completaAntes.sa_atual);
  assert.equal(completaDepois.bi_atual,completaAntes.bi_atual);
  assert.deepEqual(await instances(db,completaB),itensAntes);
  assert.equal((await db.query('select count(*)::int n from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,B])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A])).rows[0].n,1);

  await uid(db,A);
  await db.exec('set role authenticated');
  const tentativa=await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
  assert.equal(tentativa.rowCount,0);
  await assert.rejects(db.query('select app_private.sair_mesa_local($1,true)',[T]),/permission denied/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int n from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A])).rows[0].n,1);
 }finally{await db.close();}
});
