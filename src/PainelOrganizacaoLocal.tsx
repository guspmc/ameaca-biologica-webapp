import {useEffect,useState} from 'react';
import {detalheExemplar} from './inventarioConsulta';
import type {prepararOrganizacaoLocal} from './organizacaoInventario';
type Controle=ReturnType<typeof prepararOrganizacaoLocal>;
type Estado=ReturnType<Controle['estado']>;
export default function PainelOrganizacaoLocal({estado,aoPreparar,aoCancelar,aoConfirmar,aoConsultar,aoRepetir}:{estado:Estado;aoPreparar:(id:string,destino:number)=>void;aoCancelar:()=>void;aoConfirmar:(sim:boolean)=>void;aoConsultar:()=>void;aoRepetir:()=>void}){
 const [item,setItem]=useState(''),[destino,setDestino]=useState(''),[sim,setSim]=useState(false),[erro,setErro]=useState('');
 const v=estado.valor,p=estado.previa;
 useEffect(()=>{setItem('');setDestino('');setSim(false);setErro('');},[estado.selecao?.usuarioId,estado.selecao?.mesaId,estado.selecao?.personagemId,v?.revisao]);
 useEffect(()=>setSim(false),[p]);
 const bloqueado=estado.ocupado||!v||!!estado.pendente;
 const nome=(id:string)=>v?.itens.find(i=>i.instanciaId===id)?.nome??'Exemplar';
 return <section className="cartao cartao-padrao qa-organizacao" aria-label="Organização do inventário" aria-busy={estado.ocupado}>
  <p className="rotulo">ORGANIZAÇÃO FICTÍCIA · ESPAÇOS</p><h2>{estado.selecao?.nome??'Selecione uma ficha'}</h2>
  <p>Mover muda somente a posição. Não usa, equipa, recarrega, repara ou transfere itens.</p>
  <button className="botao-claro" disabled={!estado.selecao||estado.ocupado} onClick={aoConsultar}>Consultar organização</button>
  <p role="status">{estado.mensagem}</p>{estado.pendente&&<p className="qa-exemplar">Pedido preservado: {estado.pendente}</p>}
  {v&&<><p><strong>{v.itens.reduce((n,i)=>n+i.espacos,0)}/{v.capacidade} Espaços</strong> · revisão {v.revisao} · {v.itens.length} exemplares</p>
   <label>Exemplar para mover<select value={item} disabled={bloqueado} onChange={e=>{aoCancelar();setItem(e.target.value);setSim(false);setErro('');}}><option value="">Escolha um exemplar</option>{v.itens.filter(i=>i.local==='inventario').sort((a,b)=>(a.posicao??0)-(b.posicao??0)).map(i=><option key={i.instanciaId} value={i.instanciaId}>{i.nome} · espaço {(i.posicao??0)+1} · {i.instanciaId.slice(-3)}</option>)}</select></label>
   <label>Espaço de destino<input type="number" inputMode="numeric" min="1" max={v.capacidade} step="1" value={destino} disabled={bloqueado} onChange={e=>{aoCancelar();setDestino(e.target.value);setSim(false);setErro('');}}/></label>
   <button className="botao-claro" disabled={bloqueado||!item||!destino} onClick={()=>{setErro('');setSim(false);try{aoPreparar(item,Number(destino)-1);}catch(e){setErro(e instanceof Error?e.message:'Não foi possível preparar.');}}}>Preparar mudança</button>
   {erro&&<p className="erro" role="alert">{erro}</p>}
   {p&&<div className="qa-resumo-personagem"><h3>Prévia — ainda não aplicada</h3><p>{nome(p.instanciaId)}: espaço {p.origem+1} → {p.destino+1}.</p><p>{p.trocadoId?`Troca com ${nome(p.trocadoId)}, que irá para o espaço ${p.origem+1}.`:'O espaço de destino está livre.'}</p><p>Quantidade, munição e durabilidade permanecem iguais.</p>
    <label className="qa-confirmacao"><input type="checkbox" checked={sim} disabled={estado.ocupado} onChange={e=>setSim(e.target.checked)}/>Conferi a troca de espaços e quero confirmar.</label>
    <div className="qa-controles"><button className="acao" disabled={!sim||estado.ocupado} onClick={()=>{aoConfirmar(sim);setSim(false);}}>Confirmar organização fictícia</button><button className="botao-claro" disabled={estado.ocupado} onClick={()=>{aoCancelar();setSim(false);}}>Cancelar prévia</button></div>
   </div>}
   <h3>Espaços registrados</h3><p>Consulte novamente para conferir o estado confirmado. Característicos permanecem fora da organização.</p><ul className="qa-lista-espacos">{[...v.itens].sort((a,b)=>(a.posicao??Number.MAX_SAFE_INTEGER)-(b.posicao??Number.MAX_SAFE_INTEGER)).map(i=><li key={i.instanciaId}><strong>{i.local==='caracteristico'?'Característico':`Espaço ${(i.posicao??0)+1}`} · {i.nome}</strong><p>{detalheExemplar(i)} · quantidade {i.quantidade}</p><p className="qa-exemplar">{i.instanciaId}</p></li>)}</ul>
  </>}
  <button className="botao-claro" disabled={!estado.podeRepetir||estado.ocupado} onClick={aoRepetir}>Repetir pedido preservado</button>
 </section>;
}
