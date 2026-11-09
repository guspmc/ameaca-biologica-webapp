import {lerPedidoOrganizacao,planejarOrganizacao,type ContextoOrganizacao,type PedidoOrganizacao,type ReciboOrganizacao} from '../../src/organizacaoInventario';
import type {ArmazenamentoOrganizacao} from '../../src/pendenciaOrganizacao';
import {prepararInventarioQA,FICHAS_INVENTARIO as F} from './estadoInventario';
export {FICHAS_INVENTARIO as FICHAS_SESSAO} from './estadoInventario';
export const PREFIXO_ORG_QA='ab:qa:organizacao-sessao:';
export type CenarioSessao='normal'|'depois'|'antes'|'gravar'|'ler'|'corrompida'|'limpar'|'conflito'|'recusa'|'pilhas';
const cenarios:CenarioSessao[]=['normal','depois','antes','gravar','ler','corrompida','limpar','conflito','recusa','pilhas'];
export async function prepararServidorOrganizacaoSessao(a:ArmazenamentoOrganizacao){
 const key=PREFIXO_ORG_QA+'servidor',raw=a.getItem(key);
 const v=raw===null?{versao:1,cenario:'normal',envios:0,consultas:0,tentou:false,recusou:false,journal:[]}:JSON.parse(raw);
 if(!v||Object.keys(v).sort().join(',')!=='cenario,consultas,envios,journal,recusou,tentou,versao'||v.versao!==1||!cenarios.includes(v.cenario)||![v.envios,v.consultas].every(n=>Number.isSafeInteger(n)&&n>=0)||typeof v.tentou!=='boolean'||typeof v.recusou!=='boolean'||!Array.isArray(v.journal)||v.journal.length>100)throw Error('Servidor fictício não verificado. Reinicie somente esta simulação.');
 const estado=v as {versao:1;cenario:CenarioSessao;envios:number;consultas:number;tentou:boolean;recusou:boolean;journal:PedidoOrganizacao[]};
 const dados=new Map(),recibos=new Map<string,ReciboOrganizacao>();
 const chave=(c:Pick<ContextoOrganizacao,'usuarioId'|'mesaId'|'personagemId'>)=>JSON.stringify([c.usuarioId,c.mesaId,c.personagemId]);
 for(const c of Object.values(F))dados.set(chave(c),await prepararInventarioQA(estado.cenario==='pilhas'?'pilhas':'normal').carregar(c));
 function aplicar(entrada:unknown){const p=lerPedidoOrganizacao(entrada),d=dados.get(chave(p)),k=chave(p)+p.id;if(!d||recibos.has(k)||p.revisao!==d.revisao)throw Error('Histórico fictício inválido.');const resultado=planejarOrganizacao(d,p.instanciaId,p.destino).depois;dados.set(chave(p),resultado);recibos.set(k,{pedido:p,resultado});}
 for(const p of estado.journal)aplicar(p);
 if(estado.cenario==='conflito'&&estado.tentou&&estado.journal.length===0)dados.get(chave(F.A)).revisao++;
 const salvar=()=>{const raw=JSON.stringify(estado);a.setItem(key,raw);if(a.getItem(key)!==raw)throw Error('Servidor fictício não preservado.');};
 salvar();
 return {estado:()=>({cenario:estado.cenario,envios:estado.envios,consultas:estado.consultas,alteracoes:estado.journal.length}),
  reiniciar(c:CenarioSessao){if(!cenarios.includes(c))throw Error();a.setItem(key,JSON.stringify({versao:1,cenario:c,envios:0,consultas:0,tentou:false,recusou:false,journal:[]}));},
  porta:{async consultar(c:ContextoOrganizacao,id:string|null){const d=dados.get(chave(c));if(!d)throw Error();estado.consultas++;if(estado.cenario==='recusa'&&!estado.recusou){estado.recusou=true;salvar();throw Error('Recusa fictícia.');}salvar();return {inventario:structuredClone(d),recibo:structuredClone(id?recibos.get(chave(c)+id)??null:null)};},
   async enviar(entrada:PedidoOrganizacao){const p=lerPedidoOrganizacao(entrada),d=dados.get(chave(p));if(!d)throw Error();estado.envios++;const anterior=recibos.get(chave(p)+p.id);if(anterior){salvar();if(Object.keys(p).some(k=>p[k as keyof PedidoOrganizacao]!==anterior.pedido[k as keyof PedidoOrganizacao]))throw Error();return structuredClone(anterior);}
    const primeira=!estado.tentou;estado.tentou=true;
    if(estado.cenario==='antes'&&primeira){salvar();throw Error('Antes de gravar.');}
    if(estado.cenario==='conflito'&&primeira){d.revisao++;salvar();throw Error('Revisão mudou.');}
    aplicar(p);estado.journal.push(p);salvar();if(estado.cenario==='depois'&&primeira)throw Error('Resposta perdida.');return structuredClone(recibos.get(chave(p)+p.id));
   }}
 };
}
