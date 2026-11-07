export type RecursoAcao = 'acao' | 'movimento' | 'acaoBonus' | 'reacao';
export type CompraEsforco = RecursoAcao;
export type EstadoEconomiaAcoes = {
  saAtual: number;
  saGastaNoTurno: number;
  saGastaNoUltimoTurno: number;
  usados: Record<RecursoAcao, number>;
  interacaoGratuitaUsada: boolean;
};

export const CUSTO_ESFORCO: Record<CompraEsforco, number> = {
  movimento: 1,
  acaoBonus: 1,
  reacao: 1,
  acao: 2,
};

export const LIMITE_SA_JANELA_ESFORCO = 3;

export function economiaAcoesInicial(saAtual: number): EstadoEconomiaAcoes {
  if (!Number.isSafeInteger(saAtual) || saAtual < 0) {
    throw new Error('SA atual deve ser um inteiro não negativo.');
  }
  return {
    saAtual,
    saGastaNoTurno: 0,
    saGastaNoUltimoTurno: 0,
    usados: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    interacaoGratuitaUsada: false,
  };
}

export function saNaJanelaEsforco(estado: EstadoEconomiaAcoes): number {
  return estado.saGastaNoTurno + estado.saGastaNoUltimoTurno;
}

function validarEstado(estado: EstadoEconomiaAcoes): void {
  if (!estado || !Number.isSafeInteger(estado.saAtual) || estado.saAtual < 0
    || !Number.isSafeInteger(estado.saGastaNoTurno) || estado.saGastaNoTurno < 0
    || !Number.isSafeInteger(estado.saGastaNoUltimoTurno) || estado.saGastaNoUltimoTurno < 0
    || !estado.usados || (['acao', 'movimento', 'acaoBonus', 'reacao'] as const)
      .some(recurso => !Number.isSafeInteger(estado.usados[recurso]) || estado.usados[recurso] < 0)
    || typeof estado.interacaoGratuitaUsada !== 'boolean') {
    throw new Error('Estado da economia de ações inválido.');
  }
}

export function consumirRecursoNormal(
  estado: EstadoEconomiaAcoes,
  recurso: RecursoAcao,
): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!(['acao', 'movimento', 'acaoBonus', 'reacao'] as string[]).includes(recurso)) {
    throw new Error('Recurso de ação desconhecido.');
  }
  if (estado.usados[recurso] >= 1) throw new Error('Este recurso normal já foi utilizado neste turno.');
  return { ...estado, usados: { ...estado.usados, [recurso]: estado.usados[recurso] + 1 } };
}

export function consumirAcaoCompleta(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (estado.usados.acao >= 1 || estado.usados.movimento >= 1) {
    throw new Error('A Ação Completa exige Ação e Movimento disponíveis.');
  }
  return {
    ...estado,
    usados: { ...estado.usados, acao: estado.usados.acao + 1, movimento: estado.usados.movimento + 1 },
  };
}

export function consumirInteracaoGratuita(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (estado.interacaoGratuitaUsada) throw new Error('A Interação Gratuita já foi utilizada neste turno.');
  return { ...estado, interacaoGratuitaUsada: true };
}

export function comprarRecursoPorEsforco(
  estado: EstadoEconomiaAcoes,
  recurso: CompraEsforco,
): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!Object.prototype.hasOwnProperty.call(CUSTO_ESFORCO, recurso)) {
    throw new Error('Recurso não pode ser comprado por Esforço.');
  }
  const custo = CUSTO_ESFORCO[recurso];
  if (estado.saAtual < custo) throw new Error('SA insuficiente para comprar este recurso.');
  if (saNaJanelaEsforco(estado) + custo > LIMITE_SA_JANELA_ESFORCO) {
    throw new Error('O limite de 3 SA de Esforço e Manobras nesta janela seria ultrapassado.');
  }
  return {
    ...estado,
    saAtual: estado.saAtual - custo,
    saGastaNoTurno: estado.saGastaNoTurno + custo,
    usados: { ...estado.usados, [recurso]: estado.usados[recurso] + 1 },
  };
}

/** Encerra o turno da personagem: renova recursos normais e mantém a janela de SA até o fim do próximo turno. */
export function encerrarTurnoAcoes(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  return {
    ...estado,
    saGastaNoUltimoTurno: estado.saGastaNoTurno,
    saGastaNoTurno: 0,
    usados: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    interacaoGratuitaUsada: false,
  };
}
