import {lerPedidoOrganizacao,planejarOrganizacao,type ContextoOrganizacao,type ReciboOrganizacao,type PedidoOrganizacao} from '../../src/organizacaoInventario';
import type {InventarioConsulta} from '../../src/inventarioConsulta';
import {prepararInventarioQA,FICHAS_INVENTARIO} from './estadoInventario';
export const FICHAS_ORGANIZACAO=FICHAS_INVENTARIO;
export type CenarioOrganizacao='normal'|'pilhas'|'estados'|'excesso'|'conflito'|'antes'|'depois'|'recibo'|'atraso'|'recusa';
export async function prepararOrganizacaoQA(cenario:CenarioOrganizacao){
 const dados=new Map<string,InventarioConsulta>(),recibos=new Map<string,ReciboOrganizacao>();let envios=0,alteracoes=0,consultas=0,primeira=true,pendente:(()=>void)|null=null;
 const chave=(c:Pick<ContextoOrganizacao,'usuarioId'|'mesaId'|'personagemId'>)=>JSON.stringify([c.usuarioId,c.mesaId,c.personagemId]);
 for(const c of Object.values(FICHAS_INVENTARIO))dados.set(chave(c),await prepararInventarioQA(cenario==='pilhas'?'pilhas':cenario==='estados'?'estados':cenario==='excesso'?'excesso':'normal').carregar(c) as InventarioConsulta);
 const conhecido=(c:Pick<ContextoOrganizacao,'usuarioId'|'mesaId'|'personagemId'>)=>{const d=dados.get(chave(c));if(!d)throw Error('Contexto fictício desconhecido.');return d;};
 const reciboChave=(p:PedidoOrganizacao)=>chave(p)+':'+p.id;
 return {
  estado:()=>({envios,alteracoes,consultas,aguardando:pendente!==null}),
  entregar(){pendente?.();},
  porta:{
   async consultar(c:ContextoOrganizacao,pedidoId:string|null){consultas++;const d=conhecido(c);if(cenario==='recusa'&&consultas===1)throw Error('SEGREDO DE QA');return {inventario:structuredClone(d),recibo:structuredClone(pedidoId?recibos.get(chave(c)+':'+pedidoId)??null:null)};},
   async enviar(entrada:PedidoOrganizacao):Promise<unknown>{
    envios++;const p=lerPedidoOrganizacao(entrada),d=conhecido(p),k=reciboChave(p),anterior=recibos.get(k);
    if(anterior){if((Object.keys(p) as (keyof PedidoOrganizacao)[]).some(k=>anterior.pedido[k]!==p[k]))throw Error('Pedido divergente.');return structuredClone(anterior);}
    if(cenario==='conflito'&&primeira){primeira=false;d.revisao++;throw Error('Revisão mudou.');}
    if(p.revisao!==d.revisao)throw Error('Revisão mudou.');
    if(cenario==='antes'&&primeira){primeira=false;throw Error('SEGREDO DE QA');}
    const proximo=planejarOrganizacao(d,p.instanciaId,p.destino).depois,r={pedido:p,resultado:proximo};dados.set(chave(p),proximo);recibos.set(k,structuredClone(r));alteracoes++;
    if(cenario==='depois'&&primeira){primeira=false;throw Error('Resposta perdida.');}
    if(cenario==='recibo'&&primeira){primeira=false;return {...r,pedido:{...p,id:'f6000000-0000-4000-8000-999999999999'}};}
    if(cenario==='atraso'&&!pendente)return new Promise(resolve=>{pendente=()=>{pendente=null;resolve(structuredClone(r));};});
    return structuredClone(r);
   }
  }
 };
}
