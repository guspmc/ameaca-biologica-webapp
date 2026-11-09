import {FalhaAtivacao,type PedidoAtivacao,type ReciboAtivacao} from './pedidoAtivacao';

type Contexto={usuarioId:string;mesaId:string;personagemId:string};
type Armazenamento=Pick<Storage,'getItem'|'setItem'>;
export type ResultadoConsultaAtivacao={situacao:'sem_recibo'}|{situacao:'confirmada';recibo:ReciboAtivacao};
type Dependencias={contexto:Contexto;armazenamento:Armazenamento;consultar:(p:PedidoAtivacao)=>Promise<ResultadoConsultaAtivacao>;ativar:(p:PedidoAtivacao)=>Promise<ReciboAtivacao>};
const objeto=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const natural=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const chaves=(v:Record<string,unknown>,ks:string[])=>Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k));
function pedidoValido(v:unknown):v is PedidoAtivacao{return objeto(v)&&chaves(v,['personagemId','operacaoId','revisaoFicha','revisaoMesa'])&&uuid(v.personagemId)&&uuid(v.operacaoId)&&natural(v.revisaoFicha)&&natural(v.revisaoMesa);}
function incerto(mensagem='Não foi possível verificar o pedido pendente. Consulte o resultado antes de continuar.'):never{throw new FalhaAtivacao(mensagem,'incerto');}
function lerRecibo(v:unknown,p:PedidoAtivacao):ReciboAtivacao{
 if(!objeto(v)||!chaves(v,['personagemId','operacaoId','estado','quantidadeInstancias','revisaoCriacao'])||v.personagemId!==p.personagemId||v.operacaoId!==p.operacaoId||v.estado!=='completa'||!natural(v.quantidadeInstancias)||!natural(v.revisaoCriacao)||(v.revisaoCriacao as number)<=p.revisaoFicha)return incerto();
 return {personagemId:p.personagemId,operacaoId:p.operacaoId,estado:'completa',quantidadeInstancias:v.quantidadeInstancias as number,revisaoCriacao:v.revisaoCriacao as number};
}
// Nao acessa window/storage global, nao gera IDs e nao inicia consultas na criacao.
// O armazenamento e fornecido explicitamente; nenhuma aplicacao usa este modulo ainda.
export function prepararRecuperacaoAtivacao({contexto,armazenamento,consultar,ativar}:Dependencias){
 const c={...contexto};
 if(!chaves(c,['usuarioId','mesaId','personagemId'])||!Object.values(c).every(uuid))throw new FalhaAtivacao('Contexto de ativação inválido.','regra');
 const chave=['ab','ativacao','1',c.usuarioId,c.mesaId,c.personagemId].join(':');
 let valido=true,emCurso:Promise<ReciboAtivacao>|undefined;
 function atual(){if(!valido)incerto('O contexto mudou. Reabra a ficha na sessão atual para consultar o resultado.');}
 function ler():PedidoAtivacao|null{
  atual();let raw:string|null;
  try{raw=armazenamento.getItem(chave);}catch{return incerto();}
  if(raw===null)return null;
  let v:unknown;try{v=JSON.parse(raw);}catch{return incerto();}
  if(!objeto(v)||!chaves(v,['versao','usuarioId','mesaId','pedido'])||v.versao!==1||v.usuarioId!==c.usuarioId||v.mesaId!==c.mesaId||!pedidoValido(v.pedido)||v.pedido.personagemId!==c.personagemId)return incerto();
  return {...v.pedido};
 }
 function guardar(p:PedidoAtivacao){
  const raw=JSON.stringify({versao:1,usuarioId:c.usuarioId,mesaId:c.mesaId,pedido:{...p}});
  try{armazenamento.setItem(chave,raw);if(armazenamento.getItem(chave)!==raw)throw Error();}
  catch{throw new FalhaAtivacao('Não foi possível preservar o pedido antes do envio. Nenhuma ativação foi enviada.','regra');}
 }
 async function resultado(p:PedidoAtivacao):Promise<ResultadoConsultaAtivacao>{
  atual();let r:unknown;try{r=await consultar({...p});}catch{return incerto();}atual();
  if(!objeto(r))return incerto();
  if(r.situacao==='sem_recibo'&&chaves(r,['situacao']))return {situacao:'sem_recibo'};
  if(r.situacao==='confirmada'&&chaves(r,['situacao','recibo']))return {situacao:'confirmada',recibo:lerRecibo(r.recibo,p)};
  return incerto();
 }
 async function enviar(p:PedidoAtivacao):Promise<ReciboAtivacao>{
  atual();let r:unknown;
  try{r=await ativar({...p});}catch(e){atual();if(e instanceof FalhaAtivacao)throw new FalhaAtivacao(e.message,e.tipo);return incerto();}
  atual();return lerRecibo(r,p);
 }
 function executar(fn:()=>Promise<ReciboAtivacao>):Promise<ReciboAtivacao>{
  emCurso=Promise.resolve().then(fn).finally(()=>{emCurso=undefined;});return emCurso;
 }
 return {
  invalidar(){valido=false;},
  pendente(){return ler();},
  confirmar(pedido:PedidoAtivacao):Promise<ReciboAtivacao>{
   atual();if(!pedidoValido(pedido)||pedido.personagemId!==c.personagemId)throw new FalhaAtivacao('Pedido incompatível com a ficha atual.','regra');
   const p={...pedido},existente=ler();
   if(existente){
    if(emCurso&&(['personagemId','operacaoId','revisaoFicha','revisaoMesa'] as const).every(k=>existente[k]===p[k]))return emCurso;
    return incerto('Já existe um pedido nesta ficha. Consulte seu resultado antes de iniciar outro.');
   }
   guardar(p);return executar(()=>enviar(p));
  },
  async consultarResultado():Promise<ResultadoConsultaAtivacao|{situacao:'sem_pedido'}>{
   const p=ler();return p?resultado(p):{situacao:'sem_pedido'};
  },
  repetir():Promise<ReciboAtivacao>{
   atual();if(emCurso)return emCurso;
   const p=ler();if(!p)return incerto('Não há pedido preservado para recuperar. Confira a ficha antes de continuar.');
   return executar(async()=>{const r=await resultado(p);atual();return r.situacao==='confirmada'?r.recibo:enviar(p);});
  }
 };
}
