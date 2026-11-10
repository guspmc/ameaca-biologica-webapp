import { HABILIDADES_PROGRESSAO, ganhosProgressaoAte, validarGanhoPericiaProgressao, avaliarDisponibilidadeProgressao } from './progressaoHabilidades.ts';
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
  morteLocalNaoConfirmada?: boolean;
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
  const chavesComMorteLocal = [...chaves, 'morteLocalNaoConfirmada'];
  const chavesValor = objetoSimples(valor) ? Object.keys(valor).sort().join('|') : '';
  if (!objetoSimples(valor)
    || (chavesValor !== [...chaves].sort().join('|') && chavesValor !== chavesComMorteLocal.sort().join('|'))
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
    || (valor.morteLocalNaoConfirmada !== undefined && typeof valor.morteLocalNaoConfirmada !== 'boolean')
    || !Array.isArray(valor.beneficiosPorNivel)
    || !['Agente', 'Autodidata', 'Operador'].includes(classe)) return false;

  const houveMorte = valor.missoesCompletadasNaUltimaMorte !== null;
  if (!houveMorte && valor.morteLocalNaoConfirmada === true) return false;
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
    morteLocalNaoConfirmada: false,
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


export type PedidoProgressaoPersistente = {
  nivel: number;
  estado: 'aguardando_descanso' | 'descanso_confirmado';
};

/** Valida solicitação pendente sem conceder Nível nem benefícios. */
export function pedidoProgressaoPersistenteValido(
  valor: unknown,
  progressao: unknown,
  classe: string,
): valor is PedidoProgressaoPersistente {
  if (!estadoProgressaoPersistenteValido(progressao, classe)
    || !objetoSimples(valor)
    || Object.keys(valor).sort().join('|') !== 'estado|nivel'
    || !Number.isSafeInteger(valor.nivel)
    || (valor.nivel as number) !== progressao.nivelAtual + 1
    || (valor.nivel as number) > 10
    || !['aguardando_descanso', 'descanso_confirmado'].includes(String(valor.estado))) return false;
  const requisito = avaliarDisponibilidadeProgressao({
    nivelAtual: progressao.nivelAtual,
    metodo: progressao.metodo,
    missoesCompletadas: progressao.missoesCompletadas,
    marcoNarrativoConcedido: progressao.marcoNarrativoConcedido,
    missoesCompletadasNaUltimaMorte: progressao.missoesCompletadasNaUltimaMorte,
    marcoNarrativoAposUltimaMorte: progressao.marcoNarrativoAposUltimaMorte,
    descansoCompletoEmSalaDescanso: true,
  });
  return requisito.disponivel && requisito.proximoNivel === valor.nivel;
}

/** Registra o pedido de avanço quando o requisito de Missões/Marco foi cumprido. */
export function solicitarGanhoNivel(
  progressao: EstadoProgressaoPersistente,
  classe: string,
): PedidoProgressaoPersistente {
  if (!estadoProgressaoPersistenteValido(progressao, classe)) {
    throw new Error('Estado de Progressão inválido.');
  }
  const requisito = avaliarDisponibilidadeProgressao({
    nivelAtual: progressao.nivelAtual,
    metodo: progressao.metodo,
    missoesCompletadas: progressao.missoesCompletadas,
    marcoNarrativoConcedido: progressao.marcoNarrativoConcedido,
    missoesCompletadasNaUltimaMorte: progressao.missoesCompletadasNaUltimaMorte,
    marcoNarrativoAposUltimaMorte: progressao.marcoNarrativoAposUltimaMorte,
    descansoCompletoEmSalaDescanso: true,
  });
  if (!requisito.disponivel || requisito.proximoNivel === null) {
    throw new Error(requisito.motivo);
  }
  return { nivel: requisito.proximoNivel, estado: 'aguardando_descanso' };
}

/** Só confirma a etapa pendente após o salvamento de Descanso Completo na Sala de Descanso. */
export function confirmarDescansoCompletoProgressao(
  pedido: unknown,
  progressao: unknown,
  classe: string,
  local: string,
): PedidoProgressaoPersistente {
  if (local !== 'sala_descanso') {
    throw new Error('A Progressão exige Descanso Completo na Sala de Descanso.');
  }
  if (!pedidoProgressaoPersistenteValido(pedido, progressao, classe)) {
    throw new Error('Solicitação de Progressão inválida ou requisito não cumprido.');
  }
  if (pedido.estado !== 'aguardando_descanso') {
    throw new Error('Esta solicitação já foi confirmada ou não aguarda Descanso.');
  }
  return { nivel: pedido.nivel, estado: 'descanso_confirmado' };
}

/**
 * Registra a Morte na Ficha Offline, revertendo somente os benefícios exatos
 * do Nível perdido. O contador de Missões é preservado; seu valor no momento
 * da Morte é guardado como marco para exigir progresso posterior.
 */
export function registrarMorteProgressao(
  estado: EstadoProgressaoPersistente,
  classe: string,
): EstadoProgressaoPersistente {
  if (!estadoProgressaoPersistenteValido(estado, classe)) {
    throw new Error('Estado de Progressão inválido; a Morte não pode ser registrada.');
  }
  const registroNivel = estado.nivelAtual === 1
    ? []
    : estado.beneficiosPorNivel[estado.nivelAtual - 2]?.beneficios;
  const plano = planejarPerdaNivelPorMorte(estado.nivelAtual, registroNivel);
  if (!plano.aplicavel) {
    throw new Error(`A Morte não pode ser registrada: ${plano.pendencias.join(' ')}`);
  }
  const atualizado: EstadoProgressaoPersistente = {
    ...structuredClone(estado),
    nivelAtual: plano.nivelResultante,
    missoesCompletadasNaUltimaMorte: estado.missoesCompletadas,
    nivelNaUltimaMorte: estado.nivelAtual,
    marcoNarrativoConcedido: false,
    marcoNarrativoAposUltimaMorte: false,
    penalidadeMorteNivel1: plano.penalidadeMorteNivel1,
    morteLocalNaoConfirmada: true,
    beneficiosPorNivel: estado.beneficiosPorNivel
      .filter(registro => registro.nivel <= plano.nivelResultante),
  };
  if (!estadoProgressaoPersistenteValido(atualizado, classe)) {
    throw new Error('O histórico resultante da Morte não passou pela validação. Nenhuma alteração foi aplicada.');
  }
  return atualizado;
}
