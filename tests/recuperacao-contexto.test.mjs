import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const codigo=async p=>ts.transpileModule(await readFile(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const pedidoURI=uri(await codigo('../src/pedidoAtivacao.ts'));
const {prepararRecuperacaoAtivacao}=await import(uri((await codigo('../src/recuperacaoAtivacao.ts')).replace("'./pedidoAtivacao'",JSON.stringify(pedidoURI))));
const {prepararConsultaContextual}=await import(uri(await codigo('../src/consultaContextual.ts')));
const id='00000000-0000-4000-8000-000000000001',usuario='00000000-0000-4000-8000-000000000002',mesa='10000000-0000-4000-8000-000000000001',op='20000000-0000-4000-8000-000000000001';
const contexto=()=>({usuarioId:usuario,mesaId:mesa,personagemId:id});
const pedido=()=>({personagemId:id,operacaoId:op,revisaoFicha:2,revisaoMesa:3});
const recibo=()=>({personagemId:id,operacaoId:op,estado:'completa',quantidadeInstancias:6,revisaoCriacao:9});
function storage(){const dados=new Map(),eventos=[];return {dados,eventos,getItem:k=>{eventos.push('ler');return dados.get(k)??null;},setItem:(k,v)=>{eventos.push('gravar');dados.set(k,v);}};}
const adiar=()=>{let ok,erro;const promessa=new Promise((a,b)=>{ok=a;erro=b;});return {promessa,ok,erro};};
function preparar(s,extras={}){return prepararRecuperacaoAtivacao({contexto:contexto(),armazenamento:s,consultar:async()=>({situacao:'sem_recibo'}),ativar:async()=>recibo(),...extras});}
const incerto=e=>e.tipo==='incerto'&&!e.message.includes('SEGREDO');

test('recuperacao: criacao inerte, pedido minimo gravado antes de enviar e falha conserva pendencia',async()=>{
 const s=storage();let envios=0;
 const r=preparar(s,{ativar:async p=>{envios++;assert.equal(s.dados.size,1);assert.equal(s.eventos[1],'gravar');assert.deepEqual(p,pedido());throw Error('SEGREDO');}});
 assert.equal(s.eventos.length,0);await assert.rejects(r.confirmar(pedido()),incerto);assert.equal(envios,1);assert.deepEqual(r.pendente(),pedido());
 const registro=JSON.parse([...s.dados.values()][0]);assert.deepEqual(registro,{versao:1,usuarioId:usuario,mesaId:mesa,pedido:pedido()});
 assert.deepEqual(Object.keys(registro.pedido).sort(),['personagemId','operacaoId','revisaoFicha','revisaoMesa'].sort());
});

test('recuperacao: novo controlador usa recibo autorizado do mesmo pedido sem novo efeito',async()=>{
 const s=storage();let conjuntos=0,consultas=0;const fonte=recibo();
 const antigo=preparar(s,{ativar:async()=>{conjuntos++;throw Error('Resposta perdida');}});
 await assert.rejects(antigo.confirmar(pedido()));antigo.invalidar();
 const novo=preparar(s,{consultar:async p=>{consultas++;assert.deepEqual(p,pedido());return {situacao:'confirmada',recibo:fonte};},ativar:async()=>{conjuntos++;throw Error('Nao reenviar');}});
 const recuperado=await novo.repetir();assert.deepEqual(recuperado,recibo());fonte.quantidadeInstancias=999;assert.equal(recuperado.quantidadeInstancias,6);assert.equal(conjuntos,1);assert.equal(consultas,1);
 assert.throws(()=>novo.confirmar({...pedido(),operacaoId:mesa}),incerto);
});

test('recuperacao: sem recibo nao apaga pedido nem envia sozinho; repetir conserva identidade',async()=>{
 const s=storage();let envios=0,consultas=0;
 await assert.rejects(preparar(s,{ativar:async()=>{throw Error();}}).confirmar(pedido()));
 const novo=preparar(s,{consultar:async p=>{consultas++;assert.deepEqual(p,pedido());return {situacao:'sem_recibo'};},ativar:async p=>{envios++;assert.deepEqual(p,pedido());return recibo();}});
 assert.deepEqual(await novo.consultarResultado(),{situacao:'sem_recibo'});assert.equal(envios,0);assert.deepEqual(novo.pendente(),pedido());
 assert.deepEqual(await novo.repetir(),recibo());assert.equal(envios,1);assert.equal(consultas,2);
});

test('recuperacao: cliques duplicados compartilham envio e outro controlador nao sobrescreve pedido',async()=>{
 const s=storage(),d=adiar();let envios=0;const r=preparar(s,{ativar:async()=>{envios++;return d.promessa;}});
 const a=r.confirmar(pedido()),b=r.confirmar(pedido());assert.strictEqual(a,b);
 assert.throws(()=>preparar(s).confirmar({...pedido(),operacaoId:mesa}),incerto);
 await Promise.resolve();d.ok(recibo());await a;assert.equal(envios,1);
});

test('recuperacao: indisponibilidade, escrita silenciosa e registro corrompido bloqueiam efeitos',async()=>{
 let envios=0;const ativar=async()=>{envios++;return recibo();};
 for(const s of [{getItem:()=>{throw Error('SEGREDO');},setItem:()=>{}},{getItem:()=>null,setItem:()=>{throw Error('SEGREDO');}},{getItem:()=>null,setItem:()=>{}}]){
  assert.throws(()=>preparar(s,{ativar}).confirmar(pedido()),e=>['regra','incerto'].includes(e.tipo)&&!e.message.includes('SEGREDO'));
 }
 for(const raw of ['{','null',JSON.stringify({versao:1,usuarioId:usuario,mesaId:mesa,pedido:{...pedido(),historia:'SEGREDO'}}),JSON.stringify({versao:2,usuarioId:usuario,mesaId:mesa,pedido:pedido()})]){
  const s={getItem:()=>raw,setItem:()=>assert.fail('Nao sobrescrever')};assert.throws(()=>preparar(s,{ativar}).confirmar(pedido()),incerto);
 }
 assert.equal(envios,0);
});

test('recuperacao: resultado de outra operacao ou ambiguo nao limpa registro nem confirma',async()=>{
 const s=storage();await assert.rejects(preparar(s,{ativar:async()=>{throw Error();}}).confirmar(pedido()));const antes=[...s.dados];
 for(const r of [null,{situacao:'sem_recibo',extra:true},{situacao:'confirmada',recibo:{...recibo(),operacaoId:mesa}},{situacao:'confirmada',recibo:{...recibo(),historia:'SEGREDO'}},{situacao:'confirmada',recibo:{...recibo(),revisaoCriacao:2}}]){
  await assert.rejects(preparar(s,{consultar:async()=>r}).consultarResultado(),incerto);assert.deepEqual([...s.dados],antes);
 }
});

test('recuperacao: invalidar durante consulta impede envio; resposta antiga de envio nao e entregue',async()=>{
 const s=storage();await assert.rejects(preparar(s,{ativar:async()=>{throw Error();}}).confirmar(pedido()));
 let envios=0;const consulta=adiar(),r=preparar(s,{consultar:()=>consulta.promessa,ativar:async()=>{envios++;return recibo();}});
 const retomada=r.repetir();r.invalidar();consulta.ok({situacao:'sem_recibo'});await assert.rejects(retomada,incerto);assert.equal(envios,0);
 const outro=storage(),envio=adiar(),antigo=preparar(outro,{ativar:()=>envio.promessa});
 const promessa=antigo.confirmar(pedido());await Promise.resolve();antigo.invalidar();envio.ok(recibo());await assert.rejects(promessa,incerto);assert.equal(outro.dados.size,1);
});

test('recuperacao: contexto copiado e isolado por conta, Mesa e ficha, sem pedido nao ha consulta',async()=>{
 const s=storage(),c=contexto();const original=preparar(s,{contexto:c,ativar:async()=>{throw Error();}});c.mesaId=op;
 await assert.rejects(original.confirmar(pedido()));assert.deepEqual(original.pendente(),pedido());
 let consultas=0;for(const patch of [{usuarioId:op},{mesaId:op},{personagemId:op}]){
  const r=preparar(s,{contexto:{...contexto(),...patch},consultar:async()=>{consultas++;throw Error();}});
  assert.equal(r.pendente(),null);assert.deepEqual(await r.consultarResultado(),{situacao:'sem_pedido'});
 }
 assert.equal(consultas,0);assert.equal(s.dados.size,1);
});

test('contexto: resposta de Mesa anterior nao ocupa a Mesa atual',async()=>{
 const c=prepararConsultaContextual(),a=adiar(),b=adiar();c.selecionar('conta:MesaA');const pa=c.consultar(()=>a.promessa);
 c.selecionar('conta:MesaB');assert.equal(c.estado().valor,null);const pb=c.consultar(()=>b.promessa);
 b.ok([{nome:'B'}]);assert.equal(await pb,'atual');a.ok([{nome:'A'}]);assert.equal(await pa,'descartada');assert.deepEqual(c.estado().valor,[{nome:'B'}]);assert.equal(c.estado().carregando,false);
});

test('contexto: atualizacao mais recente vence e erro anterior nao apaga dados atuais',async()=>{
 const c=prepararConsultaContextual(),a=adiar(),b=adiar();c.selecionar('Mesa');const pa=c.consultar(()=>a.promessa),pb=c.consultar(()=>b.promessa);
 b.ok('atual');await pb;a.erro(Error('SEGREDO'));assert.equal(await pa,'descartada');assert.equal(c.estado().valor,'atual');assert.equal(c.estado().erro,null);
});

test('contexto: voltar ao mesmo ID ou encerrar sessao invalida respostas, inclusive em A-B-A',async()=>{
 const c=prepararConsultaContextual(),d=adiar();c.selecionar('A');const p=c.consultar(()=>d.promessa);c.selecionar('B');c.selecionar('A');d.ok('antiga');assert.equal(await p,'descartada');assert.equal(c.estado().valor,null);
 const e=adiar(),q=c.consultar(()=>e.promessa);c.invalidar();e.ok('sessao antiga');assert.equal(await q,'descartada');assert.equal(await c.consultar(()=>assert.fail('Nao consultar sem contexto')),'descartada');assert.deepEqual(c.estado(),{contexto:null,carregando:false,valor:null,erro:null});
});

test('contexto: copias independentes e erro atual limpa dados sem exibir mensagem privada',async()=>{
 const c=prepararConsultaContextual(),fonte=[{pv:7}];c.selecionar('Mesa');await c.consultar(async()=>fonte);fonte[0].pv=99;const vista=c.estado();vista.valor[0].pv=100;assert.equal(c.estado().valor[0].pv,7);
 await c.consultar(async()=>{throw Error('SEGREDO');});assert.equal(c.estado().valor,null);assert.equal(c.estado().carregando,false);assert.ok(!c.estado().erro.includes('SEGREDO'));
});
