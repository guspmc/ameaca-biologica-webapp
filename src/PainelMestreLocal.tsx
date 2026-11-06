import { useState } from 'react';
import type { MesaLocal, ParticipanteMesaLocal } from './servidorLocal';
import QRCodeLocal from './QRCodeLocal';

type SolicitacaoPendente = { id: string; status: 'pendente'; createdAt: string; accountId: string };
type AbaPainelMestre = 'mesa' | 'encontros' | 'arquivos';
type SubAbaEncontros = 'ao-vivo' | 'preparados' | 'catalogo' | 'gerador' | 'perseguicao';
type SubAbaArquivos = 'documentos' | 'anotacoes' | 'diario' | 'narracao' | 'mesa';
function IconePainel({ tipo }: { tipo: 'umbrella' | 'mesa' | 'encontros' | 'arquivos' }) {
  const desenho = {
    umbrella: <><path d="M3 12a9 9 0 0 1 18 0H3Z"/><path d="M12 12v7a2 2 0 0 0 4 0"/></>,
    mesa: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/></>,
    encontros: <><path d="m5 4 6 6m2 4 6 6M19 4 5 18M8 4l12 12"/></>,
    arquivos: <><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 12h8M8 16h8"/></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{desenho[tipo]}</svg>;
}

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
  const [subAbaEncontros, setSubAbaEncontros] = useState<SubAbaEncontros>('ao-vivo');
  const [subAbaArquivos, setSubAbaArquivos] = useState<SubAbaArquivos>('documentos');
  const [rascunhoLocal, setRascunhoLocal] = useState('');
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

  const titulo = aba === 'mesa' ? 'Centro de Operações' : aba === 'encontros' ? 'Encontros' : 'Arquivos';
  const subtitulo = aba === 'mesa' ? 'Visão geral do grupo e da administração desta Mesa.' : aba === 'encontros' ? 'Iniciativa, criaturas, preparação e monitor de Perseguição.' : 'Materiais compartilhados, registros privados e textos de narração.';
  const indice = aba === 'mesa' ? '01 / MESA' : aba === 'encontros' ? '02 / ENCONTROS' : '03 / ARQUIVOS';
  return <section className="servidor-local-controle-mesa painel-mestre-shell" aria-label={'Painel do Mestre — ' + mesa.name}>
    <div className="painel-mestre-app">
      <aside className="painel-mestre-sidebar">
        <div className="painel-mestre-side-mark"><span className="painel-mestre-umbrella"><IconePainel tipo="umbrella" /></span><div><b>UMBRELLA<br/>TERMINAL</b><small>CONTROLE OPERACIONAL</small></div></div>
        <div className="painel-mestre-side-kicker">NAVEGAÇÃO / MESTRE</div>
        <nav className="painel-mestre-side-nav" aria-label="Navegação do Mestre">
          <button type="button" className={aba==='mesa'?'ativo':''} onClick={()=>selecionarAba('mesa')}><span><IconePainel tipo="mesa" /></span>MESA</button>
          <button type="button" className={aba==='encontros'?'ativo':''} onClick={()=>selecionarAba('encontros')}><span><IconePainel tipo="encontros" /></span>ENCONTROS</button>
          <button type="button" className={aba==='arquivos'?'ativo':''} onClick={()=>selecionarAba('arquivos')}><span><IconePainel tipo="arquivos" /></span>ARQUIVOS</button>
        </nav>
        <div className="painel-mestre-side-bottom">PROTOCOLO UMB-01<br/>PAINEL DO MESTRE / V0.2<br/>LAN · MESA ATUAL</div>
      </aside>
      <div className="painel-mestre-workspace">
        <header className="painel-mestre-masthead">
          <div className="painel-mestre-brandline"/>
          <div className="painel-mestre-head-main">
            <span className="painel-mestre-umbrella"><IconePainel tipo="umbrella" /></span>
            <div className="painel-mestre-head-copy"><small>AMEAÇA BIOLÓGICA · RPG</small><strong>{mesa.name}</strong><span>Mesa do Mestre · Acesso confidencial</span></div>
            <span className="painel-mestre-acesso">ACESSO MESTRE</span>
          </div>
        </header>
        <main className="painel-mestre-main">
          <div className="painel-mestre-page-intro"><div><small>UMB / {aba==='mesa'?'OPERATION CENTER':aba==='encontros'?'TACTICAL OPERATIONS':'CONFIDENTIAL RECORDS'}</small><h4>{titulo}</h4><p>{subtitulo}</p></div><span>{indice}</span></div>
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

    {aba === 'encontros' && <section id="painel-mestre-panel-encontros" role="region" aria-labelledby="painel-mestre-tab-encontros" className="painel-mestre-conteudo">
      <div className="painel-mestre-modulo-cabecalho"><div><small>TERMINAL TÁTICO // MÓDULO DE ENCONTROS</small><h5>Central de operações</h5></div><span className="painel-mestre-selo-demo">INTERFACE DEMONSTRATIVA</span></div>
      <nav className="painel-mestre-subnav" aria-label="Ferramentas de encontros">
        {([['ao-vivo','Ao vivo'],['preparados','Preparados'],['catalogo','Catálogo'],['gerador','Gerador'],['perseguicao','Perseguição']] as [SubAbaEncontros,string][]).map(([id,label]) => <button key={id} type="button" className={subAbaEncontros===id?'ativo':''} aria-pressed={subAbaEncontros===id} onClick={()=>setSubAbaEncontros(id)}>{label}</button>)}
      </nav>
      {subAbaEncontros==='ao-vivo' && <div className="painel-mestre-grade">
        <article className="painel-mestre-cartao painel-mestre-cartao-destaque"><small>MONITOR DE COMBATE</small><h6>Nenhum encontro em andamento</h6><p>Quando o módulo estiver integrado, esta área reunirá rodada, turno, iniciativa, participantes e estado operacional do encontro.</p><div className="painel-mestre-indicadores"><span>RODADA <b>—</b></span><span>TURNO <b>—</b></span><span>PARTICIPANTES <b>—</b></span></div></article>
        <article className="painel-mestre-cartao"><small>ALERTAS OPERACIONAIS</small><h6>Monitoramento</h6><p>Alertas de dano massivo, decepamento e outros eventos previstos no sistema aparecerão aqui quando houver dados reais.</p><span className="painel-mestre-vazio-tag">SEM EVENTOS REGISTRADOS</span></article>
        <article className="painel-mestre-cartao"><small>CRIATURAS E OPONENTES</small><h6>Quadro de campo</h6><p>Área reservada ao acompanhamento de criaturas e demais envolvidos no encontro.</p><span className="painel-mestre-vazio-tag">NENHUM REGISTRO</span></article>
      </div>}
      {subAbaEncontros==='preparados' && <div className="painel-mestre-cartao"><small>PLANEJAMENTO</small><h6>Encontros preparados</h6><p>Preparações salvas deverão aparecer aqui para consulta e início pelo Mestre.</p><div className="painel-mestre-vazio"><b>＋</b><strong>Nenhuma preparação disponível</strong><span>O armazenamento de encontros ainda não está conectado.</span></div></div>}
      {subAbaEncontros==='catalogo' && <div className="painel-mestre-cartao"><small>BIBLIOTECA</small><h6>Catálogo de encontros</h6><p>Biblioteca para localizar encontros e composições previstos nos materiais oficiais.</p><div className="painel-mestre-filtros"><label>Buscar no catálogo<input type="search" placeholder="Nome ou palavra-chave" disabled /></label><label>Categoria<select disabled defaultValue=""><option value="">Todas as categorias</option></select></label></div><span className="painel-mestre-vazio-tag">CATÁLOGO AINDA NÃO CARREGADO</span></div>}
      {subAbaEncontros==='gerador' && <div className="painel-mestre-cartao"><small>FERRAMENTA DE PREPARAÇÃO</small><h6>Gerador de Encontros Errantes+</h6><p>Área de preparação baseada no procedimento do Arquivo do Mestre v1.0. Os parâmetros e cálculos serão ligados às regras oficiais antes de produzir sugestões.</p><div className="painel-mestre-parametros"><label>Nível do grupo<select disabled defaultValue=""><option value="">Aguardando integração</option></select></label><label>Personagens<select disabled defaultValue=""><option value="">Aguardando integração</option></select></label><label>Dificuldade<select disabled defaultValue=""><option value="">Aguardando integração</option></select></label></div><span className="painel-mestre-vazio-tag">CÁLCULO E SUGESTÕES DESATIVADOS</span></div>}
      {subAbaEncontros==='perseguicao' && <div className="painel-mestre-grade">
        <article className="painel-mestre-cartao painel-mestre-cartao-destaque"><small>MONITOR DE PERSEGUIÇÃO</small><h6>Nenhuma perseguição ativa</h6><p>Quando iniciada, a tela apresentará os marcadores de som, progresso, PV da perseguição e a transição para a forma de combate.</p><div className="painel-mestre-indicadores"><span>PROGRESSO <b>—</b></span><span>PV <b>—</b></span><span>MARCADORES <b>—</b></span></div></article>
        <article className="painel-mestre-cartao"><small>VERIFICAÇÃO DE CHEGADA</small><h6>Procedimento pendente</h6><p>A verificação de chegada 1d6 será apresentada como solicitação ao grupo, sem rolagem automática do WebApp.</p><span className="painel-mestre-vazio-tag">SEM ROLAGENS NESTA PRÉVIA</span></article>
      </div>}
      <p className="painel-mestre-aviso-demo">Esta tela apresenta a estrutura navegável do módulo. Não cria encontros, não executa rolagens, não altera PV ou efeitos e não salva preparações.</p>
    </section>}

    {aba === 'arquivos' && <section id="painel-mestre-panel-arquivos" role="region" aria-labelledby="painel-mestre-tab-arquivos" className="painel-mestre-conteudo">
      <div className="painel-mestre-modulo-cabecalho"><div><small>ARQUIVO CENTRAL // ACESSO RESTRITO</small><h5>Documentos e registros</h5></div><span className="painel-mestre-selo-demo">INTERFACE DEMONSTRATIVA</span></div>
      <nav className="painel-mestre-subnav" aria-label="Categorias de arquivos">
        {([['documentos','Documentos e mapa'],['anotacoes','Minhas anotações'],['diario','Diário do Mestre'],['narracao','Textos de narração'],['mesa','Documentos da Mesa']] as [SubAbaArquivos,string][]).map(([id,label]) => <button key={id} type="button" className={subAbaArquivos===id?'ativo':''} aria-pressed={subAbaArquivos===id} onClick={()=>setSubAbaArquivos(id)}>{label}</button>)}
      </nav>
      {subAbaArquivos==='documentos' && <div className="painel-mestre-grade">
        <article className="painel-mestre-cartao"><small>MAPA</small><h6>Mapa da operação</h6><p>Visualização de mapas e áreas reveladas explicitamente pelo Mestre.</p><div className="painel-mestre-vazio"><b><IconePainel tipo="arquivos" /></b><strong>Nenhum mapa disponível</strong><span>Mapas não são publicados ou revelados automaticamente.</span></div></article>
        <article className="painel-mestre-cartao"><small>DOCUMENTOS</small><h6>Documentos de referência</h6><p>Arquivos de consulta da campanha, organizados por operação e assunto.</p><div className="painel-mestre-vazio"><b><IconePainel tipo="arquivos" /></b><strong>Nenhum documento disponível</strong><span>Adição e consulta de arquivos aguardam integração.</span></div></article>
      </div>}
      {subAbaArquivos==='anotacoes' && <div className="painel-mestre-cartao"><small>ESPAÇO PESSOAL</small><h6>Minhas anotações</h6><p>Área privada da sua conta. Este campo é apenas um rascunho temporário nesta sessão e não será enviado à Mesa.</p><label className="painel-mestre-nota">Rascunho local<textarea value={rascunhoLocal} onChange={e=>setRascunhoLocal(e.target.value)} placeholder="Anote uma ideia ou lembrete..." rows={5}/></label><span className="painel-mestre-vazio-tag">NÃO SALVO · PRIVADO NESTA TELA</span></div>}
      {subAbaArquivos==='diario' && <div className="painel-mestre-cartao"><small>REGISTRO PRIVADO DO MESTRE</small><h6>Diário do Mestre</h6><p>Registro reservado ao papel de Mestre, com previsão de transferência ao sucessor conforme as regras de administração da Mesa.</p><div className="painel-mestre-vazio"><b>▤</b><strong>Diário ainda não iniciado</strong><span>O conteúdo não é compartilhado com jogadores.</span></div></div>}
      {subAbaArquivos==='narracao' && <div className="painel-mestre-cartao"><small>PREPARAÇÃO DE CENA</small><h6>Textos de narração</h6><p>Textos preparados para leitura durante a sessão, separados de segredos e anotações privadas.</p><div className="painel-mestre-vazio"><b>¶</b><strong>Nenhum texto de narração</strong><span>O modo de leitura e a publicação controlada serão integrados depois.</span></div></div>}
      {subAbaArquivos==='mesa' && <div className="painel-mestre-cartao"><small>ESPAÇO DA MESA</small><h6>Documentos da Mesa</h6><p>Área destinada aos documentos que o Mestre decidir disponibilizar aos participantes.</p><div className="painel-mestre-vazio"><b>▤</b><strong>Nenhum documento compartilhado</strong><span>Nenhum conteúdo é visível aos jogadores por esta prévia.</span></div></div>}
      <p className="painel-mestre-aviso-demo">Privacidade preservada: nenhuma anotação privada, texto secreto ou documento é compartilhado por esta interface demonstrativa.</p>
    </section>}

          <footer className="painel-mestre-footer">AMEAÇA BIOLÓGICA RPG · TERMINAL OPERACIONAL · MESA {mesa.name}</footer>
        </main>
      </div>
      <nav className="painel-mestre-floating" aria-label="Navegação principal do Mestre">
        <button type="button" className={aba==='mesa'?'ativo':''} onClick={()=>selecionarAba('mesa')}><span>▦</span>MESA</button>
        <button type="button" className={aba==='encontros'?'ativo':''} onClick={()=>selecionarAba('encontros')}><span>⚔</span>ENCONTROS</button>
        <button type="button" className={aba==='arquivos'?'ativo':''} onClick={()=>selecionarAba('arquivos')}><span>▤</span>ARQUIVOS</button>
      </nav>
    </div>
  </section>;
}
