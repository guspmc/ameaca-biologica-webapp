export type VantagemTeste = 'normal' | 'vantagem' | 'desvantagem';
export type ResultadoTeste = {
  estado: 'impossivel' | 'incompleto' | 'sucesso' | 'falha' | 'critico-sucesso' | 'falha-critica' | 'rolagem-ataque';
  dadoEscolhido: number | null;
  total: number | null;
  dt: number | null;
  detalhe: string;
};

export function calcularTesteManual(args: {
  valorBase: number;
  modificador?: number;
  dt: number | null;
  dado1?: number | null;
  dado2?: number | null;
  vantagem?: VantagemTeste;
}): ResultadoTeste {
  const { valorBase, dt } = args;
  const modificador = args.modificador ?? 0;
  const vantagem = args.vantagem ?? 'normal';
  if (!Number.isSafeInteger(valorBase) || !Number.isSafeInteger(modificador)) {
    throw new Error('Valor base e modificador precisam ser inteiros.');
  }
  if (dt === null) return { estado: 'impossivel', dadoEscolhido: null, total: null, dt: null, detalhe: 'Impossível: sem Teste.' };
  if (!Number.isSafeInteger(dt) || dt < 1) throw new Error('A DT precisa ser um inteiro positivo.');
  const d1 = args.dado1;
  const d2 = args.dado2;
  if (d1 === null || d1 === undefined) {
    return { estado: 'incompleto', dadoEscolhido: null, total: null, dt, detalhe: 'Informe o resultado físico do d20.' };
  }
  if (!Number.isSafeInteger(d1) || d1 < 1 || d1 > 20) throw new Error('A face do d20 precisa ser um inteiro entre 1 e 20.');
  if (vantagem !== 'normal' && (d2 === null || d2 === undefined)) {
    return { estado: 'incompleto', dadoEscolhido: null, total: null, dt, detalhe: 'Vantagem/Desvantagem exige os resultados dos dois d20.' };
  }
  if (vantagem !== 'normal' && (!Number.isSafeInteger(d2) || (d2 as number) < 1 || (d2 as number) > 20)) {
    throw new Error('A face do segundo d20 precisa ser um inteiro entre 1 e 20.');
  }
  const escolhido = vantagem === 'vantagem' ? Math.max(d1 as number, d2 as number)
    : vantagem === 'desvantagem' ? Math.min(d1 as number, d2 as number)
    : d1 as number;
  const total = escolhido + valorBase + modificador;
  if (escolhido === 20) return { estado: 'critico-sucesso', dadoEscolhido: escolhido, total, dt, detalhe: '20 natural: sucesso automático quando a tarefa é possível.' };
  if (escolhido === 1) return { estado: 'falha-critica', dadoEscolhido: escolhido, total, dt, detalhe: '1 natural: Falha Crítica. A consequência aplicável depende do tipo de resolução e das regras específicas.' };
  return total >= dt
    ? { estado: 'sucesso', dadoEscolhido: escolhido, total, dt, detalhe: 'Sucesso: o total alcançou a DT.' }
    : { estado: 'falha', dadoEscolhido: escolhido, total, dt, detalhe: 'Falha: o total não alcançou a DT.' };
}

/** Calcula somente a rolagem e o total do Ataque; não compara com Defesa nem decide acerto. */
export function calcularRolagemAtaqueManual(args: {
  valorBase: number;
  modificador?: number;
  dado1?: number | null;
  dado2?: number | null;
  vantagem?: VantagemTeste;
}): ResultadoTeste {
  const modificador = args.modificador ?? 0;
  const vantagem = args.vantagem ?? 'normal';
  if (!Number.isSafeInteger(args.valorBase) || !Number.isSafeInteger(modificador)) {
    throw new Error('Valor base e modificador precisam ser inteiros.');
  }
  const d1 = args.dado1;
  const d2 = args.dado2;
  if (d1 === null || d1 === undefined) {
    return { estado: 'incompleto', dadoEscolhido: null, total: null, dt: null, detalhe: 'Informe o resultado físico do d20.' };
  }
  if (!Number.isSafeInteger(d1) || d1 < 1 || d1 > 20) throw new Error('A face do d20 precisa ser um inteiro entre 1 e 20.');
  if (vantagem !== 'normal' && (d2 === null || d2 === undefined)) {
    return { estado: 'incompleto', dadoEscolhido: null, total: null, dt: null, detalhe: 'Vantagem/Desvantagem exige os resultados dos dois d20.' };
  }
  if (vantagem !== 'normal' && (!Number.isSafeInteger(d2) || (d2 as number) < 1 || (d2 as number) > 20)) {
    throw new Error('A face do segundo d20 precisa ser um inteiro entre 1 e 20.');
  }
  const escolhido = vantagem === 'vantagem' ? Math.max(d1, d2 as number)
    : vantagem === 'desvantagem' ? Math.min(d1, d2 as number) : d1;
  const total = escolhido + args.valorBase + modificador;
  const estado = escolhido === 20 ? 'critico-sucesso' : escolhido === 1 ? 'falha-critica' : 'rolagem-ataque';
  const detalhe = escolhido === 20 ? '20 natural: Acerto Crítico automático. O resultado não resolve Reações nem consequências.'
    : escolhido === 1 ? '1 natural: Falha Crítica. A Ficha não decide acerto, dano ou demais consequências.'
    : 'Rolagem registrada. Compare o total com a Defesa do alvo na mesa; a Ficha não declara acerto ou erro.';
  return { estado, dadoEscolhido: escolhido, total, dt: null, detalhe };
}
