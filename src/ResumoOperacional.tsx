import {useRef,useState} from 'react';
export type ResumoPersonagem={personagemId:string;nome:string;classe:string;nivel:number;pv:{atual:number;maximo:number};sa:{atual:number;maximo:number};bi:{atual:number;maximo:number};defesa:number;passivos:Record<string,number|null>;condicoes:string[]|null};
type Props={mesaNome:string;aoListar:()=>Promise<ResumoPersonagem[]>};
export function CartaoResumo({personagem:p}:{personagem:ResumoPersonagem}){
 return <article className="qa-resumo-personagem"><h3>{p.nome}</h3><p>{p.classe} · nível {p.nivel}</p>
 <dl className="qa-recursos"><div><dt>PV</dt><dd>{p.pv.atual}/{p.pv.maximo}</dd></div><div><dt>SA</dt><dd>{p.sa.atual}/{p.sa.maximo}</dd></div><div><dt>BI</dt><dd>{p.bi.atual}/{p.bi.maximo}</dd></div><div><dt>Defesa</dt><dd>{p.defesa}</dd></div></dl>
 <p>Condições: {p.condicoes===null?'não informadas':p.condicoes.length?p.condicoes.join(', '):'nenhuma registrada'}.</p>
 <details><summary>Perícias Passivas</summary><dl className="qa-passivos">{Object.entries(p.passivos).sort(([a],[b])=>a.localeCompare(b,'pt-BR')).map(([nome,valor])=><div key={nome}><dt>{nome}</dt><dd>{valor??'A conferir'}</dd></div>)}</dl>
 <p className="ficha-dica">Obs.: Testes Passivos recebem +5 com Vantagem ou -5 com Desvantagem.</p></details></article>;
}
export default function ResumoOperacional({mesaNome,aoListar}:Props){
 const [itens,setItens]=useState<ResumoPersonagem[]>([]),[carregado,setCarregado]=useState(false),[ocupado,setOcupado]=useState(false),[erro,setErro]=useState('');
 const trava=useRef(false);
 async function carregar(){
  if(trava.current)return;trava.current=true;setOcupado(true);setErro('');setItens([]);setCarregado(false);
  try{setItens(await aoListar());setCarregado(true);}catch(e){setErro(e instanceof Error?e.message:'Não foi possível consultar o resumo.');}
  finally{trava.current=false;setOcupado(false);}
 }
 return <section className="cartao cartao-padrao" aria-label="Resumo operacional do Mestre"><p className="rotulo">ACESSO DO MESTRE · {mesaNome}</p><h2>Personagens ativas</h2>
 <button type="button" className="botao-claro" disabled={ocupado} onClick={()=>{void carregar();}}>{ocupado?'Consultando…':'Atualizar resumo'}</button>
 {!carregado&&!erro&&<p role="status">Atualize para consultar o resumo da Mesa.</p>}
 {carregado&&!itens.length&&<p role="status">Nenhuma personagem ativa disponível.</p>}
 {itens.map(p=><CartaoResumo key={p.personagemId} personagem={p}/>)}
 {erro&&<p className="erro" role="alert">{erro}</p>}</section>;
}

