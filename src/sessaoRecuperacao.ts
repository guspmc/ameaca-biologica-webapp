import {prepararRecuperacaoAtivacao} from './recuperacaoAtivacao';

type Dependencias=Parameters<typeof prepararRecuperacaoAtivacao>[0];
type Contexto=Dependencias['contexto'];
type Recuperacao=ReturnType<typeof prepararRecuperacaoAtivacao>;

// Preparação local: o adaptador de sessão autenticada ainda não está conectado.
// Selecionar é um evento de ciclo de vida, inclusive ao voltar aos mesmos IDs.
// Os IDs delimitam o armazenamento; a autorização continua sendo do servidor.
export function prepararSessaoRecuperacao(dependencias:Omit<Dependencias,'contexto'>){
 const deps={...dependencias};
 let atual:{contexto:Contexto;recuperacao:Recuperacao}|null=null;
 function encerrar(){atual?.recuperacao.invalidar();atual=null;}
 return {
  encerrar,
  selecionar(contexto:Contexto){
   // Invalida antes de validar a próxima seleção: erro não mantém sessão antiga.
   encerrar();
   const copia={...contexto};
   const recuperacao=prepararRecuperacaoAtivacao({...deps,contexto:copia});
   atual={contexto:copia,recuperacao};
   return recuperacao;
  },
  contexto(){return atual?{...atual.contexto}:null;},
 };
}
