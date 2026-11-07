export const CATALOGO_CONDICOES = [
  { id: 'agarrado', nome: 'Agarrado', efeito: 'Movimento 0 e não recebe bônus de Movimento. Quem agarra pode arrastar o alvo com Movimento pela metade, salvo alvo 2 ou mais categorias menor.' },
  { id: 'amedrontado', nome: 'Amedrontado', efeito: 'Desvantagem em testes aplicáveis enquanto perceber a fonte do medo; tenta afastar-se/fugir e não pode aproximar-se voluntariamente.' },
  { id: 'atordoado', nome: 'Atordoado', efeito: 'Não pode realizar Ações, Reações ou Movimento. Ataques e Manobras ofensivas resistidas contra o alvo recebem Vantagem.' },
  { id: 'caido', nome: 'Caído', efeito: 'Só se desloca Rastejando. Levantar custa metade do Movimento. Ataques próprios têm Desvantagem; ataques Corpo a Corpo contra o alvo têm Vantagem e ataques à distância têm Desvantagem. Com Movimento 0, não pode levantar-se.' },
  { id: 'cego', nome: 'Cego', efeito: 'Tem Desvantagem em seus Ataques; Ataques contra ele têm Vantagem; falha automaticamente em testes que dependam exclusivamente de visão.' },
  { id: 'corrosao', nome: 'Corrosão', efeito: 'Causa 1d4 de Dano ao final do turno. No início do turno, Fortitude DT 12 encerra a Condição imediatamente e evita o Dano daquele turno. Fora de combate, causa Dano uma única vez por exposição, salvo regra específica.' },
  { id: 'desacordado', nome: 'Desacordado', efeito: 'Inconsciente: não realiza Ações ou Reações e não percebe conscientemente o ambiente. Em 0 PV, segue Reanimação; outras fontes determinam como despertar.' },
  { id: 'desorientado', nome: 'Desorientado', efeito: 'Não pode usar Atacar, tem Desvantagem em Testes de Perícia e perde a contribuição de AGI na Defesa.' },
  { id: 'enfraquecido', nome: 'Enfraquecido', efeito: 'Desvantagem em Testes baseados em FOR e em Fortitude.' },
  { id: 'exposto', nome: 'Exposto', efeito: 'Defesa -2. Não impõe penalidade em Ataques, Perícias, Reações ou outros valores. Quando causado por Falha Crítica, dura até o final do próximo turno da criatura.' },
  { id: 'imobilizado', nome: 'Imobilizado', efeito: 'Movimento 0; Desvantagem nos próprios Ataques; Ataques contra o alvo têm Vantagem; Desvantagem em Reflexos.' },
  { id: 'incapacitado', nome: 'Incapacitado', efeito: 'Não pode realizar Ações nem Reações.' },
  { id: 'intoxicado', nome: 'Intoxicado', efeito: 'Movimento reduzido em 3 m. Desvantagem em Testes de Ataque e Testes de Perícia; Testes de Atributo permanecem normais.' },
  { id: 'queimadura', nome: 'Queimadura', efeito: 'Causa 1d6 de Dano ao final de cada turno. Se a fonte não definir duração, dura 1d4 rodadas. No início de cada turno, Reflexos DT 12 apaga as chamas em sucesso. Fora de combate, aplica o Dano apenas uma vez.' },
  { id: 'surdo', nome: 'Surdo', efeito: 'Falha automaticamente em testes que dependam exclusivamente de audição.' },
  { id: 'surpreendido', nome: 'Surpreendido', efeito: 'No primeiro turno, não pode mover-se nem realizar Ações. Enquanto estiver Surpreendido, não pode usar Reações nem gastar SA. Normalmente termina ao fim do primeiro turno da própria criatura.' },
] as const;

export type CondicaoId = typeof CATALOGO_CONDICOES[number]['id'];
export type MarcoDuracao = 'inicio_turno' | 'fim_turno' | 'fim_rodada' | 'narrativa' | 'manual';
export type DuracaoCondicao = {
  tipo: 'turnos' | 'rodadas' | 'narrativa' | 'permanente';
  restante: number | null;
  marco: MarcoDuracao;
};
export type InstanciaCondicao = {
  id: string;
  condicao: CondicaoId;
  fonte: string;
  alvoId: string;
  regra: string;
  aplicadaEm: string;
  duracao: DuracaoCondicao;
  estado: 'ativa' | 'encerrada';
  encerradaEm: string | null;
  motivoEncerramento: string | null;
};
export type EstadoCondicoes = {
  ativas: InstanciaCondicao[];
  historico: InstanciaCondicao[];
};

const IDS = new Set<string>(CATALOGO_CONDICOES.map(c => c.id));
const MARCOS = ['inicio_turno', 'fim_turno', 'fim_rodada', 'narrativa', 'manual'] as const;
const objetoSimples = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
  && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const texto = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const dataValida = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

export function duracaoCondicaoValida(v: unknown): v is DuracaoCondicao {
  if (!objetoSimples(v) || Object.keys(v).sort().join('|') !== 'marco|restante|tipo') return false;
  if (!MARCOS.includes(v.marco as MarcoDuracao)) return false;
  if (!['turnos', 'rodadas', 'narrativa', 'permanente'].includes(String(v.tipo))) return false;
  if (v.tipo === 'turnos' || v.tipo === 'rodadas') {
    return Number.isSafeInteger(v.restante) && (v.restante as number) >= 0
      && (v.tipo === 'turnos' ? ['inicio_turno', 'fim_turno'].includes(String(v.marco))
        : ['fim_rodada'].includes(String(v.marco)));
  }
  if (v.tipo === 'narrativa') return v.restante === null && v.marco === 'narrativa';
  return v.restante === null && v.marco === 'manual';
}

export function instanciaCondicaoValida(v: unknown, estadoEsperado?: 'ativa' | 'encerrada'): v is InstanciaCondicao {
  if (!objetoSimples(v) || Object.keys(v).sort().join('|') !==
    'alvoId|aplicadaEm|condicao|duracao|encerradaEm|estado|fonte|id|motivoEncerramento|regra') return false;
  if (!texto(v.id, 160) || !IDS.has(String(v.condicao)) || !texto(v.fonte, 300)
    || !texto(v.alvoId, 160) || !texto(v.regra, 1200) || !dataValida(v.aplicadaEm)
    || !duracaoCondicaoValida(v.duracao)) return false;
  if (v.estado !== 'ativa' && v.estado !== 'encerrada') return false;
  if (estadoEsperado && v.estado !== estadoEsperado) return false;
  if (v.estado === 'ativa') return v.encerradaEm === null && v.motivoEncerramento === null;
  return dataValida(v.encerradaEm) && texto(v.motivoEncerramento, 300);
}

export function estadoCondicoesValido(v: unknown): v is EstadoCondicoes {
  if (!objetoSimples(v) || Object.keys(v).sort().join('|') !== 'ativas|historico'
    || !Array.isArray(v.ativas) || !Array.isArray(v.historico)) return false;
  const ids = new Set<string>();
  for (const item of v.ativas) {
    if (!instanciaCondicaoValida(item, 'ativa') || ids.has(item.id)) return false;
    ids.add(item.id);
  }
  for (const item of v.historico) {
    if (!instanciaCondicaoValida(item, 'encerrada') || ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return true;
}

export function criarEstadoCondicoes(): EstadoCondicoes {
  return { ativas: [], historico: [] };
}

/** Adiciona uma instância individual. Durações diferentes coexistem sem duplicar o efeito mecânico. */
export function adicionarCondicao(estado: EstadoCondicoes, instancia: Omit<InstanciaCondicao, 'estado' | 'encerradaEm' | 'motivoEncerramento'>): EstadoCondicoes {
  if (!estadoCondicoesValido(estado)) throw new Error('Estado de Condições inválido.');
  const nova: InstanciaCondicao = { ...instancia, estado: 'ativa', encerradaEm: null, motivoEncerramento: null };
  if (!instanciaCondicaoValida(nova, 'ativa')) throw new Error('Instância de Condição inválida.');
  if ([...estado.ativas, ...estado.historico].some(item => item.id === nova.id)) throw new Error('Identificador de Condição já utilizado.');
  return { ativas: [...estado.ativas, nova], historico: [...estado.historico] };
}

/** Encerramento explícito preserva a instância no histórico. Não executa testes ou danos. */
export function encerrarCondicao(estado: EstadoCondicoes, id: string, quando: string, motivo: string): EstadoCondicoes {
  if (!estadoCondicoesValido(estado) || !texto(id, 160) || !dataValida(quando) || !texto(motivo, 300)) {
    throw new Error('Dados inválidos para encerrar Condição.');
  }
  const indice = estado.ativas.findIndex(item => item.id === id);
  if (indice < 0) throw new Error('Condição ativa não encontrada.');
  const item = estado.ativas[indice];
  const encerrada: InstanciaCondicao = { ...item, estado: 'encerrada', encerradaEm: quando, motivoEncerramento: motivo };
  return {
    ativas: estado.ativas.filter((_, i) => i !== indice),
    historico: [...estado.historico, encerrada],
  };
}

/** Ajuste de contador é explícito; expirar nunca aplica Dano nem Testes automaticamente. */
export function ajustarDuracaoCondicao(estado: EstadoCondicoes, id: string, delta: number): EstadoCondicoes {
  if (!estadoCondicoesValido(estado) || !texto(id, 160) || !Number.isSafeInteger(delta) || delta === 0) {
    throw new Error('Ajuste de duração inválido.');
  }
  const indice = estado.ativas.findIndex(item => item.id === id);
  if (indice < 0) throw new Error('Condição ativa não encontrada.');
  const item = estado.ativas[indice];
  if (item.duracao.restante === null) throw new Error('Esta duração não possui contador numérico.');
  const restante = item.duracao.restante + delta;
  if (restante < 0) throw new Error('O contador não pode ficar negativo.');
  const atualizadas = [...estado.ativas];
  atualizadas[indice] = { ...item, duracao: { ...item.duracao, restante } };
  return { ativas: atualizadas, historico: [...estado.historico] };
}

/** Retorna apenas uma ocorrência mecânica por condição; mantém cada fonte/duração separada. */
export function condicoesMecanicasAtivas(estado: EstadoCondicoes): CondicaoId[] {
  if (!estadoCondicoesValido(estado)) throw new Error('Estado de Condições inválido.');
  return [...new Set(estado.ativas.map(item => item.condicao))];
}
