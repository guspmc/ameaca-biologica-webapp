export type ConferenciaAtivacao={personagemId:string;nome:string;revisaoFicha:number;revisaoMesa:number;ativas:number;pendencias:string[]};
export type PedidoAtivacao={personagemId:string;operacaoId:string;revisaoFicha:number;revisaoMesa:number};
export type ReciboAtivacao={personagemId:string;operacaoId:string;estado:'completa';quantidadeInstancias:number;revisaoCriacao:number};
export class FalhaAtivacao extends Error{
 constructor(mensagem:string,public readonly tipo:'revisao'|'regra'|'incerto'){super(mensagem);}
}
// Uma confirmacao conserva o mesmo identificador e snapshot em todas as tentativas.
export function confirmarAtivacao(conferencia:ConferenciaAtivacao,criarId=()=>crypto.randomUUID()){
 if(!conferencia.personagemId||conferencia.pendencias.length||!Number.isSafeInteger(conferencia.ativas)||conferencia.ativas<0||conferencia.ativas>=10
 ||![conferencia.revisaoFicha,conferencia.revisaoMesa].every(n=>Number.isSafeInteger(n)&&n>=0))throw new FalhaAtivacao('A criação precisa ser conferida antes de ativar.','regra');
 const base={personagemId:conferencia.personagemId,revisaoFicha:conferencia.revisaoFicha,revisaoMesa:conferencia.revisaoMesa};
 let pedido:PedidoAtivacao|undefined,emCurso:Promise<ReciboAtivacao>|undefined,recibo:ReciboAtivacao|undefined;
 return {
  executar(ativar:(pedido:PedidoAtivacao)=>Promise<ReciboAtivacao>):Promise<ReciboAtivacao>{
   if(recibo)return Promise.resolve({...recibo});
   if(emCurso)return emCurso;
   pedido??={...base,operacaoId:criarId()};
   const esperado={...pedido};
   emCurso=Promise.resolve().then(()=>ativar({...esperado})).then(r=>{
    if(!r||r.personagemId!==esperado.personagemId||r.operacaoId!==esperado.operacaoId||r.estado!=='completa'
    ||![r.quantidadeInstancias,r.revisaoCriacao].every(n=>Number.isSafeInteger(n)&&n>=0))throw new FalhaAtivacao('A confirmação não pôde ser verificada. Tente novamente.', 'incerto');
    recibo={personagemId:r.personagemId,operacaoId:r.operacaoId,estado:'completa',quantidadeInstancias:r.quantidadeInstancias,revisaoCriacao:r.revisaoCriacao};
    return {...recibo};
   }).finally(()=>{emCurso=undefined;});
   return emCurso;
  }
 };
}

