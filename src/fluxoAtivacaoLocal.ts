import {FalhaAtivacao,confirmarAtivacao,type ConferenciaAtivacao,type ReciboAtivacao} from './pedidoAtivacao';
import {prepararServicosAtivacao,type ClienteAtivacaoRPC} from './servicoAtivacao';
import {prepararServicoContextoCriacao,type ContextoCriacao} from './contextoCriacao';
import {prepararSessaoRecuperacao} from './sessaoRecuperacao';

type Contexto={usuarioId:string;mesaId:string;personagemId:string};
type Etapa='sem_contexto'|'selecionada'|'conferindo'|'impedida'|'pronta'|'enviando'|'pendente'|'incerta'|'confirmada';
type RevisoesPedido={fichaPreservada:number;mesaPreservada:number;fichaAtual:number;mesaAtual:number};
type Estado={etapa:Etapa;contexto:Contexto|null;criacao:ContextoCriacao|null;conferencia:ConferenciaAtivacao|null;recibo:ReciboAtivacao|null;conferida:boolean;pedidoPreservado:boolean;revisoesPedido:RevisoesPedido|null;mensagem:string};
type Dependencias={cliente:ClienteAtivacaoRPC;armazenamento:Pick<Storage,'getItem'|'setItem'>;criarId?:()=>string};
const inicial=(contexto:Contexto|null=null):Estado=>({etapa:contexto?'selecionada':'sem_contexto',contexto,criacao:null,conferencia:null,recibo:null,conferida:false,pedidoPreservado:false,revisoesPedido:null,mensagem:''});
const falhar=(texto:string):never=>{throw new FalhaAtivacao(texto,'regra');};

// Composição local desconectada: não lê Auth, não cria cliente SDK nem consulta ao montar.
// Selecionar/encerrar deve vir de eventos de sessão validados pelo adaptador futuro.
export function prepararFluxoAtivacaoLocal({cliente,armazenamento,criarId}:Dependencias){
 const servico=prepararServicosAtivacao(cliente),criacao=prepararServicoContextoCriacao(cliente);
 const sessao=prepararSessaoRecuperacao({armazenamento,consultar:servico.consultarPedido,ativar:servico.ativar});
 let vista=inicial(),geracao=0,leitura=0;
 let recuperacao:ReturnType<typeof sessao.selecionar>|null=null;
 let emCurso:{geracao:number;promessa:Promise<'atual'|'descartada'>}|null=null;
 function encerrar(){geracao++;leitura++;sessao.encerrar();recuperacao=null;vista=inicial();}
 function capturar(){if(!vista.contexto||!recuperacao)return falhar('Selecione uma ficha na sessão atual.');return {contexto:{...vista.contexto},r:recuperacao,g:geracao};}
 function erroAtual(){vista={...vista,etapa:'incerta',conferida:false,conferencia:null,recibo:null,mensagem:'Operação não confirmada. Consulte a ficha antes de continuar; pedidos preservados não são descartados.'};}
 function enviar(fn:()=>Promise<ReciboAtivacao>,g:number,r:NonNullable<typeof recuperacao>):Promise<'atual'|'descartada'>{
  vista={...vista,etapa:'enviando',conferida:false,mensagem:''};
  const promessa=Promise.resolve().then(fn).then(recibo=>{
   if(g!==geracao)return 'descartada' as const;
   vista={...vista,etapa:'confirmada',recibo:{...recibo},conferencia:null,pedidoPreservado:true,mensagem:'Ativação confirmada sem restaurar recursos.'};return 'atual' as const;
  }).catch(()=>{
   if(g!==geracao)return 'descartada' as const;
   erroAtual();try{vista.pedidoPreservado=r.pendente()!==null;}catch{/* Não remover referência ilegível. */}return 'atual' as const;
  }).finally(()=>{if(emCurso?.promessa===promessa)emCurso=null;});
  emCurso={geracao:g,promessa};return promessa;
 }
 return {
  encerrar,
  selecionar(contexto:Contexto){encerrar();const copia={...contexto};recuperacao=sessao.selecionar(copia);vista=inicial(copia);},
  estado:()=>structuredClone(vista),
  async conferir():Promise<'atual'|'descartada'>{
   const {contexto:c,r,g}=capturar();if(emCurso?.geracao===g)return falhar('Aguarde o envio antes de consultar novamente.');
   const l=++leitura;const atual=()=>g===geracao&&l===leitura;
   vista={...inicial(c),etapa:'conferindo'};
   try{
    const p=r.pendente();vista.pedidoPreservado=p!==null;
    const resultado=await servico.consultarResultado(c.personagemId,p??undefined);if(!atual())return 'descartada';
    if(resultado.situacao==='confirmada'){vista={...vista,etapa:'confirmada',recibo:resultado.recibo,mensagem:'Resultado recuperado por consulta, sem envio.'};return 'atual';}
    if(resultado.estadoFicha==='completa'){vista={...vista,etapa:'impedida',mensagem:'Ficha completa sem recibo recuperável. Não iniciar outra ativação.'};return 'atual';}
    const cfg=await criacao.consultar(c.mesaId);if(!atual())return 'descartada';vista.criacao=cfg;
    if(!cfg.preparado||cfg.metodo!=='padrao'||cfg.nivelInicial!==1||!cfg.permiteFinalizar){vista={...vista,etapa:'impedida',mensagem:'Contexto ainda não preparado, pausado ou fora do escopo Padrão de nível 1.'};return 'atual';}
    const conferencia=await servico.conferir(c.personagemId);if(!atual())return 'descartada';vista.conferencia=conferencia;
    if(conferencia.revisaoMesa!==cfg.revisao||conferencia.pendencias.length||conferencia.ativas>=10){vista={...vista,etapa:'impedida',mensagem:'Confira os impedimentos ou atualize o contexto da criação.'};return 'atual';}
    if(p){
     vista.revisoesPedido={fichaPreservada:p.revisaoFicha,mesaPreservada:p.revisaoMesa,fichaAtual:conferencia.revisaoFicha,mesaAtual:cfg.revisao};
     if(p.revisaoFicha!==conferencia.revisaoFicha||p.revisaoMesa!==cfg.revisao){vista={...vista,etapa:'impedida',mensagem:'Pedido preservado com revisões diferentes. É necessária reconciliação antes de outro envio; a referência foi mantida.'};return 'atual';}
     vista={...vista,etapa:'pendente',mensagem:'Pedido preservado sem recibo neste momento. Somente repetição explícita do mesmo pedido.'};return 'atual';
    }
    vista={...vista,etapa:'pronta',mensagem:'Confira as escolhas e confirme explicitamente antes de ativar.'};return 'atual';
   }catch{if(!atual())return 'descartada';erroAtual();return 'atual';}
  },
  consentir(valor:boolean){if(vista.etapa!=='pronta'||typeof valor!=='boolean')return falhar('É necessária uma conferência válida.');vista.conferida=valor;},
  confirmar():Promise<'atual'|'descartada'>{
   const {r,g}=capturar();if(emCurso?.geracao===g)return emCurso.promessa;
   if(vista.etapa!=='pronta'||!vista.conferida||!vista.conferencia)return falhar('Confira e confirme as escolhas antes de ativar.');
   const controle=confirmarAtivacao(vista.conferencia,criarId);return enviar(()=>controle.executar(p=>r.confirmar(p)),g,r);
  },
  repetir():Promise<'atual'|'descartada'>{
   const {r,g}=capturar();if(emCurso?.geracao===g)return emCurso.promessa;
   if(vista.etapa!=='pendente')return falhar('Consulte primeiro o resultado do pedido preservado.');
   return enviar(()=>r.repetir(),g,r);
  },
 };
}
