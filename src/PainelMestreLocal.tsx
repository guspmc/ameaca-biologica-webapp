import { useState } from 'react';
import type { MesaLocal, ParticipanteMesaLocal } from './servidorLocal';
import QRCodeLocal from './QRCodeLocal';

type SolicitacaoPendente = { id: string; status: 'pendente'; createdAt: string; accountId: string };
type AbaPainelMestre = 'mesa' | 'encontros' | 'arquivos';
type Props = {
  mesa: MesaLocal;
  enderecosLan?: string[];
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
export default function PainelMestreLocal({ mesa, enderecosLan = [], convite, solicitacoes, participantes, consultando, aoGerarConvite, aoRevogarConvite, aoCarregarSolicitacoes, aoCopiarConvite, aoDecidirSolicitacao, aoCarregarParticipantes, aoRemoverParticipante }: Props) {
  const chaveAba = 'ameaca-biologica:painel-mestre:aba:v1:' + mesa.id;
  const [aba, setAba] = useState<AbaPainelMestre>(() => {
    try {
      const salva = typeof window !== 'undefined' ? window.sessionStorage.getItem(chaveAba) : null;
      return salva === 'encontros' || salva === 'arquivos' ? salva : 'mesa';
    } catch { return 'mesa'; }
  });
  function selecionarAba(proxima: AbaPainelMestre) {
    setAba(proxima);
    try { if (typeof window !== 'undefined') window.sessionStorage.setItem(chaveAba, proxima); } catch { /* A navegação funciona sem persistência local. */ }
  }
  if (mesa.role !== 'mestre') return null;

  const totalJogadores = participantes?.filter(p => p.role === 'jogador').length;
  const vagasDisponiveis = totalJogadores === undefined ? undefined : Math.max(0, 10 - totalJogadores);
  const totalSolicitacoes = solicitacoes?.length;

  return <section className="servidor-local-controle-mesa painel-mestre-shell" aria-label={'Painel do Mestre — ' + mesa.name}>
    <header className="painel-mestre-cabecalho">
      <div>
        <small>UMBRELLA // TERMINAL DE OPERAÇÕES</small>
        <h4>Painel do Mestre</h4>
        <p>{mesa.name} · Administração desta Mesa</p>
      </div>
      <span>ACESSO MESTRE</span>
    </header>

    <div className="painel-mestre-resumo" aria-label="Resumo administrativo da Mesa">
      <div><small>JOGADORES</small><strong>{totalJogadores === undefined ? '—' : totalJogadores + '/10'}</strong></div>
      <div><small>VAGAS DISPONÍVEIS</small><strong>{vagasDisponiveis === undefined ? '—' : vagasDisponiveis}</strong></div>
      <div><small>INGRESSOS PENDENTES</small><strong>{totalSolicitacoes === undefined ? '—' : totalSolicitacoes}</strong></div>
    </div>

    <nav className="painel-mestre-nav" aria-label="Seções do Painel do Mestre">
      <button type="button" id="painel-mestre-tab-mesa" className={aba === 'mesa' ? 'ativo' : ''} aria-current={aba === 'mesa' ? 'page' : undefined} aria-controls="painel-mestre-panel-mesa" onClick={() => selecionarAba('mesa')}>Mesa</button>
      <button type="button" id="painel-mestre-tab-encontros" className={aba === 'encontros' ? 'ativo' : ''} aria-current={aba === 'encontros' ? 'page' : undefined} aria-controls="painel-mestre-panel-encontros" onClick={() => selecionarAba('encontros')}>Encontros</button>
      <button type="button" id="painel-mestre-tab-arquivos" className={aba === 'arquivos' ? 'ativo' : ''} aria-current={aba === 'arquivos' ? 'page' : undefined} aria-controls="painel-mestre-panel-arquivos" onClick={() => selecionarAba('arquivos')}>Arquivos</button>
    </nav>

    {aba === 'mesa' && <div id="painel-mestre-panel-mesa" role="region" aria-labelledby="painel-mestre-tab-mesa" className="painel-mestre-conteudo">
      <p className="painel-mestre-orientacao">Convites, solicitações e participantes são administrados nesta Mesa. Aprovações e remoções são confirmadas pelo servidor.</p>
      <div className="servidor-local-botoes">
        <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoGerarConvite(mesa)}>{convite ? 'Renovar convite' : 'Gerar convite'}</button>
        <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoRevogarConvite(mesa)}>Revogar convite ativo</button>
        <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarSolicitacoes(mesa)}>Ver solicitações</button>
      </div>
      {convite && <>
        <div className="servidor-local-codigo"><label>Código de convite<input readOnly value={convite} /></label><button className="botao-claro" type="button" onClick={() => aoCopiarConvite(convite)}>Copiar código</button></div>
        {enderecosLan.length > 0
          ? <div className="servidor-local-qr-convites">{enderecosLan.map(ip => {
              const url = new URL(window.location.pathname, 'http://' + ip + ':4174');
              url.searchParams.set('servidor', 'local');
              url.searchParams.set('convite', convite);
              return <QRCodeLocal key={ip} value={url.toString()} label={'Convite · ' + ip} />;
            })}</div>
          : <p className="servidor-local-vazio">O QR Code do convite ficará disponível quando o servidor identificar um endereço IPv4 da rede local.</p>}
      </>}
      <div className="painel-mestre-subsecao">
        <div className="painel-mestre-subsecao-topo">
          <h5>Participantes</h5>
          <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarParticipantes(mesa)}>Atualizar lista</button>
        </div>
        {participantes && <section aria-label="Participantes autorizados">
          {participantes.length ? <ul className="servidor-local-lista-mesas">{participantes.map((p, index) => {
            const numeroJogador = p.role === 'jogador'
              ? participantes.slice(0, index).filter(anterior => anterior.role === 'jogador').length + 1
              : null;
            return <li key={p.accountId}>
              <div><strong>{p.role === 'mestre' ? 'Mestre' : 'Jogador ' + numeroJogador}</strong><small>{p.role === 'mestre' ? 'Administração da Mesa' : 'Entrou em ' + new Date(p.joinedAt).toLocaleDateString('pt-BR')}</small></div>
              {p.role === 'jogador' && <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoRemoverParticipante(mesa, p.accountId)}>Remover</button>}
            </li>;
          })}</ul> : <p className="servidor-local-vazio">Nenhum participante.</p>}
        </section>}
      </div>
      <div className="painel-mestre-subsecao">
        <div className="painel-mestre-subsecao-topo">
          <h5>Solicitações de ingresso</h5>
          <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarSolicitacoes(mesa)}>Atualizar solicitações</button>
        </div>
        {(solicitacoes ?? []).length > 0 ? <ul className="servidor-local-lista-mesas">{solicitacoes!.map((pedido, index) => <li key={pedido.id}>
          <div><strong>Solicitação {index + 1}</strong><small>Pedido de ingresso pendente</small></div>
          <div className="servidor-local-botoes"><button className="botao-claro" type="button" disabled={consultando} onClick={() => aoDecidirSolicitacao(mesa, pedido.id, 'aprovar')}>Aprovar</button><button className="botao-claro" type="button" disabled={consultando} onClick={() => aoDecidirSolicitacao(mesa, pedido.id, 'recusar')}>Recusar</button></div>
        </li>)}</ul> : solicitacoes ? <p className="servidor-local-vazio">Nenhuma solicitação pendente.</p> : <p className="servidor-local-vazio">Consulte as solicitações para carregar os pedidos desta Mesa.</p>}
      </div>
    </div>}

    {aba === 'encontros' && <section id="painel-mestre-panel-encontros" role="region" aria-labelledby="painel-mestre-tab-encontros" className="painel-mestre-placeholder">
      <small>MÓDULO EM PREPARAÇÃO</small>
      <h5>Encontros</h5>
      <p>Esta área seguirá o protótipo do Terminal do Mestre. A gestão de encontros ainda não está conectada ao servidor LAN.</p>
      <p>Nenhum encontro, iniciativa, criatura, rolagem, PV ou efeito é criado ou alterado nesta tela.</p>
    </section>}

    {aba === 'arquivos' && <section id="painel-mestre-panel-arquivos" role="region" aria-labelledby="painel-mestre-tab-arquivos" className="painel-mestre-placeholder">
      <small>MÓDULO EM PREPARAÇÃO</small>
      <h5>Arquivos</h5>
      <p>O espaço de Arquivos será organizado por Mesa e respeitará as permissões de Mestre e Jogador previstas no planejamento.</p>
      <p>Nenhum documento ou anotação é compartilhado por esta tela enquanto o módulo não estiver implementado.</p>
    </section>}
  </section>;
}
