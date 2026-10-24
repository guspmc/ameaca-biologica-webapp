import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const transpilar=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const pedidoUri=uri(transpilar(await readFile(new URL('../src/pedidoAtivacao.ts',import.meta.url),'utf8')));
const {confirmarAtivacao,FalhaAtivacao}=await import(pedidoUri);
const {prepararServicosAtivacao}=await import(uri(transpilar(await readFile(new URL('../src/servicoAtivacao.ts',import.meta.url),'utf8')).replace("'./pedidoAtivacao'",JSON.stringify(pedidoUri))));
const id='00000000-0000-4000-8000-000000000001',op='20000000-0000-4000-8000-000000000001',mesa='10000000-0000-4000-8000-000000000001';
const conferencia=()=>({personagemId:id,nome:'Fictícia',revisaoFicha:2,revisaoMesa:3,ativas:0,pendencias:[]});
const pedido=()=>({personagemId:id,operacaoId:op,revisaoFicha:2,revisaoMesa:3});
const recibo=()=>({personagemId:id,operacaoId:op,estado:'completa',quantidadeInstancias:6,revisaoCriacao:9});
const passivas=['Acrobacia','Atletismo','Fortitude','Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade'];
const resumo=()=>({personagemId:id,nome:'Fictícia',classe:'Operadora',nivel:1,pv:{atual:7,maximo:15},sa:{atual:1,maximo:3},bi:{atual:3,maximo:7},defesa:12,passivos:Object.fromEntries(passivas.map(n=>[n,12])),condicoes:null});
const mock=data=>prepararServicosAtivacao({rpc:async()=>({data,error:null})});
const tipo=t=>e=>e instanceof FalhaAtivacao&&e.tipo===t&&!e.message.includes('SEGREDO');

test('contrato RPC: preparacao inerte e entradas invalidas nao chamam servidor',async()=>{
 let chamadas=0;const servico=prepararServicosAtivacao({rpc:async()=>{chamadas++;throw Error('Nao chamar');}});
 assert.equal(chamadas,0);
 for(const s of ['', 'fixture', mesa.toUpperCase().replace('10000000','XYZ')]){
  await assert.rejects(servico.conferir(s),tipo('regra'));await assert.rejects(servico.listarResumo(s),tipo('regra'));
 }
 for(const p of [{...pedido(),revisaoFicha:NaN},{...pedido(),revisaoMesa:-1},{...pedido(),operacaoId:'nova'},{...pedido(),jogador_id:'forjado'}])await assert.rejects(servico.ativar(p),tipo('regra'));
 assert.equal(chamadas,0);
});

test('contrato RPC: conferencia envia apenas ID e rejeita dados de outra ficha ou campos extras',async()=>{
 const c=conferencia();c.pendencias=['Escolha pendente'];let chamada;
 const servico=prepararServicosAtivacao({rpc:async(n,a)=>{chamada=[n,a];return {data:c,error:null};}});
 const lida=await servico.conferir(id);assert.deepEqual(chamada,['conferir_ativacao_personagem',{p_personagem:id}]);
 c.pendencias.push('Outra');assert.deepEqual(lida.pendencias,['Escolha pendente']);
 for(const patch of [{personagemId:mesa},{revisaoFicha:'2'},{ativas:1.5},{pendencias:['']},{historia:'SEGREDO'}])await assert.rejects(mock({...conferencia(),...patch}).conferir(id),tipo('incerto'));
});

test('contrato RPC: ativacao copia pedido e envia somente operacao e revisoes esperadas',async()=>{
 const p=pedido(),r=recibo();let chamada,resolver;
 const servico=prepararServicosAtivacao({rpc:(n,a)=>{chamada=[n,a];return new Promise(ok=>{resolver=()=>ok({data:r,error:null});});}});
 const promessa=servico.ativar(p);p.revisaoFicha=99;p.operacaoId=mesa;
 assert.deepEqual(chamada,['ativar_personagem',{p_personagem:id,p_operacao:op,p_revisao_ficha:2,p_revisao_mesa:3}]);
 resolver();const recebido=await promessa;r.quantidadeInstancias=99;assert.equal(recebido.quantidadeInstancias,6);
});

test('contrato RPC: erros tipados sem mensagens privadas ou tentativas automaticas',async()=>{
 const casos=[['PT409','AB_REVISAO','revisao'],['PT409','outra','incerto'],['PT422','AB_REGRA','regra'],['42501',null,'regra'],['PGRST301',null,'regra'],['PGRST202',null,'regra'],['42883',null,'regra'],['P0001',null,'incerto'],['40001',null,'incerto']];
 for(const [code,details,t] of casos){let n=0;const servico=prepararServicosAtivacao({rpc:async()=>{n++;return {data:recibo(),error:{code,details,message:'SEGREDO',hint:'SEGREDO'}};}});await assert.rejects(servico.ativar(pedido()),tipo(t));assert.equal(n,1);}
 await assert.rejects(prepararServicosAtivacao({rpc:async()=>{throw Error('SEGREDO');}}).ativar(pedido()),tipo('incerto'));
});

test('contrato RPC: resposta perdida recupera mesmo pedido via controlador sem recriar itens',async()=>{
 let tentativas=0,conjuntos=0;const enviados=[];let salvo;
 const servico=prepararServicosAtivacao({rpc:async(n,a)=>{
  assert.equal(n,'ativar_personagem');enviados.push({...a});tentativas++;
  if(!salvo){salvo={...a};conjuntos++;return {data:null,error:null};}
  assert.deepEqual(a,salvo);return {data:recibo(),error:null};
 }});
 const ctrl=confirmarAtivacao(conferencia(),()=>op);
 await assert.rejects(ctrl.executar(servico.ativar),tipo('incerto'));
 assert.equal((await ctrl.executar(servico.ativar)).estado,'completa');
 await ctrl.executar(servico.ativar);assert.equal(tentativas,2);assert.equal(conjuntos,1);assert.deepEqual(enviados[0],enviados[1]);
});

test('contrato RPC: recibos ambiguos nunca anunciam sucesso',async()=>{
 for(const r of [null,[],{...recibo(),personagemId:mesa},{...recibo(),operacaoId:mesa},{...recibo(),estado:'rascunho'},{...recibo(),quantidadeInstancias:-1},{...recibo(),revisaoCriacao:2},{...recibo(),revisaoCriacao:Number.MAX_SAFE_INTEGER+1},{...recibo(),historia:'SEGREDO'}])await assert.rejects(mock(r).ativar(pedido()),tipo('incerto'));
 await assert.rejects(prepararServicosAtivacao({rpc:async()=>({data:recibo()})}).ativar(pedido()),tipo('incerto'));
});

test('contrato RPC: resumo fechado copia recursos, passivas e condicoes sem recalcular valores',async()=>{
 const p=resumo();p.condicoes=['Condição fictícia'];p.passivos.Fortitude=null;let chamada;
 const servico=prepararServicosAtivacao({rpc:async(n,a)=>{chamada=[n,a];return {data:[p],error:null};}});
 const recebido=await servico.listarResumo(mesa);assert.deepEqual(chamada,['resumo_operacional_mesa',{p_mesa:mesa}]);
 assert.deepEqual(recebido,[p]);p.pv.atual=15;p.passivos.Luta=999;p.condicoes.push('Outra');
 assert.equal(recebido[0].pv.atual,7);assert.equal(recebido[0].passivos.Luta,12);assert.deepEqual(recebido[0].condicoes,['Condição fictícia']);
 assert.equal((await mock([resumo()]).listarResumo(mesa))[0].condicoes,null);assert.deepEqual(await mock([]).listarResumo(mesa),[]);
});

test('contrato RPC: resumo invalido, duplicado ou contaminado e recusado integralmente',async()=>{
 const p=resumo(),incompleto={...p.passivos};delete incompleto.Vontade;
 for(const r of [null,{},[p,p],Array.from({length:11},(_,i)=>({...resumo(),personagemId:'00000000-0000-4000-8000-'+String(i).padStart(12,'0')})),[{...p,historia:'SEGREDO'}],[{...p,pv:{...p.pv,item:'SEGREDO'}}],[{...p,passivos:incompleto}],[{...p,passivos:{...p.passivos,Extra:10}}],[{...p,passivos:{...p.passivos,Luta:'12'}}],[{...p,condicoes:{privado:'SEGREDO'}}],[{...p,nivel:0}]])await assert.rejects(mock(r).listarResumo(mesa),tipo('incerto'));
});

test('contrato RPC: consulta recupera por ficha sem referencia ou confere tupla do pedido conhecido',async()=>{
 let chamada;const fonte={situacao:'confirmada',estadoFicha:'completa',pedido:pedido(),recibo:recibo()};
 const s=prepararServicosAtivacao({rpc:async(n,a)=>{chamada=[n,a];return {data:fonte,error:null};}});
 const r=await s.consultarResultado(id);assert.deepEqual(chamada,['consultar_resultado_ativacao',{p_personagem:id,p_operacao:null}]);assert.deepEqual(r,fonte);
 assert.deepEqual(await s.consultarPedido(pedido()),{situacao:'confirmada',recibo:recibo()});assert.equal(chamada[1].p_operacao,op);
 fonte.pedido.revisaoFicha=1;assert.equal(r.pedido.revisaoFicha,2);await assert.rejects(s.consultarPedido(pedido()),tipo('incerto'));
});

test('contrato RPC: completa sem recibo impede reenvio; resposta de consulta ambigua recusada',async()=>{
 const r={situacao:'sem_recibo',estadoFicha:'completa',pedido:null,recibo:null};
 assert.deepEqual(await mock(r).consultarResultado(id),r);await assert.rejects(mock(r).consultarPedido(pedido()),tipo('regra'));
 assert.deepEqual(await mock({...r,estadoFicha:'rascunho'}).consultarPedido(pedido()),{situacao:'sem_recibo'});
 for(const dado of [{...r,extra:'SEGREDO'},{...r,estadoFicha:'arquivada'},{situacao:'confirmada',estadoFicha:'rascunho',pedido:pedido(),recibo:recibo()},{situacao:'confirmada',estadoFicha:'completa',pedido:{...pedido(),operacaoId:mesa},recibo:recibo()}])await assert.rejects(mock(dado).consultarResultado(id),tipo('incerto'));
});
