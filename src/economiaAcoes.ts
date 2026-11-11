export type RecursoAcao = 'acao' | 'movimento' | 'acaoBonus' | 'reacao';
export type CompraEsforco = RecursoAcao;
export type EstadoEconomiaAcoes = {
  saAtual: number;
  saGastaNaJanela: number;
  janelaEsforcoAtiva: boolean;
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
    saAtual, saGastaNaJanela: 0, janelaEsforcoAtiva: false,
    normaisUsados: { acao: false, movimento: false, acaoBonus: false, reacao: false },
    comprasEsforco: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    interacaoGratuitaUsada: false, turnoEmAndamento: true,
  };
}

export function saNaJanelaEsforco(estado: EstadoEconomiaAcoes): number { return estado.saGastaNaJanela; }

/** Mantém o saldo espelhado quando PV/SA/BI são ajustados fora do painel de ações. */
export function sincronizarSAAtual(estado: EstadoEconomiaAcoes, saAtual: number): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!Number.isSafeInteger(saAtual) || saAtual < 0) throw new Error('SA atual deve ser um inteiro não negativo.');
  return { ...estado, saAtual };
}

function validarEstado(estado: EstadoEconomiaAcoes): void {
  const chavesEstado = ['saAtual', 'saGastaNaJanela', 'janelaEsforcoAtiva', 'normaisUsados', 'comprasEsforco', 'interacaoGratuitaUsada', 'turnoEmAndamento'];
  const chavesRecursos = ['acao', 'movimento', 'acaoBonus', 'reacao'];
  if (!estado || Object.keys(estado).sort().join('|') !== chavesEstado.sort().join('|')
    || !estado.normaisUsados || Object.keys(estado.normaisUsados).sort().join('|') !== chavesRecursos.sort().join('|')
    || !estado.comprasEsforco || Object.keys(estado.comprasEsforco).sort().join('|') !== chavesRecursos.sort().join('|')
    || typeof estado.janelaEsforcoAtiva !== 'boolean'
    || !Number.isSafeInteger(estado.saAtual) || estado.saAtual < 0
    || !Number.isSafeInteger(estado.saGastaNaJanela) || estado.saGastaNaJanela < 0 || estado.saGastaNaJanela > LIMITE_SA_JANELA_ESFORCO
    || !estado.normaisUsados || RECURSOS.some(r => typeof estado.normaisUsados[r] !== 'boolean')
    || !estado.comprasEsforco || RECURSOS.some(r => !Number.isSafeInteger(estado.comprasEsforco[r]) || estado.comprasEsforco[r] < 0)
    || typeof estado.interacaoGratuitaUsada !== 'boolean' || typeof estado.turnoEmAndamento !== 'boolean') throw new Error('Estado da economia de ações inválido.');
  const custoCompras = RECURSOS.reduce((total, recurso) => total + estado.comprasEsforco[recurso] * CUSTO_ESFORCO[recurso], 0);
  if (!Number.isSafeInteger(custoCompras) || custoCompras > estado.saGastaNaJanela) {
    throw new Error('As compras por Esforço não correspondem ao total de SA gasto na janela.');
  }
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
export function gastarSAEmManobra(estado: EstadoEconomiaAcoes, custo = 1, autorizadaForaDoTurno = false): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!estado.turnoEmAndamento && !autorizadaForaDoTurno) throw new Error('Esta Manobra não foi autorizada fora do próprio turno.');
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

/** Abre a janela ao fim do turno; só a encerra ao fim do próximo turno próprio. */
export function encerrarTurnoAcoes(estado: EstadoEconomiaAcoes): EstadoEconomiaAcoes {
  validarEstado(estado);
  if (!estado.turnoEmAndamento) throw new Error('Não há turno próprio em andamento para encerrar.');
  const janelaEsforcoAtiva = estado.janelaEsforcoAtiva;
  return {
    ...estado,
    saGastaNaJanela: 0,
    janelaEsforcoAtiva: !janelaEsforcoAtiva,
    comprasEsforco: { acao: 0, movimento: 0, acaoBonus: 0, reacao: 0 },
    turnoEmAndamento: false,
  };
}

/** Migra somente o formato exato anterior; preserva os gastos e infere a fase pelo turno registrado. */
export function migrarEconomiaAcoesLegada(valor: unknown): EstadoEconomiaAcoes | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)
    || Object.getPrototypeOf(valor) !== Object.prototype) return null;
  const antigo = valor as Record<string, unknown>;
  const chavesAntigas = ['saAtual', 'saGastaNaJanela', 'normaisUsados', 'comprasEsforco', 'interacaoGratuitaUsada', 'turnoEmAndamento'];
  if (Object.keys(antigo).sort().join('|') !== chavesAntigas.sort().join('|')
    || !Number.isSafeInteger(antigo.saAtual) || (antigo.saAtual as number) < 0
    || !Number.isSafeInteger(antigo.saGastaNaJanela) || (antigo.saGastaNaJanela as number) < 0
    || (antigo.saGastaNaJanela as number) > LIMITE_SA_JANELA_ESFORCO
    || typeof antigo.turnoEmAndamento !== 'boolean'
    || typeof antigo.interacaoGratuitaUsada !== 'boolean'
    || !antigo.normaisUsados || typeof antigo.normaisUsados !== 'object' || Array.isArray(antigo.normaisUsados)
    || !antigo.comprasEsforco || typeof antigo.comprasEsforco !== 'object' || Array.isArray(antigo.comprasEsforco)) return null;
  const chavesRecursos = ['acao', 'movimento', 'acaoBonus', 'reacao'];
  if (Object.keys(antigo.normaisUsados).sort().join('|') !== chavesRecursos.sort().join('|')
    || Object.keys(antigo.comprasEsforco).sort().join('|') !== chavesRecursos.sort().join('|')) return null;
  const normais = antigo.normaisUsados as Record<string, unknown>;
  const compras = antigo.comprasEsforco as Record<string, unknown>;
  if (chavesRecursos.some(chave => typeof normais[chave] !== 'boolean'
    || !Number.isSafeInteger(compras[chave]) || (compras[chave] as number) < 0)) return null;
  const custoCompras = chavesRecursos.reduce((total, chave) => total + (compras[chave] as number) * CUSTO_ESFORCO[chave as RecursoAcao], 0);
  if (!Number.isSafeInteger(custoCompras) || custoCompras > (antigo.saGastaNaJanela as number)) return null;
  return {
    saAtual: antigo.saAtual as number,
    saGastaNaJanela: antigo.saGastaNaJanela as number,
    janelaEsforcoAtiva: antigo.turnoEmAndamento === false,
    normaisUsados: { ...(normais as Record<RecursoAcao, boolean>) },
    comprasEsforco: { ...(compras as Record<RecursoAcao, number>) },
    interacaoGratuitaUsada: antigo.interacaoGratuitaUsada as boolean,
    turnoEmAndamento: antigo.turnoEmAndamento as boolean,
  };
}

export function estadoEconomiaAcoesLegadoReconhecido(valor: unknown): boolean {
  return migrarEconomiaAcoesLegada(valor) !== null;
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
