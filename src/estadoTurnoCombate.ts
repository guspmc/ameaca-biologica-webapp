import {
  economiaAcoesInicial,
  consumirRecursoNormal,
  gastarSAEmManobra,
  iniciarTurnoAcoes,
  encerrarTurnoAcoes,
  estadoEconomiaAcoesValido,
  sincronizarSAAtual,
  type EstadoEconomiaAcoes,
} from './economiaAcoes.ts';
import type { ResultadoManobraOperacional, EstadoManobrasTurno } from './manobrasOperacionais.ts';

export type EstadoTurnoCombate = {
  versao: 1;
  economia: EstadoEconomiaAcoes;
  manobras: EstadoManobrasTurno;
  movimentosAdicionaisConcedidos: number;
  ataqueAdicionalAutorizado: boolean;
  proximoTurnoComprometido: boolean;
};

export type OrigemEstadoTurnoCombate = 'composto' | 'legado' | 'novo';

/** Carrega o formato atual ou migra em memória a economia legada, sem corrigir registros inválidos. */
export function carregarEstadoTurnoCombate(
  composto: unknown,
  legado: unknown,
  saAtual: number,
): { estado: EstadoTurnoCombate; valido: boolean; origem: OrigemEstadoTurnoCombate } {
  if (!Number.isSafeInteger(saAtual) || saAtual < 0) {
    return { estado: estadoTurnoCombateInicial(0), valido: false, origem: 'novo' };
  }
  if (composto !== undefined && composto !== null) {
    if (estadoTurnoCombateValido(composto)) {
      return {
        estado: { ...composto, economia: sincronizarSAAtual(composto.economia, saAtual) },
        valido: true,
        origem: 'composto',
      };
    }
    const migrado = migrarEstadoTurnoCombateComposto(composto);
    if (migrado) {
      return {
        estado: { ...migrado, economia: sincronizarSAAtual(migrado.economia, saAtual) },
        valido: true,
        origem: 'composto',
      };
    }
    return { estado: estadoTurnoCombateInicial(saAtual), valido: false, origem: 'composto' };
  }
  if (legado !== undefined && legado !== null) {
    if (!estadoEconomiaAcoesValido(legado)) {
      return { estado: estadoTurnoCombateInicial(saAtual), valido: false, origem: 'legado' };
    }
    return {
      estado: {
        versao: 1,
        economia: sincronizarSAAtual(legado, saAtual),
        manobras: { disparadaUsada: false, fugaUsada: false, mirarPreparado: false, ataqueNormalRealizado: false, combateDuasArmasUsado: false },
        movimentosAdicionaisConcedidos: 0,
        ataqueAdicionalAutorizado: false,
        proximoTurnoComprometido: false,
      },
      valido: true,
      origem: 'legado',
    };
  }
  return { estado: estadoTurnoCombateInicial(saAtual), valido: true, origem: 'novo' };
}

/** Reconhece apenas formatos compostos históricos conhecidos; não aceita campos desconhecidos. */
export function estadoTurnoCombateCompostoLegadoReconhecido(valor: unknown): boolean {
  return migrarEstadoTurnoCombateComposto(valor) !== null;
}

function migrarEstadoTurnoCombateComposto(valor: unknown): EstadoTurnoCombate | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)
    || Object.getPrototypeOf(valor) !== Object.prototype) return null;
  const estado = valor as Record<string, unknown>;
  if (estado.versao !== 1 || !estadoEconomiaAcoesValido(estado.economia)) return null;

  const chavesEstado = Object.keys(estado).sort().join('|');
  const chavesBasicas = ['economia', 'manobras', 'versao'].sort().join('|');
  const chavesComMarcadores = ['economia', 'manobras', 'versao', 'movimentosAdicionaisConcedidos', 'ataqueAdicionalAutorizado'].sort().join('|');
  const chavesComCompromisso = ['economia', 'manobras', 'versao', 'movimentosAdicionaisConcedidos', 'ataqueAdicionalAutorizado', 'proximoTurnoComprometido'].sort().join('|');
  if (chavesEstado !== chavesBasicas && chavesEstado !== chavesComMarcadores && chavesEstado !== chavesComCompromisso) return null;

  if ((chavesEstado === chavesComMarcadores || chavesEstado === chavesComCompromisso)
    && (!Number.isSafeInteger(estado.movimentosAdicionaisConcedidos)
      || (estado.movimentosAdicionaisConcedidos as number) < 0
      || typeof estado.ataqueAdicionalAutorizado !== 'boolean'
      || (chavesEstado === chavesComCompromisso && typeof estado.proximoTurnoComprometido !== 'boolean'))) return null;

  if (!estado.manobras || typeof estado.manobras !== 'object' || Array.isArray(estado.manobras)
    || Object.getPrototypeOf(estado.manobras) !== Object.prototype) return null;
  const manobras = estado.manobras as Record<string, unknown>;
  const chavesManobras = Object.keys(manobras).sort().join('|');
  const base = ['disparadaUsada', 'fugaUsada', 'mirarPreparado', 'combateDuasArmasUsado'].sort().join('|');
  const comAtaque = ['disparadaUsada', 'fugaUsada', 'mirarPreparado', 'ataqueNormalRealizado', 'combateDuasArmasUsado'].sort().join('|');
  if (chavesManobras !== base && chavesManobras !== comAtaque) return null;
  if (['disparadaUsada', 'fugaUsada', 'mirarPreparado', 'combateDuasArmasUsado']
    .some(chave => typeof manobras[chave] !== 'boolean')
    || ('ataqueNormalRealizado' in manobras && typeof manobras.ataqueNormalRealizado !== 'boolean')
    || (manobras.fugaUsada === true && manobras.disparadaUsada !== true)) return null;

  return {
    versao: 1,
    economia: estado.economia,
    manobras: {
      disparadaUsada: manobras.disparadaUsada as boolean,
      fugaUsada: manobras.fugaUsada as boolean,
      mirarPreparado: manobras.mirarPreparado as boolean,
      ataqueNormalRealizado: (manobras.ataqueNormalRealizado as boolean | undefined) ?? false,
      combateDuasArmasUsado: manobras.combateDuasArmasUsado as boolean,
    },
    movimentosAdicionaisConcedidos: chavesEstado === chavesComMarcadores ? estado.movimentosAdicionaisConcedidos as number : 0,
    ataqueAdicionalAutorizado: chavesEstado !== chavesBasicas ? estado.ataqueAdicionalAutorizado as boolean : false,
    proximoTurnoComprometido: chavesEstado === chavesComCompromisso ? estado.proximoTurnoComprometido as boolean : false,
  };
}

export function estadoTurnoCombateInicial(saAtual: number): EstadoTurnoCombate {
  return {
    versao: 1,
    economia: economiaAcoesInicial(saAtual),
    manobras: {
      disparadaUsada: false,
      fugaUsada: false,
      mirarPreparado: false,
      ataqueNormalRealizado: false,
      combateDuasArmasUsado: false,
    },
    movimentosAdicionaisConcedidos: 0,
    ataqueAdicionalAutorizado: false,
    proximoTurnoComprometido: false,
  };
}

export function estadoTurnoCombateValido(valor: unknown): valor is EstadoTurnoCombate {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)
    || Object.getPrototypeOf(valor) !== Object.prototype) return false;
  const estado = valor as Record<string, unknown>;
  if (Object.keys(estado).sort().join('|') !== ['ataqueAdicionalAutorizado', 'economia', 'manobras', 'movimentosAdicionaisConcedidos', 'proximoTurnoComprometido', 'versao'].sort().join('|')
    || estado.versao !== 1 || !estadoEconomiaAcoesValido(estado.economia)
    || !Number.isSafeInteger(estado.movimentosAdicionaisConcedidos) || (estado.movimentosAdicionaisConcedidos as number) < 0
    || typeof estado.ataqueAdicionalAutorizado !== 'boolean'
    || typeof estado.proximoTurnoComprometido !== 'boolean') return false;
  const manobras = estado.manobras;
  if (!manobras || typeof manobras !== 'object' || Array.isArray(manobras)
    || Object.getPrototypeOf(manobras) !== Object.prototype) return false;
  const m = manobras as Record<string, unknown>;
  return Object.keys(m).sort().join('|') === [
    'disparadaUsada', 'fugaUsada', 'mirarPreparado', 'ataqueNormalRealizado', 'combateDuasArmasUsado',
  ].sort().join('|')
    && typeof m.disparadaUsada === 'boolean'
    && typeof m.fugaUsada === 'boolean'
    && typeof m.mirarPreparado === 'boolean'
    && typeof m.ataqueNormalRealizado === 'boolean'
    && typeof m.combateDuasArmasUsado === 'boolean'
    && (!m.fugaUsada || m.disparadaUsada);
}

/** Inicia o turno e renova os marcadores de uso por turno; Mirar permanece até o próximo Ataque. */
export function iniciarTurnoCombate(estado: EstadoTurnoCombate): EstadoTurnoCombate {
  exigirEstadoValido(estado);
  const economiaBase = iniciarTurnoAcoes(estado.economia);
  const economia = estado.proximoTurnoComprometido
    ? { ...economiaBase, normaisUsados: { ...economiaBase.normaisUsados, acao: true, movimento: true } }
    : economiaBase;
  return {
    versao: 1,
    economia,
    manobras: {
      disparadaUsada: false,
      fugaUsada: false,
      mirarPreparado: estado.manobras.mirarPreparado,
      ataqueNormalRealizado: false,
      combateDuasArmasUsado: false,
    },
    movimentosAdicionaisConcedidos: 0,
    ataqueAdicionalAutorizado: false,
    proximoTurnoComprometido: false,
  };
}

/** Encerra o turno sem apagar gastos da janela de SA ou preparações ainda não consumidas. */
export function encerrarTurnoCombate(estado: EstadoTurnoCombate): EstadoTurnoCombate {
  exigirEstadoValido(estado);
  return { ...estado, economia: encerrarTurnoAcoes(estado.economia), manobras: { ...estado.manobras } };
}


/** Registra Finalização Dupla; as condições contextuais são confirmadas pela Mesa, não inferidas. */
export function registrarFinalizacaoDupla(
  estado: EstadoTurnoCombate,
  contexto: { aliadoFinalizou: boolean; alvoSobreviveu: boolean; personagemAindaNaoAgioNaRodada: boolean },
): EstadoTurnoCombate {
  exigirEstadoValido(estado);
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)
    || Object.getPrototypeOf(contexto) !== Object.prototype
    || Object.keys(contexto).sort().join('|') !== ['aliadoFinalizou', 'alvoSobreviveu', 'personagemAindaNaoAgioNaRodada'].sort().join('|')
    || contexto.aliadoFinalizou !== true || contexto.alvoSobreviveu !== true
    || contexto.personagemAindaNaoAgioNaRodada !== true) {
    throw new Error('Finalização Dupla exige confirmação de Finalização por aliado, sobrevivência do alvo e personagem ainda não agiu na rodada.');
  }
  if (estado.proximoTurnoComprometido) throw new Error('Ação e Movimento do próximo turno já estão comprometidos.');
  if (estado.economia.normaisUsados.reacao) throw new Error('Finalização Dupla exige uma Reação disponível.');
  const comReacao = consumirRecursoNormal(estado.economia, 'reacao');
  const economia = gastarSAEmManobra(comReacao, 3, true);
  const proximo = { ...estado, economia, proximoTurnoComprometido: true };
  exigirEstadoValido(proximo);
  return proximo;
}

/** Aplica uma Manobra e atualiza Economia + marcadores como uma única transição pura. */
export function aplicarManobraCombate(
  estado: EstadoTurnoCombate,
  operacao: (economia: EstadoEconomiaAcoes, manobras: EstadoManobrasTurno) => ResultadoManobraOperacional,
): { estado: EstadoTurnoCombate; resultado: ResultadoManobraOperacional } {
  exigirEstadoValido(estado);
  if (typeof operacao !== 'function') throw new Error('Operação de Manobra inválida.');
  const resultado = operacao(estado.economia, estado.manobras);
  if (!resultado || !estadoEconomiaAcoesValido(resultado.economia)
    || !resultado.manobras || typeof resultado.manobras !== 'object'
    || typeof resultado.movimentosAdicionais !== 'number'
    || !Number.isSafeInteger(resultado.movimentosAdicionais) || resultado.movimentosAdicionais < 0
    || typeof resultado.ataqueAdicionalAutorizado !== 'boolean') {
    throw new Error('Resultado da Manobra inválido; o estado original foi preservado.');
  }
  const proximo: EstadoTurnoCombate = {
    versao: 1,
    economia: resultado.economia,
    manobras: { ...resultado.manobras },
    movimentosAdicionaisConcedidos: estado.movimentosAdicionaisConcedidos + resultado.movimentosAdicionais,
    ataqueAdicionalAutorizado: estado.ataqueAdicionalAutorizado || resultado.ataqueAdicionalAutorizado,
    proximoTurnoComprometido: estado.proximoTurnoComprometido,
  };
  if (!estadoTurnoCombateValido(proximo)) throw new Error('A Manobra produziu um estado de turno inválido.');
  return { estado: proximo, resultado };
}

/** Aplica uma Reação que atualiza a Economia sem tocar nos marcadores de Manobras do turno. */
export function aplicarReacaoCombate<T extends { economia: EstadoEconomiaAcoes }>(
  estado: EstadoTurnoCombate,
  operacao: (economia: EstadoEconomiaAcoes) => T,
): { estado: EstadoTurnoCombate; resultado: T } {
  exigirEstadoValido(estado);
  if (typeof operacao !== 'function') throw new Error('Operação de Reação inválida.');
  const resultado = operacao(estado.economia);
  if (!resultado || !estadoEconomiaAcoesValido(resultado.economia)) {
    throw new Error('Resultado da Reação inválido; o estado original foi preservado.');
  }
  return {
    estado: { ...estado, economia: resultado.economia, manobras: { ...estado.manobras } },
    resultado,
  };
}

function exigirEstadoValido(estado: EstadoTurnoCombate): void {
  if (!estadoTurnoCombateValido(estado)) throw new Error('Estado integrado do turno de combate inválido.');
}


/** Consome a autorização de Ataque adicional sem gastar outra Ação: o custo já foi pago pela Ação Bônus. */
export function registrarResolucaoAtaqueAdicional(estado: EstadoTurnoCombate): EstadoTurnoCombate {
  exigirEstadoValido(estado);
  if (!estado.economia.turnoEmAndamento) throw new Error('O Ataque adicional só pode ser registrado durante o próprio turno.');
  if (!estado.ataqueAdicionalAutorizado || !estado.manobras.combateDuasArmasUsado) {
    throw new Error('Não há Ataque adicional de Combate com Duas Armas aguardando resolução.');
  }
  return { ...estado, ataqueAdicionalAutorizado: false };
}
