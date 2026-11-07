import {revisarCriacao} from './conferenciaCriacao';
import type {FichaRevisao} from './conferenciaCriacao';
import {AUTOMACOES,automacoesEfetivas} from './funcionamentoFicha';
import type {ConfiguracaoFuncionamento} from './funcionamentoFicha';
import {planejarInventarioCriacao} from './inventarioCriacao';

export type FichaPreAtivacao=FichaRevisao & {
 jogador_id:string;estado_ficha:string;revisao_compras:number;revisao_funcionamento:number;
 configuracao_funcionamento:unknown;
};
export type ContextoPreAtivacao={
 usuarioId:string|null;papel:string|null;admitido:boolean;mesaPermiteCriacao:boolean;
 metodoAtual:string;nivelInicialAtual:number;
 contextoRevisado:{metodo:string;nivelInicial:number};
 quantidadeJogadores:number;quantidadeAtivas:number;
 revisoesEsperadas:{compras:number;funcionamento:number};
};
export type ImpedimentoAtivacao={codigo:string;mensagem:string;secao?:string};
export type AvaliacaoPreAtivacao={
 precondicoesLocaisAtendidas:boolean;impedimentos:ImpedimentoAtivacao[];
};
const objeto=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const inteiroNaoNegativo=(v:unknown)=>Number.isSafeInteger(v)&&(v as number)>=0;
function configValida(v:unknown):v is ConfiguracaoFuncionamento{
 if(!objeto(v)||Object.keys(v).length!==2||!['automatico','misto','manual'].includes(v.modo as string))return false;
 const p=v.preferenciasMisto;
 if(!objeto(p)||Object.keys(p).length!==AUTOMACOES.length)return false;
 return AUTOMACOES.every(a=>Object.hasOwn(p,a.id)&&(typeof p[a.id]==='boolean'||a.padrao===null&&p[a.id]===null));
}

// Avaliacao pura para preparar o contrato futuro. Nao autoriza nem executa ativacao.
// Contexto e contagens sao cenarios locais; no servidor terao de ser relidos sob bloqueio.
export function avaliarPreAtivacao(f:FichaPreAtivacao,c:ContextoPreAtivacao):AvaliacaoPreAtivacao{
 const impedimentos:ImpedimentoAtivacao[]=[];
 const add=(codigo:string,mensagem:string,secao?:string)=>impedimentos.push({codigo,mensagem,secao});
 const resultado=()=>({precondicoesLocaisAtendidas:impedimentos.length===0,impedimentos});
 if(!c.usuarioId||!f.jogador_id||c.usuarioId!==f.jogador_id||c.papel!=='jogador'||c.admitido!==true){
  add('acesso','Somente a autoria ainda admitida como jogador pode solicitar ativação.');
  return resultado();
 }
 if(f.estado_ficha!=='rascunho'){
  add('estado','Esta avaliação cobre somente rascunhos; repetição de ativação exige o registro da operação.');
  return resultado();
 }
 if(c.mesaPermiteCriacao!==true)add('mesa','A Mesa não está permitindo criação.');
 if(c.metodoAtual!=='padrao'||c.nivelInicialAtual!==1||f.nivel!==1)
  add('escopo','Somente criação Padrão de nível 1 está contemplada neste incremento.');
 if(c.contextoRevisado.metodo!==c.metodoAtual||c.contextoRevisado.nivelInicial!==c.nivelInicialAtual)
  add('contexto_alterado','Método ou nível inicial mudou desde a revisão; conferir novamente sem apagar escolhas.');
 if(!inteiroNaoNegativo(c.quantidadeJogadores)||!inteiroNaoNegativo(c.quantidadeAtivas))
  add('contagem','As contagens da Mesa precisam ser válidas.');
 else{
  if(c.quantidadeJogadores>10)add('jogadores','A Mesa excede o limite de dez jogadores.');
  if(c.quantidadeAtivas>=10)add('ativas','A Mesa já tem dez personagens ativas.');
 }
 const pares=[
  [f.revisao_compras,c.revisoesEsperadas.compras],
  [f.revisao_funcionamento,c.revisoesEsperadas.funcionamento]
 ];
 if(pares.some(([atual,esperada])=>!inteiroNaoNegativo(atual)||!inteiroNaoNegativo(esperada)||atual!==esperada))
  add('revisao','Compras ou preferências mudaram desde a revisão; carregar os dados salvos novamente.');
 if(!configValida(f.configuracao_funcionamento))add('configuracao','A configuração de funcionamento salva é inválida.','funcionamento');
 else if(Object.values(automacoesEfetivas(f.configuracao_funcionamento)).some(v=>v===null))
  add('opcoes_misto','Definir BI infectante e Durabilidade ao Aparar para o Misto, sem escolher valores automaticamente.','funcionamento');
 try{
  // Recalcula a partir dos dados; nao recebe nem aceita um status Conferido do cliente.
  for(const linha of revisarCriacao(f))if(linha.estado!=='conferido')
   add('criacao',linha.nome+': '+linha.detalhe,linha.secao);
 }catch{
  add('dados_criacao','Os dados salvos da criação têm formato inválido.');
 }
 try{planejarInventarioCriacao(f);}catch{
  add('inventario','Não foi possível preparar o inventário com o kit e o plano salvos.','itens');
 }
 return resultado();
}
