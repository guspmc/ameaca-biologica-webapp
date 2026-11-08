import {
  consumirRecursoNormal,
  gastarSAEmManobra,
  type EstadoEconomiaAcoes,
} from './economiaAcoes.ts';

export type EstadoManobrasTurno = {
  disparadaUsada: boolean;
  fugaUsada: boolean;
  mirarPreparado: boolean;
  combateDuasArmasUsado: boolean;
};

export function estadoManobrasTurnoInicial(): EstadoManobrasTurno {
  return { disparadaUsada: false, fugaUsada: false, mirarPreparado: false, combateDuasArmasUsado: false };
}

function validarEstadoManobras(estado: EstadoManobrasTurno): void {
  const chaves = ['disparadaUsada', 'fugaUsada', 'mirarPreparado', 'combateDuasArmasUsado'];
  if (!estado || typeof estado !== 'object' || Array.isArray(estado)
    || Object.getPrototypeOf(estado) !== Object.prototype
    || Object.keys(estado).sort().join('|') !== chaves.sort().join('|')
    || chaves.some(chave => typeof (estado as unknown as Record<string, unknown>)[chave] !== 'boolean')
    || (estado.fugaUsada && !estado.disparadaUsada)) {
    throw new Error('Estado das Manobras do turno inválido.');
  }
}

export type ResultadoManobraOperacional = {
  economia: EstadoEconomiaAcoes;
  manobras: EstadoManobrasTurno;
  movimentosAdicionais: number;
  ataqueAdicionalAutorizado: boolean;
};

/** Desengajar consome o Movimento normal e concede deslocamento protegido de 1,5 m. */
export function registrarDesengajar(economia: EstadoEconomiaAcoes, manobras: EstadoManobrasTurno): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  return {
    economia: consumirRecursoNormal(economia, 'movimento'),
    manobras: { ...manobras },
    movimentosAdicionais: 0,
    ataqueAdicionalAutorizado: false,
  };
}

/** Disparada converte a Ação normal em um Movimento adicional; não executa deslocamento. */
export function registrarDisparada(
  economia: EstadoEconomiaAcoes,
  manobras: EstadoManobrasTurno,
): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  if (manobras.disparadaUsada) throw new Error('Disparada já foi utilizada neste turno.');
  const proxima = consumirRecursoNormal(economia, 'acao');
  return {
    economia: proxima,
    manobras: { ...manobras, disparadaUsada: true },
    movimentosAdicionais: 1,
    ataqueAdicionalAutorizado: false,
  };
}

/** Fuga gasta 1 SA após Disparada para conceder o terceiro Movimento do turno. */
export function registrarFuga(
  economia: EstadoEconomiaAcoes,
  manobras: EstadoManobrasTurno,
): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  if (!manobras.disparadaUsada) throw new Error('Fuga exige Disparada previamente utilizada.');
  if (manobras.fugaUsada) throw new Error('Fuga já foi utilizada neste turno.');
  return {
    economia: gastarSAEmManobra(economia, 1),
    manobras: { ...manobras, fugaUsada: true },
    movimentosAdicionais: 1,
    ataqueAdicionalAutorizado: false,
  };
}

/** Mirar gasta 1 SA e prepara o bônus +2 para o Ataque declarado em seguida. */
export function registrarMirar(
  economia: EstadoEconomiaAcoes,
  manobras: EstadoManobrasTurno,
): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  if (manobras.mirarPreparado) throw new Error('Mirar já foi declarado para este Ataque.');
  return {
    economia: gastarSAEmManobra(economia, 1),
    manobras: { ...manobras, mirarPreparado: true },
    movimentosAdicionais: 0,
    ataqueAdicionalAutorizado: false,
  };
}

/** O Ataque consome Ação; Mirar, se preparado, aplica somente +2 no Teste e é consumido. */
export function registrarAtaque(
  economia: EstadoEconomiaAcoes,
  manobras: EstadoManobrasTurno,
): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  return {
    economia: consumirRecursoNormal(economia, 'acao'),
    manobras: { ...manobras, mirarPreparado: false },
    movimentosAdicionais: 0,
    ataqueAdicionalAutorizado: false,
  };
}

/** Ajudar consome Ação; a elegibilidade do Teste e o treinamento são avaliados fora deste registro. */
export function registrarAjudar(economia: EstadoEconomiaAcoes, manobras: EstadoManobrasTurno): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  return {
    economia: consumirRecursoNormal(economia, 'acao'),
    manobras: { ...manobras },
    movimentosAdicionais: 0,
    ataqueAdicionalAutorizado: false,
  };
}

/** Usar um Objeto consome Ação para uma interação adicional; regras específicas podem alterar o custo. */
export function registrarUsarObjeto(economia: EstadoEconomiaAcoes, manobras: EstadoManobrasTurno): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  return {
    economia: consumirRecursoNormal(economia, 'acao'),
    manobras: { ...manobras },
    movimentosAdicionais: 0,
    ataqueAdicionalAutorizado: false,
  };
}

/**
 * Combate com Duas Armas: depois de um Ataque inicial elegível, consome Ação Bônus
 * e autoriza o Ataque adicional. Não calcula dano nem adiciona FOR.
 */
export function registrarCombateDuasArmas(
  economia: EstadoEconomiaAcoes,
  manobras: EstadoManobrasTurno,
  ataqueInicialElegivel: boolean,
): ResultadoManobraOperacional {
  validarEstadoManobras(manobras);
  if (typeof ataqueInicialElegivel !== 'boolean' || !ataqueInicialElegivel) {
    throw new Error('O Ataque inicial não cumpre os requisitos de Combate com Duas Armas.');
  }
  if (manobras.combateDuasArmasUsado) throw new Error('Combate com Duas Armas já foi utilizado neste turno.');
  return {
    economia: consumirRecursoNormal(economia, 'acaoBonus'),
    manobras: { ...manobras, combateDuasArmasUsado: true },
    movimentosAdicionais: 0,
    ataqueAdicionalAutorizado: true,
  };
}
