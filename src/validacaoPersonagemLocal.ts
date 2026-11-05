import { atributosIniciaisValidos } from './atributosCriacao.ts';
import { armaOperarioValida } from './armaOperario.ts';
import { distribuicaoPericiasValida, NOMES_PERICIAS } from './periciasCriacao.ts';
import { ORIGENS } from './origens.ts';
import { HABILIDADES_BASICAS } from './habilidades.ts';
import { opcoesEquipamento } from './equipamento.ts';
import { planejarInventarioCriacao } from './inventarioCriacao.ts';
import { simularCompras } from './comprasIniciais.ts';

export type PersonagemValidavel = {
  id: string;
  geracao?: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
  dados: Record<string, unknown>;
};

export type OpcoesValidacaoPersonagem = {
  permitirGeracaoAusente?: boolean;
};

/** Garante que dados conhecidos e futuros possam atravessar o backup JSON sem perda silenciosa. */
function valorJsonSeguro(valor: unknown, visitados = new Set<object>()): boolean {
  if (valor === null || typeof valor === 'string' || typeof valor === 'boolean') return true;
  if (typeof valor === 'number') return Number.isFinite(valor) && !Object.is(valor, -0);
  if (typeof valor !== 'object') return false;
  if (visitados.has(valor)) return false;
  visitados.add(valor);

  const chaves = Reflect.ownKeys(valor);
  if (chaves.some(chave => typeof chave !== 'string')) {
    visitados.delete(valor);
    return false;
  }

  if (Array.isArray(valor)) {
    // JSON transforma lacunas em null e ignora propriedades extras do array.
    if (chaves.some(chave => chave !== 'length'
      && (!/^\d+$/.test(chave as string) || Number(chave) >= valor.length))
      || Array.from({ length: valor.length }, (_, indice) => Object.prototype.hasOwnProperty.call(valor, indice)).some(existe => !existe)) {
      visitados.delete(valor);
      return false;
    }
    const valido = valor.every(item => valorJsonSeguro(item, visitados));
    visitados.delete(valor);
    return valido;
  }

  const prototipo = Object.getPrototypeOf(valor);
  if (prototipo !== Object.prototype && prototipo !== null) {
    visitados.delete(valor);
    return false;
  }
  for (const chave of chaves as string[]) {
    const descritor = Object.getOwnPropertyDescriptor(valor, chave);
    if (!descritor?.enumerable || !('value' in descritor)
      || !valorJsonSeguro(descritor.value, visitados)) {
      visitados.delete(valor);
      return false;
    }
  }
  visitados.delete(valor);
  return true;
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && (Object.getPrototypeOf(valor) === Object.prototype || Object.getPrototypeOf(valor) === null);
}

function tem(dados: Record<string, unknown>, chaves: string[]): boolean {
  return chaves.some(chave => Object.prototype.hasOwnProperty.call(dados, chave));
}

function validarDadosFicha(valor: unknown): valor is Record<string, unknown> {
  if (!objeto(valor) || !valorJsonSeguro(valor)) return false;

  // Ausência identifica registros legados/incompletos; valores presentes precisam ser explícitos.
  if ('versaoModelo' in valor && valor.versaoModelo !== 1) return false;
  if ('estadoFicha' in valor && valor.estadoFicha !== 'rascunho') return false;

  if ('classe' in valor
    && (typeof valor.classe !== 'string' || !['Agente', 'Autodidata', 'Operador'].includes(valor.classe))) return false;
  if ('origem' in valor
    && (typeof valor.origem !== 'string' || !ORIGENS.some(item => item.nome === valor.origem))) return false;
  if ('armaOperario' in valor) {
    if (typeof valor.armaOperario !== 'string') return false;
    if (valor.armaOperario !== '' && !armaOperarioValida(valor.armaOperario)) return false;
  }
  if ('habilidadeBasica' in valor) {
    if (typeof valor.habilidadeBasica !== 'string') return false;
    if (valor.habilidadeBasica !== '' && !HABILIDADES_BASICAS.some(item =>
      item.id === valor.habilidadeBasica && (!('classe' in valor) || item.classe === valor.classe)
    )) return false;
  }
  if ('equipamentoInicial' in valor) {
    if (typeof valor.equipamentoInicial !== 'string') return false;
    if (valor.equipamentoInicial !== '' && !opcoesEquipamento(typeof valor.classe === 'string' ? valor.classe : null)
      .some(item => item.id === valor.equipamentoInicial)) return false;
  }
  const caracteristicasCompletas = ['classe', 'origem', 'armaOperario', 'habilidadeBasica', 'equipamentoInicial'].every(chave => chave in valor);
  if (caracteristicasCompletas) {
    if (typeof valor.classe !== 'string' || typeof valor.origem !== 'string'
      || typeof valor.armaOperario !== 'string' || typeof valor.habilidadeBasica !== 'string'
      || typeof valor.equipamentoInicial !== 'string') return false;
    if (!HABILIDADES_BASICAS.some(item => item.id === valor.habilidadeBasica && item.classe === valor.classe)) return false;
    if (!opcoesEquipamento(valor.classe).some(item => item.id === valor.equipamentoInicial)) return false;
    if (valor.origem === 'Operário' && !armaOperarioValida(valor.armaOperario)) return false;
  }

  if ('atributos' in valor) {
    if (!objeto(valor.atributos)) return false;
    const chavesAtributos = Object.keys(valor.atributos).sort();
    if (chavesAtributos.join('|') !== ['agilidade', 'astucia', 'forca', 'vigor'].join('|')) return false;
    if (!atributosIniciaisValidos(valor.atributos as never)) return false;
  }
  if ('periciaOrigemTreinada' in valor) {
    if (typeof valor.periciaOrigemTreinada !== 'string') return false;
    if (valor.periciaOrigemTreinada !== '' && !NOMES_PERICIAS.includes(valor.periciaOrigemTreinada as never)) return false;
    if (valor.periciaOrigemTreinada && typeof valor.origem === 'string') {
      const origemTreinamento = ORIGENS.find(item => item.nome === valor.origem);
      if (!origemTreinamento) return false;
      if (valor.origem !== 'Amnésico' && !origemTreinamento.pericias.includes(valor.periciaOrigemTreinada)) return false;
    }
  }
  if ('periciaOrigemExtra' in valor) {
    if (valor.periciaOrigemExtra !== null && typeof valor.periciaOrigemExtra !== 'string') return false;
    if (typeof valor.periciaOrigemExtra === 'string' && valor.periciaOrigemExtra !== ''
      && !NOMES_PERICIAS.includes(valor.periciaOrigemExtra as never)) return false;
    if (typeof valor.periciaOrigemExtra === 'string' && valor.periciaOrigemExtra !== '') {
      if (valor.origem !== 'Amnésico' || valor.periciaOrigemExtra === valor.periciaOrigemTreinada) return false;
    }
  }
  if ('distribuicaoPericias' in valor) {
    if (!objeto(valor.distribuicaoPericias)
      || Object.entries(valor.distribuicaoPericias).some(([nome, grau]) =>
        !NOMES_PERICIAS.includes(nome as never) || !Number.isInteger(grau) || (grau as number) < 0 || (grau as number) > 2
      )) return false;
  }

  const contextoPericiasCompleto = 'atributos' in valor && 'classe' in valor && 'origem' in valor
    && 'periciaOrigemTreinada' in valor && 'distribuicaoPericias' in valor;
  if (contextoPericiasCompleto) {
    const extra = valor.periciaOrigemExtra;
    if (!distribuicaoPericiasValida(
      valor.classe as string,
      valor.origem as string,
      valor.periciaOrigemTreinada as string,
      valor.distribuicaoPericias as Record<string, number>,
      typeof extra === 'string' ? extra : undefined,
    )) return false;
  }

  if ('identidade' in valor) {
    if (!objeto(valor.identidade)) return false;
    const limites: Record<string, number> = {
      idade: 40, genero: 40, ocupacao: 120, apelido: 120, afiliacao: 120,
      aparencia: 1000, personalidade: 1000, objetivo: 1000, medo: 1000, lacos: 1000, historia: 4000,
    };
    for (const [campo, limite] of Object.entries(limites)) {
      if (campo in valor.identidade
        && (typeof valor.identidade[campo] !== 'string' || valor.identidade[campo].length > limite)) return false;
    }
  }

  if ('comprasIniciais' in valor) {
    if (!objeto(valor.comprasIniciais)) return false;
    try {
      if (!simularCompras(valor.comprasIniciais as Record<string, number>, 100).orcamentoValido) return false;
    } catch {
      return false;
    }
    if (valor.equipamentoInicial !== undefined && valor.equipamentoInicial !== 'C'
      && Object.keys(valor.comprasIniciais).length > 0) return false;
  }
  if ('revisaoCompras' in valor
    && (!Number.isInteger(valor.revisaoCompras) || (valor.revisaoCompras as number) < 0)) return false;

  const contextoInventarioCompleto = 'comprasIniciais' in valor && 'revisaoCompras' in valor
    && typeof valor.classe === 'string' && typeof valor.equipamentoInicial === 'string'
    && typeof valor.origem === 'string' && objeto(valor.atributos);
  if (contextoInventarioCompleto) {
    try {
      planejarInventarioCriacao({
        classe: valor.classe as string,
        equipamento_inicial: valor.equipamentoInicial as string,
        forca: (valor.atributos as Record<string, unknown>).forca as number,
        origem: valor.origem as string,
        nivel: 1,
        estado_ficha: 'rascunho',
        compras_iniciais: valor.comprasIniciais as Record<string, number>,
      });
    } catch {
      return false;
    }
  }

  return true;
}

export function validarPersonagemLocal(
  valor: unknown,
  opcoes: OpcoesValidacaoPersonagem = {},
): valor is PersonagemValidavel {
  if (!objeto(valor)) return false;
  const item = valor as Record<string, unknown>;
  const geracaoValida = typeof item.geracao === 'string' && item.geracao.trim().length > 0;
  if (!geracaoValida && !(opcoes.permitirGeracaoAusente && item.geracao === undefined)) return false;
  return typeof item.id === 'string' && item.id.trim().length > 0
    && typeof item.nome === 'string' && item.nome.trim().length >= 2 && item.nome.trim().length <= 80
    && typeof item.criadoEm === 'string' && !Number.isNaN(Date.parse(item.criadoEm))
    && typeof item.atualizadoEm === 'string' && !Number.isNaN(Date.parse(item.atualizadoEm))
    && validarDadosFicha(item.dados);
}
