import type { MesaLocal, ParticipanteMesaLocal } from './servidorLocal';

type SolicitacaoPendente = { id: string; status: 'pendente'; createdAt: string; accountId: string };
type Props = {
  mesa: MesaLocal;
  convite?: string;
  solicitacoes?: SolicitacaoPendente[];
  participantes?: ParticipanteMesaLocal[];
  consultando: boolean;
  aoGerarConvite: (mesa: MesaLocal) => void;
  aoRevogarConvite: (mesa: MesaLocal) => void;
  aoCarregarSolicitacoes: (mesa: MesaLocal) => void;
  aoCopiarConvite: (codigo: string) => void;
  aoDecidirSolicitacao: (mesa: MesaLocal, solicitacaoId: string, decisao: 'aprovar' | 'recusar') => void;
  aoCarregarParticipantes: (mesa: MesaLocal) => void;
  aoRemoverParticipante: (mesa: MesaLocal, accountId: string) => void;
};

/** Painel administrativo restrito ao contexto da Mesa em que a conta é Mestre. */
export default function PainelMestreLocal({ mesa, convite, solicitacoes, participantes, consultando, aoGerarConvite, aoRevogarConvite, aoCarregarSolicitacoes, aoCopiarConvite, aoDecidirSolicitacao, aoCarregarParticipantes, aoRemoverParticipante }: Props) {
  if (mesa.role !== 'mestre') return null;
  return <section className="servidor-local-controle-mesa" aria-label={'Painel do Mestre — ' + mesa.name}>
    <h4>Painel do Mestre · {mesa.name}</h4>
    <p className="secundario">Administração desta Mesa. As decisões de ingresso são confirmadas pelo servidor.</p>
    <div className="servidor-local-botoes">
      <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoGerarConvite(mesa)}>{convite ? 'Renovar convite' : 'Gerar convite'}</button>
      <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoRevogarConvite(mesa)}>Revogar convite ativo</button>
      <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarSolicitacoes(mesa)}>Ver solicitações</button>
    </div>
    {convite && <div className="servidor-local-codigo"><label>Código de convite<input readOnly value={convite} /></label><button className="botao-claro" type="button" onClick={() => aoCopiarConvite(convite)}>Copiar código</button></div>}
    <div className="servidor-local-botoes">
      <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarParticipantes(mesa)}>Ver participantes</button>
    </div>
    {participantes && <section aria-label="Participantes autorizados">
      <h5>Participantes da Mesa</h5>
      {participantes.length ? <ul className="servidor-local-lista-mesas">{participantes.map((p, index) => <li key={p.accountId}>
        <div><strong>{p.role === "mestre" ? "Mestre" : "Jogador " + (index + 1)}</strong><small>{p.role === "mestre" ? "Administração da Mesa" : "Entrou em " + new Date(p.joinedAt).toLocaleDateString("pt-BR")}</small></div>
        {p.role === "jogador" && <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoRemoverParticipante(mesa, p.accountId)}>Remover</button>}
      </li>)}</ul> : <p className="servidor-local-vazio">Nenhum participante.</p>}
    </section>}
    {(solicitacoes ?? []).length > 0 ? <ul className="servidor-local-lista-mesas">{solicitacoes!.map((pedido, index) => <li key={pedido.id}>
      <div><strong>Solicitação {index + 1}</strong><small>Pedido de ingresso pendente</small></div>
      <div className="servidor-local-botoes"><button className="botao-claro" type="button" disabled={consultando} onClick={() => aoDecidirSolicitacao(mesa, pedido.id, 'aprovar')}>Aprovar</button><button className="botao-claro" type="button" disabled={consultando} onClick={() => aoDecidirSolicitacao(mesa, pedido.id, 'recusar')}>Recusar</button></div>
    </li>)}</ul> : solicitacoes ? <p className="servidor-local-vazio">Nenhuma solicitação pendente.</p> : <p className="servidor-local-vazio">Consulte as solicitações para carregar os pedidos desta Mesa.</p>}
  </section>;
}
