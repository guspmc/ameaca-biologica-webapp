import {test} from 'node:test';
import assert from 'node:assert/strict';
import {A,B,M,X,T,U,op,uid,setup,criar,get,instances,pedido,ativar,asRole} from './helpers/ciclo-fixture.mjs';
const prever=async(db,id)=>(await db.query('select app_private.prever_arquivamento_local($1) p',[id])).rows[0].p;
const ciclo=async(db,id,operacao,rev,tipo)=>(await db.query('select app_private.executar_ciclo_ficha_local($1,$2,$3,$4) r',[id,operacao,rev,tipo])).rows[0].r;
const arquivar=async(db,id,n=100)=>{await uid(db,M);const p=await prever(db,id);return ciclo(db,id,op(n),p.revisao,'arquivar');};
const permanentes=f=>Object.fromEntries(Object.entries(f).filter(([k])=>!['jogador_id','estado_ficha','revisao_criacao','revisao_inventario'].includes(k)));
const todos=async(db,id)=>(await db.query('select * from app_private.inventario_instancias where personagem_id=$1 order by id',[id])).rows;

test('ciclo local: comandos privados negados aos clientes e proveniencia das instancias protegida',async()=>{
 const db=await setup();try{
 const id=await criar(db);await ativar(db,await pedido(db,id));
 for(const [who,role] of [[A,'authenticated'],[M,'authenticated'],[null,'anon']]){
  for(const sql of [
   'select app_private.prever_arquivamento_local($1)',
   "select app_private.executar_ciclo_ficha_local($1,'20000000-0000-4000-8000-000000000100',0,'arquivar')",
   'select app_private.excluir_rascunho_local($1,0,true)',
   'select app_private.sair_mesa_local($1,true)',
   'select * from app_private.operacoes_ciclo_ficha where personagem_id=$1'
  ])await assert.rejects(asRole(db,who,()=>db.query(sql,[id]),role),/permission denied/);
 }
 const item=(await todos(db,id))[0];
 await assert.rejects(db.query('update app_private.inventario_instancias set mesa_id=$2 where id=$1',[item.id,U]),/Proveniencia/);
 await assert.rejects(db.query("update app_private.inventario_instancias set chave_criacao='outra' where id=$1",[item.id]),/Proveniencia/);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador')",[U,A]);
 await uid(db,A);const outra=(await db.query("select public.criar_personagem_rascunho($1,'Outra','Agente',3,2,1,1) id",[U])).rows[0].id;
 await assert.rejects(db.query('update app_private.inventario_instancias set portador_id=$2 where id=$1',[item.id,outra]),/Mesa divergente/);
 assert.deepEqual((await todos(db,id)).find(i=>i.id===item.id),item);
 }finally{await db.close();}
});

test('ciclo local: Mestre arquiva sem duplicar itens, preserva arma modificada, vinculados e perdidos',async()=>{
 const db=await setup();try{
 const id=await criar(db,A,'Agente','B');await ativar(db,await pedido(db,id));
 const arma=(await instances(db,id)).find(i=>i.dados.catalogoId==='jmb-hp3');
 arma.dados.estado.carregada=7;arma.dados.estado.pecas=[{id:'peca-fixture',estado:'instalada'}];
 await db.query('update app_private.inventario_instancias set dados=$2 where id=$1',[arma.id,JSON.stringify(arma.dados)]);
 for(const [chave,destino,vinculo] of [['perdido-fixture','perdido','comum'],['expansao-fixture','personagem','expansao']]){
  const dados={chaveCriacao:chave,catalogoId:chave,nome:chave,quantidade:1,espacos:1,local:'inventario',posicao:6,vinculadoClasse:false,estado:{tipo:'fixture'}};
  await db.query('insert into app_private.inventario_instancias(personagem_id,chave_criacao,dados,destino,vinculo) values($1,$2,$3,$4,$5)',[id,chave,JSON.stringify(dados),destino,vinculo]);
 }
 await uid(db,A);await assert.rejects(prever(db,id),/acesso negado/);
 await uid(db,M);const preview=await prever(db,id),antes=await get(db,id),itens=await todos(db,id);
 assert.equal(preview.itensParaBau.length,4);assert.ok(!JSON.stringify(preview).includes('HISTORIA PRIVADA'));
 const r=await ciclo(db,id,op(100),preview.revisao,'arquivar'),depois=await get(db,id),movidos=await todos(db,id);
 assert.equal(r.itensEnviadosBau,4);assert.equal(depois.estado_ficha,'arquivada');assert.equal(depois.jogador_id,null);
 assert.deepEqual(permanentes(depois),permanentes(antes));
 assert.deepEqual(movidos.map(i=>[i.id,i.dados]),itens.map(i=>[i.id,i.dados]));
 for(const item of movidos){
  const original=itens.find(i=>i.id===item.id);
  if(original.destino==='perdido')assert.deepEqual(item,original);
  else if(item.vinculo==='comum'){assert.equal(item.destino,'bau');assert.equal(item.portador_id,null);}
  else {assert.equal(item.destino,'personagem');assert.equal(item.portador_id,id);}
 }
 assert.deepEqual(await ciclo(db,id,op(100),preview.revisao,'arquivar'),r);assert.deepEqual(await todos(db,id),movidos);
 }finally{await db.close();}
});

test('ciclo local: jogador admitido assume uma vez sem recompor equipamento ou recalcular progresso/metodo',async()=>{
 const db=await setup();try{
 const id=await criar(db);await ativar(db,await pedido(db,id));await arquivar(db,id);
 await db.query("update public.personagens set nivel=3,metodo_criacao='casa' where id=$1",[id]);
 const antes=await get(db,id),itens=await todos(db,id);await uid(db,B);
 const rev=antes.revisao_criacao,r=await ciclo(db,id,op(101),rev,'assumir'),f=await get(db,id);
 assert.equal(f.jogador_id,B);assert.equal(f.estado_ficha,'completa');assert.deepEqual(permanentes(f),permanentes(antes));
 assert.deepEqual(await todos(db,id),itens);assert.equal(r.itensEnviadosBau,0);
 assert.deepEqual(await ciclo(db,id,op(101),rev,'assumir'),r);
 await uid(db,A);await assert.rejects(ciclo(db,id,op(102),rev,'assumir'),/desatualizada|incompativel/);
 await uid(db,X);await assert.rejects(ciclo(db,id,op(103),(await get(db,id)).revisao_criacao,'assumir'),/negado/);
 await uid(db,M);await assert.rejects(ciclo(db,id,op(104),(await get(db,id)).revisao_criacao,'assumir'),/negado/);
 }finally{await db.close();}
});

test('ciclo local: inventario alterado invalida previa e falhas tardias revertem estado, itens e recibo',async()=>{
 const db=await setup();try{
 const id=await criar(db);await ativar(db,await pedido(db,id));await uid(db,M);const p=await prever(db,id);
 const i=(await instances(db,id))[0];await db.query("update app_private.inventario_instancias set dados=dados||'{\"observacao\":\"alterada\"}' where id=$1",[i.id]);
 await assert.rejects(ciclo(db,id,op(100),p.revisao,'arquivar'),/desatualizada/);
 const antes=await get(db,id),itens=await todos(db,id);
 await db.exec("create function app_private.falha_ciclo() returns trigger language plpgsql as $$begin raise exception 'Falha ciclo';end$$;create trigger falha_ciclo before insert on app_private.operacoes_ciclo_ficha for each row execute function app_private.falha_ciclo();");
 await assert.rejects(ciclo(db,id,op(100),antes.revisao_criacao,'arquivar'),/Falha ciclo/);
 assert.deepEqual(await get(db,id),antes);assert.deepEqual(await todos(db,id),itens);
 await db.exec('drop trigger falha_ciclo on app_private.operacoes_ciclo_ficha');await arquivar(db,id);
 const arquivada=await get(db,id),guardados=await todos(db,id);await uid(db,B);
 await db.query("insert into public.personagens(mesa_id,jogador_id,nome,estado_ficha) select $1,$2,'Legada','completa' from generate_series(1,10)",[T,A]);
 await assert.rejects(ciclo(db,id,op(101),arquivada.revisao_criacao,'assumir'),/dez personagens/);
 assert.deepEqual(await get(db,id),arquivada);assert.deepEqual(await todos(db,id),guardados);
 }finally{await db.close();}
});

test('ciclo local: remocao apaga apenas rascunhos da conta/Mesa, nao arquiva completa e readmissao nao ressuscita rascunho',async()=>{
 const db=await setup();try{
 const ativa=await criar(db);await ativar(db,await pedido(db,ativa));const r=await criar(db),outro=await criar(db,B);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador')",[U,A]);
 await uid(db,A);const u=(await db.query("select public.criar_personagem_rascunho($1,'Outra Mesa','Agente',3,2,1,1) id",[U])).rows[0].id;
 const f=await get(db,ativa),itens=await todos(db,ativa);
 await asRole(db,M,async()=>{
  await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
  // Operacao autenticada do Mestre atravessa a RLS de rascunhos apenas no trigger delimitado.
  const achados=(await db.query('select id from public.personagens')).rows;assert.equal(achados.length,0);
 });
 // A transacao de asRole reverte; repetir em contexto de fixture para verificar o retorno posterior.
 await uid(db,M);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
 assert.equal(await get(db,r),undefined);assert.ok(await get(db,outro));assert.ok(await get(db,u));
 assert.deepEqual(await get(db,ativa),f);assert.deepEqual(await todos(db,ativa),itens);
 await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador')",[T,A]);
 await asRole(db,A,async()=>{const ids=(await db.query('select id from public.personagens')).rows.map(r=>r.id);assert.ok(ids.includes(ativa));assert.ok(!ids.includes(r));});
 }finally{await db.close();}
});

test('ciclo local: exclusao explicita de rascunho, bloqueio de exclusao individual completa e cascata da Mesa isolada',async()=>{
 const db=await setup();try{
 const ativa=await criar(db);await ativar(db,await pedido(db,ativa));const r=await criar(db),rev=(await get(db,r)).revisao_criacao;
 await assert.rejects(db.query('select app_private.excluir_rascunho_local($1,$2,false)',[r,rev]),/Confirmacao/);
 await uid(db,M);await assert.rejects(db.query('select app_private.excluir_rascunho_local($1,$2,true)',[r,rev]),/negado/);
 await uid(db,A);await db.query('select app_private.excluir_rascunho_local($1,$2,true)',[r,rev]);assert.equal(await get(db,r),undefined);
 await arquivar(db,ativa);await assert.rejects(db.query('delete from public.personagens where id=$1',[ativa]),/individual/);
 await db.query('delete from public.mesas where id=$1',[T]);
 for(const table of ['ativacoes_ficha','operacoes_ciclo_ficha','contextos_criacao_mesa','inventario_instancias'])
  assert.equal((await db.query('select count(*)::int n from app_private.'+table+' where mesa_id=$1',[T])).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,4);assert.equal((await db.query('select id from public.mesas where id=$1',[U])).rows.length,1);
 }finally{await db.close();}
});

test('ciclo local: saida voluntaria confirmada preserva completa e Mestre nao pode usar saida de jogador',async()=>{
 const db=await setup();try{
 const id=await criar(db);await ativar(db,await pedido(db,id));const r=await criar(db),antes=await get(db,id),itens=await todos(db,id);
 await assert.rejects(db.query('select app_private.sair_mesa_local($1,false)',[T]),/Confirmacao/);assert.ok(await get(db,r));
 await uid(db,M);await assert.rejects(db.query('select app_private.sair_mesa_local($1,true)',[T]),/negado/);
 await uid(db,A);await db.query('select app_private.sair_mesa_local($1,true)',[T]);
 assert.equal(await get(db,r),undefined);assert.deepEqual(await get(db,id),antes);assert.deepEqual(await todos(db,id),itens);
 assert.equal((await db.query('select * from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A])).rows.length,0);
 }finally{await db.close();}
});

