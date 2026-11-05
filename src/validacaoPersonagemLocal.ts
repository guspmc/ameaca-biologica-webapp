import { atributosIniciaisValidos } from './atributosCriacao.ts';
import { armaOperarioValida } from './armaOperario.ts';
import { distribuicaoPericiasValida } from './periciasCriacao.ts';
import { ORIGENS } from './origens.ts';
import { HABILIDADES_BASICAS } from './habilidades.ts';
import { opcoesEquipamento } from './equipamento.ts';
import { planejarInventarioCriacao } from './inventarioCriacao.ts';

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
  if (typeof valor === 'number') return Number.isFinite(valor);
  if (typeof valor !== 'object') return false;
  if (visitados.has(valor)) return false;
  visitados.add(valor);
  if (Array.isArray(valor)) {
    const valido = valor.every(item => valorJsonSeguro(item, visitados));
    visitados.delete(valor);
    return valido;
  }
  const prototipo = Object.getPrototypeOf(valor);
  if (prototipo !== Object.prototype && prototipo !== null) return false;
  const valido = Object.values(valor as Record<string, unknown>).every(item => valorJsonSeguro(item, visitados));
  visitados.delete(valor);
  return valido;
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

  // Ausência identifica registros legados conhecidos; valores presentes precisam ser explícitos.
  if ('versaoModelo' in valor && valor.versaoModelo !== 1) return false;
  if ('estadoFicha' in valor && valor.estadoFicha !== 'rascunho') return false;

  const camposCaracteristicas = ['classe', 'origem', 'armaOperario', 'habilidadeBasica', 'equipamentoInicial'];
  if (tem(valor, camposCaracteristicas)) {
    if (typeof valor.classe !== 'string' || !['Agente', 'Autodidata', 'Operador'].includes(valor.classe)) return false;
    if (typeof valor.origem !== 'string' || !ORIGENS.some(item => item.nome === valor.origem)) return false;
    if (typeof valor.armaOperario !== 'string') return false;
    if (valor.origem === 'Operário') {
      if (!armaOperarioValida(valor.armaOperario)) return false;
    } else if (valor.armaOperario !== '' && !armaOperarioValida(valor.armaOperario)) return false;
    if (typeof valor.habilidadeBasica !== 'string'
      || !HABILIDADES_BASICAS.some(item => item.id === valor.habilidadeBasica && item.classe === valor.classe)) return false;
    if (typeof valor.equipamentoInicial !== 'string'
      || !opcoesEquipamento(valor.classe).some(item => item.id === valor.equipamentoInicial)) return false;
  }

  const camposPericias = ['atributos', 'periciaOrigemTreinada', 'periciaOrigemExtra', 'distribuicaoPericias'];
  if (tem(valor, camposPericias)) {
    if (!atributosIniciaisValidos(valor.atributos as never)) return false;
    if (typeof valor.classe !== 'string' || typeof valor.origem !== 'string'
      || typeof valor.periciaOrigemTreinada !== 'string' || !objeto(valor.distribuicaoPericias)) return false;
    const extra = valor.periciaOrigemExtra;
    if (extra !== null && typeof extra !== 'string') return false;
    if (!distribuicaoPericiasValida(
      valor.classe,
      valor.origem,
      valor.periciaOrigemTreinada,
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

  if (tem(valor, ['comprasIniciais', 'revisaoCompras'])) {
    if (!objeto(valor.comprasIniciais) || !Number.isInteger(valor.revisaoCompras) || (valor.revisaoCompras as number) < 0) return false;
    if (typeof valor.classe !== 'string' || typeof valor.equipamentoInicial !== 'string'
      || typeof valor.origem !== 'string' || !objeto(valor.atributos)) return false;
    try {
      planejarInventarioCriacao({
        classe: valor.classe,
        equipamento_inicial: valor.equipamentoInicial,
        forca: valor.atributos.forca as number,
        origem: valor.origem,
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
