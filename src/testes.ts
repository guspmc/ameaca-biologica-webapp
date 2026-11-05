export type VantagemTeste = 'normal' | 'vantagem' | 'desvantagem';
export type ResultadoTeste = {
  estado: 'impossivel' | 'incompleto' | 'sucesso' | 'falha' | 'critico-sucesso' | 'falha-critica';
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
  if (!Number.isSafeInteger(d1) || (d1 as number) < 1 || (d1 as number) > 20) {
    return { estado: 'incompleto', dadoEscolhido: null, total: null, dt, detalhe: 'Informe o resultado físico do d20.' };
  }
  if (vantagem !== 'normal' && (!Number.isSafeInteger(d2) || (d2 as number) < 1 || (d2 as number) > 20)) {
    return { estado: 'incompleto', dadoEscolhido: null, total: null, dt, detalhe: 'Vantagem/Desvantagem exige os resultados dos dois d20.' };
  }
  const escolhido = vantagem === 'vantagem' ? Math.max(d1 as number, d2 as number)
    : vantagem === 'desvantagem' ? Math.min(d1 as number, d2 as number)
    : d1 as number;
  const total = escolhido + valorBase + modificador;
  if (escolhido === 20) return { estado: 'critico-sucesso', dadoEscolhido: escolhido, total, dt, detalhe: '20 natural: sucesso automático quando a tarefa é possível.' };
  if (escolhido === 1) return { estado: 'falha-critica', dadoEscolhido: escolhido, total, dt, detalhe: '1 natural: Falha Crítica; falha automática e Exposto até o fim do próximo turno, salvo regra específica.' };
  return total >= dt
    ? { estado: 'sucesso', dadoEscolhido: escolhido, total, dt, detalhe: 'Sucesso: o total alcançou a DT.' }
    : { estado: 'falha', dadoEscolhido: escolhido, total, dt, detalhe: 'Falha: o total não alcançou a DT.' };
}
