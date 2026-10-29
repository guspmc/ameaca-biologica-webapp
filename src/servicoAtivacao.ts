import {FalhaAtivacao,type ConferenciaAtivacao,type PedidoAtivacao,type ReciboAtivacao} from './pedidoAtivacao';
import type {ResumoPersonagem} from './ResumoOperacional';
import type {ResultadoConsultaAtivacao} from './recuperacaoAtivacao';
export type ResultadoAtivacaoServidor={situacao:'sem_recibo';estadoFicha:'rascunho'|'completa';pedido:null;recibo:null}|{situacao:'confirmada';estadoFicha:'completa';pedido:PedidoAtivacao;recibo:ReciboAtivacao};

// Contrato futuro, deliberadamente fora da aplicacao conectada. Criar nao consulta.
type Objeto=Record<string,unknown>;
export type ClienteAtivacaoRPC={rpc:(nome:string,args:Objeto)=>PromiseLike<{data:unknown;error:unknown}>};
const objeto=(v:unknown):v is Objeto=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const inteiro=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v);
const natural=(v:unknown):v is number=>inteiro(v)&&v>=0;
const texto=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const chaves=(v:Objeto,campos:readonly string[])=>Object.keys(v).length===campos.length&&campos.every(k=>Object.hasOwn(v,k));
const passivas=['Percepção','Vontade','Fortitude','Reflexos'] as const;
function invalida():never{throw new FalhaAtivacao('A resposta não pôde ser verificada. Preserve o pedido antes de tentar novamente.','incerto');}
function idValido(id:string){if(!uuid(id))throw new FalhaAtivacao('Identificador inválido. Reabra a ficha para conferir.','regra');}
function lerConferencia(v:unknown,id:string):ConferenciaAtivacao{
 if(!objeto(v)||!chaves(v,['personagemId','nome','revisaoFicha','revisaoMesa','ativas','pendencias'])
 ||v.personagemId!==id||!texto(v.nome)||!natural(v.revisaoFicha)||!natural(v.revisaoMesa)||!natural(v.ativas)
 ||!Array.isArray(v.pendencias)||!v.pendencias.every(texto))return invalida();
 return {personagemId:id,nome:v.nome,revisaoFicha:v.revisaoFicha,revisaoMesa:v.revisaoMesa,ativas:v.ativas,pendencias:[...v.pendencias]};
}
function lerRecibo(v:unknown,p:PedidoAtivacao):ReciboAtivacao{
 if(!objeto(v)||!chaves(v,['personagemId','operacaoId','estado','quantidadeInstancias','revisaoCriacao'])
 ||v.personagemId!==p.personagemId||v.operacaoId!==p.operacaoId||v.estado!=='completa'
 ||!natural(v.quantidadeInstancias)||!natural(v.revisaoCriacao)||v.revisaoCriacao<=p.revisaoFicha)return invalida();
 return {personagemId:p.personagemId,operacaoId:p.operacaoId,estado:'completa',quantidadeInstancias:v.quantidadeInstancias,revisaoCriacao:v.revisaoCriacao};
}
function lerResultado(v:unknown,id:string,esperado?:PedidoAtivacao):ResultadoAtivacaoServidor{
 if(!objeto(v)||!chaves(v,['situacao','estadoFicha','pedido','recibo']))return invalida();
 if(v.situacao==='sem_recibo'&&(v.estadoFicha==='rascunho'||v.estadoFicha==='completa')&&v.pedido===null&&v.recibo===null)return {situacao:'sem_recibo',estadoFicha:v.estadoFicha,pedido:null,recibo:null};
 const p=v.pedido;
 if(v.situacao!=='confirmada'||v.estadoFicha!=='completa'||!objeto(p)||!chaves(p,['personagemId','operacaoId','revisaoFicha','revisaoMesa'])||p.personagemId!==id||!uuid(p.operacaoId)||!natural(p.revisaoFicha)||!natural(p.revisaoMesa))return invalida();
 const pedido:PedidoAtivacao={personagemId:id,operacaoId:p.operacaoId,revisaoFicha:p.revisaoFicha,revisaoMesa:p.revisaoMesa};
 if(esperado&&(['personagemId','operacaoId','revisaoFicha','revisaoMesa'] as const).some(k=>esperado[k]!==pedido[k]))return invalida();
 return {situacao:'confirmada',estadoFicha:'completa',pedido,recibo:lerRecibo(v.recibo,pedido)};
}
function recurso(v:unknown):{atual:number;maximo:number}{
 if(!objeto(v)||!chaves(v,['atual','maximo'])||!inteiro(v.atual)||!natural(v.maximo))return invalida();
 // Validacao de transporte: nao recalcula regras, cura ou limita recursos de jogo.
 return {atual:v.atual,maximo:v.maximo};
}
function lerResumo(v:unknown):ResumoPersonagem[]{
 if(!Array.isArray(v)||v.length>10)return invalida();
 const ids=new Set<string>();
 return v.map(p=>{
  if(!objeto(p)||!chaves(p,['personagemId','nome','classe','nivel','pv','sa','bi','defesa','passivos','condicoes'])
  ||!uuid(p.personagemId)||ids.has(p.personagemId)||!texto(p.nome)||!texto(p.classe)||!inteiro(p.nivel)||p.nivel<1
  ||!inteiro(p.defesa)||!objeto(p.passivos)||!chaves(p.passivos,passivas)
  ||!Object.values(p.passivos).every(n=>n===null||inteiro(n))
  ||!(p.condicoes===null||(Array.isArray(p.condicoes)&&p.condicoes.every(texto))))return invalida();
  ids.add(p.personagemId);
  const valores:Record<string,number|null>={};for(const nome of passivas)valores[nome]=p.passivos[nome] as number|null;
  return {personagemId:p.personagemId,nome:p.nome,classe:p.classe,nivel:p.nivel,pv:recurso(p.pv),sa:recurso(p.sa),bi:recurso(p.bi),defesa:p.defesa,passivos:valores,condicoes:p.condicoes===null?null:[...p.condicoes as string[]]};
 });
}
function falhaRPC(erro:unknown):FalhaAtivacao{
 if(objeto(erro)){
  if(erro.code==='PT409'&&erro.details==='AB_REVISAO')return new FalhaAtivacao('Os dados mudaram. Confira a criação novamente.','revisao');
  if(erro.code==='PT422'&&erro.details==='AB_REGRA')return new FalhaAtivacao('A criação tem impedimentos. Confira as escolhas novamente.','regra');
  if(erro.code==='42501'||['PGRST301','PGRST302','PGRST303'].includes(String(erro.code)))return new FalhaAtivacao('Acesso não autorizado. Confira sua sessão e participação na Mesa.','regra');
  if(erro.code==='PGRST202'||erro.code==='42883')return new FalhaAtivacao('A integração de ativação ainda não está disponível.','regra');
 }
 // Nunca usar message/details/hint recebidos como texto da interface.
 return new FalhaAtivacao('Não foi possível confirmar a resposta. Uma nova tentativa deve usar o mesmo pedido.','incerto');
}
export function prepararServicosAtivacao(cliente:ClienteAtivacaoRPC){
 async function chamar(nome:string,args:Objeto):Promise<unknown>{
  let resposta:unknown;
  try{resposta=await cliente.rpc(nome,args);}catch{return Promise.reject(falhaRPC(null));}
  if(!objeto(resposta)||!Object.hasOwn(resposta,'data')||!Object.hasOwn(resposta,'error'))return invalida();
  if(resposta.error!==null)throw falhaRPC(resposta.error);
  return resposta.data;
 }
 async function consultarResultado(personagemId:string,esperado?:PedidoAtivacao):Promise<ResultadoAtivacaoServidor>{
  idValido(personagemId);
  if(esperado&&(!objeto(esperado)||!chaves(esperado,['personagemId','operacaoId','revisaoFicha','revisaoMesa'])||esperado.personagemId!==personagemId||!uuid(esperado.operacaoId)||!natural(esperado.revisaoFicha)||!natural(esperado.revisaoMesa)))throw new FalhaAtivacao('Pedido inválido para consulta.','regra');
  const pedido=esperado?{...esperado}:undefined;
  return lerResultado(await chamar('consultar_resultado_ativacao',{p_personagem:personagemId,p_operacao:pedido?.operacaoId??null}),personagemId,pedido);
 }
 return {
  consultarResultado,
  async consultarPedido(p:PedidoAtivacao):Promise<ResultadoConsultaAtivacao>{
   const r=await consultarResultado(p.personagemId,p);
   if(r.situacao==='confirmada')return {situacao:'confirmada',recibo:r.recibo};
   if(r.estadoFicha!=='rascunho')throw new FalhaAtivacao('A ficha já está completa e não tem recibo disponível para este pedido.','regra');
   return {situacao:'sem_recibo'};
  },
  async conferir(personagemId:string):Promise<ConferenciaAtivacao>{
   idValido(personagemId);
   return lerConferencia(await chamar('conferir_ativacao_personagem',{p_personagem:personagemId}),personagemId);
  },
  async ativar(pedido:PedidoAtivacao):Promise<ReciboAtivacao>{
   if(!objeto(pedido)||!chaves(pedido,['personagemId','operacaoId','revisaoFicha','revisaoMesa'])
   ||!uuid(pedido.personagemId)||!uuid(pedido.operacaoId)||!natural(pedido.revisaoFicha)||!natural(pedido.revisaoMesa))throw new FalhaAtivacao('Pedido inválido. Confira a criação novamente.','regra');
   const p={...pedido};
   return lerRecibo(await chamar('ativar_personagem',{p_personagem:p.personagemId,p_operacao:p.operacaoId,p_revisao_ficha:p.revisaoFicha,p_revisao_mesa:p.revisaoMesa}),p);
  },
  async listarResumo(mesaId:string):Promise<ResumoPersonagem[]>{
   idValido(mesaId);
   return lerResumo(await chamar('resumo_operacional_mesa',{p_mesa:mesaId}));
  }
 };
}
