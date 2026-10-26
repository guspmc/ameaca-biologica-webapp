import {prepararServicosAtivacao,type ClienteAtivacaoRPC} from './servicoAtivacao';
import type {ResumoPersonagem} from './ResumoOperacional';

type Contexto={usuarioId:string;mesaId:string;mesaNome:string};
export type EstadoConsultaResumo={contexto:Contexto|null;etapa:'sem_contexto'|'pronta'|'consultando'|'carregada'|'erro';itens:ResumoPersonagem[];mensagem:string};
const inicial=(contexto:Contexto|null=null):EstadoConsultaResumo=>({contexto,etapa:contexto?'pronta':'sem_contexto',itens:[],mensagem:''});

// Preparação desconectada. Seleção não concede acesso: o adaptador futuro deve
// receber a sessão validada e o servidor continua responsável pela autorização.
export function prepararConsultaResumoLocal(cliente:ClienteAtivacaoRPC){
 const servico=prepararServicosAtivacao(cliente);
 let vista=inicial(),geracao=0;
 let curso:{geracao:number;promessa:Promise<'atual'|'descartada'>}|null=null;
 function encerrar(){geracao++;vista=inicial();curso=null;}
 return {
  encerrar,
  selecionar(contexto:Contexto){encerrar();vista=inicial({...contexto});},
  estado:()=>structuredClone(vista),
  consultar():Promise<'atual'|'descartada'>{
   if(!vista.contexto)return Promise.reject(Error('Selecione uma Mesa na sessão atual.'));
   if(curso?.geracao===geracao)return curso.promessa;
   const g=geracao,c={...vista.contexto};
   vista={...inicial(c),etapa:'consultando',mensagem:'Consultando o resumo…'};
   const promessa=Promise.resolve().then(()=>servico.listarResumo(c.mesaId)).then(itens=>{
    if(g!==geracao)return 'descartada' as const;
    vista={contexto:c,etapa:'carregada',itens:structuredClone(itens),mensagem:itens.length?`Resumo consultado: ${itens.length}/10 personagens ativas.`:'Nenhuma personagem ativa disponível.'};
    return 'atual' as const;
   }).catch(()=>{
    if(g!==geracao)return 'descartada' as const;
    vista={...inicial(c),etapa:'erro',mensagem:'Não foi possível verificar o resumo. Confira o acesso e tente consultar novamente.'};
    return 'atual' as const;
   }).finally(()=>{if(curso?.promessa===promessa)curso=null;});
   curso={geracao:g,promessa};return promessa;
  }
 };
}
