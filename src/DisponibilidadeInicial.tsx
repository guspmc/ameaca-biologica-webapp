import {useState} from 'react';
import {CATALOGO_INICIAL} from './comprasIniciais';
type Props={mesaNome:string;aoListar:()=>Promise<string[]>;aoAlterar:(item:string,liberado:boolean,esperado:boolean)=>Promise<boolean>};
// Preparado para montagem com key=mesa.id somente depois do checkpoint do backend.
export default function DisponibilidadeInicial({mesaNome,aoListar,aoAlterar}:Props){
 const [itens,setItens]=useState<string[]>([]);
 const [carregado,setCarregado]=useState(false);
 const [ocupado,setOcupado]=useState(false);
 const [erro,setErro]=useState('');
 const [aviso,setAviso]=useState('');
 async function carregar(){
  if(ocupado)return;setOcupado(true);setErro('');setAviso('');
  try{setItens(await aoListar());setCarregado(true);}
  catch(e){setCarregado(false);setErro(e instanceof Error?e.message:'Falha ao consultar disponibilidade.');}
  finally{setOcupado(false);}
 }
 async function alterar(id:string){
  if(ocupado||!carregado)return;
  const atual=itens.includes(id);setOcupado(true);setErro('');setAviso('');
  try{
   const resultado=await aoAlterar(id,!atual,atual);
   if(resultado!==!atual)throw Error('Resposta inesperada. Atualize a lista para conferir.');
   setItens(p=>resultado?[...p.filter(i=>i!==id),id]:p.filter(i=>i!==id));
   setAviso('Disponibilidade atualizada nesta Mesa.');
  }catch(e){setCarregado(false);setErro(e instanceof Error?e.message:'Falha ao atualizar.');}
  finally{setOcupado(false);}
 }
 return <section className="cartao cartao-padrao" aria-label="Disponibilidade de compras iniciais">
  <p className="rotulo">ACESSO DO MESTRE · {mesaNome}</p><h3>Compras iniciais permitidas</h3>
  <p>Libere ou bloqueie cada item do catálogo inicial nesta Mesa. Isso não compra nem entrega equipamentos. Planos já salvos são preservados ao bloquear.</p>
  <button type="button" className="botao-claro" disabled={ocupado} onClick={()=>{void carregar();}}>{ocupado?'Aguarde...':'Atualizar disponibilidade'}</button>
  {!carregado&&<p role="status">Atualize a lista antes de alterar itens. Em caso de erro, confira novamente a disponibilidade.</p>}
  {carregado&&<ul className="lista-participantes">{CATALOGO_INICIAL.map(i=><li className="linha-participante" key={i.id}>
   <div className="pessoa"><strong>{i.nome}</strong><small>{itens.includes(i.id)?'Liberado':'Bloqueado'} · {i.preco} Moeda(s) por {i.unidades} unidade(s)</small></div>
   <button type="button" className="botao-claro" disabled={ocupado} onClick={()=>{void alterar(i.id);}} aria-label={(itens.includes(i.id)?'Bloquear ':'Liberar ')+i.nome}>{itens.includes(i.id)?'Bloquear':'Liberar'}</button>
  </li>)}</ul>}
  {erro&&<p role="alert" className="erro">{erro}</p>}
  {aviso&&<p role="status" className="sucesso">{aviso}</p>}
 </section>;
}
