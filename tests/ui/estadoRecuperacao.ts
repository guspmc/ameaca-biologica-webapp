import type {PedidoAtivacao,ReciboAtivacao} from '../../src/pedidoAtivacao';
export const CONTEXTO_QA={usuarioId:'f0000000-0000-4000-8000-000000000001',mesaId:'f1000000-0000-4000-8000-000000000001',personagemId:'f2000000-0000-4000-8000-000000000001'};
export const PREFIXO_QA='ab:qa:recuperacao:v1:';
export const CHAVE_PEDIDO_QA=['ab','ativacao','1',CONTEXTO_QA.usuarioId,CONTEXTO_QA.mesaId,CONTEXTO_QA.personagemId].join(':');
export type CenarioRecuperacao='resposta'|'antes'|'normal';
type Estado={versao:1;cenario:CenarioRecuperacao;envios:number;consultas:number;conjuntos:number;falhou:boolean;pedido:PedidoAtivacao|null;recibo:ReciboAtivacao|null};
type StorageQA=Pick<Storage,'getItem'|'setItem'>;
const inicial=(cenario:CenarioRecuperacao):Estado=>({versao:1,cenario,envios:0,consultas:0,conjuntos:0,falhou:false,pedido:null,recibo:null});
// Servidor ficticio persistido apenas no armazenamento de teste injetado.
export function prepararServidorRecuperacaoQA(storage:StorageQA){
 function ler():Estado{
  const raw=storage.getItem('servidor');if(raw===null)return inicial('resposta');
  const v=JSON.parse(raw) as Estado;
  if(!v||v.versao!==1||!['resposta','antes','normal'].includes(v.cenario)||![v.envios,v.consultas,v.conjuntos].every(n=>Number.isSafeInteger(n)&&n>=0)||typeof v.falhou!=='boolean')throw Error('Estado fictício inválido. Reinicie a simulação.');
  return structuredClone(v);
 }
 const salvar=(s:Estado)=>storage.setItem('servidor',JSON.stringify(s));
 const erro=(code:string,details:string|null=null)=>({data:null,error:{code,details,message:'Erro fictício'}});
 return {
  estado:ler,
  reiniciar(cenario:CenarioRecuperacao){salvar(inicial(cenario));},
  async rpc(nome:string,args:Record<string,unknown>){
   if(args.p_personagem!==CONTEXTO_QA.personagemId)return erro('42501');
   const s=ler();
   if(nome==='consultar_resultado_ativacao'){
    s.consultas++;salvar(s);
    if(s.recibo&&s.pedido){
     if(args.p_operacao!==null&&args.p_operacao!==s.pedido.operacaoId)return erro('PT409','AB_PEDIDO_DIVERGENTE');
     return {data:{situacao:'confirmada',estadoFicha:'completa',pedido:s.pedido,recibo:s.recibo},error:null};
    }
    return {data:{situacao:'sem_recibo',estadoFicha:'rascunho',pedido:null,recibo:null},error:null};
   }
   if(nome!=='ativar_personagem')return erro('PGRST202');
   if(typeof args.p_operacao!=='string'||args.p_revisao_ficha!==2||args.p_revisao_mesa!==3)return erro('PT409','AB_REVISAO');
   s.envios++;
   const p:PedidoAtivacao={personagemId:CONTEXTO_QA.personagemId,operacaoId:args.p_operacao,revisaoFicha:2,revisaoMesa:3};
   if(s.recibo&&s.pedido){salvar(s);if(JSON.stringify(p)!==JSON.stringify(s.pedido))return erro('PT409','AB_PEDIDO_DIVERGENTE');return {data:s.recibo,error:null};}
   if(s.cenario==='antes'&&!s.falhou){s.falhou=true;salvar(s);throw Error('Falha de teste antes de gravar.');}
   s.conjuntos++;s.pedido=p;s.recibo={personagemId:p.personagemId,operacaoId:p.operacaoId,estado:'completa',quantidadeInstancias:6,revisaoCriacao:3};
   if(s.cenario==='resposta'&&!s.falhou){s.falhou=true;salvar(s);return {data:null,error:null};}
   salvar(s);return {data:s.recibo,error:null};
  }
 };
}
