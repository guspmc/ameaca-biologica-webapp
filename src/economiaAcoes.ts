export type RecursoAcao = 'acao' | 'movimento' | 'acaoBonus' | 'reacao';
export type CompraEsforco = RecursoAcao;
export type EstadoEconomiaAcoes = {
  saAtual: number;
  saGastaNaJanela: number;
  normaisUsados: Record<RecursoAcao, boolean>;
  comprasEsforco: Record<RecursoAcao, number>;
  interacaoGratuitaUsada: boolean;
  turnoEmAndamento: boolean;
};

export const CUSTO_ESFORCO: Record<CompraEsforco, number> = { movimento: 1, acaoBonus: 1, reacao: 1, acao: 2 };
export const LIMITE_SA_JANELA_ESFORCO = 3;
const RECURSOS: RecursoAcao[] = ['acao', 'movimento', 'acaoBonus', 'reacao'];

export function economiaAcoesInicial(saAtual: number): EstadoEconomiaAcoes {
  if (!Number.isSafeInteger(saAtual) || saAtual < 0) throw new Error('SA atual deve ser um inteiro não negativo.');
  return {
    saAtual, saGastaNaJanela: 0,
    normaisUsados: { acao: false, movimento: false, acaoBonus: false, reacao: false },
    comprasEsforco: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    interacaoGratuitaUsada: false, turnoEmAndamento: true,
  };
}

export function saNaJanelaEsforco(estado: EstadoEconomiaAcoes): number { return estado.saGastaNaJanela; }

function validarEstado(estado: EstadoEconomiaAcoes): void {
  if (!estado || !Number.isSafeInteger(estado.saAtual) || estado.saAtual < 0
    || !Number.isSafeInteger(estado.saGastaNaJanela) || estado.saGastaNaJanela < 0
    || !estado.normaisUsados || RECURSOS.some(r => typeof estado.normaisUsados[r] !== 'boolean')
    || !estado.comprasEsforco || RECURSOS.some(r => !Number.isSafeInteger(estado.comprasEsforco[r]) || estado.comprasEsforco[r] < 0)
    || typeof estado.interacaoGratuitaUsada !== 'boolean' || typeof estado.turnoEmAndamento !== 'boolean') throw new Error('Estado da economia de ações inválido.');
}

export function consumirRecursoNormal(estado: EstadoEconomiaAcoes, recurso: RecursoAcao): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!RECURSOS.includes(recurso)) throw new Error('Recurso de ação desconhecido.');
  if (!estado.turnoEmAndamento && recurso !== 'reacao') throw new Error('Somente Reação pode ser registrada fora do próprio turno.');
  if (estado.normaisUsados[recurso]) throw new Error('Este recurso normal já foi utilizado neste turno.');
  return { ...estado, normaisUsados: { ...estado.normaisUsados, [recurso]: true } };
}

/** Ação Completa normalmente compromete Ação e Movimento juntos. */
export function consumirAcaoCompleta(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!estado.turnoEmAndamento) throw new Error('A Ação Completa só pode ser usada no próprio turno.');
  if (estado.normaisUsados.acao || estado.normaisUsados.movimento) throw new Error('A Ação Completa exige Ação e Movimento normais disponíveis.');
  return { ...estado, normaisUsados: { ...estado.normaisUsados, acao: true, movimento: true } };
}

export function consumirInteracaoGratuita(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!estado.turnoEmAndamento) throw new Error('A Interação Gratuita só pode ser usada no próprio turno.');
  if (estado.interacaoGratuitaUsada) throw new Error('A Interação Gratuita já foi utilizada neste turno.');
  return { ...estado, interacaoGratuitaUsada: true };
}

function registrarGastoSA(estado: EstadoEconomiaAcoes, custo: number): EstadoEconomiaAcoes {
  if (!Number.isSafeInteger(custo) || custo <= 0) throw new Error('O custo em SA deve ser um inteiro positivo.');
  if (estado.saAtual < custo) throw new Error('SA insuficiente.');
  if (estado.saGastaNaJanela + custo > LIMITE_SA_JANELA_ESFORCO) {
    throw new Error('O limite de 3 SA de Esforço e Manobras nesta janela seria ultrapassado.');
  }
  return { ...estado, saAtual: estado.saAtual - custo, saGastaNaJanela: estado.saGastaNaJanela + custo };
}

/** Compra explícita de um recurso adicional, sem consumir seu uso normal. */
export function comprarRecursoPorEsforco(estado: EstadoEconomiaAcoes, recurso: CompraEsforco): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!Object.prototype.hasOwnProperty.call(CUSTO_ESFORCO, recurso)) throw new Error('Recurso não pode ser comprado por Esforço.');
  if (!estado.turnoEmAndamento && recurso !== 'reacao') throw new Error('Fora do próprio turno, somente uma Reação autorizada pode ser comprada por Esforço.');
  const gasto = registrarGastoSA(estado, CUSTO_ESFORCO[recurso]);
  return { ...gasto, comprasEsforco: { ...gasto.comprasEsforco, [recurso]: gasto.comprasEsforco[recurso] + 1 } };
}

/** Registra SA gasto em Manobra, como Contra-Ataque, sem comprar outro recurso de ação. */
export function gastarSAEmManobra(estado: EstadoEconomiaAcoes, custo = 1): EstadoEconomiaAcoes {
  validarEstado(estado);
  return registrarGastoSA(estado, custo);
}

/** Início do turno próprio renova recursos normais e compras disponíveis; não renova a janela de SA. */
export function iniciarTurnoAcoes(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (estado.turnoEmAndamento) throw new Error('O turno próprio já está em andamento.');
  return {
    ...estado,
    normaisUsados: { acao: false, movimento: false, acaoBonus: false, reacao: false },
    comprasEsforco: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    interacaoGratuitaUsada: false, turnoEmAndamento: true,
  };
}

/** A janela de SA vai do fim de um turno ao fim do próximo turno da personagem. */
export function encerrarTurnoAcoes(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!estado.turnoEmAndamento) throw new Error('Não há turno próprio em andamento para encerrar.');
  return { ...estado, saGastaNaJanela: 0, turnoEmAndamento: false };
}

/** Valida dados persistidos antes de reabrir o painel, sem corrigir silenciosamente registros inválidos. */
export function estadoEconomiaAcoesValido(valor: unknown): valor is EstadoEconomiaAcoes {
  try {
    validarEstado(valor as EstadoEconomiaAcoes);
    return (valor as EstadoEconomiaAcoes).saGastaNaJanela <= LIMITE_SA_JANELA_ESFORCO;
  } catch {
    return false;
  }
}
