import { HABILIDADES_BASICAS } from './habilidades.ts';
import { PERICIAS_CLASSE } from './pericias.ts';

export type GrauHabilidade = 'basica' | 'avancada' | 'superior' | 'avassaladora';
export type HabilidadeProgressao = {
  id: string;
  nome: string;
  classe: 'Agente' | 'Autodidata' | 'Operador';
  ramo: string;
  grau: GrauHabilidade;
  referencia: string;
};

const avancadas: HabilidadeProgressao[] = [
  { id: 'finalizacao-a-distancia', nome: 'Finalização à Distância', classe: 'Agente', ramo: 'Impiedoso', grau: 'avancada', referencia: 'J 29' },
  { id: 'na-minha-mira', nome: 'Na Minha Mira', classe: 'Agente', ramo: 'Oportunista', grau: 'avancada', referencia: 'J 29' },
  { id: 'contra-ataque-instintivo', nome: 'Contra-Ataque Instintivo', classe: 'Agente', ramo: 'Rapina', grau: 'avancada', referencia: 'J 30' },
  { id: 'armeira-autodidata', nome: 'Armeira Autodidata', classe: 'Autodidata', ramo: 'Combatente', grau: 'avancada', referencia: 'J 33' },
  { id: 'tentativa-e-erro', nome: 'Tentativa e Erro', classe: 'Autodidata', ramo: 'Pau para Toda Obra', grau: 'avancada', referencia: 'J 33' },
  { id: 'farmacia-de-campo', nome: 'Farmácia de Campo', classe: 'Autodidata', ramo: 'Socorrista', grau: 'avancada', referencia: 'J 34' },
  { id: 'casca-grossa', nome: 'Casca-Grossa', classe: 'Operador', ramo: 'Brigão', grau: 'avancada', referencia: 'J 37' },
  { id: 'armamento-especial', nome: 'Armamento Especial', classe: 'Operador', ramo: 'Especialista em Armamento', grau: 'avancada', referencia: 'J 37' },
  { id: 'quanto-mais-melhor', nome: 'Quanto Mais Melhor', classe: 'Operador', ramo: 'Tanque', grau: 'avancada', referencia: 'J 38' },
];

const superiores: HabilidadeProgressao[] = [
  { id: 'luta-livre', nome: 'Luta Livre', classe: 'Agente', ramo: 'Impiedoso', grau: 'superior', referencia: 'J 29' },
  { id: 'brecha-tatica', nome: 'Brecha Tática', classe: 'Agente', ramo: 'Oportunista', grau: 'superior', referencia: 'J 29' },
  { id: 'retaliacao', nome: 'Retaliação', classe: 'Agente', ramo: 'Rapina', grau: 'superior', referencia: 'J 30' },
  { id: 'arsenal-improvavel', nome: 'Arsenal Improvável', classe: 'Autodidata', ramo: 'Combatente', grau: 'superior', referencia: 'J 33' },
  { id: 'reflexos-de-sobrevivente', nome: 'Reflexos de Sobrevivente', classe: 'Autodidata', ramo: 'Pau para Toda Obra', grau: 'superior', referencia: 'J 34' },
  { id: 'primeiros-socorros', nome: 'Primeiros Socorros', classe: 'Autodidata', ramo: 'Socorrista', grau: 'superior', referencia: 'J 34' },
  { id: 'briga-de-gente-grande', nome: 'Briga de Gente Grande', classe: 'Operador', ramo: 'Brigão', grau: 'superior', referencia: 'J 37' },
  { id: 'controle-de-fogo', nome: 'Controle de Fogo', classe: 'Operador', ramo: 'Especialista em Armamento', grau: 'superior', referencia: 'J 37' },
  { id: 'parede-humana', nome: 'Parede Humana', classe: 'Operador', ramo: 'Tanque', grau: 'superior', referencia: 'J 38' },
];

const avassaladoras: HabilidadeProgressao[] = [
  { id: 'voce-aparou-um-missil', nome: 'VOCÊ APAROU UM MÍSSIL!?', classe: 'Agente', ramo: 'Classe', grau: 'avassaladora', referencia: 'J 30' },
  { id: 'code-veronica', nome: 'CODE VERONICA', classe: 'Autodidata', ramo: 'Classe', grau: 'avassaladora', referencia: 'J 34' },
  { id: 'socador-de-pedras', nome: 'SOCADOR DE PEDRAS', classe: 'Operador', ramo: 'Classe', grau: 'avassaladora', referencia: 'J 38' },
];

export const HABILIDADES_AVANCADAS = avancadas;
export const HABILIDADES_SUPERIORES = superiores;
export const HABILIDADES_AVASSALADORAS = avassaladoras;

export const HABILIDADES_PROGRESSAO: HabilidadeProgressao[] = [
  ...HABILIDADES_BASICAS.map(h => ({
    id: h.id, nome: h.nome, classe: h.classe as HabilidadeProgressao['classe'],
    ramo: h.ramo, grau: 'basica' as const, referencia: h.referencia,
  })),
  ...avancadas, ...superiores, ...avassaladoras,
];

export type EscolhaHabilidadeProgressao = { nivel: number; habilidadeId: string };
export type PendenciaProgressao = { nivel: number; grau: GrauHabilidade; motivo: string };

const CLASSES_PROGRESSAO = ['Agente', 'Autodidata', 'Operador'] as const;
const nivelValido = (nivel: number) => Number.isInteger(nivel) && nivel >= 1 && nivel <= 10;

/** Lista apenas Habilidades elegíveis para o nível, considerando escolhas anteriores. */
export function habilidadesDisponiveisParaEscolha(
  classe: string,
  nivel: number,
  escolhas: EscolhaHabilidadeProgressao[],
): HabilidadeProgressao[] {
  if (!CLASSES_PROGRESSAO.includes(classe as typeof CLASSES_PROGRESSAO[number])
    || !nivelValido(nivel) || !Array.isArray(escolhas)) return [];
  const grau = GRAUS_POR_NIVEL[nivel];
  if (!grau) return [];
  const anteriores = escolhas.filter(item => item && Number.isInteger(item.nivel) && item.nivel < nivel);
  const idsUsados = new Set(anteriores.map(item => item.habilidadeId));
  const basicas = anteriores
    .map(item => HABILIDADES_PROGRESSAO.find(h => h.id === item.habilidadeId))
    .filter((h): h is HabilidadeProgressao => !!h && h.classe === classe && h.grau === 'basica');
  const avancadasEscolhidas = anteriores
    .map(item => HABILIDADES_PROGRESSAO.find(h => h.id === item.habilidadeId))
    .filter((h): h is HabilidadeProgressao => !!h && h.classe === classe && h.grau === 'avancada');
  return HABILIDADES_PROGRESSAO.filter(h => {
    if (h.classe !== classe || h.grau !== grau || idsUsados.has(h.id)) return false;
    if (nivel === 2 && h.grau === 'basica') return !basicas.some(item => item.ramo === h.ramo);
    if (h.grau === 'avancada') return basicas.some(item => item.ramo === h.ramo);
    if (h.grau === 'superior') return avancadasEscolhidas.some(item => item.ramo === h.ramo);
    return true;
  });
}


const GRAUS_POR_NIVEL: Record<number, GrauHabilidade> = {
  1: 'basica', 2: 'basica', 4: 'avancada', 6: 'avancada', 8: 'superior', 10: 'avassaladora',
};

export function ganhosProgressaoAte(nivel: number) {
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 10) {
    throw new Error('Nível de criação deve estar entre 1 e 10.');
  }
  return {
    habilidades: Object.entries(GRAUS_POR_NIVEL)
      .filter(([n]) => Number(n) <= nivel)
      .map(([n, grau]) => ({ nivel: Number(n), grau })),
    atributos: [3, 5, 7, 9].filter(n => n <= nivel),
    pontosPericia: [4, 8].filter(n => n <= nivel),
  };
}

export function validarProgressaoHabilidades(
  classe: string,
  nivel: number,
  escolhas: EscolhaHabilidadeProgressao[],
): { valida: boolean; pendencias: PendenciaProgressao[] } {
  if (!CLASSES_PROGRESSAO.includes(classe as typeof CLASSES_PROGRESSAO[number]) || !nivelValido(nivel)) {
    return { valida: false, pendencias: [{ nivel: nivelValido(nivel) ? nivel : 1, grau: 'basica', motivo: 'Classe ou nível de progressão inválido.' }] };
  }
  const ganhos = ganhosProgressaoAte(nivel);
  const pendencias: PendenciaProgressao[] = [];
  const esperados = ganhos.habilidades;
  const porNivel = new Map<number, string>();
  if (!Array.isArray(escolhas)) {
    return {
      valida: false,
      pendencias: esperados.map(g => ({ nivel: g.nivel, grau: g.grau, motivo: 'Registro de escolhas inválido.' })),
    };
  }
  let formatoValido = true;

  for (const escolha of escolhas) {
    if (!escolha || typeof escolha !== 'object' || Array.isArray(escolha)
      || (Object.getPrototypeOf(escolha) !== Object.prototype && Object.getPrototypeOf(escolha) !== null)
      || Object.keys(escolha).sort().join('|') !== 'habilidadeId|nivel'
      || !Number.isInteger(escolha.nivel) || !esperados.some(g => g.nivel === escolha.nivel)
      || typeof escolha.habilidadeId !== 'string' || porNivel.has(escolha.nivel)) {
      formatoValido = false;
      const nivelInformado = escolha && typeof escolha === 'object' && Number.isInteger(escolha.nivel)
        ? escolha.nivel as number
        : 1;
      const ganhoInformado = esperados.find(g => g.nivel === nivelInformado);
      pendencias.push({
        nivel: ganhoInformado?.nivel ?? 1,
        grau: ganhoInformado?.grau ?? 'basica',
        motivo: 'Registro contém escolha duplicada, nível inesperado ou dados malformados.',
      });
      continue;
    }
    porNivel.set(escolha.nivel, escolha.habilidadeId);
  }

  const selecionadas: HabilidadeProgressao[] = [];
  for (const ganho of esperados) {
    const id = porNivel.get(ganho.nivel);
    if (!id) {
      pendencias.push({ nivel: ganho.nivel, grau: ganho.grau, motivo: 'Escolha uma Habilidade deste grau.' });
      continue;
    }
    const habilidade = HABILIDADES_PROGRESSAO.find(h => h.id === id);
    if (!habilidade || habilidade.classe !== classe || habilidade.grau !== ganho.grau) {
      pendencias.push({ nivel: ganho.nivel, grau: ganho.grau, motivo: 'Habilidade inexistente, de outra Classe ou de grau incompatível.' });
      continue;
    }
    if (selecionadas.some(h => h.id === habilidade.id)) {
      pendencias.push({ nivel: ganho.nivel, grau: ganho.grau, motivo: 'A mesma Habilidade não pode ser escolhida duas vezes.' });
      continue;
    }
    if (habilidade.grau === 'basica' && ganho.nivel === 2
      && selecionadas.some(h => h.grau === 'basica' && h.ramo === habilidade.ramo)) {
      pendencias.push({ nivel: ganho.nivel, grau: ganho.grau, motivo: 'No nível 2, escolha uma Habilidade Básica de outro Ramo.' });
      continue;
    }
    if (habilidade.grau === 'avancada'
      && !selecionadas.some(h => h.grau === 'basica' && h.ramo === habilidade.ramo)) {
      pendencias.push({ nivel: ganho.nivel, grau: ganho.grau, motivo: 'A Habilidade Avançada exige a Básica do mesmo Ramo.' });
      continue;
    }
    if (habilidade.grau === 'superior'
      && !selecionadas.some(h => h.grau === 'avancada' && h.ramo === habilidade.ramo)) {
      pendencias.push({ nivel: ganho.nivel, grau: ganho.grau, motivo: 'A Habilidade Superior exige a Avançada do mesmo Ramo.' });
      continue;
    }
    selecionadas.push(habilidade);
  }

  return { valida: formatoValido && pendencias.length === 0, pendencias };
}


export type ResultadoGanhoProgressao = { valido: boolean; motivo?: string };

/** Valida o aumento de Atributo concedido nos níveis 3, 5, 7 e 9. */
export function validarGanhoAtributoProgressao(
  nivel: number,
  atributo: string,
  valorAtual: number,
): ResultadoGanhoProgressao {
  if (!nivelValido(nivel)) return { valido: false, motivo: 'Nível de progressão inválido.' };
  const ganhos = ganhosProgressaoAte(nivel);
  if (!ganhos.atributos.includes(nivel)) return { valido: false, motivo: 'Este nível não concede aumento de Atributo.' };
  if (!['forca', 'agilidade', 'vigor', 'astucia'].includes(atributo)) return { valido: false, motivo: 'Atributo desconhecido.' };
  if (!Number.isInteger(valorAtual) || valorAtual < 0 || valorAtual >= 5) {
    return { valido: false, motivo: 'O Atributo precisa estar entre 0 e 4 antes do aumento.' };
  }
  return { valido: true };
}

/** Valida o ponto de Perícia dos níveis 4 e 8, restrito às Perícias da Classe. */
export function validarGanhoPericiaProgressao(
  classe: string,
  nivel: number,
  pericia: string,
  grauAtual: number,
): ResultadoGanhoProgressao {
  if (!nivelValido(nivel)) return { valido: false, motivo: 'Nível de progressão inválido.' };
  if (!CLASSES_PROGRESSAO.includes(classe as typeof CLASSES_PROGRESSAO[number])) return { valido: false, motivo: 'Classe inválida.' };
  const ganhos = ganhosProgressaoAte(nivel);
  if (!ganhos.pontosPericia.includes(nivel)) return { valido: false, motivo: 'Este nível não concede Ponto de Perícia.' };
  if (!(PERICIAS_CLASSE[classe] ?? []).includes(pericia)) return { valido: false, motivo: 'A progressão só permite Perícias da Classe.' };
  if (!Number.isInteger(grauAtual) || grauAtual < 0 || grauAtual >= 2) {
    return { valido: false, motivo: 'A Perícia precisa estar abaixo do grau Mestre.' };
  }
  return { valido: true };
}


export type MetodoProgressao = 'marco_narrativo' | 'missoes';
export type EstadoProgressao = {
  nivelAtual: number;
  metodo?: MetodoProgressao;
  avancoAutorizado?: boolean;
  /** Campo legado opcional; não bloqueia progressão por Missões. */
  autorizacaoMestre?: boolean;
  missoesCompletadas: number;
  marcoNarrativoConcedido?: boolean;
  missoesCompletadasNaUltimaMorte?: number | null;
  marcoNarrativoAposUltimaMorte?: boolean;
  descansoCompletoEmSalaDescanso: boolean;
};

const MISSOES_POR_NIVEL = [0, 1, 3, 6, 10, 15, 21, 28, 35, 42];

/** Avalia o requisito de progressão sem aplicar o Nível à ficha. */
export function avaliarDisponibilidadeProgressao(estado: EstadoProgressao): {
  disponivel: boolean; proximoNivel: number | null; motivo: string;
} {
  if (!estado || typeof estado !== 'object' || Array.isArray(estado)
    || !nivelValido(estado.nivelAtual)
    || (estado.metodo === undefined ? typeof estado.avancoAutorizado !== 'boolean' : !['marco_narrativo', 'missoes'].includes(estado.metodo) || estado.avancoAutorizado !== undefined)
    || (estado.autorizacaoMestre !== undefined && typeof estado.autorizacaoMestre !== 'boolean')
    || !Number.isSafeInteger(estado.missoesCompletadas) || estado.missoesCompletadas < 0
    || typeof estado.descansoCompletoEmSalaDescanso !== 'boolean'
    || (estado.marcoNarrativoConcedido !== undefined && typeof estado.marcoNarrativoConcedido !== 'boolean')
    || (estado.marcoNarrativoAposUltimaMorte !== undefined && typeof estado.marcoNarrativoAposUltimaMorte !== 'boolean')
    || (estado.missoesCompletadasNaUltimaMorte !== undefined && estado.missoesCompletadasNaUltimaMorte !== null
      && (!Number.isSafeInteger(estado.missoesCompletadasNaUltimaMorte) || estado.missoesCompletadasNaUltimaMorte < 0))) {
    return { disponivel: false, proximoNivel: null, motivo: 'Registro de progressão inválido.' };
  }
  if (estado.nivelAtual >= 10) return { disponivel: false, proximoNivel: null, motivo: 'A personagem já alcançou o nível máximo.' };
  const proximoNivel = estado.nivelAtual + 1;
  const houveMorteRegistrada = estado.missoesCompletadasNaUltimaMorte !== undefined
    && estado.missoesCompletadasNaUltimaMorte !== null;
  const requisitoCumprido = estado.metodo === undefined
    ? estado.avancoAutorizado === true
    : estado.metodo === 'marco_narrativo'
      ? estado.marcoNarrativoConcedido === true
      : estado.missoesCompletadas >= MISSOES_POR_NIVEL[proximoNivel - 1];
  if (!requisitoCumprido) return {
    disponivel: false, proximoNivel,
    motivo: estado.metodo === undefined
      ? houveMorteRegistrada
        ? 'Após perder um Nível por Morte, é necessária nova autorização de avanço pelo grupo/Narrador.'
        : 'Aguardando autorização de avanço pelo grupo/Narrador; o critério é decidido fora do WebApp.'
      : estado.metodo === 'marco_narrativo'
        ? 'Aguardando concessão de Marco Narrativo pelo Narrador.'
        : `A personagem precisa alcançar ${MISSOES_POR_NIVEL[proximoNivel - 1]} Missões Completadas.`,
  };
  if (houveMorteRegistrada) {
    const avancouAposMorte = estado.metodo === undefined
      ? estado.avancoAutorizado === true
      : estado.metodo === 'missoes'
        ? estado.missoesCompletadas > estado.missoesCompletadasNaUltimaMorte!
        : estado.marcoNarrativoAposUltimaMorte === true;
    if (!avancouAposMorte) return {
      disponivel: false, proximoNivel,
      motivo: estado.metodo === undefined
        ? 'Após perder um Nível por Morte, é necessária nova autorização de avanço pelo grupo/Narrador.'
        : 'Após perder um Nível por Morte, é necessário concluir uma nova Missão ou alcançar um novo Marco Narrativo.',
    };
  }
  if (!estado.descansoCompletoEmSalaDescanso) return {
    disponivel: false, proximoNivel,
    motivo: 'A subida só pode ser aplicada durante Descanso Completo em Sala de Descanso.',
  };
  return { disponivel: true, proximoNivel, motivo: 'Progressão disponível para aplicação neste Descanso Completo.' };
}


/** Aplica um ganho já conquistado de Atributo, sem alterar a ficha recebida. */
export function aplicarGanhoAtributoProgressao(
  nivel: number,
  atributo: string,
  atributos: Record<string, number>,
): Record<string, number> {
  const validacao = validarGanhoAtributoProgressao(nivel, atributo, atributos?.[atributo]);
  const nomes = ['forca', 'agilidade', 'vigor', 'astucia'];
  if (!validacao.valido || !atributos || typeof atributos !== 'object' || Array.isArray(atributos)
    || Object.getPrototypeOf(atributos) !== Object.prototype
    || Object.keys(atributos).sort().join('|') !== [...nomes].sort().join('|')
    || Object.values(atributos).some(valor => !Number.isSafeInteger(valor) || valor < 0 || valor > 5)) {
    throw new Error(validacao.motivo ?? 'Atributos inválidos para progressão.');
  }
  return { ...atributos, [atributo]: atributos[atributo] + 1 };
}

/** Aplica um Ponto de Perícia de nível 4 ou 8, respeitando Classe, Origem e teto Mestre. */
export function aplicarGanhoPericiaProgressao(
  classe: string,
  nivel: number,
  pericia: string,
  distribuicao: Record<string, number>,
  periciaOrigemTreinada: string | null = null,
): Record<string, number> {
  if (!distribuicao || typeof distribuicao !== 'object' || Array.isArray(distribuicao)
    || Object.getPrototypeOf(distribuicao) !== Object.prototype
    || Object.entries(distribuicao).some(([nome, pontos]) =>
      !Object.values(PERICIAS_CLASSE).flat().includes(nome)
      || !Number.isSafeInteger(pontos) || pontos < 0 || pontos > 2)) {
    throw new Error('Distribuição de Perícias inválida para progressão.');
  }
  if (periciaOrigemTreinada !== null && typeof periciaOrigemTreinada !== 'string') {
    throw new Error('Treinamento de Origem inválido para progressão.');
  }
  const grauAtual = (distribuicao[pericia] ?? 0) + (pericia === periciaOrigemTreinada ? 1 : 0);
  const validacao = validarGanhoPericiaProgressao(classe, nivel, pericia, grauAtual);
  if (!validacao.valido) throw new Error(validacao.motivo ?? 'Ganho de Perícia inválido.');
  return { ...distribuicao, [pericia]: (distribuicao[pericia] ?? 0) + 1 };
}
