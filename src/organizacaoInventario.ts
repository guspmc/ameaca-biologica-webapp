import {lerInventarioConsulta,type InventarioConsulta} from './inventarioConsulta';
export function planejarOrganizacao(entrada:InventarioConsulta,instanciaId:string,destino:number){
 const antes=lerInventarioConsulta(entrada,entrada.personagemId);
 const item=antes.itens.find(i=>i.instanciaId===instanciaId);
 if(!item||item.local!=='inventario'||item.posicao===null)throw Error('Escolha um exemplar do inventário; Característicos não são movidos.');
 if(!Number.isSafeInteger(destino)||destino<0||destino>=antes.capacidade)throw Error('Escolha um espaço dentro da capacidade atual.');
 if(antes.itens.some(i=>i.local==='inventario'&&(i.posicao===null||i.posicao>=antes.capacidade)))throw Error('Há espaços fora da capacidade atual. Confira o inventário antes de organizar.');
 if(item.posicao===destino)throw Error('O exemplar já está nesse espaço.');
 if(!Number.isSafeInteger(antes.revisao+1))throw Error('Revisão inválida.');
 const depois=structuredClone(antes),movido=depois.itens.find(i=>i.instanciaId===instanciaId)!;
 const trocado=depois.itens.find(i=>i.local==='inventario'&&i.posicao===destino);
 const origem=item.posicao;movido.posicao=destino;if(trocado)trocado.posicao=origem;depois.revisao++;
 return {antes,depois,instanciaId,origem,destino,trocadoId:trocado?.instanciaId??null};
}
export type PreviaOrganizacao=ReturnType<typeof planejarOrganizacao>;
export type ContextoOrganizacao={usuarioId:string;mesaId:string;personagemId:string;nome:string};
export type PedidoOrganizacao={id:string;usuarioId:string;mesaId:string;personagemId:string;revisao:number;instanciaId:string;destino:number};
export type ReciboOrganizacao={pedido:PedidoOrganizacao;resultado:InventarioConsulta};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const objeto=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function lerPedidoOrganizacao(v:unknown):PedidoOrganizacao{
 const ks=['id','usuarioId','mesaId','personagemId','revisao','instanciaId','destino'];
 if(!objeto(v)||Object.keys(v).length!==ks.length||!ks.every(k=>Object.hasOwn(v,k))||![v.id,v.usuarioId,v.mesaId,v.personagemId,v.instanciaId].every(uuid)||!Number.isSafeInteger(v.revisao)||Number(v.revisao)<0||!Number.isSafeInteger(v.destino)||Number(v.destino)<0)throw Error('Pedido de organização inválido.');
 return structuredClone(v) as PedidoOrganizacao;
}
const igual=(a:unknown,b:unknown):boolean=>{
 if(a===b)return true;if(!objeto(a)||!objeto(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>igual(v,b[i]));
 const ks=Object.keys(a);return ks.length===Object.keys(b).length&&ks.every(k=>Object.hasOwn(b,k)&&igual(a[k],b[k]));
};
export function lerReciboOrganizacao(v:unknown,p:PedidoOrganizacao,previa:PreviaOrganizacao):ReciboOrganizacao{
 if(!objeto(v)||Object.keys(v).length!==2||!Object.hasOwn(v,'pedido')||!Object.hasOwn(v,'resultado'))throw Error('Confirmação não verificada.');
 const pedido=lerPedidoOrganizacao(v.pedido),resultado=lerInventarioConsulta(v.resultado,p.personagemId);
 if(!igual(pedido,p)||!igual(resultado,previa.depois))throw Error('Confirmação não verificada.');
 return {pedido,resultado};
}
// Preparação local: integração real deve autorizar no servidor. Não há SDK ou persistência aqui.
export function prepararOrganizacaoLocal(porta:{consultar:(c:ContextoOrganizacao,pedidoId:string|null)=>Promise<{inventario:unknown;recibo:unknown|null}>;enviar:(p:PedidoOrganizacao)=>Promise<unknown>},gerarId:()=>string){
 let selecao:ContextoOrganizacao|null=null,valor:InventarioConsulta|null=null,previa:PreviaOrganizacao|null=null,mensagem='Selecione uma ficha fictícia.',ocupado=false,podeRepetir=false,geracao=0;
 type Pendente={pedido:PedidoOrganizacao;previa:PreviaOrganizacao};const pendentes=new Map<string,Pendente>();
 const chave=(c:ContextoOrganizacao)=>JSON.stringify([c.usuarioId,c.mesaId,c.personagemId]);
 const atual=()=>selecao?pendentes.get(chave(selecao))??null:null;
 function encerrar(){geracao++;selecao=null;valor=null;previa=null;ocupado=false;podeRepetir=false;mensagem='Seleção encerrada. Nenhuma resposta antiga será exibida.';}
 function selecionar(c:ContextoOrganizacao){encerrar();if(!c||![c.usuarioId,c.mesaId,c.personagemId].every(uuid)||typeof c.nome!=='string'||!c.nome.trim())throw Error('Seleção inválida.');selecao={...c};mensagem='Consulte antes de preparar uma organização.';}
 function preparar(instanciaId:string,destino:number){if(ocupado||!valor||!selecao||atual())throw Error('Consulte ou resolva o pedido pendente antes de preparar.');previa=null;previa=planejarOrganizacao(valor,instanciaId,destino);mensagem='Confira a prévia. Nenhum item foi movido.';}
 function cancelar(){if(ocupado||atual())return;previa=null;mensagem='Prévia cancelada. Nenhum item foi movido.';}
 async function consultar(){
  if(!selecao||ocupado)return;const c={...selecao},g=geracao,k=chave(c),pendente=pendentes.get(k);ocupado=true;valor=null;previa=null;podeRepetir=false;mensagem='Consultando…';
  try{const r=await porta.consultar(c,pendente?.pedido.id??null),v=lerInventarioConsulta(r.inventario,c.personagemId);
   if(g!==geracao)return;
   if(pendente&&r.recibo!==null){const recibo=lerReciboOrganizacao(r.recibo,pendente.pedido,pendente.previa);if(v.revisao<recibo.resultado.revisao)throw Error();pendentes.delete(k);mensagem='Organização recuperada por consulta, sem novo envio.';}
   else if(pendente){podeRepetir=igual(v,pendente.previa.antes);mensagem=podeRepetir?'Pedido sem confirmação. Pode repetir explicitamente o mesmo pedido.':'Pedido preservado com dados diferentes. Reconciliação necessária antes de continuar.';}
   else {if(r.recibo!==null)throw Error();mensagem='Inventário consultado. Prepare uma alteração.';}
   valor=v;
  }catch{if(g===geracao){valor=null;podeRepetir=false;mensagem='Consulta não verificada. Nenhuma nova alteração foi enviada.';}}
  finally{if(g===geracao)ocupado=false;}
 }
 async function executar(p:Pendente){
  if(!selecao||ocupado)return;const g=geracao,k=chave(selecao);ocupado=true;podeRepetir=false;previa=null;mensagem='Enviando organização fictícia…';
  try{const r=lerReciboOrganizacao(await porta.enviar(structuredClone(p.pedido)),p.pedido,p.previa);if(g!==geracao)return;valor=r.resultado;pendentes.delete(k);mensagem='Organização confirmada. Quantidades e estados preservados.';}
  catch{if(g===geracao){valor=null;mensagem='Resposta não confirmada. Consulte antes de tentar novamente; o pedido foi preservado.';}}
  finally{if(g===geracao)ocupado=false;}
 }
 async function confirmar(confirmacao:boolean){
  if(ocupado||!selecao||!valor||!previa||atual()||confirmacao!==true)return;
  const pedido=lerPedidoOrganizacao({id:gerarId(),usuarioId:selecao.usuarioId,mesaId:selecao.mesaId,personagemId:selecao.personagemId,revisao:valor.revisao,instanciaId:previa.instanciaId,destino:previa.destino});
  const p={pedido,previa:structuredClone(previa)};pendentes.set(chave(selecao),p);await executar(p);
 }
 async function repetir(){const p=atual();if(p&&podeRepetir)await executar(p);}
 return {selecionar,encerrar,preparar,cancelar,consultar,confirmar,repetir,estado:()=>structuredClone({selecao,valor,previa,mensagem,ocupado,podeRepetir,pendente:atual()?.pedido.id??null})};
}
