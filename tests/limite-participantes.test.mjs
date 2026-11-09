import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {M,T,X,setup,uid} from './helpers/ciclo-fixture.mjs';

const id=n=>'30000000-0000-4000-8000-'+String(n).padStart(12,'0');

test('limite de participantes: rejeita a 11a aprovacao sem alterar solicitacao ou membros',async()=>{
 const db=await setup();
 try{
  const proposta=await readFile(new URL('../supabase/proposals/limite-participantes-concorrencia.sql',import.meta.url),'utf8');
  await db.exec(proposta);

  // A Mesa ja possui A e B; acrescentamos X e mais sete jogadores.
  const extras=Array.from({length:8},(_,i)=>id(i+1));
  const candidato=id(20);
  await db.query('insert into auth.users(id) values '+extras.map((_,i)=>'($'+(i+1)+')').concat('($9)').join(','),[...extras,candidato]);
  await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values "+[X,...extras.slice(0,7)].map((_,i)=>'($1,$'+(i+2)+",'jogador')").join(','),[T,X,...extras.slice(0,7)]);
  const totalAntes=(await db.query("select count(*)::int n from public.mesa_participantes where mesa_id=$1 and papel='jogador'",[T])).rows[0].n;
  assert.equal(totalAntes,10);

  const solicitacao=(await db.query(
   "insert into public.solicitacoes_entrada(mesa_id,usuario_id,apelido) values($1,$2,'Candidato') returning id",
   [T,candidato]
  )).rows[0].id;

  await uid(db,M);
  await db.exec('set role authenticated');
  await assert.rejects(
   db.query('select public.responder_solicitacao_mesa($1,true)',[solicitacao]),
   /limite de 10 jogadores/
  );
  await assert.rejects(
   db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values($1,$2,'jogador')",[T,candidato]),
   /permission denied/
  );
  await db.exec('reset role');

  const totalDepois=(await db.query("select count(*)::int n from public.mesa_participantes where mesa_id=$1 and papel='jogador'",[T])).rows[0].n;
  const status=(await db.query('select status from public.solicitacoes_entrada where id=$1',[solicitacao])).rows[0].status;
  assert.equal(totalDepois,10);
  assert.equal(status,'pendente');
 }finally{await db.close();}
});

test('limite de participantes: aprovacao ocupa vaga quando ha menos de dez jogadores',async()=>{
 const db=await setup();
 try{
  const proposta=await readFile(new URL('../supabase/proposals/limite-participantes-concorrencia.sql',import.meta.url),'utf8');
  await db.exec(proposta);
  const candidato=id(30);
  await db.query('insert into auth.users(id) values($1)',[candidato]);
  const solicitacao=(await db.query(
   "insert into public.solicitacoes_entrada(mesa_id,usuario_id,apelido) values($1,$2,'Candidato') returning id",
   [T,candidato]
  )).rows[0].id;
  await uid(db,M);
  await db.exec('set role authenticated');
  await db.query('select public.responder_solicitacao_mesa($1,true)',[solicitacao]);
  await db.exec('reset role');
  assert.equal((await db.query("select count(*)::int n from public.mesa_participantes where mesa_id=$1 and papel='jogador'",[T])).rows[0].n,3);
  assert.equal((await db.query('select status from public.solicitacoes_entrada where id=$1',[solicitacao])).rows[0].status,'aprovada');
 }finally{await db.close();}
});
