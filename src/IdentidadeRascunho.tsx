import {useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
const CAMPOS=[
  {id:'idade',nome:'Idade',limite:40},
  {id:'genero',nome:'Gênero da personagem',limite:40},
  {id:'ocupacao',nome:'Ocupação',limite:120},
  {id:'apelido',nome:'Apelido',limite:120},
  {id:'afiliacao',nome:'Afiliação',limite:120},
  {id:'aparencia',nome:'Aparência',limite:1000},
  {id:'personalidade',nome:'Personalidade',limite:1000},
  {id:'objetivo',nome:'Objetivo',limite:1000},
  {id:'medo',nome:'Medo',limite:1000},
  {id:'lacos',nome:'Laços',limite:1000},
  {id:'historia',nome:'História',limite:4000}
];
type Props={supabase:SupabaseClient;ficha:{id:string;nome:string;estado_ficha:string;identidade:Record<string,string>};dona:boolean;recarregar:()=>Promise<void>;somenteLeituraOffline?:boolean};
export default function IdentidadeRascunho({supabase,ficha,dona,recarregar,somenteLeituraOffline=false}:Props){
  const [nome,setNome]=useState(ficha.nome);
  const [dados,setDados]=useState({...ficha.identidade});
  const [salvando,setSalvando]=useState(false);
  const [erro,setErro]=useState('');
  const [aviso,setAviso]=useState('');
  const pode=dona&&ficha.estado_ficha==='rascunho'&&!somenteLeituraOffline;
  async function salvar(){
    if(!pode||salvando)return;
    setSalvando(true);setErro('');setAviso('');
    try{
      const {error}=await supabase.rpc('definir_identidade_rascunho',{p_personagem:ficha.id,p_nome:nome,p_identidade:dados});
      if(error){setErro('Não foi possível salvar: '+error.message);return;}
      await recarregar();setAviso('Identidade salva. A ficha continua em rascunho.');
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao salvar identidade.');}
    finally{setSalvando(false);}
  }
  return <details><summary>Identidade, aparência e história</summary>
    <p className="ficha-dica">Dados da personagem fictícia. Os campos narrativos são opcionais e não alteram Atributos ou recursos. Gênero se refere à personagem.</p>
    {pode?<form className="formulario formulario-identidade" onSubmit={e=>{e.preventDefault();void salvar();}}>
      <label>Nome da personagem na ficha<input value={nome} maxLength={60} minLength={2} required disabled={salvando} onChange={e=>{setNome(e.target.value);setAviso('');}}/></label>
      {CAMPOS.map(c=><label key={c.id}>{c.nome}
        {c.limite>120?<textarea rows={c.id==='historia'?6:3} maxLength={c.limite} value={dados[c.id]??''} disabled={salvando} onChange={e=>{setDados(d=>({...d,[c.id]:e.target.value}));setAviso('');}}/>:
          <input maxLength={c.limite} value={dados[c.id]??''} disabled={salvando} onChange={e=>{setDados(d=>({...d,[c.id]:e.target.value}));setAviso('');}}/>}
        <small>{(dados[c.id]??'').length}/{c.limite}</small>
      </label>)}
      {erro&&<p className="erro" role="alert">{erro}</p>}{aviso&&<p className="sucesso" role="status">{aviso}</p>}
      <button type="submit" className="acao" disabled={salvando||nome.trim().length<2}>{salvando?'Salvando...':'Salvar Identidade'}</button>
    </form>:<dl className="identidade-leitura">{CAMPOS.filter(c=>ficha.identidade?.[c.id]).map(c=><div key={c.id}><dt>{c.nome}</dt><dd>{ficha.identidade[c.id]}</dd></div>)}</dl>}
  </details>;
}
