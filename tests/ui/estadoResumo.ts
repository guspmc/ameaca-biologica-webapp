import type {ClienteAtivacaoRPC} from '../../src/servicoAtivacao';
import type {ResumoPersonagem} from '../../src/ResumoOperacional';
export type CenarioResumo='normal'|'desconhecidas'|'condicoes'|'vazia'|'dez'|'recusa'|'invalida'|'atraso';
const id=(n:number)=>`e4000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const MESAS_RESUMO={A:{usuarioId:id(1),mesaId:id(2),mesaNome:'Mesa A fictícia'},B:{usuarioId:id(1),mesaId:id(3),mesaNome:'Mesa B fictícia'}};
export function prepararResumoQA(cenario:CenarioResumo){
 let consultas=0,pendente:(()=>void)|null=null;
 const personagem=(n:number,nome:string):ResumoPersonagem=>({personagemId:id(10+n),nome,classe:'Operadora',nivel:1,pv:{atual:7,maximo:15},sa:{atual:1,maximo:3},bi:{atual:3,maximo:7},defesa:12,passivos:{'Percepção':13,Vontade:11,Fortitude:12,Reflexos:12},condicoes:null});
 function resposta(mesa:string){
  const p=personagem(0,mesa===MESAS_RESUMO.A.mesaId?'Sobrevivente da Mesa A':'Sobrevivente da Mesa B');
  if(cenario==='vazia')return {data:[],error:null};
  if(cenario==='dez')return {data:Array.from({length:10},(_,i)=>personagem(i,`Sobrevivente ${i+1} com nome longo para conferir leitura`)),error:null};
  if(cenario==='desconhecidas'){p.passivos.Fortitude=null;p.passivos.Reflexos=null;}
  if(cenario==='condicoes')return {data:[{...p,condicoes:[]}, {...personagem(1,'Sobrevivente com condição'),condicoes:['Condição fictícia de demonstração com descrição longa']}],error:null};
  if(cenario==='invalida'&&consultas===1)return {data:[p,{...personagem(1,'Não deve aparecer'),historia:'SEGREDO DE QA'}],error:null};
  if(cenario==='recusa'&&consultas===1)return {data:null,error:{code:'42501',message:'SEGREDO DE QA'}};
  return {data:[p],error:null};
 }
 const cliente:ClienteAtivacaoRPC={rpc(nome,args){
  if(nome!=='resumo_operacional_mesa')throw Error('Somente leitura nesta simulação.');
  consultas++;const r=resposta(String(args.p_mesa));
  if(cenario==='atraso'&&args.p_mesa===MESAS_RESUMO.A.mesaId&&!pendente)return new Promise(resolve=>{pendente=()=>{pendente=null;resolve(r);};});
  return Promise.resolve(r);
 }};
 return {cliente,estado:()=>({consultas,aguardando:pendente!==null}),entregar(){pendente?.();}};
}
