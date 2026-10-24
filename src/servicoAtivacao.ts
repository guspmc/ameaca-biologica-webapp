import type {SupabaseClient} from '@supabase/supabase-js';
import {FalhaAtivacao,type ConferenciaAtivacao,type PedidoAtivacao,type ReciboAtivacao} from './pedidoAtivacao';
import type {ResumoPersonagem} from './ResumoOperacional';

// Contrato futuro, deliberadamente fora da aplicacao conectada. Criar nao consulta.
type Objeto=Record<string,unknown>;
const objeto=(v:unknown):v is Objeto=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const inteiro=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v);
const natural=(v:unknown):v is number=>inteiro(v)&&v>=0;
const texto=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const chaves=(v:Objeto,campos:readonly string[])=>Object.keys(v).length===campos.length&&campos.every(k=>Object.hasOwn(v,k));
const passivas=['Acrobacia','Atletismo','Fortitude','Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade'] as const;
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
export function prepararServicosAtivacao(cliente:Pick<SupabaseClient,'rpc'>){
 async function chamar(nome:string,args:Objeto):Promise<unknown>{
  let resposta:unknown;
  try{resposta=await cliente.rpc(nome,args);}catch{return Promise.reject(falhaRPC(null));}
  if(!objeto(resposta)||!Object.hasOwn(resposta,'data')||!Object.hasOwn(resposta,'error'))return invalida();
  if(resposta.error!==null)throw falhaRPC(resposta.error);
  return resposta.data;
 }
 return {
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
