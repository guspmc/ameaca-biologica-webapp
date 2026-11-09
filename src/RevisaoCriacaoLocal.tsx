import { revisarCriacao, type FichaRevisao } from './conferenciaCriacao';

type Props = {
  ficha: FichaRevisao;
  irPara: (secao: string) => void;
};

export default function RevisaoCriacaoLocal({ ficha, irPara }: Props) {
  const linhas = revisarCriacao(ficha);
  const pendentes = linhas.filter(linha => linha.estado === 'pendente');
  const revisar = linhas.filter(linha => linha.estado === 'revisar');
  const conferidos = linhas.length - pendentes.length - revisar.length;

  return <details className="revisao-criacao-local">
    <summary>Revisão da criação · estado salvo</summary>
    <p>Esta conferência lê somente os dados já salvos. Não altera a ficha, não restaura recursos e não ativa a personagem.</p>
    <p role="status"><strong>{conferidos}/{linhas.length} itens conferidos</strong> · {pendentes.length} pendente(s) · {revisar.length} para revisar.</p>
    {(pendentes.length + revisar.length) > 0 && <nav className="revisao-atalhos" aria-label="Atalhos para pendências">
      {[...revisar, ...pendentes].map(linha => <button type="button" className="botao-claro" key={linha.nome} onClick={() => irPara(linha.secao)}>
        {linha.nome} · {linha.estado === 'revisar' ? 'Revisar' : 'Pendente'}
      </button>)}
    </nav>}
    <ul>{linhas.map(linha => <li key={linha.nome} data-estado={linha.estado}>
      <div><strong>{linha.nome}</strong><span className="revisao-estado">{linha.estado === 'conferido' ? 'Conferido' : linha.estado === 'pendente' ? 'Pendente' : 'Revisar'}</span></div>
      <p>{linha.detalhe}</p>
      {linha.estado !== 'conferido' && <button type="button" className="botao-claro" onClick={() => irPara(linha.secao)}>
        Ver {linha.secao === 'itens' ? 'Inventário' : linha.secao === 'pericias' ? 'Atributos e Perícias' : 'Características'}
      </button>}
    </li>)}</ul>
    <p className="ficha-local-legenda">Os máximos são conferidos sem restaurar PV, SA ou BI atuais. Efeitos condicionais continuam dependentes da situação de jogo.</p>
  </details>;
}
