import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import ts from 'typescript';
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002',M='00000000-0000-4000-8000-000000000003',X='00000000-0000-4000-8000-000000000004';
const T='10000000-0000-4000-8000-000000000001',U='10000000-0000-4000-8000-000000000002';
const op=n=>'20000000-0000-4000-8000-'+String(n).padStart(12,'0');
const uid=(db,id)=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);
async function setup(){
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create publication supabase_realtime;");
 const dir=new URL('../supabase/migrations/',import.meta.url);
 for(const f of(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 for(const f of ['inventario-instancias.sql','ativacao-local.sql','resumo-operacional-local.sql'])await db.exec(await readFile(new URL('../supabase/proposals/'+f,import.meta.url),'utf8'));
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

test('ativacao local: nove kits, varias ativas da mesma autoria e preservacao de todos os recursos',async()=>{
 const db=await setup();try{
 let n=1;
 for(const classe of ['Agente','Autodidata','Operador'])for(const kit of ['A','B','C']){
  const id=await criar(db,A,classe,kit);const antes=await get(db,id);const resposta=await ativar(db,await pedido(db,id,op(n++)));
  const depois=await get(db,id);
  assert.deepEqual(depois,{...antes,estado_ficha:'completa',metodo_criacao:'padrao',revisao_criacao:antes.revisao_criacao+1});
  assert.equal(resposta.estado,'completa');assert.equal(resposta.quantidadeInstancias,(await instances(db,id)).length);
  assert.equal((await instances(db,id)).filter(i=>i.dados.vinculadoClasse).length,2);
 }
 assert.equal((await db.query("select count(*)::int n from public.personagens where estado_ficha='completa'")).rows[0].n,9);
 }finally{await db.close();}
});

test('ativacao local: mesma operacao retorna recibo sem recriar itens nem curar; outra operacao e recusada',async()=>{
 const db=await setup();try{
 const id=await criar(db),args=await pedido(db,id),resposta=await ativar(db,args);
 const itens=await instances(db,id);
 await db.query("update app_private.inventario_instancias set dados=jsonb_set(dados,'{estado,durabilidadeAtual}','0') where id=$1",[itens.find(i=>i.dados.catalogoId==='hatchet').id]);
 await db.query('update public.personagens set pv_atual=2 where id=$1',[id]);
 const alterados=await instances(db,id),f=await get(db,id);
 const contexto=(await db.query('select * from app_private.contextos_criacao_mesa where mesa_id=$1',[T])).rows[0];
 assert.deepEqual(await ativar(db,args),resposta);assert.deepEqual(await instances(db,id),alterados);assert.deepEqual(await get(db,id),f);
 assert.deepEqual((await db.query('select * from app_private.contextos_criacao_mesa where mesa_id=$1',[T])).rows[0],contexto);
 await assert.rejects(ativar(db,[id,op(2),args[2],args[3]]),/ja ativada/);
 await assert.rejects(ativar(db,[id,args[1],args[2]+1,args[3]]),/ja ativada/);
 const outro=await criar(db);await assert.rejects(ativar(db,await pedido(db,outro,args[1])),/ja utilizado/);await assertVazio(db,outro);
 }finally{await db.close();}
});

test('ativacao local: revisao cobre identidade, recurso e retorno do contexto ao valor anterior',async()=>{
 const db=await setup();try{
 const id=await criar(db),args=await pedido(db,id);
 await db.query("select public.definir_identidade_rascunho($1,'Outro nome',$2)",[id,JSON.stringify({historia:'NOVA HISTORIA'})]);
 await assert.rejects(ativar(db,args),/desatualizada/);await assertVazio(db,id);
 const recente=await pedido(db,id);
 await db.query('update public.personagens set pv_atual=2 where id=$1',[id]);
 await assert.rejects(ativar(db,recente),/desatualizada/);
 const fichaAtual=await pedido(db,id);
 await db.query("update app_private.contextos_criacao_mesa set metodo='casa' where mesa_id=$1",[T]);
 await db.query("update app_private.contextos_criacao_mesa set metodo='padrao' where mesa_id=$1",[T]);
 await assert.rejects(ativar(db,fichaAtual),/desatualizada/);await assertVazio(db,id);
 const rev=(await get(db,id)).revisao_criacao;
 await db.query('update public.personagens set nome=nome,revisao_criacao=999 where id=$1',[id]);
 assert.equal((await get(db,id)).revisao_criacao,rev);
 await ativar(db,await pedido(db,id));
 }finally{await db.close();}
});

test('ativacao local: escolhas incompletas, identidade, formulas, preferencias e inventario invalidos nao materializam',async()=>{
 const db=await setup();try{
 const id=await criar(db);
 // A restricao existente ja impede Habilidade de outra Classe no armazenamento.
 await assert.rejects(db.query("update public.personagens set habilidade_basica='parrudo' where id=$1",[id]),/check constraint/);
 const casos=[
 ["pontos_pericia_classe='{}'",/Pontos de Pericia/],
 ["habilidade_basica=null",/Habilidade Basica/],
 ["origem=null",/Origem/],
 ["pericia_origem_treinada='Vontade'",/Treinamento/],
 ["pontos_pericia_classe='{\"Investigação\":2,\"Luta\":2}'",/Grau/],
 ["pontos_pericia_classe='{\"Fortitude\":2,\"Luta\":2}'",/Pericia/],
 ["forca=4",/Atributos/],
 ["pv_maximo=pv_maximo+1",/Derivados/],
 ["identidade='{\"intruso\":\"nao\"}'",/narrativo/],
 ["configuracao_funcionamento='{\"modo\":\"inventado\"}'",/Configuracao/],
 ["configuracao_funcionamento=configuracao_funcionamento||'{\"intrusa\":true}'",/Configuracao/],
 ["configuracao_funcionamento=jsonb_set(configuracao_funcionamento,'{preferenciasMisto,municao}','null')",/Preferencias/],
 ["configuracao_funcionamento=jsonb_set(configuracao_funcionamento,'{modo}','\"misto\"')",/opcoes pendentes/],
 ["equipamento_inicial=null",/kit/],
 ["compras_iniciais='{\"faca\":1}'",/revisao valida/],
 ["compras_iniciais='{\"faca\":4}',revisao_compras=1",/Compra/]
 ];
 for(const [set,erro] of casos){
  await db.exec('begin');
  try{
   // Monta legado inconsistente somente na fixture, preservando os triggers.
   if(/^(origem|pericia_origem)/.test(set))await db.query("update public.personagens set pontos_pericia_classe='{}' where id=$1",[id]);
   await db.query('update public.personagens set '+set+' where id=$1',[id]);
   if(/^(origem|pericia_origem)/.test(set))await db.query("update public.personagens set pontos_pericia_classe='{\"Luta\":2,\"Pontaria\":2}' where id=$1",[id]);
   await assert.rejects(ativar(db,await pedido(db,id)),erro);
  }
  finally{await db.exec('rollback');}
  await assertVazio(db,id);
 }
 // Capacidade real tambem e revalidada, sem depender do resumo do cliente.
 await db.query("update public.personagens set forca=0,agilidade=3,vigor=3,astucia=1,pv_maximo=13,sa_maximo=4,bi_maximo=9,defesa=13,compras_iniciais='{\"faca\":2}',revisao_compras=1 where id=$1",[id]);
 await assert.rejects(ativar(db,await pedido(db,id)),/Capacidade/);await assertVazio(db,id);
 }finally{await db.close();}
});

test('ativacao local: teto coletivo, contexto ausente/fechado e autoria ainda admitida',async()=>{
 const db=await setup();try{
 const id=await criar(db);
 await db.exec('begin');
 try{
  await db.query("with novos as(insert into auth.users(id) select gen_random_uuid() from generate_series(1,9) returning id) insert into public.mesa_participantes(mesa_id,usuario_id,papel) select $1,id,'jogador' from novos",[T]);
  await assert.rejects(ativar(db,await pedido(db,id)),/dez jogadores/);
 }finally{await db.exec('rollback');}
 await assertVazio(db,id);
 await db.query("insert into public.personagens(mesa_id,jogador_id,nome,estado_ficha) select $1,$2,'Legada','completa' from generate_series(1,10)",[T,A]);
 await assert.rejects(ativar(db,await pedido(db,id)),/dez personagens ativas/);await assertVazio(db,id);
 await db.query("delete from public.personagens where nome='Legada' and id=(select min(id::text)::uuid from public.personagens where nome='Legada')");
 await ativar(db,await pedido(db,id)); // Nove legadas + esta = dez. Rascunho nao contou.
 const outro=await criar(db),args=await pedido(db,outro,op(2));
 await db.query('delete from app_private.contextos_criacao_mesa where mesa_id=$1',[T]);
 await assert.rejects(ativar(db,args),/Contexto/);await assertVazio(db,outro);
 await db.query("insert into app_private.contextos_criacao_mesa values($1,'padrao',1,false,0)",[T]);
 await assert.rejects(ativar(db,args),/nao permite/);
 await db.query("update app_private.contextos_criacao_mesa set nivel_inicial=2 where mesa_id=$1",[T]);await assert.rejects(ativar(db,args),/nivel 1/);
 await uid(db,M);await assert.rejects(ativar(db,args),/acesso negado/);
 await uid(db,X);await assert.rejects(ativar(db,args),/acesso negado/);
 await uid(db,null);await assert.rejects(ativar(db,args),/Autenticacao/);
 await uid(db,A);await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
 await assert.rejects(ativar(db,args),/acesso negado/);
 }finally{await db.close();}
});

test('ativacao local: falha durante itens ou apos troca de estado reverte tudo e permite nova tentativa',async()=>{
 const db=await setup();try{
 const id=await criar(db);
 await db.query("update public.personagens set compras_iniciais='{\"faca\":1}',revisao_compras=1 where id=$1",[id]);
 const args=await pedido(db,id),antes=await get(db,id);
 const contextoAntes=(await db.query('select * from app_private.contextos_criacao_mesa where mesa_id=$1',[T])).rows[0];
 await db.exec("create function app_private.falhar_item() returns trigger language plpgsql as $$begin if new.dados->>'catalogoId'='faca' then raise exception 'Falha no item';end if;return new;end$$;create trigger falhar_item before insert on app_private.inventario_instancias for each row execute function app_private.falhar_item();");
 await assert.rejects(ativar(db,args),/Falha no item/);await assertVazio(db,id);assert.deepEqual(await get(db,id),antes);
 await db.exec('drop trigger falhar_item on app_private.inventario_instancias');
 await db.exec("create function app_private.falhar_recibo() returns trigger language plpgsql as $$begin raise exception 'Falha no recibo';end$$;create trigger falhar_recibo before insert on app_private.ativacoes_ficha for each row execute function app_private.falhar_recibo();");
 await assert.rejects(ativar(db,args),/Falha no recibo/);await assertVazio(db,id);assert.deepEqual(await get(db,id),antes);
 assert.deepEqual((await db.query('select * from app_private.contextos_criacao_mesa where mesa_id=$1',[T])).rows[0],contextoAntes);
 await db.exec('drop trigger falhar_recibo on app_private.ativacoes_ficha');
 await ativar(db,args);assert.equal((await get(db,id)).estado_ficha,'completa');
 }finally{await db.close();}
});

test('ativacao local: bonus de Origem combinam com Parrudo; Misto resolvido preserva configuracao',async()=>{
 const db=await setup();try{
 let n=30;
 for(const origem of ['Cobaia','Universitária','Policial','Mochileiro','Amnésico']){
  const id=await criar(db,A,'Operador','C','parrudo');
  await db.query("select public.definir_pericias_rascunho($1,'{}')",[id]);
  const treinada={Cobaia:'Reflexos','Universitária':'Medicina',Policial:'Pontaria',Mochileiro:'Sobrevivência','Amnésico':'Medicina'}[origem];
  await db.query('select public.definir_origem_rascunho($1,$2,$3,$4)',[id,origem,treinada,origem==='Amnésico'?'Vontade':null]);
  await db.query('select public.definir_pericias_rascunho($1,$2)',[id,JSON.stringify({Luta:2,Atletismo:1})]);
  const cfg=(await get(db,id)).configuracao_funcionamento;cfg.modo='misto';cfg.preferenciasMisto.biInfectante=false;cfg.preferenciasMisto.durabilidadeAparar=true;
  await db.query('select public.salvar_funcionamento_rascunho($1,$2,$3)',[id,JSON.stringify(cfg),(await get(db,id)).revisao_funcionamento]);
  const antes=await get(db,id);await ativar(db,await pedido(db,id,op(n++)));const f=await get(db,id);
  assert.equal(f.pv_maximo,18);assert.equal(f.sa_maximo,origem==='Universitária'?4:3);assert.equal(f.bi_maximo,origem==='Cobaia'?12:10);assert.equal(f.defesa,origem==='Policial'?14:12);
  assert.equal(f.pv_atual,antes.pv_atual);assert.equal(f.sa_atual,antes.sa_atual);assert.equal(f.bi_atual,antes.bi_atual);assert.deepEqual(f.configuracao_funcionamento,cfg);
 }
 }finally{await db.close();}
});

test('resumo local: Mestre recebe somente operacao e passivos normais, sem narrativa ou inventario',async()=>{
 const db=await setup();try{
 const id=await criar(db,A,'Operador','B','parrudo');
 await db.query("update public.personagens set identidade=identidade||'{\"genero\":\"Feminino\"}' where id=$1",[id]);
 await ativar(db,await pedido(db,id));
 const r=await asRole(db,M,async()=>{
  assert.equal((await db.query('select * from public.personagens')).rows.length,0);
  assert.equal((await db.query('update public.personagens set pv_atual=1 where id=$1 returning id',[id])).rows.length,0);
  return(await db.query('select public.resumo_operacional_mesa($1) resumo',[T])).rows[0].resumo;
 });
 assert.equal(r.length,1);const p=r[0];
 assert.equal(p.classe,'Operadora');assert.equal((await get(db,id)).classe,'Operador');
 assert.deepEqual(Object.keys(p).sort(),['personagemId','nome','classe','nivel','pv','sa','bi','defesa','passivos','condicoes'].sort());
 assert.equal(p.pv.atual,3);assert.equal(p.pv.maximo,18);assert.equal(p.passivos.Fortitude,11);assert.equal(p.passivos.Luta,16);
 assert.equal(Object.keys(p.passivos).length,12);assert.equal(p.condicoes,null);
 assert.ok(!JSON.stringify(r).includes('HISTORIA PRIVADA'));assert.ok(!JSON.stringify(r).includes('MEDO PRIVADO'));assert.ok(!JSON.stringify(r).includes('LEMI'));
 assert.equal((await get(db,id)).pv_atual,3);
 await asRole(db,X,()=>assert.rejects(db.query('select public.resumo_operacional_mesa($1)',[T]),/negado/));
 await asRole(db,A,()=>assert.rejects(db.query('select public.resumo_operacional_mesa($1)',[T]),/negado/));
 await asRole(db,null,()=>assert.rejects(db.query('select public.resumo_operacional_mesa($1)',[T]),/permission denied/),'anon');
 }finally{await db.close();}
});

test('privacidade local: ativa libera leitura entre jogadores admitidos, nunca rascunho ou edicao alheia',async()=>{
 const db=await setup();try{
 const a=await criar(db,A);await ativar(db,await pedido(db,a));
 const rascunhoA=await criar(db,A),b=await criar(db,B);
 await asRole(db,B,async()=>{const ids=(await db.query('select id from public.personagens')).rows.map(r=>r.id);assert.deepEqual(ids,[b]);});
 await ativar(db,await pedido(db,b,op(2)));
 await asRole(db,B,async()=>{
  const ids=(await db.query('select id from public.personagens order by id')).rows.map(r=>r.id).sort();
  assert.deepEqual(ids,[a,b].sort());assert.ok(!ids.includes(rascunhoA));
  assert.equal((await db.query('update public.personagens set pv_atual=1 where id=$1 returning id',[a])).rows.length,0);
 });
 await db.query('delete from public.mesa_participantes where mesa_id=$1 and usuario_id=$2',[T,A]);
 await asRole(db,A,async()=>assert.equal((await db.query('select * from public.personagens')).rows.length,0));
 await asRole(db,B,async()=>assert.deepEqual((await db.query('select id from public.personagens')).rows.map(r=>r.id),[b]));
 const resumo=await asRole(db,M,async()=>(await db.query('select public.resumo_operacional_mesa($1) r',[T])).rows[0].r);assert.deepEqual(resumo.map(r=>r.personagemId),[b]);
 }finally{await db.close();}
});

test('ativacao local: tabelas e comando privados, revisao protegida e snapshot de regras igual ao catalogo auditado',async()=>{
 const db=await setup();try{
 const id=await criar(db),args=await pedido(db,id);
 for(const table of ['contextos_criacao_mesa','ativacoes_ficha','inventario_instancias'])await asRole(db,A,()=>assert.rejects(db.query('select * from app_private.'+table),/permission denied/));
 await asRole(db,A,()=>assert.rejects(ativar(db,args),/permission denied/));
 await asRole(db,A,()=>assert.rejects(db.query('update public.personagens set revisao_criacao=99 where id=$1',[id]),/permission denied/));
 const antes=await get(db,id);
 await asRole(db,A,async()=>{
  const row=(await db.query('update public.personagens set pv_atual=2 where id=$1 returning pv_atual,revisao_criacao',[id])).rows[0];
  assert.equal(row.pv_atual,2);assert.equal(row.revisao_criacao,antes.revisao_criacao+1);
 });
 assert.deepEqual(await get(db,id),antes);
 for(const role of ['anon','authenticated']){
  const acesso=(await db.query("select has_function_privilege($1,'app_private.ativar_ficha_local(uuid,uuid,bigint,bigint)','execute') permitido",[role])).rows[0].permitido;
  assert.equal(acesso,false);
 }
 const source=(await Promise.all(['origens','habilidades','pericias'].map(n=>readFile(new URL('../src/'+n+'.ts',import.meta.url),'utf8')))).join('\n');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 const {ORIGENS,HABILIDADES_BASICAS,PERICIAS_CLASSE,PONTOS_CLASSE}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
 const regras=(await db.query('select app_private.regras_criacao_nivel_um() r')).rows[0].r;
 assert.deepEqual(regras,{origens:Object.fromEntries(ORIGENS.map(o=>[o.nome,o.pericias])),habilidades:Object.fromEntries(HABILIDADES_BASICAS.map(h=>[h.id,h.classe])),periciasClasse:PERICIAS_CLASSE,pontosClasse:PONTOS_CLASSE});
 // Este teste e sequencial; nao simula conexoes PostgreSQL sobrepostas.
 }finally{await db.close();}
});

