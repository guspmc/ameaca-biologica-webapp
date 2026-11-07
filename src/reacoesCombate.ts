import { calcularTesteManual, type ResultadoTeste, type VantagemTeste } from './testes.ts';
import { comprarRecursoPorEsforco, consumirRecursoNormal, gastarSAEmManobra, estadoEconomiaAcoesValido, type EstadoEconomiaAcoes } from './economiaAcoes.ts';

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
  if (!gatilho || typeof gatilho !== 'object' || Array.isArray(gatilho)) {
    throw new Error('Gatilho de Reação inválido.');
  }
  const chavesGatilho = ['resultadoAtaque', 'dadoNaturalAtaque', 'ataqueCorpoACorpo', 'ataqueAcertou', 'ataqueAparavel', 'gatilhoEsquivaAutorizado'];
  if (Object.keys(gatilho).sort().join('|') !== chavesGatilho.sort().join('|')
    || typeof gatilho.ataqueCorpoACorpo !== 'boolean' || typeof gatilho.ataqueAcertou !== 'boolean'
    || typeof gatilho.ataqueAparavel !== 'boolean' || typeof gatilho.gatilhoEsquivaAutorizado !== 'boolean'
    || !Number.isSafeInteger(gatilho.resultadoAtaque) || gatilho.resultadoAtaque < 1
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
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Dados do Teste defensivo inválidos.');
  if (args.tipo !== 'aparar' && args.tipo !== 'esquivar') throw new Error('Manobra defensiva desconhecida.');
  if (!Number.isSafeInteger(args.resultadoAtaque) || args.resultadoAtaque < 1) throw new Error('Resultado do Ataque inválido para o Teste defensivo.');
  if (args.vantagem !== undefined && !['normal', 'vantagem', 'desvantagem'].includes(args.vantagem)) {
    throw new Error('Tipo de Vantagem/Desvantagem inválido.');
  }
  const valorBase = args.tipo === 'aparar' ? args.valorLuta : args.valorReflexos;
  if (!Number.isSafeInteger(valorBase) || (valorBase as number) < 0) throw new Error('O valor da Perícia defensiva não foi informado corretamente.');
  return calcularTesteManual({
    valorBase: valorBase as number, dt: args.resultadoAtaque,
    dado1: args.dado1, dado2: args.dado2, vantagem: args.vantagem,
  });
}

/** Prepara Contra-Ataque somente após Aparar/Esquivar bem-sucedido. Não rola nem aplica Dano. */
export function prepararContraAtaque(args: {
  economia: EstadoEconomiaAcoes;
  defesaBemSucedida: boolean;
  ataqueCorpoACorpo: boolean;
  excecaoContraAtaqueADistancia?: boolean;
  mesmaReacaoAutorizada: boolean;
}): { economia: EstadoEconomiaAcoes; reacaoAdicionalComprada: boolean; custoSA: number } {
  if (typeof args.defesaBemSucedida !== 'boolean' || typeof args.ataqueCorpoACorpo !== 'boolean'
    || typeof args.mesmaReacaoAutorizada !== 'boolean'
    || (args.excecaoContraAtaqueADistancia !== undefined && typeof args.excecaoContraAtaqueADistancia !== 'boolean')) {
    throw new Error('Dados de autorização do Contra-Ataque inválidos.');
  }
  if (!args.defesaBemSucedida) throw new Error('Contra-Ataque exige Aparar ou Esquivar bem-sucedido.');
  if (!args.ataqueCorpoACorpo && !args.excecaoContraAtaqueADistancia) throw new Error('Contra-Ataque responde apenas a Ataques Corpo a Corpo, salvo Habilidade ou regra específica.');
  if (!estadoEconomiaAcoesValido(args.economia)) throw new Error('Estado da economia de ações inválido para Contra-Ataque.');
  let economia = args.economia;
  let reacaoAdicionalComprada = false;
  if (!args.mesmaReacaoAutorizada) {
    if (!economia.normaisUsados.reacao) {
      economia = consumirRecursoNormal(economia, 'reacao');
    } else {
      economia = comprarRecursoPorEsforco(economia, 'reacao');
      reacaoAdicionalComprada = true;
    }
  }
  economia = gastarSAEmManobra(economia, 1, true);
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
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Estado de Aparar inválido.');
  const { item, automacaoAtiva } = args;
  if (!item || typeof item !== 'object' || Array.isArray(item)
    || Object.getPrototypeOf(item) !== Object.prototype
    || Object.keys(item).sort().join('|') !== ['durabilidadeAtual', 'indestrutivel'].sort().join('|')
    || typeof item.indestrutivel !== 'boolean' || typeof automacaoAtiva !== 'boolean') throw new Error('Estado de Aparar inválido.');
  if (item.indestrutivel) return { ...item };
  if (!Number.isSafeInteger(item.durabilidadeAtual) || (item.durabilidadeAtual as number) < 0) {
    throw new Error('Durabilidade atual inválida ou não informada.');
  }
  if ((item.durabilidadeAtual as number) === 0) throw new Error('Durabilidade 0: este item não pode Aparar.');
  return automacaoAtiva
    ? { ...item, durabilidadeAtual: (item.durabilidadeAtual as number) - 1 }
    : { ...item };
}

function janelaReacaoValida(valor: unknown): valor is JanelaReacao {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const janela = valor as Record<string, unknown>;
  const chaves = Object.keys(janela).sort();
  if (chaves.join('|') !== ['aberta', 'fechadaPor20Natural', 'motivo', 'podeAparar', 'podeEsquivar'].sort().join('|')
    || typeof janela.aberta !== 'boolean'
    || typeof janela.fechadaPor20Natural !== 'boolean'
    || typeof janela.podeAparar !== 'boolean'
    || typeof janela.podeEsquivar !== 'boolean'
    || typeof janela.motivo !== 'string'
    || janela.fechadaPor20Natural === janela.aberta
    || (janela.fechadaPor20Natural && (janela.podeAparar || janela.podeEsquivar))) return false;
  return true;
}

/** Consome uma Reação defensiva; se a normal já foi usada, compra outra por Esforço. */
export function registrarReacaoDefensiva(args: {
  economia: EstadoEconomiaAcoes;
  manobra: 'aparar' | 'esquivar';
  janela: JanelaReacao;
}): { economia: EstadoEconomiaAcoes; reacaoAdicionalComprada: boolean } {
  if (args.manobra !== 'aparar' && args.manobra !== 'esquivar') throw new Error('Manobra defensiva desconhecida.');
  if (!estadoEconomiaAcoesValido(args.economia)) throw new Error('Estado da economia de ações inválido para Reação defensiva.');
  if (!janelaReacaoValida(args.janela)) {
    throw new Error('Janela de Reação inválida.');
  }
  if (!args.janela.aberta) throw new Error('A janela de Reações defensivas está fechada.');
  if (args.manobra === 'aparar' && !args.janela.podeAparar) throw new Error('Aparar não está disponível para este Ataque.');
  if (args.manobra === 'esquivar' && !args.janela.podeEsquivar) throw new Error('Esquivar não está liberado por Habilidade ou regra para este gatilho.');
  let economia = args.economia;
  let reacaoAdicionalComprada = false;
  if (!economia.normaisUsados.reacao) {
    economia = consumirRecursoNormal(economia, 'reacao');
  } else {
    economia = comprarRecursoPorEsforco(economia, 'reacao');
    reacaoAdicionalComprada = true;
  }
  return { economia, reacaoAdicionalComprada };
}
