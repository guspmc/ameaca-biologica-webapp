/**
 * Persistência isolada do laboratório local.
 *
 * Este módulo não importa nem chama Supabase, Auth ou APIs remotas.
 * Só deve armazenar dados fictícios explicitamente identificados como laboratório.
 * A integração visual é feita em etapa posterior; o cache offline real permanece
 * somente de leitura.
 */
export const CHAVE_LABORATORIO = 'ameaca-biologica:laboratorio-local:v1';
export const VERSAO_LABORATORIO = 1 as const;

export type RegistroLaboratorio = {
  id: string;
  tipo: 'mesa' | 'personagem';
  nome: string;
  atualizadoEm: string;
  dados: Record<string, unknown>;
};

export type EstadoLaboratorio = {
  versao: typeof VERSAO_LABORATORIO;
  ambiente: 'laboratorio-local';
  atualizadoEm: string;
  registros: RegistroLaboratorio[];
};

export interface ArmazenamentoLocal {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

function validarRegistro(valor: unknown): valor is RegistroLaboratorio {
  if (!valor || typeof valor !== 'object') return false;
  const r = valor as Partial<RegistroLaboratorio>;
  return typeof r.id === 'string' && r.id.length > 0
    && (r.tipo === 'mesa' || r.tipo === 'personagem')
    && typeof r.nome === 'string'
    && typeof r.atualizadoEm === 'string'
    && !!r.dados && typeof r.dados === 'object' && !Array.isArray(r.dados);
}

function validarEstado(valor: unknown): valor is EstadoLaboratorio {
  if (!valor || typeof valor !== 'object') return false;
  const e = valor as Partial<EstadoLaboratorio>;
  return e.versao === VERSAO_LABORATORIO
    && e.ambiente === 'laboratorio-local'
    && typeof e.atualizadoEm === 'string'
    && Array.isArray(e.registros)
    && e.registros.every(validarRegistro)
    && new Set(e.registros.map(r => r.id)).size === e.registros.length;
}

export function criarEstadoLaboratorio(agora = new Date().toISOString()): EstadoLaboratorio {
  return {
    versao: VERSAO_LABORATORIO,
    ambiente: 'laboratorio-local',
    atualizadoEm: agora,
    registros: [],
  };
}

export function lerLaboratorio(
  armazenamento: ArmazenamentoLocal,
): EstadoLaboratorio {
  const texto = armazenamento.getItem(CHAVE_LABORATORIO);
  if (texto === null) return criarEstadoLaboratorio();

  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    throw new Error('Os dados do laboratório local estão corrompidos. Nenhum dado foi sobrescrito.');
  }
  if (!validarEstado(valor)) {
    throw new Error('Os dados do laboratório local têm formato ou versão inválidos. Nenhum dado foi sobrescrito.');
  }
  return valor;
}

export function salvarLaboratorio(
  armazenamento: ArmazenamentoLocal,
  estado: EstadoLaboratorio,
  agora = new Date().toISOString(),
): EstadoLaboratorio {
  if (!validarEstado(estado)) {
    throw new Error('Estado do laboratório inválido; a gravação foi recusada.');
  }
  const salvo: EstadoLaboratorio = {
    ...estado,
    atualizadoEm: agora,
    registros: estado.registros.map(registro => ({ ...registro, dados: { ...registro.dados } })),
  };
  // Só retorna sucesso após setItem terminar sem lançar erro.
  armazenamento.setItem(CHAVE_LABORATORIO, JSON.stringify(salvo));
  return salvo;
}

export function gravarRegistroLaboratorio(
  armazenamento: ArmazenamentoLocal,
  registro: RegistroLaboratorio,
  agora = new Date().toISOString(),
): EstadoLaboratorio {
  if (!validarRegistro(registro)) throw new Error('Registro de laboratório inválido.');
  const estado = lerLaboratorio(armazenamento);
  const registros = estado.registros.filter(item => item.id !== registro.id);
  registros.push({ ...registro, atualizadoEm: agora, dados: { ...registro.dados } });
  return salvarLaboratorio(armazenamento, { ...estado, registros }, agora);
}

export function removerRegistroLaboratorio(
  armazenamento: ArmazenamentoLocal,
  id: string,
  agora = new Date().toISOString(),
): EstadoLaboratorio {
  const estado = lerLaboratorio(armazenamento);
  return salvarLaboratorio(
    armazenamento,
    { ...estado, registros: estado.registros.filter(item => item.id !== id) },
    agora,
  );
}

export function limparLaboratorio(armazenamento: ArmazenamentoLocal): void {
  armazenamento.removeItem(CHAVE_LABORATORIO);
}
