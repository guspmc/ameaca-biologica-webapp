import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const carregados={};for(const nome of ['pedidoAtivacao','recuperacaoAtivacao','sessaoRecuperacao','contextoCriacao','servicoAtivacao','fluxoAtivacaoLocal']){
 let s=ts.transpileModule(await readFile(new URL('../src/'+nome+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const [anterior,u]of Object.entries(carregados))s=s.replaceAll("'./"+anterior+"'",JSON.stringify(u));carregados[nome]=uri(s);
}
const {prepararFluxoAtivacaoLocal}=await import(carregados.fluxoAtivacaoLocal);
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const contexto=()=>({usuarioId:id(1),mesaId:id(2),personagemId:id(3)});
const adiar=()=>{let ok;const promessa=new Promise(r=>{ok=r;});return {promessa,ok};};
function fixture(modo='normal'){
 const dados=new Map(),chamadas=[];let envios=0,conjuntos=0,ids=0,recibo=null,pedido=null,falhou=false;
 const cfg={mesaId:id(2),preparado:true,metodo:'padrao',nivelInicial:1,permiteFinalizar:true,revisao:3};
 const conf={personagemId:id(3),nome:'Fictícia',revisaoFicha:2,revisaoMesa:3,ativas:0,pendencias:[]};
 const cliente={rpc:async(nome,args)=>{chamadas.push([nome,structuredClone(args)]);
  if(nome==='consultar_resultado_ativacao')return {data:recibo?{situacao:'confirmada',estadoFicha:'completa',pedido,recibo}:{situacao:'sem_recibo',estadoFicha:'rascunho',pedido:null,recibo:null},error:null};
  if(nome==='consultar_contexto_criacao')return {data:structuredClone(cfg),error:null};
  if(nome==='conferir_ativacao_personagem')return {data:structuredClone(conf),error:null};
  assert.equal(nome,'ativar_personagem');envios++;
  if(modo==='antes'&&!falhou){falhou=true;throw Error('SEGREDO');}
  assert.equal(dados.size,1);conjuntos++;pedido={personagemId:args.p_personagem,operacaoId:args.p_operacao,revisaoFicha:args.p_revisao_ficha,revisaoMesa:args.p_revisao_mesa};recibo={personagemId:id(3),operacaoId:args.p_operacao,estado:'completa',quantidadeInstancias:6,revisaoCriacao:3};
  if(modo==='resposta'&&!falhou){falhou=true;return {data:null,error:null};}return {data:recibo,error:null};
 }};
 const deps={cliente,armazenamento:{getItem:k=>dados.get(k)??null,setItem:(k,v)=>dados.set(k,v)},criarId:()=>{ids++;return id(4);}};
 return {deps,dados,chamadas,cfg,conf,contagens:()=>({envios,conjuntos,ids}),novo:()=>prepararFluxoAtivacaoLocal(deps)};
}
test('fluxo local: preparacao e selecao inertes, estado copiado e envio exige conferencia e consentimento',async()=>{
 const f=fixture(),x=f.novo();assert.equal(x.estado().etapa,'sem_contexto');x.selecionar(contexto());assert.equal(f.chamadas.length,0);assert.throws(()=>x.confirmar());await x.conferir();assert.equal(x.estado().etapa,'pronta');assert.throws(()=>x.confirmar());
 const copia=x.estado();copia.contexto.mesaId=id(8);copia.conferencia.pendencias.push('Forjada');assert.equal(x.estado().conferencia.pendencias.length,0);
 x.consentir(true);await x.confirmar();assert.equal(x.estado().etapa,'confirmada');assert.deepEqual(f.contagens(),{envios:1,conjuntos:1,ids:1});assert.throws(()=>x.confirmar());
});
test('fluxo local: contexto pausado ou revisao cruzada impede gerar pedido',async()=>{
 for(const mutar of [f=>{f.cfg.permiteFinalizar=false;},f=>{f.conf.revisaoMesa=4;},f=>{f.conf.pendencias=['Pendente'];},f=>{f.conf.ativas=10;}]){const f=fixture(),x=f.novo();mutar(f);x.selecionar(contexto());await x.conferir();assert.equal(x.estado().etapa,'impedida');assert.throws(()=>x.consentir(true));assert.equal(f.contagens().ids,0);assert.equal(f.dados.size,0);}
});
test('fluxo local: resposta perdida recupera depois de nova selecao sem outro ID ou envio',async()=>{
 const f=fixture('resposta'),a=f.novo();a.selecionar(contexto());await a.conferir();a.consentir(true);await a.confirmar();assert.equal(a.estado().etapa,'incerta');assert.equal(a.estado().pedidoPreservado,true);a.encerrar();
 const b=f.novo();b.selecionar(contexto());await b.conferir();assert.equal(b.estado().etapa,'confirmada');assert.deepEqual(f.contagens(),{envios:1,conjuntos:1,ids:1});
});
test('fluxo local: falha anterior permite somente repeticao explicita do mesmo pedido',async()=>{
 const f=fixture('antes'),x=f.novo();x.selecionar(contexto());await x.conferir();x.consentir(true);await x.confirmar();assert.equal(x.estado().etapa,'incerta');await x.conferir();assert.equal(x.estado().etapa,'pendente');assert.equal(f.contagens().envios,1);assert.throws(()=>x.confirmar());await x.repetir();assert.equal(x.estado().etapa,'confirmada');assert.deepEqual(f.contagens(),{envios:2,conjuntos:1,ids:1});
});
test('fluxo local: pedido preservado com revisao alterada bloqueia reenvio sem apagar referencia',async()=>{
 const f=fixture('antes'),x=f.novo();x.selecionar(contexto());await x.conferir();x.consentir(true);await x.confirmar();const guardado=[...f.dados];f.cfg.revisao=4;f.conf.revisaoMesa=4;await x.conferir();assert.equal(x.estado().etapa,'impedida');assert.throws(()=>x.repetir());assert.deepEqual([...f.dados],guardado);assert.equal(f.contagens().envios,1);
});
test('fluxo local: consulta antiga nao preenche nova selecao mesmo com mesmos IDs',async()=>{
 const f=fixture(),d=adiar();let primeiro=true;const rpc=f.deps.cliente.rpc;f.deps.cliente.rpc=(nome,args)=>{if(primeiro){primeiro=false;return d.promessa;}return rpc(nome,args);};
 const x=f.novo();x.selecionar(contexto());const p=x.conferir();x.selecionar(contexto());await x.conferir();d.ok({data:null,error:null});assert.equal(await p,'descartada');assert.equal(x.estado().etapa,'pronta');assert.equal(x.estado().conferida,false);
});
test('fluxo local: cliques compartilham envio, encerramento descarta recibo tardio sem apagar pedido',async()=>{
 const f=fixture(),d=adiar(),iniciou=adiar(),rpc=f.deps.cliente.rpc;f.deps.cliente.rpc=async(nome,args)=>{const r=await rpc(nome,args);if(nome==='ativar_personagem'){iniciou.ok();return d.promessa;}return r;};
 const x=f.novo();x.selecionar(contexto());await x.conferir();x.consentir(true);const a=x.confirmar(),b=x.confirmar();assert.strictEqual(a,b);await iniciou.promessa;x.encerrar();d.ok({data:{personagemId:id(3),operacaoId:id(4),estado:'completa',quantidadeInstancias:6,revisaoCriacao:3},error:null});assert.equal(await a,'descartada');assert.equal(x.estado().etapa,'sem_contexto');assert.equal(f.dados.size,1);assert.equal(f.contagens().envios,1);
});
test('fluxo local: armazenamento ilegivel impede conferir ou enviar e nao vaza erro interno',async()=>{
 const f=fixture();f.deps.armazenamento.getItem=()=>{throw Error('SEGREDO');};const x=f.novo();x.selecionar(contexto());await x.conferir();assert.equal(x.estado().etapa,'incerta');assert.ok(!x.estado().mensagem.includes('SEGREDO'));assert.equal(f.chamadas.length,0);assert.throws(()=>x.confirmar());
});

test('fluxo local: composicao completa usa SQL local autorizado e recupera confirmacao sem outro envio',async()=>{
 const {A,T,op,setup,criar,get}=await import('./helpers/ciclo-fixture.mjs');const db=await setup();try{
 for(const nome of ['consulta-ativacao-local.sql','gateway-ativacao-local.sql','contexto-criacao-local.sql'])await db.exec(await readFile(new URL('../supabase/proposals/'+nome,import.meta.url),'utf8'));
 const personagemId=await criar(db),antes=await get(db,personagemId),dados=new Map();let envios=0,ids=0;
 const consultas={
  consultar_resultado_ativacao:a=>db.query('select public.consultar_resultado_ativacao($1,$2) r',[a.p_personagem,a.p_operacao]),
  consultar_contexto_criacao:a=>db.query('select public.consultar_contexto_criacao($1) r',[a.p_mesa]),
  conferir_ativacao_personagem:a=>db.query('select public.conferir_ativacao_personagem($1) r',[a.p_personagem]),
  ativar_personagem:a=>{envios++;return db.query('select public.ativar_personagem($1,$2,$3,$4) r',[a.p_personagem,a.p_operacao,a.p_revisao_ficha,a.p_revisao_mesa]);},
 };
 const deps={cliente:{rpc:async(nome,a)=>{try{assert.ok(consultas[nome]);return {data:(await consultas[nome](a)).rows[0].r,error:null};}catch(e){return {data:null,error:{code:e.code,details:e.detail,message:e.message}};}}},armazenamento:{getItem:k=>dados.get(k)??null,setItem:(k,v)=>dados.set(k,v)},criarId:()=>{ids++;return op(20);}};
 await db.exec('set role authenticated');const x=prepararFluxoAtivacaoLocal(deps);x.selecionar({usuarioId:A,mesaId:T,personagemId});await x.conferir();assert.equal(x.estado().etapa,'pronta');x.consentir(true);await x.confirmar();assert.equal(x.estado().etapa,'confirmada');x.encerrar();
 const novo=prepararFluxoAtivacaoLocal(deps);novo.selecionar({usuarioId:A,mesaId:T,personagemId});await novo.conferir();assert.equal(novo.estado().etapa,'confirmada');assert.equal(envios,1);assert.equal(ids,1);await db.exec('reset role');const depois=await get(db,personagemId);assert.equal(depois.estado_ficha,'completa');for(const campo of ['pv_atual','sa_atual','bi_atual'])assert.equal(depois[campo],antes[campo]);assert.equal((await db.query('select count(*)::int n from app_private.ativacoes_ficha where personagem_id=$1',[personagemId])).rows[0].n,1);
 }finally{await db.close();}
});
