import PreviaCompras from './PreviaCompras';
import {useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {capacidadeInventario,caracteristicos,equipamentoInicial,espacosOcupados,opcoesEquipamento} from './equipamento';
type Props={supabase:SupabaseClient;ficha:{id:string;classe:string|null;forca:number;origem:string|null;nivel:number;estado_ficha:string;equipamento_inicial:string|null};dona:boolean;recarregar:()=>Promise<void>};
export default function EquipamentoRascunho({supabase,ficha,dona,recarregar}:Props){
  const [escolha,setEscolha]=useState(ficha.equipamento_inicial??'');
  const [salvando,setSalvando]=useState(false);
  const [erro,setErro]=useState('');
  const [aviso,setAviso]=useState('');
  useEffect(()=>{setEscolha(ficha.equipamento_inicial??'');setErro('');setAviso('');},[ficha.id]);
  const capacidade=capacidadeInventario(ficha.forca,ficha.origem);
  const itens=equipamentoInicial(ficha.classe,ficha.equipamento_inicial);
  const ocupados=espacosOcupados(itens);
  const previa=equipamentoInicial(ficha.classe,escolha);
  const cabe=espacosOcupados(previa)<=capacidade;
  const salvo=opcoesEquipamento(ficha.classe).find(o=>o.id===ficha.equipamento_inicial);
  const pode=dona&&ficha.estado_ficha==='rascunho'&&ficha.nivel===1;
  async function salvar(){
    if(!pode||salvando||!cabe)return;
    setSalvando(true);setErro('');setAviso('');
    try{
      const {error}=await supabase.rpc('definir_equipamento_rascunho',{p_personagem:ficha.id,p_opcao:escolha||null});
      if(error){setErro('Não foi possível salvar: '+error.message);return;}
      await recarregar();setAviso('Equipamento inicial salvo. A ficha continua em rascunho.');
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao salvar equipamento.');}
    finally{setSalvando(false);}
  }
  return <>
    <details open><summary>Equipamento inicial · {salvo?'Opção '+salvo.id:'pendente'}</summary>
      {salvo&&<p><strong>{salvo.nome}</strong> <small>({salvo.referencia})</small></p>}
      {pode&&<div className="formulario-origem">
        <label>Escolher equipamento inicial
          <select value={escolha} disabled={salvando} onChange={e=>{setEscolha(e.target.value);setAviso('');setErro('');}}>
            <option value="">Sem opção escolhida</option>
            {opcoesEquipamento(ficha.classe).map(o=><option key={o.id} value={o.id} disabled={espacosOcupados(equipamentoInicial(ficha.classe,o.id))>capacidade}>{o.id} · {o.nome}{espacosOcupados(equipamentoInicial(ficha.classe,o.id))>capacidade?' · não cabe':''}</option>)}
          </select>
        </label>
        {escolha&&<p>Prévia: {previa.map(i=>i.nome+(i.id==='moedas'?' ('+i.detalhe+')':'')).join(' · ')}. <strong>{espacosOcupados(previa)}/{capacidade} Espaços.</strong></p>}
        <p className="ficha-dica">Todas as opções incluem 1 Erva Verde, 1 Lanterna Simples e os Itens Característicos. Armas de fogo começam carregadas. Colete e Peças ficam guardados até equipar ou instalar; não alteram a Defesa nem o pente nesta etapa.</p>
        <p className="ficha-dica">Você pode refazer a escolha enquanto rascunho: ela substitui o conjunto inicial, sem acumular itens ou moedas. Personalizado mantém as 3 Moedas; a compra antes da primeira cena será integrada depois.</p>
        {erro&&<p className="erro" role="alert">{erro}</p>}
        {aviso&&<p className="sucesso" role="status">{aviso}</p>}
        {!cabe&&<p className="erro" role="alert">Essa opção não cabe. Escolha um conjunto menor.</p>}
        <button type="button" className="acao" disabled={salvando||!cabe} onClick={()=>{void salvar();}}>{salvando?'Salvando...':'Salvar Equipamento Inicial'}</button>
      </div>}
    </details>
    {salvo?.id==='C'&&pode&&<PreviaCompras capacidade={capacidade}/>}
    {salvo&&<>
      <div className="ficha-caracteristicos"><strong>ITENS CARACTERÍSTICOS · 0 ESPAÇOS</strong>
        {caracteristicos(ficha.classe).map(i=><details key={i.id}><summary>{i.nome}</summary><p>{i.detalhe}. Vinculado à Classe; não pode ser descartado voluntariamente.</p></details>)}
      </div>
      <div className="ficha-inventario-topo"><span>EQUIPAMENTO DA CRIAÇÃO</span><strong>{ocupados} / {capacidade} ESPAÇOS</strong></div>
      {ocupados>capacidade&&<p role="alert" className="erro">A capacidade atual é menor que o conjunto salvo. Os itens foram preservados; revise a opção de criação.</p>}
      <div className="ficha-inventario">
        {itens.map(i=><div className="ficha-slot ficha-slot-item" key={i.id}><strong>{i.nome}</strong><small>{i.detalhe}</small></div>)}
        {Array.from({length:Math.max(0,capacidade-ocupados)},(_,i)=><div className="ficha-slot" key={'vazio'+i} aria-label={'Espaço vazio '+(i+1)}/>)}
      </div>
      <p className="ficha-dica">Expansão equipada: nenhuma. Esta é a preparação da criação; usar, equipar, comprar, recarregar, descartar e transferir itens serão habilitados na ficha ativa. Itens guardados continuam ocupando seus Espaços.</p>
    </>}
  </>;
}
