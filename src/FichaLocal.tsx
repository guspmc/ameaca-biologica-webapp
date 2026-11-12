import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
import AtivacaoPersonagemLocal from './AtivacaoPersonagemLocal';
import type { ResultadoConferenciaCriacaoLocal } from './servidorLocal';
import CalculadoraTesteLocal from './CalculadoraTesteLocal';
import RoladoresBasicosLocal from './RoladoresBasicosLocal';
import RecursosFichaLocal from './RecursosFichaLocal';
import BeneficiosOrigemContextuaisLocal from './BeneficiosOrigemContextuaisLocal';
import DescansoFichaLocal from './DescansoFichaLocal';
import UsosDescansoCompletoLocal from './UsosDescansoCompletoLocal';
import ReanimacaoFichaLocal from './ReanimacaoFichaLocal';
import PainelAcoesLocal from './PainelAcoesLocal';
import CondicoesFichaLocal from './CondicoesFichaLocal';
import RegistroDecisoesMesaLocal from './RegistroDecisoesMesaLocal';
import PlanejadorHabilidadesCriacaoLocal from './PlanejadorHabilidadesCriacaoLocal';
import ProgressaoFichaLocal from './ProgressaoFichaLocal';
import { recursosIniciais } from './recursosFicha';
import { carregarEstadoTurnoCombate } from './estadoTurnoCombate';
import { calcularDerivadosCriacao } from './derivadosCriacao';
import type { FichaRevisao } from './conferenciaCriacao';
import { normalizarConfiguracaoFuncionamento, type ConfiguracaoFuncionamento } from './funcionamentoFicha';
import { calcularFaseBioInfeccao } from './bioInfeccao';
import { reanimacaoValida } from './reanimacaoFicha';
import { usosDescansoCompletoValido } from './usosDescansoCompleto';
import { adicionarInstanciaCondicao, condicoesAtivas, gerarIdCondicao, listaCondicoesValida, type CondicaoId } from './condicoesFicha';
import { classePersonagem, termoPersonagem } from './textoPersonagem';
import { calcularDefesaComCondicoes, calcularDefesaComReflexosSobrevivente } from './condicoesCalculadora';
import { confirmarDescansoCompletoProgressao, estadoProgressaoPersistenteValido, pedidoProgressaoPersistenteValido, type PedidoProgressaoPersistente } from './progressaoPersistente';

type DadosFichaLocal = {
  classe?: unknown;
  origem?: unknown;
  armaOperario?: unknown;
  atributos?: unknown;
  periciaOrigemTreinada?: unknown;
  periciaOrigemExtra?: unknown;
  periciaTentativaErroTreinada?: unknown;
  habilidadeBasica?: unknown;
  habilidadesAdquiridas?: unknown;
  planejamentoCriacao?: unknown;
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
  nivel?: unknown;
  reanimacao?: unknown;
  progressao?: unknown;
  pedidoProgressao?: unknown;
  economiaAcoes?: unknown;
};

type Props = {
  nome: string;
  mesa: string;
  contextoId?: string;
  dados: Record<string, unknown>;
  aoFechar: () => void;
  aoRecarregar?: () => void;
  aoAlterarPendencia?: (secao: string, pendente: boolean) => void;
  aoEditar: (secao: 'caracteristicas' | 'pericias' | 'inventario') => void;
  aoSalvarAtributosPericias: (dados: { atributos: AtributosIniciais; periciaOrigemTreinada: string; periciaOrigemExtra: string | null; periciaTentativaErroTreinada: string | null; distribuicaoPericias: Record<string, number> }) => Promise<boolean>;
  aoSalvarCaracteristicas: (dados: { classe: string; origem: string; armaOperario: string; habilidadeBasica: string }) => Promise<boolean>;
  aoSalvarIdentidade?: (dados: { nome: string; identidade: Record<string, string> }) => Promise<boolean>;
  aoSalvarInventario: (dados: { equipamentoInicial: string; comprasIniciais: Record<string, number>; revisaoCompras: number }) => Promise<boolean>;
  aoSalvarFuncionamento: (configuracao: ConfiguracaoFuncionamento) => Promise<boolean>;
  aoSalvarRecursos: (patch: Record<string, unknown>) => Promise<boolean>;
  origemDados?: 'local' | 'servidor';
  estadoFicha?: 'rascunho' | 'completa';
  revisaoFicha?: number;
  aoConferirAtivacao?: () => Promise<ResultadoConferenciaCriacaoLocal>;
  aoAtivar?: (revision: number, operationId: string) => Promise<boolean>;
  bloqueadoAtivacao?: boolean;
  status?: string;
  erro?: string;
  autoSalvar?: boolean;
};

const ATRIBUTOS: { chave: keyof AtributosIniciais; sigla: string; nome: string }[] = [
  { chave: 'forca', sigla: 'FOR', nome: 'Força' },
  { chave: 'agilidade', sigla: 'AGI', nome: 'Agilidade' },
  { chave: 'vigor', sigla: 'VIG', nome: 'Vigor' },
  { chave: 'astucia', sigla: 'AST', nome: 'Astúcia' },
];

function IconeFicha({ tipo }: { tipo: 'perfil' | 'pericias' | 'combate' | 'itens' | 'vida' | 'adrenalina' | 'bio' | 'defesa' }) {
  const paths: Record<typeof tipo, ReactNode> = {
    perfil: <><circle cx="12" cy="8" r="3.2"/><path d="M5 20c.7-3.1 3.1-4.8 7-4.8s6.3 1.7 7 4.8"/></>,
    pericias: <><path d="M7 3.5h8l3 3V21H7z"/><path d="M15 3.5V7h3M10 11h5M10 15h5"/></>,
    combate: <><path d="m4 4 6 6m4 4 6 6M5 19 19 5M8 4l12 12"/></>,
    itens: <><path d="M4 7h16v13H4zM4 7l2-4h12l2 4M9 7v4h6V7"/></>,
    vida: <><path d="M20.5 8.8c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.8Z"/></>,
    adrenalina: <><path d="m13 2-8 12h6l-1 8 9-13h-6z"/></>,
    bio: <><circle cx="12" cy="12" r="2"/><path d="M12 10c-1-5 3-7 6-5 2 2 1 5-3 7M10 12c-5-1-7 3-5 6 2 2 5 1 7-3M13 14c1 5-3 7-6 5-2-2-1-5 3-7"/></>,
    defesa: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[tipo]}</svg>;
}

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

export default function FichaLocal({ nome, mesa, contextoId, dados, aoFechar, aoRecarregar, aoAlterarPendencia, aoEditar, aoSalvarAtributosPericias, aoSalvarCaracteristicas, aoSalvarIdentidade, aoSalvarInventario, aoSalvarFuncionamento, aoSalvarRecursos, origemDados = 'local', estadoFicha = 'rascunho', revisaoFicha, aoConferirAtivacao, aoAtivar, bloqueadoAtivacao = false, status, erro, autoSalvar = false }: Props) {
  const pendenciasInternas = useRef(new Set<string>());
  const [secoesPendentes, setSecoesPendentes] = useState<Set<string>>(() => new Set());
  const [secaoAtiva, setSecaoAtiva] = useState('caracteristicas');
  const [avisoFechamento, setAvisoFechamento] = useState('');
  const [fecharAposSalvar, setFecharAposSalvar] = useState(false);
  const corpoRef = useRef<HTMLDivElement | null>(null);
  const salvandoExpostoRef = useRef(false);
  const chavePosicao = 'ameaca-biologica:ficha:posicao:v1:' + (contextoId ?? mesa + ':' + nome);
  const chaveEditores = 'ameaca-biologica:ficha:editores:v1:' + (contextoId ?? mesa + ':' + nome);
  useEffect(() => {
    const corpo = corpoRef.current;
    if (!corpo) return;
    try {
      const salvo = Number(localStorage.getItem(chavePosicao));
      if (Number.isFinite(salvo) && salvo > 0) corpo.scrollTop = salvo;
    } catch { /* A ficha continua navegável sem armazenamento local. */ }
    const salvarPosicao = () => {
      try { localStorage.setItem(chavePosicao, String(corpo.scrollTop)); }
      catch { /* A posição não é essencial ao salvamento da ficha. */ }
    };
    corpo.addEventListener('scroll', salvarPosicao, { passive: true });
    return () => corpo.removeEventListener('scroll', salvarPosicao);
  }, [chavePosicao]);
  useEffect(() => {
    const corpo = corpoRef.current;
    if (!corpo) return;
    const listarEditores = () => [...corpo.querySelectorAll<HTMLDetailsElement>('details[data-ficha-editor][id]')];
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveEditores) ?? '{}') as Record<string, unknown>;
      for (const detalhe of listarEditores()) {
        if (typeof salvo[detalhe.id] === 'boolean') detalhe.open = salvo[detalhe.id] as boolean;
      }
    } catch { /* Os editores mantêm seus estados padrão se a preferência local estiver indisponível. */ }
    const salvarEstado = (evento: Event) => {
      const alvo = evento.target;
      if (!(alvo instanceof HTMLDetailsElement) || !alvo.id || !alvo.hasAttribute('data-ficha-editor')) return;
      try {
        const estado: Record<string, boolean> = {};
        for (const detalhe of listarEditores()) estado[detalhe.id] = detalhe.open;
        localStorage.setItem(chaveEditores, JSON.stringify(estado));
      } catch { /* A ficha continua funcional sem persistir a abertura dos editores. */ }
    };
    corpo.addEventListener('toggle', salvarEstado, true);
    return () => corpo.removeEventListener('toggle', salvarEstado, true);
  }, [chaveEditores]);

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
  async function registrarExpostoPorFalhaCritica(): Promise<boolean> {
    if (configuracaoFuncionamento.modo !== 'automatico' || salvandoExpostoRef.current) return false;
    salvandoExpostoRef.current = true;
    try {
      const condicoesAtuais = dados.condicoes === undefined ? [] : dados.condicoes;
      if (!listaCondicoesValida(condicoesAtuais)) return false;
      if (condicoesAtivas(condicoesAtuais).some(item => item.condicao === 'exposto')) return true;
      const atualizadas = adicionarInstanciaCondicao(condicoesAtuais, {
        id: gerarIdCondicao(),
        condicao: 'exposto',
        fonte: 'Falha Crítica em Ataque',
        duracao: 'Até o final do próximo turno da criatura',
        observacao: 'Ativada automaticamente pela Ficha Automática após resultado natural 1 no d20.',
        estado: 'ativa',
        encerradaEm: null,
      });
      return await aoSalvarRecursos({ condicoes: atualizadas });
    } catch {
      return false;
    } finally {
      salvandoExpostoRef.current = false;
    }
  }

  function fecharFicha() {
    if (pendenciasInternas.current.size > 0) {
      const secoes = [...pendenciasInternas.current].join(', ');
      if (autoSalvar) {
        setFecharAposSalvar(true);
        setAvisoFechamento((origemDados === 'servidor' ? 'Aguardando confirmação do servidor: ' : 'Aguardando confirmação do armazenamento local: ') + secoes + '. A ficha fechará automaticamente quando todas as alterações forem salvas.');
      } else {
        setAvisoFechamento('Há alterações pendentes em: ' + secoes + '. Salve-as antes de fechar a ficha.');
      }
      return;
    }
    setFecharAposSalvar(false);
    setAvisoFechamento('');
    aoFechar();
  }

  useEffect(() => {
    if (autoSalvar && fecharAposSalvar && pendenciasInternas.current.size === 0) {
      setFecharAposSalvar(false);
      setAvisoFechamento('');
      aoFechar();
    }
  }, [autoSalvar, fecharAposSalvar, secoesPendentes, aoFechar]);
  const ficha = dados as DadosFichaLocal;
  const condicoesRegistradasIds = listaCondicoesValida(dados.condicoes)
    ? [...new Set(condicoesAtivas(dados.condicoes).map(item => item.condicao))]
    : [];
  const estadoReanimacao = (dados as Record<string, unknown>).reanimacao;
  const reanimacaoEmCurso = reanimacaoValida(estadoReanimacao) && estadoReanimacao.estado !== 'concluida';
  const reanimacaoPV0EmCurso = reanimacaoValida(estadoReanimacao) && estadoReanimacao.causa === 'pv_zero' && estadoReanimacao.estado !== 'concluida';
  const classe = typeof ficha.classe === 'string' ? ficha.classe : '';
  const origem = typeof ficha.origem === 'string' ? ficha.origem : '';
  const nivelAtual = Number.isSafeInteger(ficha.nivel) && numero(ficha.nivel) >= 1 && numero(ficha.nivel) <= 10 ? numero(ficha.nivel) : 1;
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
  const extraTentativa = typeof ficha.periciaTentativaErroTreinada === 'string' ? ficha.periciaTentativaErroTreinada : '';
  const dadosClasse = dadosDaClasse(classe);
  const dadosOrigem = ORIGENS.find(item => item.nome === origem);
  const habilidadeSelecionada = typeof ficha.habilidadeBasica === 'string' ? ficha.habilidadeBasica : ''; 
  const habilidade = HABILIDADES_BASICAS.find(item => item.id === habilidadeSelecionada && item.classe === classe);
  const habilidadesProgressaoIds = Array.isArray(ficha.habilidadesAdquiridas)
    ? ficha.habilidadesAdquiridas.flatMap(escolha => {
        if (!escolha || typeof escolha !== 'object' || Array.isArray(escolha)) return [];
        const id = (escolha as Record<string, unknown>).habilidadeId;
        return typeof id === 'string' ? [id] : [];
      })
    : [];
  const habilidadesAtivasIds = [...new Set([...(habilidade ? [habilidade.id] : []), ...habilidadesProgressaoIds])];
  const proficienciasAdicionais = [
    ...(habilidadesProgressaoIds.includes('arsenal-improvavel') ? ['Magnums'] : []),
    ...(habilidadesProgressaoIds.includes('armamento-especial') ? ['Magnums', 'Armas Especiais'] : []),
  ];
  const regrasEspeciaisProficiencia = [
    ...(habilidadesProgressaoIds.includes('code-veronica') ? ['CODE VERONICA: permite usar Submetralhadoras sem coronha com Ambidestria.'] : []),
  ];
  const temTentativaEErro = habilidadesProgressaoIds.includes('tentativa-e-erro');
  const atributosDaFicha = {
    forca: numero(atributos.forca), agilidade: numero(atributos.agilidade),
    vigor: numero(atributos.vigor), astucia: numero(atributos.astucia),
  };
  const atributosCalculaveis = Object.values(atributosDaFicha)
    .every(valor => Number.isInteger(valor) && valor >= 0 && valor <= 5);
  const origemCalculavel = !origem || !!dadosOrigem;
  const derivados = dadosClasse && atributosCalculaveis && origemCalculavel
    ? calcularDerivadosCriacao({
        classe, origem, habilidadeBasica: habilidade?.id ?? '',
        atributos: atributosDaFicha, nivel: nivelAtual,
      })
    : null;
  const pv = derivados?.pvMaximo ?? 0;
  const sa = derivados?.saMaximo ?? 0;
  const bi = derivados?.biMaxima ?? 0;
  const usosDescanso = (dados as Record<string, unknown>).usosDescansoCompleto ?? {};
  const academicoDisponivel = origem === 'Acadêmico' && usosDescansoCompletoValido(usosDescanso)
    && (usosDescanso as Record<string, unknown>)['origem:academico'] !== true;
  const criminosoDisponivel = origem === 'Criminoso' && usosDescansoCompletoValido(usosDescanso)
    && (usosDescanso as Record<string, unknown>)['origem:criminoso'] !== true;
  const recursosAtuais = recursosIniciais(ficha as Record<string, unknown>, pv, sa);
  const estadoTurnoCombateAtual = carregarEstadoTurnoCombate(dados.estadoTurnoCombate, dados.economiaAcoes, recursosAtuais.saAtual);
  const biAtual = recursosAtuais.biAtual;
  const faseBi = calcularFaseBioInfeccao(biAtual, bi);
  const desacordadoPorRecursos = recursosAtuais.pvAtual <= 0 || faseBi.estado === 'colapso';
  const condicoesAtivasIds: CondicaoId[] = [...new Set([
    ...condicoesRegistradasIds,
    ...(desacordadoPorRecursos ? ['desacordado' as const] : []),
  ])];
  const periodoTransformacaoSemDescansoCompleto = (condicoesRegistradasIds.includes('infectado-especial') && recursosAtuais.pvAtual <= 0)
    || (condicoesRegistradasIds.includes('cabeca-carmesim') && biAtual === 0);
  const progressaoValida = estadoProgressaoPersistenteValido(ficha.progressao, classe);
  const penalidadeMorteNivel1 = progressaoValida && (ficha.progressao as { penalidadeMorteNivel1: boolean }).penalidadeMorteNivel1;
  const defesa = derivados?.defesa ?? 10 + numero(atributos.agilidade);
  const defesaAtual = calcularDefesaComCondicoes(defesa, numero(atributos.agilidade), condicoesAtivasIds);
  const acrobaciaAtual = valorBasePericia('Acrobacia', atributos, treinada || null, distribuicao, extra || null, extraTentativa || null);
  const reflexosSobreviventeAtivo = habilidadesAtivasIds.includes('reflexos-de-sobrevivente');
  const defesaContraAtaques = calcularDefesaComReflexosSobrevivente(defesaAtual, acrobaciaAtual, reflexosSobreviventeAtivo);
  const paredeHumanaAtiva = habilidadesAtivasIds.includes('parede-humana');
  const capacidade = derivados?.inventario ?? capacidadeInventario(numero(atributos.forca), origem);
  const listaPericias = [...new Set([...(PERICIAS_CLASSE[classe] ?? []), ...(dadosOrigem?.pericias ?? []), ...(treinada ? [treinada] : []), ...(extra ? [extra] : []), ...(extraTentativa ? [extraTentativa] : []), ...Object.keys(distribuicao)])].sort();
  const itensClasse = caracteristicos(classe);
  const kitSelecionado = typeof ficha.equipamentoInicial === 'string' ? ficha.equipamentoInicial : '';
  const kit = opcoesEquipamento(classe).find(item => item.id === kitSelecionado);
  const armaOperario = typeof ficha.armaOperario === 'string' ? ficha.armaOperario : '';
  const alertasCompatibilidade = [
    ...(habilidadeSelecionada && !habilidade ? ['Habilidade Básica incompatível com a Classe atual'] : []),
    ...(kitSelecionado && !kit ? ['Equipamento Inicial incompatível com a Classe atual'] : []),
    ...(origem === 'Operário' && !ARMAS_OPERARIO.includes(armaOperario as never) ? [armaOperario ? 'Arma escolhida incompatível com a Origem Operário' : 'Escolha a arma concedida pela Origem Operário'] : []),
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
    nivel: nivelAtual,
    forca: numero(atributos.forca),
    agilidade: numero(atributos.agilidade),
    vigor: numero(atributos.vigor),
    astucia: numero(atributos.astucia),
    origem: origem || null,
    arma_operario: typeof ficha.armaOperario === 'string' ? ficha.armaOperario : null,
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
  function abrirEditor(secao: 'caracteristicas' | 'pericias' | 'inventario') {
    const detalhe = document.getElementById('ficha-local-editor-' + secao) as HTMLDetailsElement | null;
    if (detalhe) detalhe.open = true;
    aoEditar(secao);
  }

  function irParaRevisao(secao: string) {
    const destino: Record<string, 'caracteristicas' | 'pericias' | 'inventario'> = {
      perfil: 'caracteristicas',
      pericias: 'pericias',
      itens: 'inventario',
    };
    abrirEditor(destino[secao] ?? 'caracteristicas');
  }

  return <div className="ficha-local-fundo" role="dialog" aria-modal="true" aria-labelledby="ficha-local-titulo">
    <article className="ficha-local">
      <div className="ficha-local-corpo" ref={corpoRef}>
        <header className="ficha-local-topo">
          <div className="ficha-local-topline">
            <div className="ficha-local-wordmark">AMEAÇA<br/><span>BIOLÓGICA</span></div>
            <div className="ficha-local-top-meta">ARQUIVO DO JOGADOR · V1.0<br/>MESA / {mesa || 'MESA LOCAL'}</div>
          </div>
        </header>
        {status && <p className="offline-status" role="status" aria-live="polite">{status}</p>}
        {avisoFechamento && <div className="offline-status" role="status">
          <p>{avisoFechamento}</p>
          {fecharAposSalvar && <button type="button" className="botao-claro" onClick={() => { setFecharAposSalvar(false); setAvisoFechamento(''); }}>Continuar editando</button>}
        </div>}
        {erro && <p className="offline-erro" role="alert">{erro}</p>}
        {erro?.includes('alterada em outra aba') && aoRecarregar && <button type="button" className="botao-claro" onClick={aoRecarregar}>Descartar esta edição e carregar a versão mais recente</button>}
        <div className="ficha-local-chapter-meta">{termo('REGISTRO DO SOBREVIVENTE')} · {origemDados === 'servidor' ? 'DADOS NO SERVIDOR' : 'DADOS LOCAIS'} · {estadoFicha === 'completa' ? 'FICHA ATIVA' : 'RASCUNHO NÃO ATIVO'}</div>
        <div className="ficha-local-identidade">
          <div className="ficha-local-identidade-principal">
            <h1 id="ficha-local-titulo">{nome}</h1>
            <p>{classePersonagem(classe || null, genero)} · {termo(origem || 'Origem pendente')} · Nível {nivelAtual}{nivelAtual === 1 ? ' (criação)' : ''}</p>
            {origem === 'Operário' && typeof ficha.armaOperario === 'string' && <small>Arma escolhida: {ficha.armaOperario}</small>}
          </div>
          <span className="ficha-local-carimbo">DADOS<br/>RESTRITOS</span>
        </div>
        <div className="ficha-local-acoes">
          <button type="button" className="ficha-local-voltar" onClick={fecharFicha}>← Voltar</button>
          <span className="ficha-local-selo">{estadoFicha === 'completa' ? 'FICHA ATIVA' : 'RASCUNHO · NÃO ATIVA'}</span>
          {estadoFicha === 'rascunho' && <button type="button" className="botao-claro" onClick={() => abrirEditor('caracteristicas')}>Editar rascunho</button>}
        </div>

        <div className="ficha-local-recursos">
          <div><span className="ficha-local-recurso-icone"><IconeFicha tipo="vida" /></span><small>PONTOS DE VIDA</small><strong>{recursosAtuais.pvAtual} / {pv}</strong><span>Temporários: {recursosAtuais.pvTemporarios}</span></div>
          <div><span className="ficha-local-recurso-icone"><IconeFicha tipo="adrenalina" /></span><small>SURTO DE ADRENALINA</small><strong>{recursosAtuais.saAtual} / {sa}</strong><span>Máximo derivado</span></div>
          <div><span className="ficha-local-recurso-icone"><IconeFicha tipo="bio" /></span><small>BIO-INFECÇÃO</small><strong>{biAtual} / {bi}</strong><span>{faseBi.estado === 'colapso' ? 'Colapso Viral' : faseBi.fase ? 'Fase ' + faseBi.fase : 'Fase indisponível'}</span></div>
          <div><span className="ficha-local-recurso-icone"><IconeFicha tipo="defesa" /></span><small>DEFESA</small><strong>{defesa}</strong><span>Sem equipamento</span></div>
        </div>
        <ProgressaoFichaLocal dados={dados} classe={classe} nivel={nivelAtual} origemDados={origemDados} aoSalvar={aoSalvarRecursos} />

        <CondicoesFichaLocal dados={dados} pvAtual={recursosAtuais.pvAtual} pvMaximo={pv} biAtual={biAtual} biMaximo={bi} aoSalvar={aoSalvarRecursos} origemDados={origemDados} />
        <RegistroDecisoesMesaLocal dados={dados} aoSalvar={aoSalvarRecursos} origemDados={origemDados} />

        {origem === 'Agente de Saúde' && <p className="ficha-local-aviso">AGENTE DE SAÚDE: ao curar um aliado com item ou efeito, acrescente +1d4 aos Dados de Cura. O benefício não se aplica à própria personagem; a cura do aliado continua sendo registrada na ficha correspondente.</p>}

        <BeneficiosOrigemContextuaisLocal dados={dados as Record<string, unknown>} origem={origem} aoSalvar={aoSalvarRecursos} />
                <RecursosFichaLocal origemDados={origemDados} autoSalvar={autoSalvar}
          dados={dados}
          pvMaximo={pv}
          saMaximo={sa}
          biMaximo={bi}
          origem={origem}
          bloquearPV={recursosAtuais.pvAtual === 0 || reanimacaoPV0EmCurso}
          aoSalvar={aoSalvarRecursos}
          aoAlterarPendencia={pendente => registrarPendencia('Recursos', pendente)}
        />

        <UsosDescansoCompletoLocal
          dados={dados}
          origem={origem}
          habilidades={habilidadesAtivasIds}
          aoSalvar={aoSalvarRecursos}
        />

        <DescansoFichaLocal
          origemDados={origemDados}
          dados={dados}
          classe={classe}
          pvMaximo={pv}
          saMaximo={sa}
          nivel={nivelAtual}
          modoDados={configuracaoFuncionamento.modoDados}
          modo={configuracaoFuncionamento.modo}
          aoSalvar={aoSalvarRecursos}
          aoPrepararPatchCompleto={() => {
            if (!usosDescansoCompletoValido(dados.usosDescansoCompleto ?? {})) {
              throw new Error('Não foi possível concluir o Descanso Completo: o registro de usos está inválido e precisa ser revisado.');
            }
            if (origemDados !== 'local' || dados.pedidoProgressao === undefined || dados.pedidoProgressao === null) return {};
            if (!estadoProgressaoPersistenteValido(dados.progressao, classe)
              || !pedidoProgressaoPersistenteValido(dados.pedidoProgressao, dados.progressao, classe)) {
              throw new Error('Não foi possível confirmar a Progressão: o pedido ou o histórico está inválido.');
            }
            const pedidoAtual = dados.pedidoProgressao as PedidoProgressaoPersistente;
            if (pedidoAtual.estado === 'descanso_confirmado') {
              return { pedidoProgressao: pedidoAtual };
            }
            return { pedidoProgressao: confirmarDescansoCompletoProgressao(pedidoAtual, dados.progressao, classe, 'sala_descanso') };
          }}
          bloqueado={secoesPendentes.size > 0 || reanimacaoEmCurso}
          bloquearDescansoCompleto={periodoTransformacaoSemDescansoCompleto}
        />

        <ReanimacaoFichaLocal
          transformacaoAtiva={condicoesRegistradasIds.includes('infectado-especial') && condicoesRegistradasIds.includes('cabeca-carmesim') ? 'conflito' : condicoesRegistradasIds.includes('infectado-especial') ? 'infectado-especial' : condicoesRegistradasIds.includes('cabeca-carmesim') ? 'cabeca-carmesim' : null}
          origemDados={origemDados}
          dados={dados}
          recursos={recursosAtuais}
          origem={origem}
          pvMaximo={pv}
          biMaximo={bi}
          modoDados={configuracaoFuncionamento.modoDados}
          modo={configuracaoFuncionamento.modo}
          aoSalvar={aoSalvarRecursos}
          bloqueado={secoesPendentes.size > 0}
        />

        <section id="ficha-local-caracteristicas" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>01</span> Características</h2>{estadoFicha === 'rascunho' && <button type="button" className="ficha-local-editar-secao" onClick={() => abrirEditor('caracteristicas')}>Editar seção ↗</button>}</div>
          {alertasCompatibilidade.length > 0 && <p className="ficha-local-aviso" role="alert">Revisão da criação necessária: {alertasCompatibilidade.join("; ")}. As escolhas foram preservadas; corrija os itens incompatíveis antes de confirmar a criação.</p>}
          {estadoFicha === 'rascunho'
            ? <details id="ficha-local-editor-caracteristicas" className="ficha-local-editor-detalhe" open data-ficha-editor>
                <summary><span>Editar características e Habilidade Básica</span><small>Classe · Origem · Habilidade Básica</small></summary>
                <EditorCaracteristicasLocal autoSalvar={autoSalvar} iniciais={{ classe, origem, armaOperario: typeof ficha.armaOperario === 'string' ? ficha.armaOperario : '', habilidadeBasica: typeof ficha.habilidadeBasica === 'string' ? ficha.habilidadeBasica : '' }} aoSalvar={aoSalvarCaracteristicas} aoAlterarPendencia={pendente => registrarPendencia('Características', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Características confirmadas pelo servidor.' : undefined} />
              </details>
            : <p className="ficha-local-legenda">Classe, Origem e Habilidade Básica foram fixadas na ativação. Alterações dessas escolhas dependem de uma regra ou ferramenta própria aprovada.</p>}
          {aoSalvarIdentidade && <IdentidadeLocal autoSalvar={autoSalvar} nome={nome} identidade={(ficha.identidade as Record<string, string>) ?? {}} aoSalvar={aoSalvarIdentidade} aoAlterarPendencia={pendente => registrarPendencia('Identificação', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Identificação confirmada pelo servidor.' : undefined} />}
          <div className="ficha-local-fatos-rapidos">
            <div><small>ORIGEM</small><strong>{termo(origem || 'Pendente')}</strong><span>{dadosOrigem?.beneficio ?? 'Benefício ainda não definido.'}</span></div>
            <div><small>CLASSE</small><strong>{classePersonagem(classe || null, genero)}</strong><span>{ramo.length ? 'Ramos disponíveis: ' + ramo.join(' · ') : 'Ramos ainda não definidos.'}</span></div>
          </div>
          <details className="ficha-local-acordeao">
            <summary>Habilidade Básica <span>{habilidade?.nome ?? 'Não selecionada'}</span></summary>
            <div className="ficha-local-acordeao-corpo">
              <strong>{habilidade?.nome ?? 'Habilidade não selecionada'}</strong>
              <p>{habilidade ? habilidade.efeito : 'Ainda não selecionada. Nenhuma habilidade foi presumida para o personagem.'}</p>
            </div>
          </details>
          {estadoFicha === 'rascunho' && <details className="ficha-local-editor-detalhe">
            <summary><span>Planejamento de criação em Nível superior</span><small>Nível-alvo · Habilidades previstas</small></summary>
            <PlanejadorHabilidadesCriacaoLocal
              classe={classe}
              inicial={ficha.planejamentoCriacao as { nivelAlvo: number; habilidades: { nivel: number; habilidadeId: string }[] } | null | undefined}
              aoSalvar={planejamento => aoSalvarRecursos({ planejamentoCriacao: planejamento })}
              aoAlterarPendencia={pendente => registrarPendencia('Planejamento de criação', pendente)}
              autoSalvar={autoSalvar}
            />
          </details>}
          <details className="ficha-local-acordeao">
            <summary>Identidade e histórico <span>{ficha.identidade && typeof ficha.identidade === 'object' && Object.keys(ficha.identidade).length > 0 ? 'Dados registrados' : 'Dados pendentes'}</span></summary>
            <div className="ficha-local-acordeao-corpo">
              <p>Os dados de identificação editáveis permanecem no registro da personagem. Nenhum histórico narrativo é presumido nesta etapa.</p>
            </div>
          </details>
          <details className="ficha-local-acordeao">
            <summary>Proficiências <span>{dadosClasse?.proficiencias.length ?? 0} registros</span></summary>
            <div className="ficha-local-acordeao-corpo">
              <strong>Proficiências iniciais da Classe</strong>
              <ul>{(dadosClasse?.proficiencias ?? []).map(item => <li key={item}>{item}</li>)}</ul>
              {proficienciasAdicionais.length > 0 && <><strong>Ampliações por Habilidade</strong><ul>{[...new Set(proficienciasAdicionais)].map(item => <li key={item}>{item}</li>)}</ul></>}
              {regrasEspeciaisProficiencia.map(item => <p key={item}>{item}</p>)}
              <p className="ficha-local-legenda">Usar arma sem Proficiência impõe Desvantagem e não permite Rajada, Disparo Cadenciado ou Finalização com essa arma, salvo regra específica. Proficiência nominal em um modelo prevalece sobre restrições de Grupo, Família ou Grau. Este resumo informa as permissões da personagem; a validação automática por arma equipada será integrada ao módulo de Inventário.</p>
            </div>
          </details>
        </section>

        <section id="ficha-local-pericias" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>02</span> Atributos e Perícias</h2>{estadoFicha === 'rascunho' && <button type="button" className="ficha-local-editar-secao" onClick={() => abrirEditor('pericias')}>Editar seção ↗</button>}</div>
          {estadoFicha === 'rascunho'
            ? <details id="ficha-local-editor-pericias" className="ficha-local-editor-detalhe" data-ficha-editor>
                <summary><span>Editar Atributos e distribuição de Perícias</span><small>Valores · Treinamento · Pontos de Perícia</small></summary>
                <EditorAtributosPericiasLocal autoSalvar={autoSalvar} classe={classe} origem={origem} habilidadeBasica={habilidadeSelecionada} atributosIniciais={atributos} treinadaInicial={treinada} extraInicial={extra} extraTentativaInicial={extraTentativa} temTentativaEErro={temTentativaEErro} distribuicaoInicial={distribuicao} aoSalvar={aoSalvarAtributosPericias} aoAlterarPendencia={pendente => registrarPendencia('Atributos e Perícias', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Atributos e Perícias confirmados pelo servidor.' : undefined} />
              </details>
            : <p className="ficha-local-legenda">Atributos e Treinamentos da criação são preservados após a ativação. Aumentos de Atributo e novas Perícias seguem o fluxo de Progressão, sujeito à autorização do grupo e às etapas de confirmação previstas.</p>}
          <div className="ficha-local-atributos">
            {ATRIBUTOS.map(item => <div key={item.chave}><small>{item.sigla}</small><strong>{numero(atributos[item.chave])}</strong><span>{item.nome}</span></div>)}
          </div>
          <div className="ficha-local-pontos"><span>Treinamento gratuito da Origem</span><strong>{treinada || 'Pendente'}</strong></div>
          {origem === 'Amnésico' && <div className="ficha-local-pontos"><span>Segunda Perícia da Origem</span><strong>{extra || 'Pendente'}</strong></div>}
          {temTentativaEErro && <div className="ficha-local-pontos"><span>Perícia adicional — Tentativa e Erro</span><strong>{extraTentativa || 'Escolha pendente'}</strong></div>}
          <div className="ficha-local-pericias">
            {listaPericias.map(pericia => {
              const grau = Math.min(2, Math.max(0, numero(distribuicao[pericia]) + (pericia === treinada ? 1 : 0) + (pericia === extraTentativa ? 1 : 0)));
              const rotulo = grau === 2 ? 'Mestre' : grau === 1 ? 'Treinada' : 'Não Treinada';
              const atributo = ATRIBUTO_PERICIA[pericia];
              const totalBase = valorBasePericia(pericia, atributos, treinada || null, distribuicao, extra || null, extraTentativa || null);
              const passivo = valorPassivoPericia(pericia, atributos, treinada || null, distribuicao, extra || null, extraTentativa || null);
              return <div key={pericia}><span>{pericia}<small>{rotulo}{pericia === treinada ? ' · Origem' : ''}{pericia === extra ? ' · 2ª Perícia da Origem' : ''}{pericia === extraTentativa ? ' · Tentativa e Erro' : ''} · {atributo?.toUpperCase()} {atributo ? numero(atributos[atributo]) : ''} + Treinamento · Passivo {passivo}</small></span><strong>+{totalBase}</strong></div>;
            })}
          </div>
          <p className="ficha-local-legenda">O valor exibido soma o Atributo associado e o Treinamento. O Passivo exibido é o normal; Testes Passivos recebem +5 com Vantagem ou -5 com Desvantagem. A circunstância é resolvida pela Mesa. Não some o Atributo novamente ao realizar o Teste.</p>
          {configuracaoFuncionamento.modo === 'automatico' && <CalculadoraTesteLocal escopo="testes" atributos={atributos} treinada={treinada} periciaOrigemExtra={extra} periciaTentativaErroTreinada={extraTentativa} temTentativaEErro={temTentativaEErro} distribuicao={distribuicao} modoDados={configuracaoFuncionamento.modoDados} origem={origem} saDisponivel={recursosAtuais.saAtual} penalidadeMorteNivel1={penalidadeMorteNivel1} academicoDisponivel={academicoDisponivel} criminosoDisponivel={criminosoDisponivel} condicoesAtivas={condicoesAtivasIds} habilidadesAtivas={habilidadesAtivasIds} />}
        </section>

        <section id="ficha-local-combate" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>03</span> Combate</h2><span className="ficha-local-selo">PREPARAÇÃO</span></div>
          <p className="ficha-local-legenda">Resumo operacional da personagem. {origemDados === 'servidor' ? 'O painel opcional registra recursos de ação e gastos de SA confirmados pelo servidor' : 'O painel opcional registra recursos de ação e gastos de SA salvos neste dispositivo'}; não controla a Iniciativa da Mesa nem resolve rolagens ou efeitos.</p>

          <h3 className="ficha-local-subtitulo">Defesa e deslocamento</h3>
          <div className="ficha-local-grade">
            <div><small>DEFESA ATUAL</small><strong>{defesaAtual}</strong><p>Base {defesa} · {condicoesAtivasIds.includes('desorientado') ? 'AGI removida por Desorientado' : 'AGI aplicada'}{condicoesAtivasIds.includes('exposto') ? ' · −2 por Exposto' : ''}. Equipamentos ainda não aplicados.</p></div>
            {reflexosSobreviventeAtivo && <div><small>DEFESA CONTRA ATAQUES — REFLEXOS DE SOBREVIVENTE</small><strong>{defesaContraAtaques}</strong><p>Use o maior entre a Defesa atual e 10 + Acrobacia ({10 + acrobaciaAtual}). A escolha é feita contra cada Ataque; não altera a Defesa-base.</p><p>Uma vez por rodada, pode Esquivar sem gastar Reação; a próxima Ação Bônus fica comprometida. Também pode atravessar espaços ocupados por personagens ou inimigos Médios e menores sem provocar Ataque de Oportunidade.</p></div>}
            {habilidadesAtivasIds.includes('rolamento') && <div><small>ROLAMENTO</small><p>Após Esquivar com sucesso, pode reposicionar-se até 3 m sem provocar Ataques de Oportunidade.</p></div>}
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
          {penalidadeMorteNivel1 && <p className="ficha-local-aviso" role="status">Penalidade por Morte no Nível 1 ativa: −2 em Testes de Atributo, Perícia e Ataque. Será encerrada automaticamente quando a personagem recuperar o Nível 2.</p>}
          <p className="ficha-local-legenda">A BI começa em 0 e não progride sozinha. Alterações são registradas expressamente no painel de Recursos. Este resumo calcula os modificadores da fase, sem aplicá-los automaticamente a movimento, ataques ou dano. Ao confirmar BI igual ou superior ao máximo, o módulo Reanimação registra o Colapso Viral automaticamente, exceto quando PV 0 e Transformação ativa exigem decisão da Mesa sobre o fluxo a registrar; a Ficha não avança turnos nem decide morte ou transformação.</p>

          <h3 className="ficha-local-subtitulo">Combate ativo</h3>
          <PainelAcoesLocal dados={dados} saAtual={recursosAtuais.saAtual} origemDados={origemDados} origem={origem} habilidadesAtivas={habilidadesAtivasIds} valorLuta={valorBasePericia('Luta', atributos, treinada || null, distribuicao, extra || null, extraTentativa || null)} valorReflexos={valorBasePericia('Reflexos', atributos, treinada || null, distribuicao, extra || null, extraTentativa || null)} modo={configuracaoFuncionamento.modo} modoDados={configuracaoFuncionamento.modoDados} desvantagemBI={faseBi.desvantagemAtaquesETestes === true} condicoesAtivas={condicoesAtivasIds} aoSalvar={aoSalvarRecursos} />
          <RoladoresBasicosLocal modo={configuracaoFuncionamento.modo} modoDados={configuracaoFuncionamento.modoDados} visibilidade={configuracaoFuncionamento.visibilidadeRolagem} agilidade={numero(atributos.agilidade)} />
          <div className="ficha-local-grade">
            <div><small>MODIFICADOR DE INICIATIVA</small><strong>+{numero(atributos.agilidade)}</strong><p>AGI da personagem. A rolagem pontual fica disponível no modo Automático; a ordem do Encontro pertence ao Painel do Mestre.</p></div>
          </div>
          {paredeHumanaAtiva && <p className="ficha-local-aviso">PAREDE HUMANA: ao fim do seu turno, se não tiver gasto o recurso Movimento, até o início do próximo turno recebe +VIG na Defesa e RD igual a 1 + metade do Nível de Operador (arredondada para baixo; máximo 6). Confirme o gatilho e a duração na Mesa; a Ficha não acompanha o gasto de Movimento nem ativa esse efeito automaticamente.</p>}
          {configuracaoFuncionamento.modo === 'automatico' && <CalculadoraTesteLocal escopo="ataques" atributos={atributos} treinada={treinada} periciaOrigemExtra={extra} periciaTentativaErroTreinada={extraTentativa} temTentativaEErro={temTentativaEErro} distribuicao={distribuicao} modoDados={configuracaoFuncionamento.modoDados} origem={origem} saDisponivel={recursosAtuais.saAtual} aoFalharCriticoAtaque={registrarExpostoPorFalhaCritica} armaOperario={armaOperario} penalidadeMorteNivel1={penalidadeMorteNivel1} bonusAtaqueBI={faseBi.bonusTesteAtaque ?? 0} danoCorpoACorpoAdicionalBI={faseBi.danoCorpoACorpoAdicional} desvantagemBI={faseBi.desvantagemAtaquesETestes === true} condicoesAtivas={condicoesAtivasIds} habilidadesAtivas={habilidadesAtivasIds} mirarPreparado={estadoTurnoCombateAtual.valido && estadoTurnoCombateAtual.estado.manobras.mirarPreparado} />}
          <p className="ficha-local-aviso">O painel registra usos de Ação, Movimento, Ação Bônus, Reação, Interação Gratuita, Esforço e gastos de Manobra; ele não presume gatilhos nem aplica efeitos. PV, SA e BI continuam administrados nos painéis próprios. A Ficha Automática disponibiliza a consulta de perfis de armas, o Teste de Ataque e o cálculo manual de Dano; nenhum resultado altera PV. As demais modalidades de Ficha não exibem roladores nem calculadoras. Condições próprias já aplicam à calculadora as Desvantagens expressamente previstas para cada tipo de Teste/Ataque, além dos ajustes de Exposto e Desorientado na Defesa apresentada. Condições do alvo, bloqueios de Ação, efeitos dependentes de percepção, duração em turnos e demais consequências continuam sob controle da mesa. O controle de munição, recarga e propriedades operacionais das armas será integrado ao Inventário, respeitando as regras de cada arma. A ordem de Iniciativa pertence ao Painel do Mestre; a Ficha do Jogador exibe o modificador e, no modo Automático, a rolagem pontual.</p>
        </section>

        <section id="ficha-local-inventario" className="ficha-local-secao">
          <div className="ficha-local-titulo-secao"><h2><span>04</span> Inventário</h2>{estadoFicha === 'rascunho' && <button type="button" className="ficha-local-editar-secao" onClick={() => abrirEditor('inventario')}>Editar seção ↗</button>}</div>
          {estadoFicha === 'rascunho'
            ? <details id="ficha-local-editor-inventario" className="ficha-local-editor-detalhe" data-ficha-editor open>
                <summary><span>Editar Equipamento Inicial e compras</span><small>Equipamento · Catálogo · Capacidade</small></summary>
                <EditorInventarioLocal autoSalvar={autoSalvar} classe={classe} capacidade={capacidade} kitInicial={kitSelecionado} comprasIniciais={(ficha.comprasIniciais as Record<string, number>) ?? {}} revisaoCompras={numero(ficha.revisaoCompras)} aoSalvar={aoSalvarInventario} aoAlterarPendencia={pendente => registrarPendencia('Inventário', pendente)} mensagemSucesso={origemDados === 'servidor' ? 'Planejamento do inventário confirmado pelo servidor.' : undefined} />
              </details>
            : <p className="ficha-local-legenda">O equipamento inicial foi materializado na ativação e permanece preservado. A movimentação e o gerenciamento contínuo dos itens serão liberados no módulo Inventário.</p>}
          <div className="ficha-local-inventario-topo"><span>CAPACIDADE BASE</span><strong>{capacidade} Espaços</strong></div>
          <div className="ficha-local-itens">
            <strong>Itens característicos</strong>
            {itensClasse.length ? itensClasse.map(item => <div key={item.id}><strong>{item.nome}</strong><small>{item.detalhe} · Característico · 0 Espaços</small></div>) : <p>Itens característicos ainda não definidos para esta Classe.</p>}
            <strong>Equipamento Inicial · {kit ? kit.id + ' — ' + kit.nome : 'Não selecionado'}</strong>
            {inventarioPlanejado ? inventarioPlanejado.itens.map(item => <div key={item.chaveCriacao}><strong>{item.nome} × {item.quantidade}</strong><small>{item.local === 'caracteristico' ? 'Característico · vinculado à Classe' : 'Inventário · ' + item.espacos + ' Espaço(s)'} · {item.estado.tipo.replace('_',' ')}</small></div>) : <p>Não foi possível montar a prévia do inventário. Confira Classe, Origem, kit e compras do rascunho.</p>}
          </div>
          <p className="ficha-local-legenda">A capacidade considera 4 + FOR{origem === 'Mochileiro' ? ' + 1 de Mochileiro' : ''} = {capacidade} Espaços. O conjunto selecionado ocupa {inventarioPlanejado?.ocupados ?? espacosKit} de {capacidade} Espaços. Os itens aparecem em estado inicial guardado/não equipado; operações de Inventário ainda não estão integradas.</p>
        <FuncionamentoFichaLocal origemDados={origemDados} autoSalvar={autoSalvar}
          inicial={ficha.configuracaoFuncionamento as ConfiguracaoFuncionamento | undefined}
          aoSalvar={aoSalvarFuncionamento}
          aoAlterarPendencia={pendente => registrarPendencia('Funcionamento', pendente)}
        />
        <RevisaoCriacaoLocal ficha={fichaRevisao} irPara={irParaRevisao} />
        {origemDados === 'servidor' && estadoFicha === 'rascunho' && revisaoFicha !== undefined && aoConferirAtivacao && aoAtivar && <AtivacaoPersonagemLocal revision={revisaoFicha} bloqueado={bloqueadoAtivacao || secoesPendentes.size > 0} aoConferir={aoConferirAtivacao} aoAtivar={aoAtivar} />}
        </section>

        <footer className="ficha-local-rodape">AMEAÇA BIOLÓGICA RPG · {origemDados === 'servidor' ? 'DADOS NO SERVIDOR' : 'DADOS LOCAIS'} · {estadoFicha === 'completa' ? 'FICHA ATIVA' : 'RASCUNHO NÃO ATIVO'}</footer>
      </div>
      <nav className="ficha-local-nav" aria-label="Atalhos da ficha">
        <button type="button" className={secaoAtiva === 'caracteristicas' ? 'ativo' : ''} aria-current={secaoAtiva === 'caracteristicas' ? 'location' : undefined} onClick={() => { setSecaoAtiva('caracteristicas'); document.getElementById('ficha-local-caracteristicas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true"><IconeFicha tipo="perfil" /></span><small>PERFIL</small></button>
        <button type="button" className={secaoAtiva === 'pericias' ? 'ativo' : ''} aria-current={secaoAtiva === 'pericias' ? 'location' : undefined} onClick={() => { setSecaoAtiva('pericias'); document.getElementById('ficha-local-pericias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true"><IconeFicha tipo="pericias" /></span><small>PERÍCIAS</small></button>
        <button type="button" className={secaoAtiva === 'combate' ? 'ativo' : ''} aria-current={secaoAtiva === 'combate' ? 'location' : undefined} onClick={() => { setSecaoAtiva('combate'); document.getElementById('ficha-local-combate')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true"><IconeFicha tipo="combate" /></span><small>COMBATE</small></button>
        <button type="button" className={secaoAtiva === 'inventario' ? 'ativo' : ''} aria-current={secaoAtiva === 'inventario' ? 'location' : undefined} onClick={() => { setSecaoAtiva('inventario'); document.getElementById('ficha-local-inventario')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><span aria-hidden="true"><IconeFicha tipo="itens" /></span><small>ITENS</small></button>
      </nav>
    </article>
  </div>;
}
