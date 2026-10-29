import {useEffect,useState} from 'react';
import {detalheExemplar,filtrarExemplares} from './inventarioConsulta';
import type {prepararConsultaInventarioLocal} from './consultaInventarioLocal';
type Estado=ReturnType<ReturnType<typeof prepararConsultaInventarioLocal>['estado']>;
export default function PainelInventarioLocal({estado,aoConsultar}:{estado:Estado;aoConsultar:()=>void}){
 const [busca,setBusca]=useState(''),[local,setLocal]=useState<'todos'|'inventario'|'caracteristico'>('todos');
 useEffect(()=>{setBusca('');setLocal('todos');},[estado.contexto]);
 const v=estado.valor,ocupados=v?.itens.reduce((n,i)=>n+i.espacos,0)??0,itens=v?filtrarExemplares(v,busca,local):[];
 return <section className="cartao cartao-padrao qa-inventario" aria-label="Consulta do inventário por exemplar" aria-busy={estado.carregando}>
  <p className="rotulo">INVENTÁRIO POR EXEMPLAR · SOMENTE LEITURA</p><h2>{estado.selecao?.nome??'Selecione uma personagem'}</h2>
  <p>Consulta dos itens registrados. Abrir detalhes e filtrar não usa, equipa, recarrega ou transfere itens.</p>
  <button className="botao-claro" disabled={!estado.selecao||estado.carregando} onClick={aoConsultar}>{estado.carregando?'Consultando…':'Consultar inventário'}</button>
  {estado.erro&&<p className="erro" role="alert">{estado.erro}</p>}
  {!estado.erro&&!v&&<p role="status">{estado.carregando?'Consultando os exemplares…':'Nenhuma consulta enviada nesta seleção.'}</p>}
  {v&&<><p role="status"><strong>{ocupados}/{v.capacidade} Espaços</strong> · {v.itens.length} exemplar(es) · revisão {v.revisao}. Característicos ocupam zero.</p>
   {ocupados>v.capacidade&&<p className="erro" role="alert">Os itens registrados excedem a capacidade atual. Nada foi descartado ou reorganizado pela consulta.</p>}
   <label>Buscar por nome, detalhe ou exemplar<input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Ex.: municao ou faca"/></label>
   <label>Local dos itens<select value={local} onChange={e=>setLocal(e.target.value as typeof local)}><option value="todos">Todos</option><option value="inventario">Inventário</option><option value="caracteristico">Característicos</option></select></label>
   <button className="botao-claro" onClick={()=>{setBusca('');setLocal('todos');}}>Limpar busca e filtros</button>
   <p role="status">{itens.length} de {v.itens.length} exemplar(es) visível(is).</p>
   {!v.itens.length?<p>Inventário consultado sem itens registrados.</p>:!itens.length?<p>Nenhum item corresponde à busca e ao filtro. Os itens registrados continuam preservados.</p>:itens.map(i=><details key={i.instanciaId} className="qa-resumo-personagem"><summary>{i.nome} · {i.local==='caracteristico'?'Característico':`Espaço ${(i.posicao??0)+1}`}</summary>
    <p>{detalheExemplar(i)}</p><p>Quantidade neste exemplar: {i.quantidade} · {i.espacos} Espaço(s)</p><p className="qa-exemplar">Exemplar: {i.instanciaId}</p>
   </details>)}
  </>}
 </section>;
}
