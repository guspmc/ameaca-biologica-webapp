import {useState} from 'react';
import {CATALOGO_INICIAL,simularCompras} from './comprasIniciais';
type Props={capacidade:number;planoSalvo?:Record<string,number>;revisaoSalva?:number;aoSalvar?:(plano:Record<string,number>,revisao:number)=>Promise<number>;aoAlterarPendencia?:(pendente:boolean)=>void};
export default function PreviaCompras({capacidade,planoSalvo={},revisaoSalva=0,aoSalvar,aoAlterarPendencia}:Props){
  const [plano,setPlano]=useState<Record<string,number>>({...planoSalvo});
  const [revisao,setRevisao]=useState(revisaoSalva);
  const [busca,setBusca]=useState('');
  const [salvando,setSalvando]=useState(false);
  const [erro,setErro]=useState('');
  const [aviso,setAviso]=useState('');
  const [alterada,setAlterada]=useState(false);
  const resultado=simularCompras(plano,capacidade);
  const pesquisar=(texto:string)=>texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function mudar(id:string,n:number){setPlano(p=>({...p,[id]:n}));setAlterada(true);aoAlterarPendencia?.(true);setErro('');setAviso('');}
  async function salvar(){
    if(!aoSalvar||salvando||!resultado.cabe||!resultado.orcamentoValido)return;
    setSalvando(true);setErro('');setAviso('');
    try{const novaRevisao=await aoSalvar({...plano},revisao);setRevisao(novaRevisao);setAlterada(false);aoAlterarPendencia?.(false);setAviso('Plano aplicado ao rascunho. A sincronização com o servidor ocorre automaticamente.');}
    catch(e){setErro(e instanceof Error?e.message:'Falha ao salvar compras.');}
    finally{setSalvando(false);}
  }
  return <details className="previa-compras"><summary>{aoSalvar?'Compras iniciais · plano e prévia':'Planejar compras · prévia não salva'}</summary>
    <p>{aoSalvar?'As escolhas ficam nesta prévia até você clicar em “Aplicar ao rascunho”. Depois disso, o WebApp sincroniza automaticamente com o servidor.':'Simule o uso das 3 Moedas da opção Personalizado. Esta prévia não altera o kit salvo e é descartada ao fechar a ficha ou recarregar a página.'}</p>
    <p className="ficha-dica">Catálogo inicial parcial, com preços conferidos no livro. A compra depende dos itens liberados na Mesa; disponibilidade é validada pelo servidor. Salvar o plano não equipa, consome nem finaliza a personagem.</p>
    <label className="busca-compras">Buscar neste catálogo<input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Ex.: colete ou munição"/></label>
    <p className="saldo-compras"><strong>Prévia: {resultado.saldo}/3 Moedas restantes · {resultado.espacos}/{capacidade} Espaços</strong><br/>Inclui Erva Verde, Lanterna Simples e moedas restantes; Característicos ocupam zero.</p>
    {CATALOGO_INICIAL.filter(i=>pesquisar(i.nome).includes(pesquisar(busca))).map(i=>{
      const n=plano[i.id]??0;
      const proxima=n>=3?null:simularCompras({...plano,[i.id]:n+1},capacidade);
      const motivo=!proxima?'Limite da prévia':!proxima.orcamentoValido?'Saldo insuficiente':!proxima.cabe?'Não cabe no Inventário':'';
      return <div className="compra-linha" key={i.id}>
        <strong>{i.nome}</strong><small>{i.preco} Moeda(s) por {i.unidades} unidade(s) · {i.referencia}{i.id==='municao-9mm'?' · até 30 por Espaço':''}</small>
        <div><button type="button" className="botao-claro" disabled={salvando||!n} aria-label={'Retirar '+i.nome+' da prévia'} onClick={()=>mudar(i.id,Math.max(0,n-1))}>−</button>
          <span>{n} compra(s){n?' · '+(n*i.unidades)+' unidade(s)':''}</span>
          <button type="button" className="botao-claro" disabled={salvando||!!motivo} aria-label={'Adicionar '+i.nome+' à prévia'} onClick={()=>mudar(i.id,n+1)}>+</button></div>
        {motivo&&<small>{motivo}</small>}
      </div>;
    })}
    {CATALOGO_INICIAL.every(i=>!pesquisar(i.nome).includes(pesquisar(busca)))&&<p>Nenhum item encontrado neste catálogo.</p>}
    <p className="ficha-dica">Armaduras da prévia continuam guardadas. Comprar munição de reserva não instala Peças nem aumenta o pente de uma arma.</p>
    {erro&&<p className="erro" role="alert">{erro} A prévia foi preservada. Se a versão estiver desatualizada, anote suas escolhas e recarregue para conferir o plano salvo.</p>}
    {alterada&&aoSalvar&&<p className="ficha-dica" role="status">Prévia alterada, ainda não aplicada ao rascunho. Clique em “Aplicar ao rascunho” para incluir as escolhas e iniciar a sincronização.</p>}
    {aviso&&<p className="sucesso" role="status">{aviso}</p>}
    <button type="button" className="botao-claro" disabled={salvando} onClick={()=>{setPlano({});setAlterada(true);aoAlterarPendencia?.(true);setAviso(aoSalvar?'Prévia zerada. Aplique ao rascunho para sincronizar a alteração.':'');setErro('');}}>Limpar prévia de compras</button>
    {aoSalvar&&<><p className="ficha-dica">Revisão local do plano: {revisao}. A prévia ainda não aplicada não integra o rascunho. Nenhum item é liberado automaticamente.</p><button type="button" className="acao" disabled={salvando||!resultado.cabe||!resultado.orcamentoValido} onClick={()=>{void salvar();}}>{salvando?'Aplicando...':'Aplicar ao rascunho'}</button></>}
  </details>;
}
