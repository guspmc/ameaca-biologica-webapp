import { HABILIDADES_PROGRESSAO, ganhosProgressaoAte, validarGanhoPericiaProgressao } from './progressaoHabilidades.ts';
import { planejarPerdaNivelPorMorte, type BeneficioNivelRegistrado } from './progressaoMorte.ts';

export type MetodoProgressaoPersistente = 'marco_narrativo' | 'missoes';
export type EstadoProgressaoPersistente = {
  versao: 1;
  nivelAtual: number;
  metodo: MetodoProgressaoPersistente;
  missoesCompletadas: number;
  marcoNarrativoConcedido: boolean;
  missoesCompletadasNaUltimaMorte: number | null;
  nivelNaUltimaMorte: number | null;
  marcoNarrativoAposUltimaMorte: boolean;
  penalidadeMorteNivel1: boolean;
  beneficiosPorNivel: { nivel: number; beneficios: BeneficioNivelRegistrado[] }[];
};

const objetoSimples = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

/**
 * Contrato versionado para o estado de campanha. Não aplica ganhos nem altera
 * a ficha: valida o histórico necessário para uma futura aplicação atômica.
 * O histórico registra os benefícios dos níveis 2..N; o nível 1 não é perdido.
 */
export function estadoProgressaoPersistenteValido(valor: unknown, classe: string): valor is EstadoProgressaoPersistente {
  const chaves = [
    'versao', 'nivelAtual', 'metodo', 'missoesCompletadas', 'marcoNarrativoConcedido',
    'missoesCompletadasNaUltimaMorte', 'nivelNaUltimaMorte', 'marcoNarrativoAposUltimaMorte',
    'penalidadeMorteNivel1', 'beneficiosPorNivel',
  ];
  if (!objetoSimples(valor) || Object.keys(valor).sort().join('|') !== [...chaves].sort().join('|')
    || valor.versao !== 1 || !Number.isSafeInteger(valor.nivelAtual)
    || (valor.nivelAtual as number) < 1 || (valor.nivelAtual as number) > 10
    || !['marco_narrativo', 'missoes'].includes(String(valor.metodo))
    || !Number.isSafeInteger(valor.missoesCompletadas) || (valor.missoesCompletadas as number) < 0
    || typeof valor.marcoNarrativoConcedido !== 'boolean'
    || (valor.missoesCompletadasNaUltimaMorte !== null
      && (!Number.isSafeInteger(valor.missoesCompletadasNaUltimaMorte)
        || (valor.missoesCompletadasNaUltimaMorte as number) < 0
        ))
    || (valor.nivelNaUltimaMorte !== null && (!Number.isSafeInteger(valor.nivelNaUltimaMorte)
      || (valor.nivelNaUltimaMorte as number) < 1 || (valor.nivelNaUltimaMorte as number) > 10))
    || typeof valor.marcoNarrativoAposUltimaMorte !== 'boolean'
    || typeof valor.penalidadeMorteNivel1 !== 'boolean'
    || !Array.isArray(valor.beneficiosPorNivel)
    || !['Agente', 'Autodidata', 'Operador'].includes(classe)) return false;

  const houveMorte = valor.missoesCompletadasNaUltimaMorte !== null;
  if (houveMorte !== (valor.nivelNaUltimaMorte !== null)
    || (!houveMorte && (valor.marcoNarrativoAposUltimaMorte || valor.penalidadeMorteNivel1))
    || (houveMorte && (valor.nivelAtual as number) < Math.max(1, (valor.nivelNaUltimaMorte as number) - 1))
    || (houveMorte && valor.penalidadeMorteNivel1 !== (valor.nivelNaUltimaMorte === 1 && valor.nivelAtual === 1))) return false;

  const nivelAtual = valor.nivelAtual as number;
  const registros = valor.beneficiosPorNivel as unknown[];
  if (registros.length !== nivelAtual - 1) return false;
  const porNivel = new Map<number, unknown[]>();
  for (let nivel = 2; nivel <= nivelAtual; nivel++) {
    const registro = registros[nivel - 2];
    if (!objetoSimples(registro) || Object.keys(registro).sort().join('|') !== 'beneficios|nivel'
      || registro.nivel !== nivel || !Array.isArray(registro.beneficios)) return false;
    const plano = planejarPerdaNivelPorMorte(nivel, registro.beneficios);
    if (!plano.aplicavel) return false;
    porNivel.set(nivel, registro.beneficios);
  }

  for (const [nivel, beneficios] of porNivel) {
    for (const beneficio of beneficios) {
      if (!objetoSimples(beneficio)) return false;
      if (beneficio.tipo === 'habilidade') {
        const grau = ganhosProgressaoAte(nivel).habilidades.find(item => item.nivel === nivel)?.grau;
        const catalogada = HABILIDADES_PROGRESSAO.find(item => item.id === beneficio.habilidadeId);
        if (!catalogada || catalogada.classe !== classe || catalogada.grau !== grau) return false;
      } else if (beneficio.tipo === 'pericia') {
        if (!validarGanhoPericiaProgressao(classe, nivel, String(beneficio.pericia), Number(beneficio.grauAntes)).valido) return false;
      }
    }
  }
  return true;
}

/** Atualiza somente o contador editável; não concede nível nem altera benefícios. */
export function atualizarContadorMissoes(
  estado: EstadoProgressaoPersistente,
  classe: string,
  quantidade: number,
): EstadoProgressaoPersistente {
  if (!estadoProgressaoPersistenteValido(estado, classe) || !Number.isSafeInteger(quantidade) || quantidade < 0) {
    throw new Error('Estado ou contador de Missões inválido.');
  }
  return { ...structuredClone(estado), missoesCompletadas: quantidade };
}

 
/** Cria o estado inicial da Progressão pertencente à própria Ficha.
 * Marco Narrativo é o padrão oficial preferencial; Missões permanece opcional.
 * Não configura nem consulta a Mesa e não concede benefícios.
 */
export function criarEstadoProgressaoInicial(
  metodo: MetodoProgressaoPersistente = 'marco_narrativo',
): EstadoProgressaoPersistente {
  if (metodo !== 'marco_narrativo' && metodo !== 'missoes') {
    throw new Error('Método de Progressão inválido.');
  }
  return {
    versao: 1,
    nivelAtual: 1,
    metodo,
    missoesCompletadas: 0,
    marcoNarrativoConcedido: false,
    missoesCompletadasNaUltimaMorte: null,
    nivelNaUltimaMorte: null,
    marcoNarrativoAposUltimaMorte: false,
    penalidadeMorteNivel1: false,
    beneficiosPorNivel: [],
  };
}

/** Registra um Marco comunicado pelo Narrador; não sobe Nível nem aplica benefícios. */
export function registrarMarcoNarrativo(
  estado: EstadoProgressaoPersistente,
  classe: string,
): EstadoProgressaoPersistente {
  if (!estadoProgressaoPersistenteValido(estado, classe)) {
    throw new Error('Estado de Progressão inválido.');
  }
  if (estado.metodo !== 'marco_narrativo') {
    throw new Error('Esta Ficha utiliza contagem de Missões, não Marco Narrativo.');
  }
  const houveMorte = estado.nivelNaUltimaMorte !== null;
  return {
    ...structuredClone(estado),
    marcoNarrativoConcedido: true,
    marcoNarrativoAposUltimaMorte: houveMorte ? true : estado.marcoNarrativoAposUltimaMorte,
  };
}
