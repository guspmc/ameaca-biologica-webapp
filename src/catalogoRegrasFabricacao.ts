export type RaridadeFabricacao = 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário';
export type CalibreFabricacao = '9mm' | 'calibre12' | 'especial';

const dtRaridade: Record<RaridadeFabricacao, number> = {
  Comum: 12, Incomum: 15, Raro: 18, 'Muito Raro': 21, Lendário: 24,
};
const dtCalibre: Record<CalibreFabricacao, number> = {
  '9mm': 12, calibre12: 15, especial: 18,
};

export type RegraFabricacaoMedicinal = {
  tempoMinutos: 30;
  teste: 'Medicina';
  dt: 12;
  semTesteSeTreinada: true;
  ingredientesPreservadosNaFalha: true;
  tempoConsumidoNaFalha: true;
  habilidadesPodemReduzirTempo: true;
  habilidadesPodemPermitirPreparoEmMovimento: true;
  requisito: 'Sala de Descanso ou Kit de Primeiros Socorros, salvo regra específica';
  referencia: string;
};

export type RegraFabricacaoArmamento = {
  tempoMinutos: 30;
  teste: 'AST';
  dt: number;
  dtRaridade: number;
  dtMinimaCalibre: number;
  requisito: 'Sala de Descanso ou Kit de Ferramentas, salvo regra específica';
  referencia: string;
};

const regraMedicinal: RegraFabricacaoMedicinal = {
  tempoMinutos: 30,
  teste: 'Medicina',
  dt: 12,
  semTesteSeTreinada: true,
  ingredientesPreservadosNaFalha: true,
  tempoConsumidoNaFalha: true,
  habilidadesPodemReduzirTempo: true,
  habilidadesPodemPermitirPreparoEmMovimento: true,
  requisito: 'Sala de Descanso ou Kit de Primeiros Socorros, salvo regra específica',
  referencia: 'Arquivo do Jogador v1.0, p. 71–73',
};

export function consultarRegraFabricacaoMedicinal(): RegraFabricacaoMedicinal {
  return { ...regraMedicinal };
}

/** Calcula apenas a DT canônica; não realiza Teste nem fabrica o item. */
export function calcularDTFabricacaoArmamento(
  raridade: RaridadeFabricacao,
  calibre: CalibreFabricacao,
): RegraFabricacaoArmamento {
  if (!(raridade in dtRaridade) || !(calibre in dtCalibre)) {
    throw new Error('Raridade ou calibre de fabricação inválido.');
  }
  const base = dtRaridade[raridade];
  const minima = dtCalibre[calibre];
  return {
    tempoMinutos: 30,
    teste: 'AST',
    dt: Math.max(base, minima),
    dtRaridade: base,
    dtMinimaCalibre: minima,
    requisito: 'Sala de Descanso ou Kit de Ferramentas, salvo regra específica',
    referencia: 'Arquivo do Jogador v1.0, p. 71–73',
  };
}

export function raridadesFabricacao(): RaridadeFabricacao[] {
  return ['Comum', 'Incomum', 'Raro', 'Muito Raro', 'Lendário'];
}
