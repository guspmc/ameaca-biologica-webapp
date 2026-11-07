export type RecursoAcao = 'acao' | 'movimento' | 'acaoBonus' | 'reacao';
export type CompraEsforco = RecursoAcao;
export type EstadoEconomiaAcoes = {
  saAtual: number;
  saGastaNaJanela: number;
  usados: Record<RecursoAcao, number>;
  interacaoGratuitaUsada: boolean;
};

export const CUSTO_ESFORCO: Record<CompraEsforco, number> = { movimento: 1, acaoBonus: 1, reacao: 1, acao: 2 };
export const LIMITE_SA_JANELA_ESFORCO = 3;

export function economiaAcoesInicial(saAtual: number): EstadoEconomiaAcoes {
  if (!Number.isSafeInteger(saAtual) || saAtual < 0) throw new Error('SA atual deve ser um inteiro não negativo.');
  return { saAtual, saGastaNaJanela: 0, usados: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 }, interacaoGratuitaUsada: false };
}

export function saNaJanelaEsforco(estado: EstadoEconomiaAcoes): number { return estado.saGastaNaJanela; }

function validarEstado(estado: EstadoEconomiaAcoes): void {
  if (!estado || !Number.isSafeInteger(estado.saAtual) || estado.saAtual < 0
    || !Number.isSafeInteger(estado.saGastaNaJanela) || estado.saGastaNaJanela < 0
    || !estado.usados || (['acao', 'movimento', 'acaoBonus', 'reacao'] as const)
      .some(recurso => !Number.isSafeInteger(estado.usados[recurso]) || estado.usados[recurso] < 0)
    || typeof estado.interacaoGratuitaUsada !== 'boolean') throw new Error('Estado da economia de ações inválido.');
}

export function consumirRecursoNormal(estado: EstadoEconomiaAcoes, recurso: RecursoAcao): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!Object.prototype.hasOwnProperty.call(estado.usados, recurso)) throw new Error('Recurso de ação desconhecido.');
  if (estado.usados[recurso] >= 1) throw new Error('Este recurso normal já foi utilizado neste turno.');
  return { ...estado, usados: { ...estado.usados, [recurso]: estado.usados[recurso] + 1 } };
}

/** Ação Completa normalmente compromete Ação e Movimento juntos. */
export function consumirAcaoCompleta(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (estado.usados.acao >= 1 || estado.usados.movimento >= 1) throw new Error('A Ação Completa exige Ação e Movimento disponíveis.');
  return { ...estado, usados: { ...estado.usados, acao: estado.usados.acao + 1, movimento: estado.usados.movimento + 1 } };
}

export function consumirInteracaoGratuita(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
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

/** Compra explícita; não gasta SA automaticamente quando um recurso normal acaba. */
export function comprarRecursoPorEsforco(estado: EstadoEconomiaAcoes, recurso: CompraEsforco): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!Object.prototype.hasOwnProperty.call(CUSTO_ESFORCO, recurso)) throw new Error('Recurso não pode ser comprado por Esforço.');
  const gasto = registrarGastoSA(estado, CUSTO_ESFORCO[recurso]);
  return { ...gasto, usados: { ...gasto.usados, [recurso]: gasto.usados[recurso] + 1 } };
}

/** Registra SA gasto em Manobra, como Contra-Ataque, sem comprar outro recurso de ação. */
export function gastarSAEmManobra(estado: EstadoEconomiaAcoes, custo = 1): EstadoEconomiaAcoes {
  validarEstado(estado);
  return registrarGastoSA(estado, custo);
}

/** Início do turno próprio renova recursos normais; não renova a janela de Esforço. */
export function iniciarTurnoAcoes(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  return { ...estado, usados: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 }, interacaoGratuitaUsada: false };
}

/** A janela de SA vai do fim de um turno ao fim do próximo turno da personagem. */
export function encerrarTurnoAcoes(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  return { ...estado, saGastaNaJanela: 0 };
}
