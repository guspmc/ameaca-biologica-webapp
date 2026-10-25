import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const codigo=async p=>ts.transpileModule(await readFile(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const pedidoUri=uri(await codigo('../src/pedidoAtivacao.ts'));
const recuperacaoUri=uri((await codigo('../src/recuperacaoAtivacao.ts')).replace("'./pedidoAtivacao'",JSON.stringify(pedidoUri)));
const {prepararSessaoRecuperacao}=await import(uri((await codigo('../src/sessaoRecuperacao.ts')).replace("'./recuperacaoAtivacao'",JSON.stringify(recuperacaoUri))));
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const contexto=()=>({usuarioId:id(1),mesaId:id(2),personagemId:id(3)});
const pedido=()=>({personagemId:id(3),operacaoId:id(4),revisaoFicha:2,revisaoMesa:3});
const recibo=()=>({personagemId:id(3),operacaoId:id(4),estado:'completa',quantidadeInstancias:6,revisaoCriacao:3});
function preparar(extra={}){const dados=new Map();let chamadas=0;const sessao=prepararSessaoRecuperacao({armazenamento:{getItem:k=>dados.get(k)??null,setItem:(k,v)=>dados.set(k,v)},consultar:async()=>{chamadas++;return {situacao:'confirmada',recibo:recibo()};},ativar:async()=>{chamadas++;return recibo();},...extra});return {sessao,dados,chamadas:()=>chamadas};}
const adiar=()=>{let ok;const promessa=new Promise(r=>{ok=r;});return {promessa,ok};};

test('sessao: selecionar e encerrar sao inertes; contexto copiado e selecao invalida encerra anterior',()=>{
 const t=preparar(),c=contexto(),a=t.sessao.selecionar(c);c.mesaId=id(9);const vista=t.sessao.contexto();vista.usuarioId=id(9);assert.deepEqual(t.sessao.contexto(),contexto());
 assert.equal(t.chamadas(),0);assert.equal(t.dados.size,0);assert.throws(()=>t.sessao.selecionar({...contexto(),usuarioId:'invalido'}));assert.equal(t.sessao.contexto(),null);assert.throws(()=>a.pendente());t.sessao.encerrar();t.sessao.encerrar();assert.equal(t.chamadas(),0);
});
test('sessao: conta Mesa e ficha isolam pedido; voltar recupera referencia sem reviver controles antigos',async()=>{
 const t=preparar(),a=t.sessao.selecionar(contexto());await a.confirmar(pedido());const guardado=[...t.dados];
 for(const campo of ['usuarioId','mesaId','personagemId']){const b=t.sessao.selecionar({...contexto(),[campo]:id(8)});assert.equal(b.pendente(),null);assert.throws(()=>a.confirmar(pedido()));}
 const nova=t.sessao.selecionar(contexto());assert.deepEqual(nova.pendente(),pedido());assert.deepEqual(await nova.consultarResultado(),{situacao:'confirmada',recibo:recibo()});assert.deepEqual([...t.dados],guardado);assert.equal(t.chamadas(),2);
});
test('sessao: logout durante consulta impede reenvio e conserva referencia recuperavel',async()=>{
 const d=adiar();let envios=0;const t=preparar({ativar:async()=>{envios++;throw Error('Resposta perdida');},consultar:()=>d.promessa});const a=t.sessao.selecionar(contexto());await assert.rejects(a.confirmar(pedido()));
 const p=a.repetir();t.sessao.encerrar();d.ok({situacao:'sem_recibo'});await assert.rejects(p);assert.equal(envios,1);assert.equal(t.dados.size,1);assert.equal(t.sessao.contexto(),null);
});
test('sessao: nova sessao com mesmos IDs descarta recibo tardio sem apagar pedido nem duplicar envio',async()=>{
 const d=adiar();let envios=0;const t=preparar({ativar:()=>{envios++;return d.promessa;}});const a=t.sessao.selecionar(contexto()),p=a.confirmar(pedido());await Promise.resolve();
 const b=t.sessao.selecionar(contexto());d.ok(recibo());await assert.rejects(p);assert.deepEqual(b.pendente(),pedido());assert.deepEqual(await b.consultarResultado(),{situacao:'confirmada',recibo:recibo()});assert.equal(envios,1);
});
