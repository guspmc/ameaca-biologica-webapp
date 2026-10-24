import {useRef,useState} from 'react';
import {confirmarAtivacao,FalhaAtivacao,type ConferenciaAtivacao,type PedidoAtivacao,type ReciboAtivacao} from './pedidoAtivacao';
type Props={aoConferir:()=>Promise<ConferenciaAtivacao>;aoAtivar:(pedido:PedidoAtivacao)=>Promise<ReciboAtivacao>};
// Componente isolado: nenhum backend e chamado durante a renderizacao.
export default function RevisaoAtivacao({aoConferir,aoAtivar}:Props){
 const [conferencia,setConferencia]=useState<ConferenciaAtivacao|null>(null),[confirmado,setConfirmado]=useState(false);
 const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState(''),[incerto,setIncerto]=useState(false),[concluido,setConcluido]=useState(false);
 const trava=useRef(false),controle=useRef<ReturnType<typeof confirmarAtivacao>|null>(null);
 async function conferir(){
  if(trava.current||incerto||concluido)return;trava.current=true;setOcupado(true);setErro('');setConfirmado(false);setConferencia(null);controle.current=null;
  try{const c=await aoConferir();setConferencia({...c,pendencias:[...c.pendencias]});}
  catch(e){setErro(e instanceof Error?e.message:'Não foi possível conferir.');}
  finally{trava.current=false;setOcupado(false);}
 }
 async function ativar(){
  if(trava.current||!conferencia||!confirmado||concluido)return;
  trava.current=true;setOcupado(true);setErro('');
  try{controle.current??=confirmarAtivacao(conferencia);await controle.current.executar(aoAtivar);setConcluido(true);setIncerto(false);}
  catch(e){setErro(e instanceof Error?e.message:'Não foi possível obter a confirmação.');setIncerto(!(e instanceof FalhaAtivacao)||e.tipo==='incerto');}
  finally{trava.current=false;setOcupado(false);}
 }
 const apta=!!conferencia&&!conferencia.pendencias.length&&conferencia.ativas<10;
 return <section className="cartao cartao-padrao" aria-label="Revisão e ativação">
  <p className="rotulo">REVISÃO DA CRIAÇÃO</p><h2>Conferir e ativar</h2>
  <p>Confira as escolhas salvas antes de confirmar. A ativação preserva os recursos atuais e prepara os itens uma única vez.</p>
  {!concluido&&<button type="button" className="botao-claro" disabled={ocupado||incerto} onClick={()=>{void conferir();}}>Conferir criação</button>}
  {conferencia&&<div className="qa-conferencia"><h3>{conferencia.nome}</h3><p>Na conferência: {conferencia.ativas}/10 vagas ocupadas.</p>
   {conferencia.pendencias.length>0&&<ul aria-label="Pendências de ativação">{conferencia.pendencias.map((p,i)=><li key={i}>{p}</li>)}</ul>}
   {conferencia.ativas>=10&&<p role="status">A Mesa está com as dez vagas ativas ocupadas.</p>}
   {apta&&!concluido&&<><label className="qa-confirmacao"><input type="checkbox" checked={confirmado} disabled={ocupado||incerto} onChange={e=>setConfirmado(e.target.checked)}/>Conferi as escolhas e quero ativar esta personagem.</label>
   <button type="button" className="acao" disabled={!confirmado||ocupado} onClick={()=>{void ativar();}}>{ocupado?'Aguardando confirmação…':incerto?'Tentar novamente':'Ativar personagem'}</button></>}
  </div>}
  {erro&&<p className="erro" role="alert">{erro}{incerto?' A resposta pode não ter chegado. Tentar novamente usa o mesmo pedido, sem repetir a criação.':' Confira novamente antes de tentar.'}</p>}
  {concluido&&<p className="sucesso" role="status">Ativação confirmada. Nenhum recurso foi restaurado.</p>}
 </section>;
}

