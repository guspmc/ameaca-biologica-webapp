import {FalhaAtivacao,type ConferenciaAtivacao,type PedidoAtivacao,type ReciboAtivacao} from '../../src/pedidoAtivacao';
import type {ResumoPersonagem} from '../../src/ResumoOperacional';
export type Cenario='normal'|'pendencias'|'lotada'|'revisao'|'antes'|'resposta';
export function criarEstadoAtivacao(cenario:Cenario='normal'){
 let revisao=1,ativa=false,tentativas=0,conjuntos=0,primeira=true,falharResumo=false;
 let pedidoSalvo:PedidoAtivacao|undefined,recibo:ReciboAtivacao|undefined;
 const pv=7,sa=1,bi=3; // Gastos ficticios: ativar/repetir nao os restaura.
 const passivos={'Percepção':13,Vontade:11,Fortitude:12,Reflexos:12};
 const resumo=(id:string,nome:string):ResumoPersonagem=>({personagemId:id,nome,classe:'Operadora',nivel:1,pv:{atual:pv,maximo:15},sa:{atual:sa,maximo:3},bi:{atual:bi,maximo:7},defesa:12,passivos:{...passivos},condicoes:null});
 return {
  async conferir():Promise<ConferenciaAtivacao>{return {personagemId:'fixture-ativacao',nome:'Sobrevivente fictícia',revisaoFicha:revisao,revisaoMesa:0,ativas:cenario==='lotada'?10:ativa?1:0,
   pendencias:ativa?['Esta personagem já está ativa.']:cenario==='pendencias'?['Distribuir os Pontos de Perícia restantes.','Definir as duas opções pendentes do Misto.']:[]};},
  async ativar(p:PedidoAtivacao):Promise<ReciboAtivacao>{
   tentativas++;
   if(recibo){if(!pedidoSalvo||p.personagemId!==pedidoSalvo.personagemId||p.operacaoId!==pedidoSalvo.operacaoId||p.revisaoFicha!==pedidoSalvo.revisaoFicha||p.revisaoMesa!==pedidoSalvo.revisaoMesa)throw new FalhaAtivacao('A personagem já foi ativada por outro pedido.','regra');return {...recibo};}
   if(cenario==='revisao'&&primeira){primeira=false;revisao++;throw new FalhaAtivacao('Os dados mudaram. Confira a criação novamente.','revisao');}
   if(p.personagemId!=='fixture-ativacao'||p.revisaoFicha!==revisao||p.revisaoMesa!==0)throw new FalhaAtivacao('Dados desatualizados. Confira novamente.','revisao');
   if(cenario==='pendencias'||cenario==='lotada')throw new FalhaAtivacao('A criação ainda não pode ser ativada.','regra');
   if(cenario==='antes'&&primeira){primeira=false;throw new FalhaAtivacao('Falha simulada antes de gravar.','incerto');}
   ativa=true;conjuntos++;revisao++;pedidoSalvo={...p};
   recibo={personagemId:p.personagemId,operacaoId:p.operacaoId,estado:'completa',quantidadeInstancias:6,revisaoCriacao:revisao};
   if(cenario==='resposta'&&primeira){primeira=false;throw new FalhaAtivacao('A resposta se perdeu após a confirmação simulada.','incerto');}
   return {...recibo};
  },
  async listar():Promise<ResumoPersonagem[]>{
   if(falharResumo){falharResumo=false;throw Error('Acesso ao resumo recusado nesta simulação.');}
   return cenario==='lotada'?Array.from({length:10},(_,i)=>resumo('fixture-'+i,'Sobrevivente '+(i+1))):ativa?[resumo('fixture-ativacao','Sobrevivente fictícia')]:[];
  },
  falharProximoResumo(){falharResumo=true;},
  estado(){return {ativa,tentativas,conjuntos,pv,sa,bi};}
 };
}

