import {useState} from 'react';
import {CATALOGO_INICIAL,simularCompras} from './comprasIniciais';
export default function PreviaCompras({capacidade}:{capacidade:number}){
  const [plano,setPlano]=useState<Record<string,number>>({});
  const [busca,setBusca]=useState('');
  const resultado=simularCompras(plano,capacidade);
  const pesquisar=(texto:string)=>texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  return <details className="previa-compras"><summary>Planejar compras · prévia não salva</summary>
    <p>Simule o uso das 3 Moedas da opção Personalizado. Esta prévia não altera o kit salvo e é descartada ao fechar a ficha ou recarregar a página.</p>
    <p className="ficha-dica">Catálogo inicial parcial, com preços conferidos no livro. Disponibilidade depende do acesso da personagem na Mesa. Compra e gravação ainda não estão habilitadas.</p>
    <label className="busca-compras">Buscar neste catálogo<input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Ex.: colete ou munição"/></label>
    <p className="saldo-compras"><strong>Prévia: {resultado.saldo}/3 Moedas restantes · {resultado.espacos}/{capacidade} Espaços</strong><br/>Inclui Erva Verde, Lanterna Simples e moedas restantes; Característicos ocupam zero.</p>
    {CATALOGO_INICIAL.filter(i=>pesquisar(i.nome).includes(pesquisar(busca))).map(i=>{
      const n=plano[i.id]??0;
      const proxima=n>=3?null:simularCompras({...plano,[i.id]:n+1},capacidade);
      const motivo=!proxima?'Limite da prévia':!proxima.orcamentoValido?'Saldo insuficiente':!proxima.cabe?'Não cabe no Inventário':'';
      return <div className="compra-linha" key={i.id}>
        <strong>{i.nome}</strong><small>{i.preco} Moeda(s) por {i.unidades} unidade(s) · {i.referencia}{i.id==='municao-9mm'?' · até 30 por Espaço':''}</small>
        <div><button type="button" className="botao-claro" disabled={!n} aria-label={'Retirar '+i.nome+' da prévia'} onClick={()=>setPlano(p=>({...p,[i.id]:Math.max(0,n-1)}))}>−</button>
          <span>{n} compra(s){n?' · '+(n*i.unidades)+' unidade(s)':''}</span>
          <button type="button" className="botao-claro" disabled={!!motivo} aria-label={'Adicionar '+i.nome+' à prévia'} onClick={()=>setPlano(p=>({...p,[i.id]:n+1}))}>+</button></div>
        {motivo&&<small>{motivo}</small>}
      </div>;
    })}
    {CATALOGO_INICIAL.every(i=>!pesquisar(i.nome).includes(pesquisar(busca)))&&<p>Nenhum item encontrado neste catálogo.</p>}
    <p className="ficha-dica">Armaduras da prévia continuam guardadas. Comprar munição de reserva não instala Peças nem aumenta o pente de uma arma.</p>
    <button type="button" className="botao-claro" onClick={()=>setPlano({})}>Limpar prévia de compras</button>
  </details>;
}
