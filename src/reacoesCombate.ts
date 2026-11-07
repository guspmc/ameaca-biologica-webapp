import { calcularTesteManual, type ResultadoTeste, type VantagemTeste } from './testes.ts';
import { comprarRecursoPorEsforco, consumirRecursoNormal, gastarSAEmManobra, type EstadoEconomiaAcoes } from './economiaAcoes.ts';

export type GatilhoReacao = {
  resultadoAtaque: number;
  dadoNaturalAtaque: number;
  ataqueCorpoACorpo: boolean;
  ataqueAcertou: boolean;
  ataqueAparavel: boolean;
  gatilhoEsquivaAutorizado: boolean;
};

export type JanelaReacao = {
  aberta: boolean;
  fechadaPor20Natural: boolean;
  podeAparar: boolean;
  podeEsquivar: boolean;
  motivo: string;
};

/** Registra a janela após conhecer o resultado do Ataque e antes de Dano, BI ou Condições. */
export function avaliarJanelaReacao(gatilho: GatilhoReacao): JanelaReacao {
  if (!Number.isSafeInteger(gatilho.resultadoAtaque) || gatilho.resultadoAtaque < 1
    || !Number.isSafeInteger(gatilho.dadoNaturalAtaque) || gatilho.dadoNaturalAtaque < 1 || gatilho.dadoNaturalAtaque > 20) {
    throw new Error('Resultado do Ataque e dado natural precisam ser válidos.');
  }
  const fechada = gatilho.dadoNaturalAtaque === 20;
  const aparar = !fechada && gatilho.ataqueCorpoACorpo && gatilho.ataqueAcertou && gatilho.ataqueAparavel;
  const esquivar = !fechada && gatilho.gatilhoEsquivaAutorizado;
  return {
    aberta: !fechada,
    fechadaPor20Natural: fechada,
    podeAparar: aparar,
    podeEsquivar: esquivar,
    motivo: fechada ? '20 natural fecha as Reações defensivas normais.'
      : aparar || esquivar ? 'Declare a Reação imediatamente, antes da resolução de Dano, BI ou Condições.'
      : 'A janela permanece aberta, mas não há Manobra defensiva habilitada para este gatilho.',
  };
}

export function resolverTesteDefensivo(args: {
  tipo: 'aparar' | 'esquivar';
  valorLuta?: number;
  valorReflexos?: number;
  resultadoAtaque: number;
  dado1: number;
  dado2?: number | null;
  vantagem?: VantagemTeste;
}): ResultadoTeste {
  const valorBase = args.tipo === 'aparar' ? args.valorLuta : args.valorReflexos;
  if (!Number.isSafeInteger(valorBase)) throw new Error('O valor da Perícia defensiva não foi informado corretamente.');
  return calcularTesteManual({
    valorBase: valorBase as number, dt: args.resultadoAtaque,
    dado1: args.dado1, dado2: args.dado2, vantagem: args.vantagem,
  });
}

/** Prepara Contra-Ataque somente após Aparar/Esquivar bem-sucedido. Não rola nem aplica Dano. */
export function prepararContraAtaque(args: {
  economia: EstadoEconomiaAcoes;
  defesaBemSucedida: boolean;
  mesmaReacaoAutorizada: boolean;
}): { economia: EstadoEconomiaAcoes; reacaoAdicionalComprada: boolean; custoSA: number } {
  if (!args.defesaBemSucedida) throw new Error('Contra-Ataque exige Aparar ou Esquivar bem-sucedido.');
  let economia = args.economia;
  let reacaoAdicionalComprada = false;
  if (!args.mesmaReacaoAutorizada) {
    if (economia.turnoEmAndamento && !economia.normaisUsados.reacao) {
      economia = consumirRecursoNormal(economia, 'reacao');
    } else {
      economia = comprarRecursoPorEsforco(economia, 'reacao');
      reacaoAdicionalComprada = true;
    }
  }
  economia = gastarSAEmManobra(economia, 1);
  return { economia, reacaoAdicionalComprada, custoSA: 1 + (reacaoAdicionalComprada ? 1 : 0) };
}

export type EstadoDurabilidadeAparar = {
  durabilidadeAtual: number | null;
  indestrutivel: boolean;
};

/** Valida se o item pode Aparar e aplica o custo somente quando a automação está habilitada. */
export function registrarUsoAparar(args: {
  item: EstadoDurabilidadeAparar;
  automacaoAtiva: boolean;
}): EstadoDurabilidadeAparar {
  const { item, automacaoAtiva } = args;
  if (typeof item.indestrutivel !== 'boolean') throw new Error('Estado Indestrutível inválido.');
  if (item.indestrutivel) return { ...item };
  if (!Number.isSafeInteger(item.durabilidadeAtual) || (item.durabilidadeAtual as number) < 0) {
    throw new Error('Durabilidade atual inválida ou não informada.');
  }
  if ((item.durabilidadeAtual as number) === 0) throw new Error('Durabilidade 0: este item não pode Aparar.');
  return automacaoAtiva
    ? { ...item, durabilidadeAtual: (item.durabilidadeAtual as number) - 1 }
    : { ...item };
}

/** Consome uma Reação defensiva; se a normal já foi usada, compra outra por Esforço. */
export function registrarReacaoDefensiva(args: {
  economia: EstadoEconomiaAcoes;
  manobra: 'aparar' | 'esquivar';
  janela: JanelaReacao;
}): { economia: EstadoEconomiaAcoes; reacaoAdicionalComprada: boolean } {
  if (!args.janela.aberta) throw new Error('A janela de Reações defensivas está fechada.');
  if (args.manobra === 'aparar' && !args.janela.podeAparar) throw new Error('Aparar não está disponível para este Ataque.');
  if (args.manobra === 'esquivar' && !args.janela.podeEsquivar) throw new Error('Esquivar não está liberado por Habilidade ou regra para este gatilho.');
  let economia = args.economia;
  let reacaoAdicionalComprada = false;
  if (economia.turnoEmAndamento && !economia.normaisUsados.reacao) {
    economia = consumirRecursoNormal(economia, 'reacao');
  } else {
    economia = comprarRecursoPorEsforco(economia, 'reacao');
    reacaoAdicionalComprada = true;
  }
  return { economia, reacaoAdicionalComprada };
}
