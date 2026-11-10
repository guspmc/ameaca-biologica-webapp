export type CartuchoGM79 = 'acido' | 'explosivo' | 'incendiario';
export type ModoGM79 = 'direto' | 'area';

export type ProcedimentoGM79 = {
  titulo: string;
  descricao: string;
  usaAtaque: boolean;
  danoEmArea: boolean;
};

/** Consulta o procedimento canônico; não rola dados nem resolve efeitos. */
export function consultarProcedimentoGM79(cartucho: CartuchoGM79, modo: ModoGM79): ProcedimentoGM79 {
  if (cartucho === 'explosivo') {
    return {
      titulo: 'Cartucho GM 79 — Explosivo · Área',
      descricao: 'Dispare contra um ponto até Alcance Médio, sem Teste de Ataque. Criaturas em raio de 3 m fazem Reflexos DT 10: sucesso sofre metade do Dano do GM 79; falha sofre o Dano integral. Não há Acerto Crítico.',
      usaAtaque: false,
      danoEmArea: true,
    };
  }
  if (cartucho === 'acido' && modo === 'direto') {
    return {
      titulo: 'Cartucho GM 79 — Ácido · Ataque direto',
      descricao: 'Faça Teste de Ataque contra a Defesa. Em acerto, o alvo direto sofre o Dano do GM 79; outras criaturas em raio de 1,5 m fazem Reflexos DT 10: em falha sofrem 1d6 de Dano de respingo; em sucesso evitam o respingo.',
      usaAtaque: true,
      danoEmArea: false,
    };
  }
  if (cartucho === 'acido') {
    return {
      titulo: 'Cartucho GM 79 — Ácido · Área',
      descricao: 'Dispare contra um ponto até Alcance Médio, sem Teste de Ataque. Criaturas em raio de 1,5 m fazem Reflexos DT 10: sucesso sofre metade do Dano do GM 79; falha sofre o Dano integral. Não há Acerto Crítico.',
      usaAtaque: false,
      danoEmArea: true,
    };
  }
  if (modo === 'direto') {
    return {
      titulo: 'Cartucho GM 79 — Incendiário · Ataque direto',
      descricao: 'Faça Teste de Ataque contra a Defesa. Em acerto, o alvo sofre o Dano do GM 79 e faz Fortitude DT 10; em falha, sofre Queimadura de 1d6 por 1 turno.',
      usaAtaque: true,
      danoEmArea: false,
    };
  }
  return {
    titulo: 'Cartucho GM 79 — Incendiário · Área',
    descricao: 'Dispare contra um ponto até Alcance Médio, sem Teste de Ataque. Criaturas em raio de 1,5 m fazem Reflexos DT 10: sucesso sofre metade do Dano do GM 79; falha sofre o Dano integral. Não há Acerto Crítico.',
    usaAtaque: false,
    danoEmArea: true,
  };
}
