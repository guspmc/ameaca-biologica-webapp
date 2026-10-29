import type {ClienteAtivacaoRPC} from './servicoAtivacao';
export type ContextoCriacao={mesaId:string;preparado:false;metodo:null;nivelInicial:null;permiteFinalizar:false;revisao:null}|{mesaId:string;preparado:true;metodo:'padrao'|'casa';nivelInicial:number;permiteFinalizar:boolean;revisao:number};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const objeto=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const natural=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
function validar(v:unknown,id:string):ContextoCriacao{
 if(!objeto(v)||Object.keys(v).length!==6||!['mesaId','preparado','metodo','nivelInicial','permiteFinalizar','revisao'].every(k=>Object.hasOwn(v,k))||v.mesaId!==id)throw Error('Resposta de contexto não verificada. Consulte novamente.');
 if(v.preparado===false&&v.metodo===null&&v.nivelInicial===null&&v.permiteFinalizar===false&&v.revisao===null)return {mesaId:id,preparado:false,metodo:null,nivelInicial:null,permiteFinalizar:false,revisao:null};
 if(v.preparado===true&&(v.metodo==='padrao'||v.metodo==='casa')&&natural(v.nivelInicial)&&v.nivelInicial>=1&&v.nivelInicial<=10&&typeof v.permiteFinalizar==='boolean'&&natural(v.revisao))return {mesaId:id,preparado:true,metodo:v.metodo,nivelInicial:v.nivelInicial,permiteFinalizar:v.permiteFinalizar,revisao:v.revisao};
 throw Error('Resposta de contexto não verificada. Consulte novamente.');
}
// Porta injetada, sem sessão global, consulta inicial ou integração na aplicação.
export function prepararServicoContextoCriacao(cliente:ClienteAtivacaoRPC){
 async function chamar(nome:string,id:string,args:Record<string,unknown>){
  if(!uuid(id))throw Error('Mesa inválida.');
  let r:unknown;try{r=await cliente.rpc(nome,args);}catch{throw Error('Resposta não confirmada. Consulte o contexto antes de tentar novamente.');}
  if(!objeto(r)||!Object.hasOwn(r,'data')||!Object.hasOwn(r,'error'))throw Error('Resposta não confirmada. Consulte novamente.');
  if(r.error!==null){const e=r.error;if(objeto(e)&&e.code==='PT409')throw Error('Contexto desatualizado. Sua escolha foi preservada; consulte novamente antes de salvar.');if(objeto(e)&&e.code==='PT422')throw Error('Configuração recusada. A preparação desta Mesa exige um fluxo específico.');if(objeto(e)&&e.code==='42501')throw Error('Acesso ao contexto recusado.');throw Error('Resposta não confirmada. Consulte o contexto antes de tentar novamente.');}
  return validar(r.data,id);
 }
 return {
  consultar:(id:string)=>chamar('consultar_contexto_criacao',id,{p_mesa:id}),
  salvar:(id:string,permitir:boolean,revisao:number|null)=>{if(typeof permitir!=='boolean'||(revisao!==null&&!natural(revisao)))return Promise.reject(Error('Escolha ou revisão inválida.'));return chamar('salvar_contexto_criacao',id,{p_mesa:id,p_permite_finalizar:permitir,p_revisao:revisao});},
 };
}
