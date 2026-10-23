import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL real em memoria, sem URL, chave ou conexao de rede.
// Auth e identidades sao fixtures; nao testa GoTrue, PostgREST ou Realtime.
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const M = '00000000-0000-4000-8000-000000000003';
const X = '00000000-0000-4000-8000-000000000004';
const T = '10000000-0000-4000-8000-000000000001';
const U = '10000000-0000-4000-8000-000000000002';
const dir = new URL('../supabase/migrations/', import.meta.url);

async function setup({ proposal = true } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create publication supabase_realtime;
  `);
  for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) {
    if (!proposal && file.includes('privacidade_e_limite')) continue;
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  }
  await db.query('insert into auth.users values ($1),($2),($3),($4)', [A, B, M, X]);
  await db.query('insert into public.mesas(id,nome,mestre_id) values ($1,$2,$3),($4,$5,$3)',
    [T, 'Mesa ficticia A', M, U, 'Mesa ficticia B']);
  await db.query(`insert into app_private.disponibilidade_compra_inicial(mesa_id,item_id) select m,i from unnest(array[$1::uuid,$2::uuid]) m cross join unnest(array['bastao','faca','colete-acolchoado','colete-leve','lanterna-simples','municao-9mm']) i`,[T,U]);
  await db.query(`insert into public.mesa_participantes(mesa_id,usuario_id,papel)
    values ($1,$2,'jogador'),($1,$3,'jogador'),($4,$2,'jogador')`, [T, A, B, U]);
  return db;
}

async function as(db, user, work, role = 'authenticated') {
  await db.exec('begin');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user ?? '']);
    await db.exec(role === 'anon' ? 'set local role anon' : 'set local role authenticated');
    const result = await work();
    await db.exec('commit');
    return result;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}
async function create(db, user = A, mesa = T, classe = 'Agente') {
  return as(db, user, async () => (await db.query(
    'select public.criar_personagem_rascunho($1,$2,$3,2,2,2,1) id',
    [mesa, 'Sobrevivente ficticio', classe])).rows[0].id);
}
async function origin(db, id, name, trained, extra = null, user = A) {
  return as(db, user, () => db.query('select public.definir_origem_rascunho($1,$2,$3,$4)',
    [id, name, trained, extra]));
}
async function get(db, id) {
  return (await db.query('select * from public.personagens where id=$1', [id])).rows[0];
}
async function visible(db, user) {
  return as(db, user, async () => (await db.query('select id from public.personagens order by id')).rows.map(r => r.id));
}
async function skills(db,id,points,user=A) {
  return as(db,user,()=>db.query('select public.definir_pericias_rascunho($1,$2::jsonb)',[id,JSON.stringify(points)]));
}
async function ability(db,id,name,user=A){
  return as(db,user,()=>db.query('select public.definir_habilidade_rascunho($1,$2)',[id,name]));
}
test('Habilidade: nove Basicas, uma por ficha, validacao de Classe e sem acumulacao',async()=>{
  const db=await setup();
  try{
    for(const [classe,choices,pv,bi] of [
      ['Agente',['anatomia-de-combate','nao-vai-escapar','rolamento'],12,9],
      ['Autodidata',['ambidestria','curiosa','herbalista'],10,11],
      ['Operador',['golpe-sujo','armeiro','parrudo'],14,7]
    ]){
      const id=await create(db,A,T,classe);
      for(const choice of choices){
        await ability(db,id,choice);await ability(db,id,choice);
        const row=await get(db,id);
        assert.equal(row.habilidade_basica,choice);
        assert.equal(row.pv_maximo,pv+(choice==='parrudo'?5:0));
        assert.equal(row.bi_maximo,bi+(choice==='parrudo'?3:0));
        assert.equal(row.bi_atual,0);assert.equal(row.sa_atual,3);
        assert.equal(row.estado_ficha,'rascunho');
      }
      await ability(db,id,null);
      const before=await get(db,id);
      for(const choice of ['inexistente','casca-grossa','parrudo,armeiro',classe==='Agente'?'ambidestria':'rolamento']){
        await assert.rejects(ability(db,id,choice),/invalida/);
        assert.deepEqual(await get(db,id),before);
      }
    }
  }finally{await db.close();}
});
test('Parrudo: preserva dano e BI acumulada; combina com Origem sem perder bonus',async()=>{
  const db=await setup();
  try{
    const id=await create(db,A,T,'Operador');
    await as(db,A,()=>db.query('update public.personagens set pv_atual=9 where id=$1',[id]));
    await ability(db,id,'parrudo');
    assert.equal((await get(db,id)).pv_atual,14);
    await ability(db,id,'parrudo');
    assert.equal((await get(db,id)).pv_atual,14);
    await origin(db,id,'Cobaia','Reflexos');
    assert.equal((await get(db,id)).bi_maximo,12);
    await as(db,A,()=>db.query('update public.personagens set bi_atual=10 where id=$1',[id]));
    await origin(db,id,'Policial','Pontaria');
    assert.equal((await get(db,id)).bi_maximo,10);
    const before=await get(db,id);
    await assert.rejects(ability(db,id,'armeiro'),/BI atual excede/);
    assert.deepEqual(await get(db,id),before);
    await assert.rejects(ability(db,id,null),/BI atual excede/);
    await as(db,A,()=>db.query('update public.personagens set bi_atual=0 where id=$1',[id]));
    await ability(db,id,'armeiro');
    const after=await get(db,id);
    assert.equal(after.pv_maximo,14);assert.equal(after.pv_atual,9);
    assert.equal(after.bi_maximo,7);assert.equal(after.defesa,14);
  }finally{await db.close();}
});
test('Habilidade: autorizacao, escrita direta negada e somente rascunho nivel 1',async()=>{
  const db=await setup();
  try{
    const id=await create(db);
    for(const user of [B,M,X])await assert.rejects(ability(db,id,'rolamento',user),/acesso negado/);
    await assert.rejects(ability(db,id,'rolamento',null),/Autenticacao/);
    await assert.rejects(as(db,null,()=>db.query('select public.definir_habilidade_rascunho($1,$2)',[id,'rolamento']),'anon'),/permission denied/);
    await assert.rejects(as(db,A,()=>db.query("update public.personagens set habilidade_basica='rolamento' where id=$1",[id])),/permission denied/);
    await db.query('update public.personagens set nivel=2 where id=$1',[id]);
    await assert.rejects(ability(db,id,'rolamento'),/nivel 1/);
    await db.query("update public.personagens set nivel=1,estado_ficha='completa' where id=$1",[id]);
    await assert.rejects(ability(db,id,'rolamento'),/acesso negado/);
    await db.query("update public.personagens set estado_ficha='rascunho' where id=$1",[id]);
    await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
    await assert.rejects(ability(db,id,'rolamento'),/acesso negado/);
  }finally{await db.close();}
});

test('Pericias: orcamentos 4/5/3, grau gratuito e recursos preservados', async()=>{
  const db=await setup();
  try{
    for(const [classe,points,over] of [
      ['Agente',{'Pontaria':1,'Luta':2,'Reflexos':1},{'Pontaria':1,'Luta':2,'Reflexos':2}],
      ['Autodidata',{'Pontaria':1,'Luta':2,'Medicina':2},{'Pontaria':1,'Luta':2,'Medicina':2,'Vontade':1}],
      ['Operador',{'Pontaria':1,'Luta':2},{'Pontaria':1,'Luta':2,'Fortitude':1}],
    ]){
      const id=await create(db,A,T,classe);
      await origin(db,id,'Policial','Pontaria');
      const before=await get(db,id);
      await skills(db,id,points);
      const after=await get(db,id);
      assert.deepEqual(after.pontos_pericia_classe,points);
      assert.deepEqual({...after,pontos_pericia_classe:{}},before);
      await assert.rejects(skills(db,id,over),/excedem/);
      assert.deepEqual((await get(db,id)).pontos_pericia_classe,points);
      await assert.rejects(skills(db,id,{'Pontaria':2}),/Mestre/);
      await skills(db,id,{'Luta':0});
      assert.deepEqual((await get(db,id)).pontos_pericia_classe,{});
    }
  }finally{await db.close();}
});

test('Pericias: a outra opcao de Origem amplia a lista; nao concede segundo treinamento gratuito',async()=>{
  const db=await setup();
  try{
    const id=await create(db,A,T,'Operador');
    await origin(db,id,'Acadêmico','Investigação');
    await skills(db,id,{'Medicina':2,'Luta':1});
    assert.equal((await get(db,id)).pontos_pericia_classe.Medicina,2);
    await assert.rejects(skills(db,id,{'Acrobacia':1}),/invalida/);
    await skills(db,id,{});
    await origin(db,id,'Amnésico','Medicina','Vontade');
    await skills(db,id,{'Vontade':2,'Luta':1});
    // Treinamento gratuito fora da lista nao passa a autorizar pontos da Classe.
    await assert.rejects(skills(db,id,{'Medicina':1}),/invalida/);
    assert.equal((await get(db,id)).pericia_origem_treinada,'Medicina');
  }finally{await db.close();}
});

test('Pericias: rejeita payloads e estados invalidos sem atualizar parcialmente',async()=>{
  const db=await setup();
  try{
    const id=await create(db);
    await assert.rejects(skills(db,id,{}),/Origem/);
    await origin(db,id,'Policial','Pontaria');
    await skills(db,id,{'Luta':1});
    const before=await get(db,id);
    for(const input of [null,[],1,{'Luta':'1'},{'Luta':true},{'Luta':null},{'Luta':1.5},{'Luta':-1},{'Luta':3},{'Outra':0},{'Luta':1,'Medicina':1}]){
      await assert.rejects(skills(db,id,input),/objeto|invalida/);
      assert.deepEqual(await get(db,id),before);
    }
    for(const args of [['Cobaia','Reflexos'],['Policial','Percepção']]){
      await assert.rejects(origin(db,id,...args),/distribuicao vazia/);
      assert.deepEqual(await get(db,id),before);
    }
    await origin(db,id,'Policial','Pontaria');
    assert.deepEqual(await get(db,id),before);
    await skills(db,id,{});
    await origin(db,id,'Cobaia','Reflexos');
    assert.equal((await get(db,id)).origem,'Cobaia');
    await db.query('update public.personagens set nivel=2 where id=$1',[id]);
    await assert.rejects(skills(db,id,{}),/nivel 1/);
  }finally{await db.close();}
});

test('Pericias: RPC somente do jogador admitido, escrita direta e anon negados',async()=>{
  const db=await setup();
  try{
    const id=await create(db);
    await origin(db,id,'Policial','Pontaria');
    for(const user of [B,M,X]) await assert.rejects(skills(db,id,{'Luta':1},user),/acesso negado/);
    await assert.rejects(skills(db,id,{},null),/Autenticacao/);
    await assert.rejects(as(db,null,()=>db.query('select public.definir_pericias_rascunho($1,$2::jsonb)',[id,'{}']),'anon'),/permission denied/);
    await assert.rejects(as(db,A,()=>db.query("update public.personagens set pontos_pericia_classe='{}'::jsonb where id=$1",[id])),/permission denied/);
    await db.query("update public.personagens set estado_ficha='completa' where id=$1",[id]);
    await assert.rejects(skills(db,id,{}),/acesso negado/);
    await db.query("update public.personagens set estado_ficha='rascunho' where id=$1",[id]);
    await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
    await assert.rejects(skills(db,id,{}),/acesso negado/);
  }finally{await db.close();}
});

test('RLS: reproduz vazamento antigo; proposta protege rascunho sem ocultar ficha completa do Mestre', async () => {
  for (const proposal of [false, true]) {
    const db = await setup({ proposal });
    try {
      const a = await create(db);
      const b = await create(db, B);
      assert.deepEqual(await visible(db, A), [a]);
      assert.deepEqual(await visible(db, B), [b]);
      assert.deepEqual(await visible(db, X), []);
      assert.equal((await visible(db, M)).length, proposal ? 0 : 2);
      await db.query("update public.personagens set estado_ficha='completa' where id=$1", [a]);
      assert.equal((await visible(db, M)).includes(a), true);
      assert.equal((await visible(db, B)).includes(a), false);
    } finally { await db.close(); }
  }
});

test('tres rascunhos por conta/Mesa; outras contas e Mesas independentes; dez completas nao bloqueiam rascunho', async () => {
  const db = await setup();
  try {
    for (let i = 0; i < 10; i++) {
      const id = await create(db);
      await db.query("update public.personagens set estado_ficha='completa' where id=$1", [id]);
    }
    const ids = [];
    for (let i = 0; i < 3; i++) ids.push(await create(db));
    await assert.rejects(create(db), /tres rascunhos/);
    await create(db, B);
    await create(db, A, U);
    await db.query('delete from public.personagens where id=$1', [ids[0]]);
    await create(db);
    assert.equal((await db.query("select count(*)::int n from public.personagens where jogador_id=$1 and mesa_id=$2 and estado_ficha='rascunho'", [A,T])).rows[0].n, 3);
    // Completar e excluir acima sao apenas preparacao administrativa de fixtures.
    // Nao existe finalizacao publica nesta Alfa.
  } finally { await db.close(); }
});

test('proposta preserva excedentes legados e apenas impede novas criacoes', async () => {
  const db = await setup({ proposal: false });
  try {
    for (let i = 0; i < 4; i++) await create(db);
    await db.exec(await readFile(new URL('20261022224633_privacidade_e_limite_rascunhos.sql', dir), 'utf8'));
    assert.equal((await visible(db, A)).length, 4);
    await assert.rejects(create(db), /tres rascunhos/);
  } finally { await db.close(); }
});

test('autorizacao: RPC alheia, nao membro, Mestre, anon e escrita direta protegida', async () => {
  const db = await setup();
  try {
    const id = await create(db);
    for (const user of [B, M, X]) {
      await assert.rejects(origin(db, id, 'Policial', 'Pontaria', null, user), /acesso negado/);
    }
    for (const user of [M, X]) await assert.rejects(create(db, user), /jogadores aprovados/);
    await assert.rejects(as(db, null, () => db.query('select public.definir_origem_rascunho($1,$2,$3)', [id,'Policial','Pontaria']), 'anon'), /permission denied/);
    await assert.rejects(create(db, null), /Autenticacao/);
    for (const assignment of ["origem='Policial'", "classe='Operador'", 'pv_maximo=100', `jogador_id='${B}'`, "estado_ficha='completa'"]) {
      await assert.rejects(as(db,A,()=>db.query(`update public.personagens set ${assignment} where id=$1`,[id])), /permission denied/);
    }
    await assert.rejects(as(db,A,()=>db.query('insert into public.personagens(mesa_id,jogador_id,nome) values ($1,$2,$3)',[T,A,'Proibido'])), /permission denied/);
    await as(db,A,()=>db.query('update public.personagens set pv_atual=7 where id=$1',[id]));
    const otherWrite = await as(db,B,()=>db.query('update public.personagens set pv_atual=1 where id=$1 returning id',[id]));
    assert.equal(otherWrite.rows.length, 0);
    assert.equal((await get(db,id)).pv_atual, 7);
    await db.query("update public.personagens set estado_ficha='completa' where id=$1", [id]);
    await assert.rejects(origin(db,id,'Policial','Pontaria'), /acesso negado/);
  } finally { await db.close(); }
});

test('Origem: 17 opcoes, escolhas invalidas, bonus repetidos, SA gastos e BI preservada', async () => {
  const db = await setup();
  try {
    const id = await create(db);
    const valid = [
      ['Acadêmico','Medicina'], ['Agente de Saúde','Medicina'], ['Amnésico','Luta','Medicina'],
      ['Atleta','Acrobacia'], ['Chef','Fortitude'], ['Cobaia','Reflexos'],
      ['Criminoso','Furtividade'], ['Desgarrado','Sobrevivência'], ['Investigador','Percepção'],
      ['Lutador','Luta'], ['Mercenário','Pontaria'], ['Militar','Percepção'],
      ['Mochileiro','Atletismo'], ['Operário','Fortitude'], ['Policial','Pontaria'],
      ['Servidor Público','Vontade'], ['Universitária','Investigação'],
    ];
    for (const [name, trained, extra] of valid) {
      await origin(db,id,name,trained,extra);
      await origin(db,id,name,trained,extra);
      const row = await get(db,id);
      assert.equal(row.origem,name);
      assert.equal(row.pericia_origem_treinada,trained);
      assert.equal(row.defesa,name==='Policial'?14:12);
      assert.equal(row.sa_maximo,name==='Universitária'?4:3);
      assert.equal(row.bi_maximo,name==='Cobaia'?11:9);
      assert.equal(row.bi_atual,0);
      assert.equal(row.pv_atual,12);
      assert.equal(row.estado_ficha,'rascunho');
    }
    for (const args of [ [null,'Luta'], ['Inexistente','Luta'], ['Policial',null], ['Policial','Medicina'], ['Policial','Pontaria','Luta'], ['Amnésico','Luta','Luta'], ['Amnésico','Luta',null], ['Amnésico','Inexistente','Luta'] ]) {
      const before = await get(db,id);
      await assert.rejects(origin(db,id,...args), /invalida|distintas/);
      assert.deepEqual(await get(db,id),before);
    }
    await origin(db,id,'Policial','Pontaria');
    await as(db,A,()=>db.query('update public.personagens set sa_atual=1,pv_atual=5 where id=$1',[id]));
    await origin(db,id,'Universitária','Medicina');
    assert.equal((await get(db,id)).sa_atual,2);
    await origin(db,id,'Universitária','Investigação');
    assert.equal((await get(db,id)).sa_atual,2);
    await origin(db,id,'Cobaia','Reflexos');
    assert.equal((await get(db,id)).sa_atual,1);
    await as(db,A,()=>db.query('update public.personagens set bi_atual=10 where id=$1',[id]));
    const before = await get(db,id);
    await assert.rejects(origin(db,id,'Policial','Pontaria'), /BI atual excede/);
    assert.deepEqual(await get(db,id),before);
    assert.equal(before.pv_atual,5);
  } finally { await db.close(); }
});

test('removido perde leitura e escrita; readmissao ainda restaura rascunho (pendencia conhecida)', async () => {
  const db = await setup();
  try {
    const id = await create(db);
    await as(db,M,()=>db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]));
    assert.deepEqual(await visible(db,A),[]);
    await assert.rejects(origin(db,id,'Policial','Pontaria'), /acesso negado/);
    await assert.rejects(create(db), /jogadores aprovados/);
    assert.equal((await as(db,A,()=>db.query('update public.personagens set pv_atual=1 where id=$1 returning id',[id]))).rows.length,0);
    await db.query("insert into public.mesa_participantes(mesa_id,usuario_id,papel) values ($1,$2,'jogador')",[T,A]);
    assert.deepEqual(await visible(db,A),[id]);
  } finally { await db.close(); }
});

test('criacao preserva formulas das tres Classes e rejeita entradas ilegais', async () => {
  const db = await setup();
  try {
    for (const [classe,pv,bi] of [['Agente',12,9],['Autodidata',10,11],['Operador',14,7]]) {
      const id = await create(db,A,T,classe);
      const row = await get(db,id);
      assert.equal(row.classe,classe);
      assert.equal(row.pv_atual,pv);
      assert.equal(row.pv_maximo,pv);
      assert.equal(row.bi_maximo,bi);
      assert.equal(row.bi_atual,0);
      assert.equal(row.sa_atual,3);
    }
    for (const args of [
      ['x','Agente',2,2,2,1], ['Nome',null,2,2,2,1], ['Nome','Outra',2,2,2,1],
      ['Nome','Agente',null,2,2,1], ['Nome','Agente',4,1,1,1],
      ['Nome','Agente',1,1,1,1], ['Nome','Agente',0,0,3,3],
    ]) {
      await assert.rejects(as(db,A,()=>db.query('select public.criar_personagem_rascunho($1,$2,$3,$4,$5,$6,$7)',[U,...args])), /nome|Classe|Atributos/);
    }
    const legalZero = await as(db,A,()=>db.query('select public.criar_personagem_rascunho($1,$2,$3,0,3,3,1) id',[U,'Nome valido','Agente']));
    assert.equal((await get(db,legalZero.rows[0].id)).forca,0);
  } finally { await db.close(); }
});

async function equipment(db,id,option,user=A){return as(db,user,()=>db.query('select public.definir_equipamento_rascunho($1,$2)',[id,option]));}
test('Equipamento: escolhas persistem sem acumular e preservam recursos, Origem e Habilidade',async()=>{
  const db=await setup();try{
    for(const classe of ['Agente','Autodidata','Operador']){
      const id=await create(db,A,T,classe);
      await origin(db,id,'Policial','Pontaria');
      if(classe==='Operador')await ability(db,id,'parrudo');
      const before=await get(db,id);
      for(const opcao of ['A','A','B','C',null]){
        await equipment(db,id,opcao);
        const after=await get(db,id);
        assert.equal(after.equipamento_inicial,opcao);
        assert.deepEqual({...after,equipamento_inicial:null},{...before,equipamento_inicial:null});
      }
      for(const opcao of ['D','a','', 'A;select 1']){
        await assert.rejects(equipment(db,id,opcao),/invalida/);
        assert.equal((await get(db,id)).equipamento_inicial,null);
      }
    }
  }finally{await db.close();}
});
test('Equipamento: capacidade validada no banco; reducao preserva escolha anterior',async()=>{
  const db=await setup();try{
    const id=await as(db,A,async()=>(await db.query("select public.criar_personagem_rascunho($1,'Fixture fragil','Operador',0,3,3,1) id",[T])).rows[0].id);
    await equipment(db,id,'B');
    await assert.rejects(equipment(db,id,'A'),/capacidade/);
    assert.equal((await get(db,id)).equipamento_inicial,'B');
    await origin(db,id,'Mochileiro','Atletismo');await equipment(db,id,'A');
    await origin(db,id,'Policial','Pontaria');
    assert.equal((await get(db,id)).equipamento_inicial,'A');
    await assert.rejects(equipment(db,id,'A'),/capacidade/);
    await equipment(db,id,'C');assert.equal((await get(db,id)).equipamento_inicial,'C');
  }finally{await db.close();}
});
test('Equipamento: RPC exige autor admitido e rascunho nivel 1; coluna protegida',async()=>{
  const db=await setup();try{
    const id=await create(db);
    for(const user of [B,M,X])await assert.rejects(equipment(db,id,'A',user),/acesso negado/);
    await assert.rejects(equipment(db,id,'A',null),/Autenticacao/);
    await assert.rejects(as(db,null,()=>db.query("select public.definir_equipamento_rascunho($1,'A')",[id]),'anon'),/permission denied/);
    await assert.rejects(as(db,A,()=>db.query("update public.personagens set equipamento_inicial='A' where id=$1",[id])),/permission denied/);
    await db.query('update public.personagens set nivel=2 where id=$1',[id]);
    await assert.rejects(equipment(db,id,'A'),/nivel 1/);
    await db.query("update public.personagens set nivel=1,estado_ficha='completa' where id=$1",[id]);
    await assert.rejects(equipment(db,id,'A'),/acesso negado/);
    await db.query("update public.personagens set estado_ficha='rascunho' where id=$1",[id]);
    await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
    await assert.rejects(equipment(db,id,'A'),/acesso negado/);
    assert.equal((await get(db,id)).equipamento_inicial,null);
  }finally{await db.close();}
});

async function identity(db,id,name,data,user=A){return as(db,user,()=>db.query('select public.definir_identidade_rascunho($1,$2,$3)',[id,name,JSON.stringify(data)]));}
test('Identidade: textos opcionais, acentos, quebras de linha e limpeza explicita sem alterar mecanicas',async()=>{
 const db=await setup();try{
  const id=await create(db);const before=await get(db,id);
  const data={idade:'28',genero:'Feminino',ocupacao:'Médica',apelido:'Águia',afiliacao:'Equipe fictícia',aparencia:'Cicatriz',personalidade:'Cautelosa',objetivo:'Resgatar o grupo',medo:'Isolamento',lacos:'Irmã',historia:'Linha 1\nLinha 2 <script>texto literal</script>'};
  await identity(db,id,'  Personagem fictícia  ',data);
  let row=await get(db,id);assert.equal(row.nome,'Personagem fictícia');assert.deepEqual(row.identidade,data);
  assert.deepEqual({...row,nome:before.nome,identidade:{}},before);
  await identity(db,id,'Personagem fictícia',{historia:'   '});assert.deepEqual((await get(db,id)).identidade,{});
 }finally{await db.close();}
});
test('Identidade: entradas invalidas recusadas atomicamente e limites aceitos',async()=>{
 const db=await setup();try{
  const id=await create(db);await identity(db,id,'Nome válido',{historia:'h'.repeat(4000),idade:'i'.repeat(40),ocupacao:'o'.repeat(120),aparencia:'a'.repeat(1000)});
  const before=await get(db,id);
  for(const [name,data] of [['x',{}],['n'.repeat(61),{}],['Nome',[]],['Nome',null],['Nome',{pv_atual:'100'}],['Nome',{idade:12}],['Nome',{historia:null}],['Nome',{historia:'h'.repeat(4001)}],['Nome',{genero:'x'.repeat(41)}],['Nome',{ocupacao:'x'.repeat(121)}],['Nome',{medo:'x'.repeat(1001)}]]){
   await assert.rejects(identity(db,id,name,data),/Nome|objeto|invalido|limite/);assert.deepEqual(await get(db,id),before);
  }
 }finally{await db.close();}
});
test('Identidade: autor admitido somente; RLS protege leitura; escrita direta e anon negados',async()=>{
 const db=await setup();try{
  const id=await create(db);
  for(const user of [B,M,X])await assert.rejects(identity(db,id,'Alheio',{},user),/acesso negado/);
  await assert.rejects(identity(db,id,'Anon',{},null),/Autenticacao/);
  await assert.rejects(as(db,null,()=>db.query("select public.definir_identidade_rascunho($1,'Anon','{}')",[id]),'anon'),/permission denied/);
  await assert.rejects(as(db,A,()=>db.query("update public.personagens set identidade='{}' where id=$1",[id])),/permission denied/);
  assert.equal((await visible(db,M)).includes(id),false);assert.equal((await visible(db,B)).includes(id),false);
  await db.query("update public.personagens set estado_ficha='completa' where id=$1",[id]);await assert.rejects(identity(db,id,'Completa',{}),/acesso negado/);
  await db.query("update public.personagens set estado_ficha='rascunho' where id=$1",[id]);
  await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);await assert.rejects(identity(db,id,'Removido',{}),/acesso negado/);
 }finally{await db.close();}
});

async function purchase(db,id,plan,revision=0,user=A){
 return as(db,user,async()=>(await db.query('select public.salvar_compras_rascunho($1,$2,$3) rev',[id,JSON.stringify(plan),revision])).rows[0].rev);
}
test('Compras locais: salva plano normalizado, preserva recursos e repeticao nao duplica',async()=>{
 const db=await setup();try{
  const id=await create(db);await equipment(db,id,'C');const before=await get(db,id);
  assert.equal(await purchase(db,id,{bastao:1,'colete-acolchoado':1,faca:0}),1);
  assert.equal(await purchase(db,id,{bastao:1,'colete-acolchoado':1},0),1);
  const row=await get(db,id);assert.deepEqual(row.compras_iniciais,{bastao:1,'colete-acolchoado':1});assert.equal(row.revisao_compras,1);
  assert.deepEqual({...row,compras_iniciais:{},revisao_compras:0},before);
  await assert.rejects(purchase(db,id,{faca:1},0),/desatualizada/);
  assert.deepEqual(await get(db,id),row);
  assert.equal(await purchase(db,id,{'municao-9mm':3},1),2);
  assert.equal(await purchase(db,id,{'municao-9mm':3},1),2);
  await assert.rejects(purchase(db,id,{'municao-9mm':3},99),/desatualizada/);
 }finally{await db.close();}
});
test('Compras locais: saldo e pilhas oficiais no servidor; capacidade insuficiente nao grava',async()=>{
 const db=await setup();try{
  const id=await as(db,A,async()=>(await db.query("select public.criar_personagem_rascunho($1,'Fixture compras','Operador',0,3,3,1) id",[T])).rows[0].id);
  await equipment(db,id,'C');
  await assert.rejects(purchase(db,id,{'colete-leve':2}),/Saldo/);
  await assert.rejects(purchase(db,id,{bastao:1,'colete-acolchoado':1}),/Capacidade/);
  assert.equal((await get(db,id)).revisao_compras,0);
  // 45 tiros: dois Espacos; sem moedas restantes; mais dois itens comuns = quatro.
  assert.equal(await purchase(db,id,{'municao-9mm':3}),1);
  assert.deepEqual((await get(db,id)).compras_iniciais,{'municao-9mm':3});
  for(const plan of [null,[],{Hatchet:1},{bastao:1.5},{bastao:-1},{bastao:4},{bastao:'1'},{bastao:null}])
   await assert.rejects(purchase(db,id,plan,1),/invalido|invalida/);
  assert.equal((await get(db,id)).revisao_compras,1);
 }finally{await db.close();}
});
test('Compras locais: trocar kit exige limpeza explicita; contrato nao permite comprar em B ou nivel 2',async()=>{
 const db=await setup();try{
  const id=await create(db);await equipment(db,id,'C');await purchase(db,id,{faca:1});
  await assert.rejects(equipment(db,id,'B'),/compras vazias/);
  assert.equal((await get(db,id)).equipamento_inicial,'C');
  await equipment(db,id,'C');assert.deepEqual((await get(db,id)).compras_iniciais,{faca:1});
  await purchase(db,id,{},1);await equipment(db,id,'B');
  await assert.rejects(purchase(db,id,{} ,2),/Personalizado/);
  await equipment(db,id,'C');await db.query('update public.personagens set nivel=2 where id=$1',[id]);
  await assert.rejects(purchase(db,id,{},2),/nivel 1/);
  await db.query('update public.personagens set nivel=1,classe=null where id=$1',[id]);await assert.rejects(purchase(db,id,{},2),/nivel 1/);
 }finally{await db.close();}
});
test('Compras locais: propriedade, admissao e estado validados; colunas e anon protegidos',async()=>{
 const db=await setup();try{
  const id=await create(db);await equipment(db,id,'C');
  for(const user of [B,M,X])await assert.rejects(purchase(db,id,{faca:1},0,user),/acesso negado/);
  await assert.rejects(purchase(db,id,{faca:1},0,null),/Autenticacao/);
  await assert.rejects(as(db,null,()=>db.query("select public.salvar_compras_rascunho($1,'{}',0)",[id]),'anon'),/permission denied/);
  for(const assignment of ["compras_iniciais='{}'",'revisao_compras=5'])await assert.rejects(as(db,A,()=>db.query('update public.personagens set '+assignment+' where id=$1',[id])),/permission denied/);
  await db.query("update public.personagens set estado_ficha='completa' where id=$1",[id]);await assert.rejects(purchase(db,id,{}),/acesso negado/);
  await db.query("update public.personagens set estado_ficha='rascunho' where id=$1",[id]);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
  await assert.rejects(purchase(db,id,{}),/acesso negado/);
 }finally{await db.close();}
});

test('Compras locais: disponibilidade e controlada no servidor e nao pode ser ampliada pelo jogador',async()=>{
 const db=await setup();try{
  const id=await create(db);await equipment(db,id,'C');
  await db.query("delete from app_private.disponibilidade_compra_inicial where mesa_id=$1 and item_id='faca'",[T]);
  await assert.rejects(purchase(db,id,{faca:1}),/indisponivel/);
  assert.deepEqual((await get(db,id)).compras_iniciais,{});
  await assert.rejects(as(db,A,()=>db.query("insert into app_private.disponibilidade_compra_inicial values ($1,'faca')",[T])),/permission denied/);
  assert.equal(await purchase(db,id,{bastao:1}),1);
 }finally{await db.close();}
});

test('smoke transacional de Compras e exercitado localmente com rollback',async()=>{const db=await setup();try{await db.exec(await readFile(new URL('staging-compras.sql',import.meta.url),'utf8'));}finally{await db.close();}});
