import FuncionamentoPrevio from './FuncionamentoPrevio';
import {revisarCriacao,type FichaRevisao} from './conferenciaCriacao';
export default function RevisaoCriacao({ficha,irPara}:{ficha:FichaRevisao;irPara:(secao:string)=>void}){
  const linhas=revisarCriacao(ficha);
  const pendentes=linhas.filter(l=>l.estado==='pendente');
  const revisar=linhas.filter(l=>l.estado==='revisar');
  const conferidos=linhas.length-pendentes.length-revisar.length;
  return <details className="revisao-criacao"><summary>Revisão da criação · escolhas salvas</summary>
    <p>Confira os dados já salvos. Alterações ainda não salvas nos formulários não aparecem aqui. Esta conferência não finaliza nem altera a ficha.</p>
    <p>As escolhas seguem a ordem das etapas da criação e refletem o estado salvo.</p>
    <p role="status"><strong>{conferidos}/{linhas.length} itens conferidos</strong> · {pendentes.length} pendente(s) · {revisar.length} para revisar.</p>
    {pendentes.length+revisar.length>0?<nav className="revisao-atalhos" aria-label="Pendências da criação">
      <p>Ir para uma escolha que precisa de atenção:</p>
      {[...revisar,...pendentes].map(l=><button type="button" className="botao-claro" key={l.nome} onClick={()=>irPara(l.secao)}>{l.nome} · {l.estado==='revisar'?'Revisar':'Pendente'}</button>)}
    </nav>:<p>As escolhas desta conferência estão consistentes. A personagem continua em rascunho.</p>}
    <ul>{linhas.map(l=><li key={l.nome} data-estado={l.estado}>
      <div><strong>{l.nome}</strong><span className="revisao-estado">{l.estado==='conferido'?'Conferido':l.estado==='pendente'?'Pendente':'Revisar'}</span></div>
      <p>{l.detalhe}</p>{l.estado!=='conferido'&&<button type="button" className="botao-claro" onClick={()=>irPara(l.secao)}>Ver {l.secao==='itens'?'Inventário':l.secao==='pericias'?'Perícias':'Características'}</button>}
    </li>)}</ul>
    <p className="ficha-dica">Recursos atuais podem estar gastos; esta revisão confere os máximos sem restaurá-los. Efeitos condicionais continuam dependentes da situação de jogo.</p>
    <FuncionamentoPrevio/>
    <p className="dica">Finalização ainda indisponível. Ainda faltam catálogo completo de compras, inventário ativo, persistência das configurações de funcionamento e validações de ativação. Mesmo com as escolhas conferidas, a personagem continua em rascunho.</p>
  </details>;
}
