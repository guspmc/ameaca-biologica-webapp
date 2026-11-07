import {lerPedidoOrganizacao,planejarOrganizacao,type ContextoOrganizacao,type PendenteOrganizacao,type RepositorioOrganizacao} from './organizacaoInventario';
import {lerInventarioConsulta} from './inventarioConsulta';
export type ArmazenamentoOrganizacao={getItem:(k:string)=>string|null;setItem:(k:string,v:string)=>void;removeItem:(k:string)=>void};
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
export function chavePendenciaOrganizacao(c:ContextoOrganizacao){
 if(![c.usuarioId,c.mesaId,c.personagemId].every(uuid))throw Error('Contexto inválido.');
 return ['ab','organizacao','1',c.usuarioId,c.mesaId,c.personagemId].join(':');
}
// Porta explícita, sem window/SDK. Armazena somente pedido e snapshot técnico necessário à conferência.
export function prepararRepositorioOrganizacao(a:ArmazenamentoOrganizacao):RepositorioOrganizacao{
 function ler(c:ContextoOrganizacao):PendenteOrganizacao|null{
  const raw=a.getItem(chavePendenciaOrganizacao(c));if(raw===null)return null;
  if(typeof raw!=='string'||raw.length>100000)throw Error('Referência inválida.');
  const v=JSON.parse(raw);if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==3||!['versao','pedido','antes'].every(k=>Object.hasOwn(v,k))||v.versao!==1)throw Error('Referência inválida.');
  const pedido=lerPedidoOrganizacao(v.pedido),antes=lerInventarioConsulta(v.antes,c.personagemId);
  if(pedido.usuarioId!==c.usuarioId||pedido.mesaId!==c.mesaId||pedido.personagemId!==c.personagemId||pedido.revisao!==antes.revisao)throw Error('Referência de outro contexto.');
  return {pedido,previa:planejarOrganizacao(antes,pedido.instanciaId,pedido.destino)};
 }
 return {ler,guardar(c,p){
  const anterior=ler(c);if(anterior)throw Error('Já existe pedido preservado.');
  const raw=JSON.stringify({versao:1,pedido:p.pedido,antes:p.previa.antes}),k=chavePendenciaOrganizacao(c);
  a.setItem(k,raw);if(a.getItem(k)!==raw)throw Error('Gravação não confirmada.');ler(c);
 },remover(c,id){
  const p=ler(c);if(!p||p.pedido.id!==id)throw Error('Referência mudou.');
  const k=chavePendenciaOrganizacao(c);a.removeItem(k);if(a.getItem(k)!==null)throw Error('Limpeza não confirmada.');
 }};
}
