import { CATALOGO_CONDICOES, condicoesComEfeitoUnico, listaCondicoesValida, vulneravelPorPV, type CondicaoId } from './condicoesFicha';

type Props = {
  dados: Record<string, unknown>;
  pvAtual: number;
  pvMaximo: number;
};

export default function CondicoesFichaLocal({ dados, pvAtual, pvMaximo }: Props) {
  const itens = listaCondicoesValida(dados.condicoes) ? dados.condicoes : [];
  const vulneravel = pvMaximo > 0 ? vulneravelPorPV(pvAtual, pvMaximo) : null;
  const tiposAtivos = condicoesComEfeitoUnico(itens);

  return <details className="ficha-local-editor condicoes-ficha">
    <summary>Condições e efeitos</summary>
    <p>Consulta das Condições recebidas. O registro e a administração dos efeitos são feitos pelo Mestre; a ficha do jogador apresenta as informações sem oferecer edição administrativa. A duração e a remoção seguem a regra específica de cada Condição no Arquivo do Jogador v1.0; não há expiração genérica por descanso.</p>
    <div className="ficha-local-grade">
      <div><small>VULNERÁVEL</small><strong>{vulneravel === null ? 'Não calculável' : vulneravel ? 'Sim' : 'Não'}</strong><p>Derivada dos PV Atuais iguais ou inferiores a 1/5 dos PV Máximos; não é cadastrada manualmente.</p></div>
    </div>
    {itens.length === 0 ? <p>Nenhuma Condição recebida do Mestre.</p> : <ul>
      {itens.map(item => {
        const regra = CATALOGO_CONDICOES[item.condicao as CondicaoId];
        return <li key={item.id}>
          <strong>{regra.nome}</strong> · Fonte: {item.fonte}
          <p>{regra.efeito}</p>
          <p>Duração/remoção: {item.duracao}</p>
          <small>Referência: Arquivo do Jogador v1.0, capítulos 4 e 5, conforme a origem da Condição. Contagem de rodadas e atualização de duração são controladas pelo Mestre no módulo de Combate.</small>
          {item.observacao && <p>Observação: {item.observacao}</p>}
        </li>;
      })}
    </ul>}
    {tiposAtivos.length > 0 && <p>Condições ativas distintas: {tiposAtivos.map(id => CATALOGO_CONDICOES[id].nome).join(' · ')}. Fontes múltiplas da mesma Condição mantêm duração própria, sem acumular o efeito.</p>}
  </details>;
}
