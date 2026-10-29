import type {ContextoCriacao} from '../../src/contextoCriacao';
export const MESA_CONTEXTO_QA='f1000000-0000-4000-8000-000000000014';
export type CenarioContexto='normal'|'legado'|'conflito'|'resposta';
// Apenas memória, sem conta, armazenamento ou acesso a banco.
export function prepararContextoQA(cenario:CenarioContexto){
 let atual:ContextoCriacao={mesaId:MESA_CONTEXTO_QA,preparado:false,metodo:null,nivelInicial:null,permiteFinalizar:false,revisao:null};
 let falhou=false,envios=0;
 const erro=(code:string)=>({data:null,error:{code,message:'SEGREDO FICTICIO'}});
 return {
  estado:()=>({contexto:structuredClone(atual),envios,personagens:cenario==='legado'?1:0,pv:7,sa:1,bi:3}),
  async rpc(nome:string,a:Record<string,unknown>){
   if(a.p_mesa!==MESA_CONTEXTO_QA)return erro('42501');
   if(nome==='consultar_contexto_criacao')return {data:structuredClone(atual),error:null};
   if(nome!=='salvar_contexto_criacao')return erro('42883');envios++;
   if(cenario==='legado'&&!atual.preparado)return erro('PT422');
   if(cenario==='conflito'&&!falhou){falhou=true;atual={mesaId:MESA_CONTEXTO_QA,preparado:true,metodo:'padrao',nivelInicial:1,permiteFinalizar:false,revisao:1};return erro('PT409');}
   if(a.p_revisao!==atual.revisao)return erro('PT409');
   if(typeof a.p_permite_finalizar!=='boolean')return erro('PT422');
   atual={mesaId:MESA_CONTEXTO_QA,preparado:true,metodo:'padrao',nivelInicial:1,permiteFinalizar:a.p_permite_finalizar,revisao:atual.preparado?atual.revisao+(atual.permiteFinalizar!==a.p_permite_finalizar?1:0):0};
   if(cenario==='resposta'&&!falhou){falhou=true;throw Error('Resposta ficticia perdida');}
   return {data:structuredClone(atual),error:null};
  }
 };
}
