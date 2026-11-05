export type CausaReanimacao = 'pv_zero' | 'colapso_bi';
export type EstadoReanimacao =
  | 'aguardando_proximo_turno'
  | 'em_andamento'
  | 'desacordada_ate_reducao_bi'
  | 'morte_a_registrar'
  | 'transformacao_no_proximo_turno'
  | 'concluida';

export type Reanimacao = {
  causa: CausaReanimacao;
  estado: EstadoReanimacao;
  sucessos: number;
  falhas: number;
  tentativas: number;
  curaAcumulada: number;
  vantagemProximoTeste: boolean;
};

export type ResultadoReanimacao = {
  reanimacao: Reanimacao;
  pvAoDespertar: number | null;
  transformacaoPendente: boolean;
  morteParaRegistroDoMestre: boolean;
};

const inteiroNaoNegativo = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

export function reanimacaoValida(valor: unknown): valor is Reanimacao {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const r = valor as Reanimacao;
  return ['pv_zero', 'colapso_bi'].includes(r.causa)
    && ['aguardando_proximo_turno', 'em_andamento', 'desacordada_ate_reducao_bi', 'morte_a_registrar', 'transformacao_no_proximo_turno', 'concluida'].includes(r.estado)
    && inteiroNaoNegativo(r.sucessos) && inteiroNaoNegativo(r.falhas)
    && inteiroNaoNegativo(r.tentativas) && inteiroNaoNegativo(r.curaAcumulada)
    && r.sucessos <= 3 && r.falhas <= 3 && r.tentativas <= 5
    && r.sucessos + r.falhas === r.tentativas
    && typeof r.vantagemProximoTeste === 'boolean'
    && (r.causa === 'pv_zero'
      ? !['desacordada_ate_reducao_bi', 'transformacao_no_proximo_turno'].includes(r.estado)
      : r.curaAcumulada === 0 && !r.vantagemProximoTeste
        && !['morte_a_registrar'].includes(r.estado))
    && (r.estado !== 'desacordada_ate_reducao_bi' || (r.causa === 'colapso_bi' && r.sucessos === 3))
    && (r.estado !== 'morte_a_registrar' || (r.causa === 'pv_zero' && r.falhas === 3))
    && (r.estado !== 'transformacao_no_proximo_turno' || (r.causa === 'colapso_bi' && r.falhas === 3))
    && (r.estado !== 'concluida' || r.sucessos === 3);
}

function validarEstado(r: Reanimacao): void {
  if (!reanimacaoValida(r)) throw new Error('Estado de Reanimação inválido.');
}

/** A causa é explícita: 0 PV e Colapso Viral nunca compartilham desfecho. */
export function iniciarReanimacao(causa: CausaReanimacao): Reanimacao {
  if (causa !== 'pv_zero' && causa !== 'colapso_bi') throw new Error('Causa de Reanimação inválida.');
  return {
    causa,
    estado: 'aguardando_proximo_turno',
    sucessos: 0,
    falhas: 0,
    tentativas: 0,
    curaAcumulada: 0,
    vantagemProximoTeste: false,
  };
}

/** A Reanimação por 0 PV começa no próximo turno, nunca por rolagem automática. */
export function iniciarTurnoReanimacao(r: Reanimacao): Reanimacao {
  validarEstado(r);
  if (r.estado !== 'aguardando_proximo_turno') throw new Error('Reanimação não está aguardando o próximo turno.');
  return { ...r, estado: 'em_andamento' };
}

/** Medicina DT 15 bem-sucedida concede Vantagem ao próximo Teste de Reanimação por 0 PV. */
export function concederAjudaMedicina(r: Reanimacao, resultadoMedicina: number): Reanimacao {
  validarEstado(r);
  if (r.causa !== 'pv_zero' || r.estado !== 'em_andamento'
    || !Number.isSafeInteger(resultadoMedicina) || resultadoMedicina < 1 || resultadoMedicina > 20) {
    throw new Error('Ajuda de Medicina inválida para este estado.');
  }
  return { ...r, vantagemProximoTeste: resultadoMedicina >= 15 };
}

/** Cura recebida em 0 PV acumula e não desperta antes do terceiro sucesso. */
export function acumularCuraDuranteReanimacao(r: Reanimacao, quantidade: number): Reanimacao {
  validarEstado(r);
  if (r.causa !== 'pv_zero' || !['aguardando_proximo_turno', 'em_andamento'].includes(r.estado)
    || !inteiroNaoNegativo(quantidade)) {
    throw new Error('Cura não pode ser acumulada neste estado de Reanimação.');
  }
  return { ...r, curaAcumulada: r.curaAcumulada + quantidade };
}

/**
 * Recebe resultados expressamente rolados. Informe dois d20 quando houver Vantagem
 * (Ajuda de Medicina ou Origem Cobaia no Colapso); o sistema usa o melhor.
 */
export function resolverTesteReanimacao(
  r: Reanimacao,
  resultados: number | [number, number],
  pvMaximo: number,
  origemCobaia = false,
): ResultadoReanimacao {
  validarEstado(r);
  if (r.estado !== 'em_andamento' || r.tentativas >= 5 || r.sucessos >= 3 || r.falhas >= 3
    || !inteiroNaoNegativo(pvMaximo) || pvMaximo < 1) {
    throw new Error('Reanimação não está apta a receber outro Teste.');
  }
  const vantagem = r.vantagemProximoTeste || (r.causa === 'colapso_bi' && origemCobaia);
  const lista = Array.isArray(resultados) ? resultados : [resultados];
  if ((vantagem && lista.length !== 2) || (!vantagem && lista.length !== 1)
    || lista.some(v => !Number.isSafeInteger(v) || v < 1 || v > 20)) {
    throw new Error(vantagem ? 'Informe os dois resultados físicos ou virtuais da Vantagem.' : 'Informe um resultado físico ou virtual válido.');
  }
  const passou = Math.max(...lista) >= 12;
  const proximo: Reanimacao = {
    ...r,
    estado: 'em_andamento',
    sucessos: r.sucessos + (passou ? 1 : 0),
    falhas: r.falhas + (passou ? 0 : 1),
    tentativas: r.tentativas + 1,
    vantagemProximoTeste: false,
  };
  if (proximo.sucessos === 3) {
    if (r.causa === 'pv_zero') {
      const pvAoDespertar = Math.min(pvMaximo, Math.max(1, r.curaAcumulada));
      proximo.estado = 'concluida';
      return { reanimacao: proximo, pvAoDespertar, transformacaoPendente: false, morteParaRegistroDoMestre: false };
    }
    proximo.estado = 'desacordada_ate_reducao_bi';
  } else if (proximo.falhas === 3) {
    if (r.causa === 'pv_zero') proximo.estado = 'morte_a_registrar';
    else proximo.estado = 'transformacao_no_proximo_turno';
  }
  return {
    reanimacao: proximo,
    pvAoDespertar: null,
    transformacaoPendente: proximo.estado === 'transformacao_no_proximo_turno',
    morteParaRegistroDoMestre: proximo.estado === 'morte_a_registrar',
  };
}

/** Após três sucessos no Colapso, só a BI abaixo do máximo encerra o estado Desacordado. */
export function encerrarColapsoPorReducaoBI(r: Reanimacao, biAtual: number, biMaximo: number): Reanimacao {
  validarEstado(r);
  if (r.causa !== 'colapso_bi' || r.estado !== 'desacordada_ate_reducao_bi'
    || !inteiroNaoNegativo(biAtual) || !Number.isSafeInteger(biMaximo) || biMaximo < 1
    || biAtual >= biMaximo) {
    throw new Error('A BI precisa estar abaixo do máximo após três sucessos no Colapso.');
  }
  return { ...r, estado: 'concluida' };
}
