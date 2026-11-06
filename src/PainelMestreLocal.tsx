import { useState } from 'react';
import type { MesaLocal, ParticipanteMesaLocal } from './servidorLocal';
import QRCodeLocal from './QRCodeLocal';

type SolicitacaoPendente = { id: string; status: 'pendente'; createdAt: string; accountId: string };
type AbaPainelMestre = 'mesa' | 'encontros' | 'arquivos';
type SubAbaEncontros = 'ao-vivo' | 'preparados' | 'catalogo' | 'gerador' | 'perseguicao';
type SubAbaArquivos = 'documentos' | 'anotacoes' | 'diario' | 'narracao' | 'mesa';
function IconePainel({ tipo }: { tipo: 'umbrella' | 'mesa' | 'encontros' | 'arquivos' }) {
  const desenho = {
    umbrella: <><path d="M12 2c-3.1 2.5-5.6 5.2-8.5 8.4L12 12l8.5-1.6C17.6 7.2 15.1 4.5 12 2Z"/><path d="M12 12 3.5 10.4 5.8 21 12 12Zm0 0 6.2 9 2.3-10.6L12 12Z"/></>,
    mesa: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    encontros: <><path d="m4 20 9-9m-8-7 15 15M14 3l7 7-5 5-7-7zM3 14l7 7"/></>,
    arquivos: <path d="M4 4h7l2 3h7v13H4zM8 11h8M8 15h6"/>
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
  const chaveSubAbaEncontros = 'ameaca-biologica:painel-mestre:encontros:v1:' + mesa.id;
  const chaveSubAbaArquivos = 'ameaca-biologica:painel-mestre:arquivos:v1:' + mesa.id;
  const [subAbaEncontros, setSubAbaEncontros] = useState<SubAbaEncontros>(() => {
    try {
      const salva = typeof window !== 'undefined' ? window.sessionStorage.getItem(chaveSubAbaEncontros) : null;
      return salva === 'preparados' || salva === 'catalogo' || salva === 'gerador' || salva === 'perseguicao' ? salva : 'ao-vivo';
    } catch { return 'ao-vivo'; }
  });
  const [subAbaArquivos, setSubAbaArquivos] = useState<SubAbaArquivos>(() => {
    try {
      const salva = typeof window !== 'undefined' ? window.sessionStorage.getItem(chaveSubAbaArquivos) : null;
      return salva === 'anotacoes' || salva === 'diario' || salva === 'narracao' || salva === 'mesa' ? salva : 'documentos';
    } catch { return 'documentos'; }
  });
  const [rascunhoLocal, setRascunhoLocal] = useState('');
  function selecionarSubAbaEncontros(proxima: SubAbaEncontros) {
    setSubAbaEncontros(proxima);
    try { if (typeof window !== 'undefined') window.sessionStorage.setItem(chaveSubAbaEncontros, proxima); } catch { /* A navegação funciona sem persistência local. */ }
  }
  function selecionarSubAbaArquivos(proxima: SubAbaArquivos) {
    setSubAbaArquivos(proxima);
    try { if (typeof window !== 'undefined') window.sessionStorage.setItem(chaveSubAbaArquivos, proxima); } catch { /* A navegação funciona sem persistência local. */ }
  }
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
          <button id="painel-mestre-tab-mesa" type="button" aria-controls="painel-mestre-panel-mesa" className={aba==='mesa'?'ativo':''} onClick={()=>selecionarAba('mesa')}><span><IconePainel tipo="mesa" /></span>MESA</button>
          <button id="painel-mestre-tab-encontros" type="button" aria-controls="painel-mestre-panel-encontros" className={aba==='encontros'?'ativo':''} onClick={()=>selecionarAba('encontros')}><span><IconePainel tipo="encontros" /></span>ENCONTROS</button>
          <button id="painel-mestre-tab-arquivos" type="button" aria-controls="painel-mestre-panel-arquivos" className={aba==='arquivos'?'ativo':''} onClick={()=>selecionarAba('arquivos')}><span><IconePainel tipo="arquivos" /></span>ARQUIVOS</button>
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
      <div className="painel-mestre-mesa-dashboard">
        <div className="painel-mestre-mesa-hero">
          <div><small>UMB / OPERATION CENTER · MESA ATUAL</small><h5>{mesa.name}</h5><p>Centro de controle de participantes, acessos e solicitações desta operação.</p></div>
          <span className="painel-mestre-selo-demo">CONTROLE DO MESTRE</span>
        </div>
        <p className="painel-mestre-orientacao">Convites, solicitações e participantes são administrados nesta Mesa. Aprovações e remoções são confirmadas pelo servidor.</p>
        <div className="painel-mestre-indicadores painel-mestre-mesa-stats" aria-label="Indicadores atuais da Mesa">
        <span>JOGADORES <b>{totalJogadores === undefined ? '—' : totalJogadores}</b></span>
        <span>VAGAS RESTANTES <b>{vagasDisponiveis === undefined ? '—' : vagasDisponiveis}</b></span>
        <span>SOLICITAÇÕES PENDENTES <b>{totalSolicitacoes === undefined ? '—' : totalSolicitacoes}</b></span>
      </div>
        <div className="painel-mestre-mesa-acoes">
          <div><small>ACESSO À OPERAÇÃO</small><strong>Convites e permissões</strong><span>Gerencie o ingresso e a permanência dos participantes.</span></div>
          <div className="servidor-local-botoes">
        <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoGerarConvite(mesa)}>{convite ? 'Renovar convite' : 'Gerar convite'}</button>
        <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoRevogarConvite(mesa)}>Revogar convite ativo</button>
        <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarSolicitacoes(mesa)}>Ver solicitações</button>
          </div>
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
      <div className="painel-mestre-subsecao painel-mestre-mesa-participantes">
        <div className="painel-mestre-subsecao-topo">
          <div><small>GRUPO AUTORIZADO</small><h5>Participantes</h5></div>
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
      <div className="painel-mestre-subsecao painel-mestre-mesa-solicitacoes">
        <div className="painel-mestre-subsecao-topo">
          <div><small>CONTROLE DE ACESSO</small><h5>Solicitações de ingresso</h5></div>
          <button className="botao-claro" type="button" disabled={consultando} onClick={() => aoCarregarSolicitacoes(mesa)}>Atualizar solicitações</button>
        </div>
        {(solicitacoes ?? []).length > 0 ? <ul className="servidor-local-lista-mesas">{solicitacoes!.map((pedido, index) => <li key={pedido.id}>
          <div><strong>Solicitação {index + 1}</strong><small>Pedido de ingresso pendente</small></div>
          <div className="servidor-local-botoes"><button className="botao-claro" type="button" disabled={consultando} onClick={() => aoDecidirSolicitacao(mesa, pedido.id, 'aprovar')}>Aprovar</button><button className="botao-claro" type="button" disabled={consultando} onClick={() => aoDecidirSolicitacao(mesa, pedido.id, 'recusar')}>Recusar</button></div>
        </li>)}</ul> : solicitacoes ? <p className="servidor-local-vazio">Nenhuma solicitação pendente.</p> : <p className="servidor-local-vazio">Consulte as solicitações para carregar os pedidos desta Mesa.</p>}
      </div>
      </div>
    </div>}

    {aba === 'encontros' && <section id="painel-mestre-panel-encontros" role="region" aria-labelledby="painel-mestre-tab-encontros" className="painel-mestre-conteudo">
      <div className="painel-mestre-modulo-cabecalho"><div><small>TERMINAL TÁTICO // MÓDULO DE ENCONTROS</small><h5>Central de operações</h5></div><span className="painel-mestre-selo-demo">INTERFACE DEMONSTRATIVA</span></div>
      <nav className="painel-mestre-subnav" aria-label="Ferramentas de encontros">
        {([['ao-vivo','Ao vivo'],['preparados','Preparados'],['catalogo','Catálogo'],['gerador','Gerador'],['perseguicao','Perseguição']] as [SubAbaEncontros,string][]).map(([id,label]) => <button key={id} id={'painel-mestre-encontros-tab-' + id} type="button" className={subAbaEncontros===id?'ativo':''} aria-pressed={subAbaEncontros===id} onClick={()=>selecionarSubAbaEncontros(id)}>{label}</button>)}
      </nav>
      {subAbaEncontros==='ao-vivo' && <div id="painel-mestre-encontros-panel-ao-vivo" role="region" aria-labelledby="painel-mestre-encontros-tab-ao-vivo" className="painel-mestre-grade">
        <article className="painel-mestre-cartao painel-mestre-cartao-destaque"><small>MONITOR DE COMBATE</small><h6>Nenhum encontro em andamento</h6><p>Quando o módulo estiver integrado, esta área reunirá rodada, turno, iniciativa, participantes e estado operacional do encontro.</p><div className="painel-mestre-indicadores"><span>RODADA <b>—</b></span><span>TURNO <b>—</b></span><span>PARTICIPANTES <b>—</b></span></div></article>
        <article className="painel-mestre-cartao"><small>ALERTAS OPERACIONAIS</small><h6>Monitoramento</h6><p>Alertas de dano massivo, decepamento e outros eventos previstos no sistema aparecerão aqui quando houver dados reais.</p><span className="painel-mestre-vazio-tag">SEM EVENTOS REGISTRADOS</span></article>
        <article className="painel-mestre-cartao"><small>CRIATURAS E OPONENTES</small><h6>Quadro de campo</h6><p>Área reservada ao acompanhamento de criaturas e demais envolvidos no encontro.</p><span className="painel-mestre-vazio-tag">NENHUM REGISTRO</span></article>
      </div>}
      {subAbaEncontros==='preparados' && <div id="painel-mestre-encontros-panel-preparados" role="region" aria-labelledby="painel-mestre-encontros-tab-preparados" className="painel-mestre-cartao"><small>PLANEJAMENTO</small><h6>Encontros preparados</h6><p>Preparações salvas deverão aparecer aqui para consulta e início pelo Mestre.</p><div className="painel-mestre-vazio"><b>＋</b><strong>Nenhuma preparação disponível</strong><span>O armazenamento de encontros ainda não está conectado.</span></div></div>}
      {subAbaEncontros==='catalogo' && <div id="painel-mestre-encontros-panel-catalogo" role="region" aria-labelledby="painel-mestre-encontros-tab-catalogo" className="painel-mestre-cartao"><small>BIBLIOTECA</small><h6>Catálogo de encontros</h6><p>Biblioteca para localizar encontros e composições previstos nos materiais oficiais.</p><div className="painel-mestre-filtros"><label>Buscar no catálogo<input type="search" placeholder="Nome ou palavra-chave" disabled /></label><label>Categoria<select disabled defaultValue=""><option value="">Todas as categorias</option></select></label></div><span className="painel-mestre-vazio-tag">CATÁLOGO AINDA NÃO CARREGADO</span></div>}
      {subAbaEncontros==='gerador' && <div id="painel-mestre-encontros-panel-gerador" role="region" aria-labelledby="painel-mestre-encontros-tab-gerador" className="painel-mestre-cartao"><small>FERRAMENTA DE PREPARAÇÃO</small><h6>Gerador de Encontros Errantes+</h6><p>Área de preparação baseada no procedimento do Arquivo do Mestre v1.0. Os parâmetros e cálculos serão ligados às regras oficiais antes de produzir sugestões.</p><div className="painel-mestre-parametros"><label>Nível do grupo<select disabled defaultValue=""><option value="">Aguardando integração</option></select></label><label>Personagens<select disabled defaultValue=""><option value="">Aguardando integração</option></select></label><label>Dificuldade<select disabled defaultValue=""><option value="">Aguardando integração</option></select></label></div><span className="painel-mestre-vazio-tag">CÁLCULO E SUGESTÕES DESATIVADOS</span></div>}
      {subAbaEncontros==='perseguicao' && <div id="painel-mestre-encontros-panel-perseguicao" role="region" aria-labelledby="painel-mestre-encontros-tab-perseguicao" className="painel-mestre-grade">
        <article className="painel-mestre-cartao painel-mestre-cartao-destaque"><small>MONITOR DE PERSEGUIÇÃO</small><h6>Nenhuma perseguição ativa</h6><p>Quando iniciada, a tela apresentará os marcadores de som, progresso, PV da perseguição e a transição para a forma de combate.</p><div className="painel-mestre-indicadores"><span>PROGRESSO <b>—</b></span><span>PV <b>—</b></span><span>MARCADORES <b>—</b></span></div></article>
        <article className="painel-mestre-cartao"><small>VERIFICAÇÃO DE CHEGADA</small><h6>Procedimento pendente</h6><p>A verificação de chegada 1d6 será apresentada como solicitação ao grupo, sem rolagem automática do WebApp.</p><span className="painel-mestre-vazio-tag">SEM ROLAGENS NESTA PRÉVIA</span></article>
      </div>}
      <p className="painel-mestre-aviso-demo">Esta tela apresenta a estrutura navegável do módulo. Não cria encontros, não executa rolagens, não altera PV ou efeitos e não salva preparações.</p>
    </section>}

    {aba === 'arquivos' && <section id="painel-mestre-panel-arquivos" role="region" aria-labelledby="painel-mestre-tab-arquivos" className="painel-mestre-conteudo">
      <div className="painel-mestre-modulo-cabecalho"><div><small>ARQUIVO CENTRAL // ACESSO RESTRITO</small><h5>Documentos e registros</h5></div><span className="painel-mestre-selo-demo">INTERFACE DEMONSTRATIVA</span></div>
      <nav className="painel-mestre-subnav" aria-label="Categorias de arquivos">
        {([['documentos','Documentos e mapa'],['anotacoes','Minhas anotações'],['diario','Diário do Mestre'],['narracao','Textos de narração'],['mesa','Documentos da Mesa']] as [SubAbaArquivos,string][]).map(([id,label]) => <button key={id} id={'painel-mestre-arquivos-tab-' + id} type="button" className={subAbaArquivos===id?'ativo':''} aria-pressed={subAbaArquivos===id} onClick={()=>selecionarSubAbaArquivos(id)}>{label}</button>)}
      </nav>
      {subAbaArquivos==='documentos' && <div id="painel-mestre-arquivos-panel-documentos" role="region" aria-labelledby="painel-mestre-arquivos-tab-documentos" className="painel-mestre-grade">
        <article className="painel-mestre-cartao"><small>MAPA</small><h6>Mapa da operação</h6><p>Visualização de mapas e áreas reveladas explicitamente pelo Mestre.</p><div className="painel-mestre-vazio"><b><IconePainel tipo="arquivos" /></b><strong>Nenhum mapa disponível</strong><span>Mapas não são publicados ou revelados automaticamente.</span></div></article>
        <article className="painel-mestre-cartao"><small>DOCUMENTOS</small><h6>Documentos de referência</h6><p>Arquivos de consulta da campanha, organizados por operação e assunto.</p><div className="painel-mestre-vazio"><b><IconePainel tipo="arquivos" /></b><strong>Nenhum documento disponível</strong><span>Adição e consulta de arquivos aguardam integração.</span></div></article>
      </div>}
      {subAbaArquivos==='anotacoes' && <div id="painel-mestre-arquivos-panel-anotacoes" role="region" aria-labelledby="painel-mestre-arquivos-tab-anotacoes" className="painel-mestre-cartao"><small>ESPAÇO PESSOAL</small><h6>Minhas anotações</h6><p>Área privada da sua conta. Este campo é apenas um rascunho temporário nesta sessão e não será enviado à Mesa.</p><label className="painel-mestre-nota">Rascunho local<textarea value={rascunhoLocal} onChange={e=>setRascunhoLocal(e.target.value)} placeholder="Anote uma ideia ou lembrete..." rows={5}/></label><span className="painel-mestre-vazio-tag">NÃO SALVO · PRIVADO NESTA TELA</span></div>}
      {subAbaArquivos==='diario' && <div id="painel-mestre-arquivos-panel-diario" role="region" aria-labelledby="painel-mestre-arquivos-tab-diario" className="painel-mestre-cartao"><small>REGISTRO PRIVADO DO MESTRE</small><h6>Diário do Mestre</h6><p>Registro reservado ao papel de Mestre, com previsão de transferência ao sucessor conforme as regras de administração da Mesa.</p><div className="painel-mestre-vazio"><b>▤</b><strong>Diário ainda não iniciado</strong><span>O conteúdo não é compartilhado com jogadores.</span></div></div>}
      {subAbaArquivos==='narracao' && <div id="painel-mestre-arquivos-panel-narracao" role="region" aria-labelledby="painel-mestre-arquivos-tab-narracao" className="painel-mestre-cartao"><small>PREPARAÇÃO DE CENA</small><h6>Textos de narração</h6><p>Textos preparados para leitura durante a sessão, separados de segredos e anotações privadas.</p><div className="painel-mestre-vazio"><b>¶</b><strong>Nenhum texto de narração</strong><span>O modo de leitura e a publicação controlada serão integrados depois.</span></div></div>}
      {subAbaArquivos==='mesa' && <div id="painel-mestre-arquivos-panel-mesa" role="region" aria-labelledby="painel-mestre-arquivos-tab-mesa" className="painel-mestre-cartao"><small>ESPAÇO DA MESA</small><h6>Documentos da Mesa</h6><p>Área destinada aos documentos que o Mestre decidir disponibilizar aos participantes.</p><div className="painel-mestre-vazio"><b>▤</b><strong>Nenhum documento compartilhado</strong><span>Nenhum conteúdo é visível aos jogadores por esta prévia.</span></div></div>}
      <p className="painel-mestre-aviso-demo">Privacidade preservada: nenhuma anotação privada, texto secreto ou documento é compartilhado por esta interface demonstrativa.</p>
    </section>}

          <footer className="painel-mestre-footer">AMEAÇA BIOLÓGICA RPG · TERMINAL OPERACIONAL · MESA {mesa.name}</footer>
        </main>
      </div>
      <nav className="painel-mestre-floating" aria-label="Navegação principal do Mestre">
        <button type="button" className={aba==='mesa'?'ativo':''} aria-current={aba==='mesa'?'page':undefined} onClick={()=>selecionarAba('mesa')}><span><IconePainel tipo="mesa" /></span>MESA</button>
        <button type="button" className={aba==='encontros'?'ativo':''} aria-current={aba==='encontros'?'page':undefined} onClick={()=>selecionarAba('encontros')}><span><IconePainel tipo="encontros" /></span>ENCONTROS</button>
        <button type="button" className={aba==='arquivos'?'ativo':''} aria-current={aba==='arquivos'?'page':undefined} onClick={()=>selecionarAba('arquivos')}><span><IconePainel tipo="arquivos" /></span>ARQUIVOS</button>
      </nav>
    </div>
  </section>;
}
