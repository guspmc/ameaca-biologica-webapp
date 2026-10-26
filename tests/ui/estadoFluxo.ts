import type {PedidoAtivacao,ReciboAtivacao} from '../../src/pedidoAtivacao';
export const CONTEXTO_FLUXO_QA={usuarioId:'f0000000-0000-4000-8000-000000000015',mesaId:'f1000000-0000-4000-8000-000000000015',personagemId:'f2000000-0000-4000-8000-000000000015'};
export type CenarioFluxo='normal'|'pausado'|'resposta'|'antes'|'revisao'|'armazenamento';
export function prepararFluxoQA(cenario:CenarioFluxo){
 let recibo:ReciboAtivacao|null=null,pedido:PedidoAtivacao|null=null,envios=0,conjuntos=0,revisaoMesa=3;
 const dados=new Map<string,string>();
 return {
  armazenamento:{getItem:(k:string)=>dados.get(k)??null,setItem:(k:string,v:string)=>{if(cenario==='armazenamento')throw Error('Falha fictícia');dados.set(k,v);}},
  estado:()=>({envios,conjuntos,referencias:dados.size,pv:7,sa:1,bi:3}),
  async rpc(nome:string,a:Record<string,unknown>){
   const id=CONTEXTO_FLUXO_QA.personagemId,mesa=CONTEXTO_FLUXO_QA.mesaId;
   const erro=(code:string,details:string|null=null)=>({data:null,error:{code,details}});
   if(nome==='consultar_contexto_criacao'){if(a.p_mesa!==mesa)return erro('42501');return {data:{mesaId:mesa,preparado:true,metodo:'padrao',nivelInicial:1,permiteFinalizar:cenario!=='pausado',revisao:revisaoMesa},error:null};}
   if(a.p_personagem!==id)return erro('42501');
   if(nome==='consultar_resultado_ativacao'){if(recibo&&a.p_operacao!==null&&a.p_operacao!==pedido?.operacaoId)return erro('PT409','AB_PEDIDO_DIVERGENTE');return {data:recibo?{situacao:'confirmada',estadoFicha:'completa',pedido,recibo}:{situacao:'sem_recibo',estadoFicha:'rascunho',pedido:null,recibo:null},error:null};}
   if(nome==='conferir_ativacao_personagem')return {data:{personagemId:id,nome:'Sobrevivente fictícia',revisaoFicha:2,revisaoMesa,ativas:0,pendencias:[]},error:null};
   if(nome!=='ativar_personagem')return erro('42883');envios++;
   if(envios===1&&(cenario==='antes'||cenario==='revisao')){if(cenario==='revisao')revisaoMesa=4;return {data:null,error:null};}
   if(cenario==='pausado')return erro('PT422','AB_REGRA');
   if(a.p_revisao_ficha!==2||a.p_revisao_mesa!==revisaoMesa)return erro('PT409','AB_REVISAO');
   if(typeof a.p_operacao!=='string')return erro('PT422','AB_REGRA');
   if(recibo)return a.p_operacao===pedido?.operacaoId?{data:recibo,error:null}:erro('PT409','AB_PEDIDO_DIVERGENTE');
   conjuntos++;pedido={personagemId:id,operacaoId:a.p_operacao,revisaoFicha:2,revisaoMesa:3};recibo={personagemId:id,operacaoId:a.p_operacao,estado:'completa',quantidadeInstancias:5,revisaoCriacao:3};
   return {data:cenario==='resposta'?null:recibo,error:null};
  },
 };
}
