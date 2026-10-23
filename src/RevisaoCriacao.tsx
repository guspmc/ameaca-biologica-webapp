import {revisarCriacao,type FichaRevisao} from './conferenciaCriacao';
export default function RevisaoCriacao({ficha,irPara}:{ficha:FichaRevisao;irPara:(secao:string)=>void}){
  const linhas=revisarCriacao(ficha);
  return <details className="revisao-criacao"><summary>Revisão da criação · escolhas salvas</summary>
    <p>Confira os dados já salvos. Alterações ainda não salvas nos formulários não aparecem aqui. Esta conferência não finaliza nem altera a ficha.</p>
    <ul>{linhas.map(l=><li key={l.nome} data-estado={l.estado}>
      <div><strong>{l.nome}</strong><span className="revisao-estado">{l.estado==='conferido'?'Conferido':l.estado==='pendente'?'Pendente':'Revisar'}</span></div>
      <p>{l.detalhe}</p>{l.estado!=='conferido'&&<button type="button" className="botao-claro" onClick={()=>irPara(l.secao)}>Ver {l.secao==='itens'?'Inventário':l.secao==='pericias'?'Perícias':'Características'}</button>}
    </li>)}</ul>
    <p className="ficha-dica">Recursos atuais podem estar gastos; esta revisão confere os máximos sem restaurá-los. Efeitos condicionais continuam dependentes da situação de jogo.</p>
    <p className="dica">Finalização ainda indisponível. Faltam compras iniciais, inventário ativo, configurações do modo Misto e validações de ativação. Mesmo com as escolhas conferidas, a personagem continua em rascunho.</p>
  </details>;
}
