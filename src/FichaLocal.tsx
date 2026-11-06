import { useEffect, useRef, useState } from 'react';
import { dadosDaClasse } from './classesFicha';
import { PERICIAS_CLASSE, ATRIBUTO_PERICIA, valorBasePericia, valorPassivoPericia } from './pericias';
import { ORIGENS } from './origens';
import { capacidadeInventario, caracteristicos, equipamentoInicial as itensDoKit, opcoesEquipamento, espacosOcupados } from './equipamento';
import { HABILIDADES_BASICAS } from './habilidades';
import { ARMAS_OPERARIO } from './armaOperario';
import type { AtributosIniciais } from './atributosCriacao';
import { planejarInventarioCriacao } from './inventarioCriacao';
import EditorAtributosPericiasLocal from './EditorAtributosPericiasLocal';
import EditorCaracteristicasLocal from './EditorCaracteristicasLocal';
import EditorInventarioLocal from './EditorInventarioLocal';
import IdentidadeLocal from './IdentidadeLocal';
import FuncionamentoFichaLocal from './FuncionamentoFichaLocal';
import RevisaoCriacaoLocal from './RevisaoCriacaoLocal';
import CalculadoraTesteLocal from './CalculadoraTesteLocal';
import RecursosFichaLocal from './RecursosFichaLocal';
import DescansoFichaLocal from './DescansoFichaLocal';
import ReanimacaoFichaLocal from './ReanimacaoFichaLocal';
import { recursosIniciais } from './recursosFicha';
import type { FichaRevisao } from './conferenciaCriacao';
import { normalizarConfiguracaoFuncionamento, type ConfiguracaoFuncionamento } from './funcionamentoFicha';
import { calcularFaseBioInfeccao } from './bioInfeccao';
import { reanimacaoValida } from './reanimacaoFicha';
import { classePersonagem, termoPersonagem } from './textoPersonagem';

type DadosFichaLocal = {
  classe?: unknown;
  origem?: unknown;
  armaOperario?: unknown;
  atributos?: unknown;
  periciaOrigemTreinada?: unknown;
  periciaOrigemExtra?: unknown;
  habilidadeBasica?: unknown;
  equipamentoInicial?: unknown;
  distribuicaoPericias?: unknown;
  comprasIniciais?: unknown;
  revisaoCompras?: unknown;
  identidade?: unknown;
  configuracaoFuncionamento?: unknown;
  biAtual?: unknown;
  pvAtual?: unknown;
  pvTemporarios?: unknown;
  saAtual?: unknown;
  reanimacao?: unknown;
};

type Props = {
  nome: string;
  mesa: string;
  dados: Record<string, unknown>;
  aoFechar: () => void;
  aoRecarregar?: () => void;
  aoAlterarPendencia?: (secao: string, pendente: boolean) => void;
  aoEditar: (secao: 'caracteristicas' | 'pericias' | 'inventario') => void;
  aoSalvarAtributosPericias: (dados: { atributos: AtributosIniciais; periciaOrigemTreinada: string; periciaOrigemExtra: string | null; distribuicaoPericias: Record<string, number> }) => Promise<boolean>;
  aoSalvarCaracteristicas: (dados: { classe: string; origem: string; armaOperario: string; habilidadeBasica: string; equipamentoInicial: string }) => Promise<boolean>;
  aoSalvarIdentidade?: (dados: { nome: string; identidade: Record<string, string> }) => Promise<boolean>;
  aoSalvarInventario: (dados: { equipamentoInicial: string; comprasIniciais: Record<string, number>; revisaoCompras: number }) => Promise<boolean>;
  aoSalvarFuncionamento: (configuracao: ConfiguracaoFuncionamento) => Promise<boolean>;
  aoSalvarRecursos: (patch: Record<string, unknown>) => Promise<boolean>;
  origemDados?: 'local' | 'servidor';
  status?: string;
  erro?: string;
};

const ATRIBUTOS: { chave: keyof AtributosIniciais; sigla: string; nome: string }[] = [
  { chave: 'forca', sigla: 'FOR', nome: 'Força' },
  { chave: 'agilidade', sigla: 'AGI', nome: 'Agilidade' },
  { chave: 'vigor', sigla: 'VIG', nome: 'Vigor' },
  { chave: 'astucia', sigla: 'AST', nome: 'Astúcia' },
];

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

export default function FichaLocal({ nome, mesa, dados, aoFechar, aoRecarregar, aoAlterarPendencia, aoEditar, aoSalvarAtributosPericias, aoSalvarCaracteristicas, aoSalvarIdentidade, aoSalvarInventario, aoSalvarFuncionamento, aoSalvarRecursos, origemDados = 'local', status, erro }: Props) {
  const pendenciasInternas = useRef(new Set<string>());
  const [secoesPendentes, setSecoesPendentes] = useState<Set<string>>(() => new Set());
  const [secaoAtiva, setSecaoAtiva] = useState('caracteristicas');
  const corpoRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const corpo = corpoRef.current;
    if (!corpo) return;
    const secoes = [
      { id: 'ficha-local-caracteristicas', chave: 'caracteristicas' },
      { id: 'ficha-local-pericias', chave: 'pericias' },
      { id: 'ficha-local-combate', chave: 'combate' },
      { id: 'ficha-local-inventario', chave: 'inventario' },
    ];
    const atualizarSecaoAtiva = () => {
      const limite = corpo.getBoundingClientRect().top + Math.min(corpo.clientHeight * 0.4, 180);
      let atual = secoes[0].chave;
      for (const secao of secoes) {
        const elemento = document.getElementById(secao.id);
        if (elemento && elemento.getBoundingClientRect().top <= limite) atual = secao.chave;
      }
      setSecaoAtiva(valor => valor === atual ? valor : atual);
    };
    corpo.addEventListener('scroll', atualizarSecaoAtiva, { passive: true });
    atualizarSecaoAtiva();
    return () => corpo.removeEventListener('scroll', atualizarSecaoAtiva);
  }, []);
  function registrarPendencia(secao: string, pendente: boolean) {
    setSecoesPendentes(atual => { const proxima = new Set(atual); if (pendente) proxima.add(secao); else proxima.delete(secao); return proxima; });
    if (aoAlterarPendencia) {
      aoAlterarPendencia(secao, pendente);
      return;
    }
    if (pendente) pendenciasInternas.current.add(secao);
    else pendenciasInternas.current.delete(secao);
  }
  function fecharFicha() {
    if (pendenciasInternas.current.size > 0) {
      const secoes = [...pendenciasInternas.current].join(', ');
      if (!window.confirm(`Há alterações não salvas em: ${secoes}.\n\nSe fechar agora, essas alterações serão descartadas. Deseja fechar mesmo assim?`)) return;
    }
    pendenciasInternas.current.clear();
    aoFechar();
  }
  const ficha = dados as DadosFichaLocal;
  const estadoReanimacao = (dados as Record<string, unknown>).reanimacao;
  const reanimacaoEmCurso = reanimacaoValida(estadoReanimacao) && estadoReanimacao.estado !== 'concluida';
  const reanimacaoPV0EmCurso = reanimacaoValida(estadoReanimacao) && estadoReanimacao.causa === 'pv_zero' && estadoReanimacao.estado !== 'concluida';
  const classe = typeof ficha.classe === 'string' ? ficha.classe : '';
  const origem = typeof ficha.origem === 'string' ? ficha.origem : '';
  const genero = typeof (ficha.identidade as Record<string, unknown> | undefined)?.genero === 'string' ? (ficha.identidade as Record<string, string>).genero : undefined;
  const termo = (valor: string) => termoPersonagem(valor, genero);
  const atributos = ficha.atributos && typeof ficha.atributos === 'object'
    ? ficha.atributos as AtributosIniciais
    : { forca: 1, agilidade: 1, vigor: 1, astucia: 1 };
  const distribuicao = ficha.distribuicaoPericias && typeof ficha.distribuicaoPericias === 'object'
    ? ficha.distribuicaoPericias as Record<string, number>
    : {};
  const treinada = typeof ficha.periciaOrigemTreinada === 'string' ? ficha.periciaOrigemTreinada : '';
  const extra = typeof ficha.periciaOrigemExtra === 'string' ? ficha.periciaOrigemExtra : '';
  const dadosClasse = dadosDaClasse(classe);
  const dadosOrigem = ORIGENS.find(item => item.nome === origem);
  const habilidadeSelecionada = typeof ficha.habilidadeBasica === 'string' ? ficha.habilidadeBasica : ''; 
  const habilidade = HABILIDADES_BASICAS.find(item => item.id === habilidadeSelecionada && item.classe === classe);
  const pv = (classe === 'Agente' ? 10 : classe === 'Autodidata' ? 8 : classe === 'Operador' ? 12 : 0) + numero(atributos.vigor) + (habilidade?.id === 'parrudo' ? 5 : 0);
  const sa = numero(atributos.agilidade) + numero(atributos.astucia) + (origem === 'Universitária' ? 1 : 0);
  const bi = (classe === 'Agente' ? 8 : classe === 'Autodidata' ? 10 : classe === 'Operador' ? 6 : 0) + numero(atributos.astucia) + (origem === 'Cobaia' ? 2 : 0) + (habilidade?.id === 'parrudo' ? 3 : 0);
  const recursosAtuais = recursosIniciais(ficha as Record<string, unknown>, pv, sa);
  const biAtual = recursosAtuais.biAtual;
  const faseBi = calcularFaseBioInfeccao(biAtual, bi);
  const defesa = 10 + numero(atributos.agilidade) + (origem === 'Policial' ? 2 : 0);
  const capacidade = capacidadeInventario(numero(atributos.forca), origem);
  const listaPericias = [...new Set([...(PERICIAS_CLASSE[classe] ?? []), ...(dadosOrigem?.pericias ?? []), ...(treinada ? [treinada] : []), ...(extra ? [extra] : []), ...Object.keys(distribuicao)])].sort();
  const itensClasse = caracteristicos(classe);
  const kitSelecionado = typeof ficha.equipamentoInicial === 'string' ? ficha.equipamentoInicial : '';
  const kit = opcoesEquipamento(classe).find(item => item.id === kitSelecionado);
  const armaOperario = typeof ficha.armaOperario === 'string' ? ficha.armaOperario : '';
  const alertasCompatibilidade = [
    ...(habilidadeSelecionada && !habilidade ? ['Habilidade Básica incompatível com a Classe atual'] : []),
    ...(kitSelecionado && !kit ? ['Equipamento Inicial incompatível com a Classe atual'] : []),
    ...(origem === 'Operário' && armaOperario && !ARMAS_OPERARIO.includes(armaOperario as never) ? ['Arma escolhida incompatível com a Origem Operário'] : []),
  ];
  const itensKit = itensDoKit(classe, kitSelecionado);
  const espacosKit = espacosOcupados(itensKit);
  let inventarioPlanejado: ReturnType<typeof planejarInventarioCriacao> | null = null;
  try { inventarioPlanejado = planejarInventarioCriacao({ classe, equipamento_inicial: kitSelecionado, forca: numero(atributos.forca), origem: origem || null, nivel: 1, estado_ficha: 'rascunho', compras_iniciais: (ficha.comprasIniciais as Record<string, number>) ?? {} }); } catch { inventarioPlanejado = null; }
  const ramo = dadosClasse?.ramos ?? [];
  const configuracaoFuncionamento = normalizarConfiguracaoFuncionamento(ficha.configuracaoFuncionamento);
  const fichaRevisao: FichaRevisao = {
    identidade: genero ? { genero } : {},
    nome,
    classe: classe || null,
    nivel: 1,
    forca: numero(atributos.forca),
    agilidade: numero(atributos.agilidade),
    vigor: numero(atributos.vigor),
    astucia: numero(atributos.astucia),
    origem: origem || null,
    pericia_origem_treinada: treinada || null,
    pericia_origem_extra: typeof ficha.periciaOrigemExtra === 'string' ? ficha.periciaOrigemExtra : null,
    pontos_pericia_classe: distribuicao,
    habilidade_basica: habilidadeSelecionada || null,
    equipamento_inicial: kitSelecionado || null,
    compras_iniciais: (ficha.comprasIniciais as Record<string, number>) ?? {},
    revisao_compras: numero(ficha.revisaoCompras),
    pv_maximo: pv,
    sa_maximo: sa,
    bi_maximo: bi,
    defesa,
  };
  function irParaRevisao(secao: string) {
    const ids: Record<string, string> = {
      perfil: 'ficha-local-caracteristicas',
      pericias: 'ficha-local-pericias',
      itens: 'ficha-local-inventario',
    };
    document.getElementById(ids[secao] ?? ids.perfil)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return <div className="ficha-local-fundo" role="dialog" aria-modal="true" aria-labelledby="ficha-local-titulo">
    <article className="ficha-local">
      <header className="ficha-local-topo">
        <div className="ficha-local-acoes"><button type="button" className="ficha-local-voltar" onClick={fecharFicha}>← Voltar</button><button type="button" className="botao-claro" onClick={() => aoEditar("caracteristicas")}>Editar rascunho</button></div>
        <div><strong>AMEAÇA BIOLÓGICA</strong><small>{origemDados === 'servidor' ? 'FICHA NO SERVIDOR · RASCUNHO' : 'FICHA LOCAL · RASCUNHO'}</small></div>
        <span className="ficha-local-selo">NÃO ATIVA</span>
      </header>
      <div className="ficha-local-corpo" ref={corpoRef}>
        {status && <p className="offline-status" role="status" aria-live="polite">{status}</p>}
        {erro && <p className="offline-erro" role="alert">{erro}</p>}
        {erro?.includes('alterada em outra aba') && aoRecarregar && <button type="button" className="botao-claro" onClick={aoRecarregar}>Descartar esta edição e carregar a versão mais recente</button>}
        <div className="ficha-local-identidade">
          <span>{termo('REGISTRO DO SOBREVIVENTE')} · {mesa || 'MESA LOCAL'}</span>
          <h1 id="ficha-local-titulo">{nome}</h1>
          <p>{classePersonagem(classe || null, genero)} · {termo(origem || 'Origem pendente')} · Nível 1 (criação)</p>
          {origem === 'Operário' && typeof ficha.armaOperario === 'string' && <small>Arma escolhida: {ficha.armaOperario}</small>}
        </div>

        <div className="ficha-local-recursos">
          <div><small>PONTOS DE VIDA</small><strong>{recursosAtuais.pvAtual} / {pv}</strong><span>Temporários: {recursosAtuais.pvTemporarios}</span></div>
          <div><small>SURTO DE ADRENALINA</small><strong>{recursosAtuais.saAtual} / {sa}</strong><span>Máximo derivado</span></div>
          <div><small>BIO-INFECÇÃO</small><strong>{biAtual} / {bi}</strong><span>{faseBi.estado === 'colapso' ? 'Colapso Viral' : faseBi.fase ? 'Fase ' + faseBi.fase : 'Fase indisponível'}</span></div>
          <div><small>DEFESA</small><strong>{defesa}</strong><span>Sem equipamento</span></div>
        </div>

        <RecursosFichaLocal
          key={JSON.stringify([ficha.pvAtual ?? null, ficha.pvTemporarios ?? null, ficha.saAtual ?? null, ficha.biAtual ?? null])}
          dados={dados}
          pvMaximo={pv}
          saMaximo={sa}
          biMaximo={bi}
          bloquearPV={recursosAtuais.pvAtual === 0 || reanimacaoPV0EmCurso}
          aoSalvar={aoSalvarRecursos}
          aoAlterarPendencia={pendente => registrarPendencia('Recursos', pendente)}
        />

        <DescansoFichaLocal
          key={JSON.stringify([classe, pv, sa, ficha.pvAtual ?? null, ficha.pvTemporarios ?? null, ficha.saAtual ?? null, ficha.biAtual ?? null])}
          dados={dados}
          classe={classe}
          pvMaximo={pv}
          saMaximo={sa}
          modoDados={configuracaoFuncionamento.modoDados}
          aoSalvar={aoSalvarRecursos}
          bloqueado={secoesPendentes.size > 0 || reanimacaoEmCurso}
        />

        <ReanimacaoFichaLocal
          key={JSON.stringify([ficha.reanimacao ?? null, ficha.pvAtual ?? null, ficha.biAtual ?? null, classe, origem])}
          dados={dados}
          recursos={recursosAtuais}
          origem={origem}
          pvMaximo={pv}
          biMaximo={bi}
          modoDados={configuracaoFuncionamento.modoDados}
          aoSalvar={aoSalvarRecursos}
          bloqueado={secoesPendentes.size > 0}
        />

        <section id="ficha-local-caracteristicas" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>01</span> Características</h2><button type="button" className="ficha-local-editar-secao" onClick={() => aoEditar("caracteristicas")}>Editar seção ↗</button></div>
          {alertasCompatibilidade.length > 0 && <p className="ficha-local-aviso" role="alert">Revisão da criação necessária: {alertasCompatibilidade.join("; ")}. As escolhas foram preservadas; corrija os itens incompatíveis antes de confirmar a criação.</p>}
          <EditorCaracteristicasLocal key={JSON.stringify([classe, origem, ficha.armaOperario, ficha.habilidadeBasica, kitSelecionado])} iniciais={{ classe, origem, armaOperario: typeof ficha.armaOperario === 'string' ? ficha.armaOperario : '', habilidadeBasica: typeof ficha.habilidadeBasica === 'string' ? ficha.habilidadeBasica : '', equipamentoInicial: kitSelecionado }} aoSalvar={aoSalvarCaracteristicas} aoAlterarPendencia={pendente => registrarPendencia('Características', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Características confirmadas pelo servidor.' : undefined} />
          {aoSalvarIdentidade && <IdentidadeLocal key={JSON.stringify([nome, ficha.identidade ?? {}])} nome={nome} identidade={(ficha.identidade as Record<string, string>) ?? {}} aoSalvar={aoSalvarIdentidade} aoAlterarPendencia={pendente => registrarPendencia('Identificação', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Identificação confirmada pelo servidor.' : undefined} />}
          <div className="ficha-local-grade">
            <div><small>CLASSE</small><strong>{classePersonagem(classe || null, genero)}</strong><p>{dadosClasse?.identidade ?? 'Dados da Classe ainda não definidos.'}</p></div>
            <div><small>ORIGEM</small><strong>{termo(origem || 'Pendente')}</strong><p>{dadosOrigem?.beneficio ?? 'Benefício da Origem ainda não definido.'}</p></div>
            <div><small>RAMOS DA CLASSE</small><strong>{ramo.length ? ramo.join(' · ') : 'Pendente'}</strong><p>Ramos disponíveis para desenvolvimento futuro. Nenhum foi escolhido nesta etapa.</p></div>
            <div><small>PROFICIÊNCIAS</small><strong>{dadosClasse?.proficiencias.length ?? 0} registros</strong><p>{dadosClasse?.proficiencias.join(' · ') ?? 'Pendente'}</p></div>
          </div>
          <div className="ficha-local-nota"><strong>Habilidade Básica · {habilidade?.nome ?? 'Não selecionada'}</strong><p>{habilidade ? habilidade.efeito : 'Ainda não selecionada. Nenhuma habilidade foi presumida para o personagem.'}</p></div>
        </section>

        <section id="ficha-local-pericias" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>02</span> Atributos e Perícias</h2><button type="button" className="ficha-local-editar-secao" onClick={() => aoEditar("pericias")}>Editar seção ↗</button></div>
          <EditorAtributosPericiasLocal key={JSON.stringify([classe, origem, atributos, treinada, extra, distribuicao])} classe={classe} origem={origem} atributosIniciais={atributos} treinadaInicial={treinada} extraInicial={extra} distribuicaoInicial={distribuicao} aoSalvar={aoSalvarAtributosPericias} aoAlterarPendencia={pendente => registrarPendencia('Atributos e Perícias', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Atributos e Perícias confirmados pelo servidor.' : undefined} />
          <div className="ficha-local-atributos">
            {ATRIBUTOS.map(item => <div key={item.chave}><small>{item.sigla}</small><strong>{numero(atributos[item.chave])}</strong><span>{item.nome}</span></div>)}
          </div>
          <div className="ficha-local-pontos"><span>Treinamento gratuito da Origem</span><strong>{treinada || 'Pendente'}</strong></div>
          {origem === 'Amnésico' && <div className="ficha-local-pontos"><span>Segunda Perícia da Origem</span><strong>{extra || 'Pendente'}</strong></div>}
          <div className="ficha-local-pericias">
            {listaPericias.map(pericia => {
              const grau = Math.min(2, Math.max(0, numero(distribuicao[pericia]) + (pericia === treinada ? 1 : 0)));
              const rotulo = grau === 2 ? 'Mestre' : grau === 1 ? 'Treinada' : 'Não Treinada';
              const atributo = ATRIBUTO_PERICIA[pericia];
              const totalBase = valorBasePericia(pericia, atributos, treinada || null, distribuicao);
              const passivo = valorPassivoPericia(pericia, atributos, treinada || null, distribuicao);
              return <div key={pericia}><span>{pericia}<small>{rotulo}{pericia === treinada ? ' · Origem' : ''} · {atributo?.toUpperCase()} {atributo ? numero(atributos[atributo]) : ''} + Treinamento · Passivo {passivo}</small></span><strong>+{totalBase}</strong></div>;
            })}
          </div>
          <p className="ficha-local-legenda">O valor exibido soma o Atributo associado e o Treinamento. O Passivo exibido é o normal; Testes Passivos recebem +5 com Vantagem ou -5 com Desvantagem. A circunstância é resolvida pela Mesa. Não some o Atributo novamente ao realizar o Teste.</p>
          <CalculadoraTesteLocal atributos={atributos} treinada={treinada} distribuicao={distribuicao} modoDados={configuracaoFuncionamento.modoDados} />
        </section>

        <section id="ficha-local-combate" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>03</span> Combate</h2><span className="ficha-local-selo">PREPARAÇÃO</span></div>
          <p className="ficha-local-legenda">Resumo operacional da personagem. Os valores abaixo são informativos: esta seção ainda não inicia nem resolve um combate.</p>

          <h3 className="ficha-local-subtitulo">Defesa e deslocamento</h3>
          <div className="ficha-local-grade">
            <div><small>DEFESA BÁSICA</small><strong>{defesa}</strong><p>10 + AGI{origem === 'Policial' ? ' + 2 da Origem Policial' : ''}. Equipamentos ainda não aplicados.</p></div>
            <div><small>MOVIMENTO BASE</small><strong>9 m</strong><p>Deslocamento base informado pela ficha.</p></div>
          </div>

          <h3 className="ficha-local-subtitulo">Habilidade e equipamento</h3>
          <div className="ficha-local-grade">
            <div><small>HABILIDADE BÁSICA</small><strong>{habilidade?.nome ?? 'Não selecionada'}</strong><p>{habilidade ? habilidade.efeito : 'Nenhuma Habilidade Básica foi selecionada.'}</p></div>
            <div><small>ARMAMENTO</small><strong>Não equipado</strong><p>{kit ? 'Conjunto inicial selecionado: ' + kit.nome + '. A escolha faz parte do planejamento do inventário e não significa que uma arma esteja equipada.' : 'Selecione um conjunto inicial na seção Inventário. A seleção não equipa automaticamente uma arma.'}</p></div>
          </div>

          <h3 className="ficha-local-subtitulo">Bio-Infecção</h3>
          <div className="ficha-local-grade">
            <div><small>BI ATUAL / MÁXIMA</small><strong>{biAtual} / {bi}</strong><p>{faseBi.estado === 'fase' ? 'Fase ' + faseBi.fase + ' · ' + faseBi.efeito : faseBi.efeito}</p></div>
            <div><small>MOVIMENTO PELA BI</small><strong>{faseBi.modificadorMovimento === null ? (faseBi.estado === 'colapso' ? 'Desacordada' : '—') : (9 + faseBi.modificadorMovimento) + ' m'}</strong><p>{faseBi.modificadorMovimento === null ? 'Sem valor de movimento derivável.' : 'Base 9 m ' + (faseBi.modificadorMovimento > 0 ? '+ ' : faseBi.modificadorMovimento < 0 ? '− ' : '') + (faseBi.modificadorMovimento === 0 ? 'sem ajuste' : Math.abs(faseBi.modificadorMovimento) + ' m pela fase de BI')}</p></div>
            <div><small>BÔNUS EM TESTES DE ATAQUE</small><strong>{faseBi.bonusTesteAtaque === null ? '—' : '+' + faseBi.bonusTesteAtaque}</strong><p>{faseBi.bonusTesteAtaque === null ? 'Não aplicável.' : 'Modificador da fase de BI, antes de outros efeitos.'}</p></div>
            <div><small>DANO CORPO A CORPO</small><strong>{faseBi.danoCorpoACorpoAdicional ? '+' + faseBi.danoCorpoACorpoAdicional : '—'}</strong><p>{faseBi.danoCorpoACorpoAdicional ? 'Dano adicional da 4ª fase.' : 'Sem bônus de dano corpo a corpo por BI.'}</p></div>
            <div><small>DESVANTAGEM POR BI</small><strong>{faseBi.desvantagemAtaquesETestes === null ? '—' : faseBi.desvantagemAtaquesETestes ? 'Sim' : 'Não'}</strong><p>Aplica-se a Ataques e Testes de Perícia e Atributo na 5ª fase.</p></div>
          </div>
          <p className="ficha-local-legenda">A BI começa em 0 e não progride sozinha. Alterações de BI são registradas expressamente no painel de Recursos; este resumo apenas calcula os modificadores da fase e não os aplica automaticamente a movimento, ataques ou dano, nem inicia Reanimação.</p>

          <h3 className="ficha-local-subtitulo">Combate ativo</h3>
          <div className="ficha-local-grade">
            <div><small>INICIATIVA E AÇÕES</small><strong>A integrar</strong><p>O acompanhamento de turnos, ações, reações e movimentação em combate ainda não está implementado.</p></div>
            <div><small>CONDIÇÕES E EFEITOS</small><strong>A integrar</strong><p>Esta ficha ainda não registra nem aplica Condições ou efeitos temporários.</p></div>
            <div><small>ATAQUES E DANO</small><strong>A integrar</strong><p>Resolução de Testes, Defesa de alvos, Dano e consumo de munição não estão implementados nesta seção.</p></div>
          </div>
          <p className="ficha-local-aviso">Esta seção não simula rolagens, ações ou efeitos de combate. PV, SA e BI podem ser ajustados expressamente no painel de Recursos; Descanso e Reanimação possuem painéis próprios. O controle de turnos, Condições, ataques, Defesa de alvos, dano e consumo de munição permanece pendente.</p>
        </section>

        <section id="ficha-local-inventario" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>04</span> Inventário</h2><button type="button" className="ficha-local-editar-secao" onClick={() => aoEditar("inventario")}>Editar seção ↗</button></div>
          <EditorInventarioLocal key={JSON.stringify([classe, kitSelecionado, ficha.comprasIniciais, ficha.revisaoCompras, capacidade])} classe={classe} capacidade={capacidade} kitInicial={kitSelecionado} comprasIniciais={(ficha.comprasIniciais as Record<string, number>) ?? {}} revisaoCompras={numero(ficha.revisaoCompras)} aoSalvar={aoSalvarInventario} aoAlterarPendencia={pendente => registrarPendencia('Inventário', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Planejamento do inventário confirmado pelo servidor.' : undefined} />
          <div className="ficha-local-inventario-topo"><span>CAPACIDADE BASE</span><strong>{capacidade} Espaços</strong></div>
          <div className="ficha-local-itens">
            <strong>Itens característicos</strong>
            {itensClasse.length ? itensClasse.map(item => <div key={item.id}><strong>{item.nome}</strong><small>{item.detalhe} · Característico · 0 Espaços</small></div>) : <p>Itens característicos ainda não definidos para esta Classe.</p>}
            <strong>Conjunto inicial · {kit ? kit.id + ' — ' + kit.nome : 'Não selecionado'}</strong>
            {inventarioPlanejado ? inventarioPlanejado.itens.map(item => <div key={item.chaveCriacao}><strong>{item.nome} × {item.quantidade}</strong><small>{item.local === 'caracteristico' ? 'Característico · vinculado à Classe' : 'Inventário · ' + item.espacos + ' Espaço(s)'} · {item.estado.tipo.replace('_',' ')}</small></div>) : <p>Não foi possível montar a prévia do inventário. Confira Classe, Origem, kit e compras do rascunho.</p>}
          </div>
          <p className="ficha-local-legenda">A capacidade considera 4 + FOR{origem === 'Mochileiro' ? ' + 1 de Mochileiro' : ''} = {capacidade} Espaços. O conjunto selecionado ocupa {inventarioPlanejado?.ocupados ?? espacosKit} de {capacidade} Espaços. Os itens aparecem em estado inicial guardado/não equipado; operações de Inventário ainda não estão integradas.</p>
        <FuncionamentoFichaLocal
          key={JSON.stringify(ficha.configuracaoFuncionamento ?? null)}
          inicial={ficha.configuracaoFuncionamento as ConfiguracaoFuncionamento | undefined}
          aoSalvar={aoSalvarFuncionamento}
          aoAlterarPendencia={pendente => registrarPendencia('Funcionamento', pendente)}
        />
        <RevisaoCriacaoLocal ficha={fichaRevisao} irPara={irParaRevisao} />
        </section>

        <footer className="ficha-local-rodape">AMEAÇA BIOLÓGICA RPG · {origemDados === 'servidor' ? 'DADOS NO SERVIDOR' : 'DADOS LOCAIS'} · RASCUNHO NÃO ATIVO</footer>
      </div>
      <nav className="ficha-local-nav" aria-label="Atalhos da ficha">
        <button type="button" className={secaoAtiva === 'caracteristicas' ? 'ativo' : ''} aria-current={secaoAtiva === 'caracteristicas' ? 'location' : undefined} onClick={() => { setSecaoAtiva('caracteristicas'); document.getElementById('ficha-local-caracteristicas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true">◉</span><small>PERFIL</small></button>
        <button type="button" className={secaoAtiva === 'pericias' ? 'ativo' : ''} aria-current={secaoAtiva === 'pericias' ? 'location' : undefined} onClick={() => { setSecaoAtiva('pericias'); document.getElementById('ficha-local-pericias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true">▤</span><small>PERÍCIAS</small></button>
        <button type="button" className={secaoAtiva === 'combate' ? 'ativo' : ''} aria-current={secaoAtiva === 'combate' ? 'location' : undefined} onClick={() => { setSecaoAtiva('combate'); document.getElementById('ficha-local-combate')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true">◎</span><small>COMBATE</small></button>
        <button type="button" className={secaoAtiva === 'inventario' ? 'ativo' : ''} aria-current={secaoAtiva === 'inventario' ? 'location' : undefined} onClick={() => { setSecaoAtiva('inventario'); document.getElementById('ficha-local-inventario')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true">▦</span><small>ITENS</small></button>
      </nav>
    </article>
  </div>;
}
