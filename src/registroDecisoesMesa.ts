export const TIPOS_DECISAO_MESA = {
  morte: 'Morte',
  transformacao: 'Transformação',
  reversao: 'Reversão de transformação',
  reanimacao: 'Desfecho de Reanimação',
  excecao: 'Exceção ou decisão especial',
  retificacao: 'Retificação de registro anterior',
  outro: 'Outro acontecimento',
} as const;

export type TipoDecisaoMesa = keyof typeof TIPOS_DECISAO_MESA;

export type RegistroDecisaoMesa = {
  id: string;
  tipo: TipoDecisaoMesa;
  descricao: string;
  responsavel: string;
  ocorridoEm: string;
  registradoEm: string;
};

function objetoSimples(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && (Object.getPrototypeOf(valor) === Object.prototype || Object.getPrototypeOf(valor) === null);
}

function dataValida(valor: unknown): valor is string {
  return typeof valor === 'string' && !Number.isNaN(Date.parse(valor))
    && new Date(valor).toISOString() === valor;
}

export function registroDecisaoMesaValido(valor: unknown): valor is RegistroDecisaoMesa {
  if (!objetoSimples(valor)) return false;
  const chaves = Object.keys(valor).sort().join('|');
  return chaves === 'descricao|id|ocorridoEm|registradoEm|responsavel|tipo'
    && typeof valor.id === 'string' && valor.id.trim().length > 0 && valor.id.length <= 100
    && typeof valor.tipo === 'string' && Object.prototype.hasOwnProperty.call(TIPOS_DECISAO_MESA, valor.tipo)
    && typeof valor.descricao === 'string' && valor.descricao.trim().length > 0 && valor.descricao.length <= 1200
    && typeof valor.responsavel === 'string' && valor.responsavel.trim().length > 0 && valor.responsavel.length <= 120
    && dataValida(valor.ocorridoEm) && dataValida(valor.registradoEm);
}

export function listaDecisoesMesaValida(valor: unknown): valor is RegistroDecisaoMesa[] {
  if (!Array.isArray(valor) || valor.length > 100) return false;
  const ids = new Set<string>();
  for (const item of valor) {
    if (!registroDecisaoMesaValido(item) || ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return true;
}

export function adicionarDecisaoMesa(
  atuais: RegistroDecisaoMesa[],
  novo: RegistroDecisaoMesa,
): RegistroDecisaoMesa[] {
  if (!listaDecisoesMesaValida(atuais) || !registroDecisaoMesaValido(novo)) {
    throw new Error('Registro de decisões da Mesa inválido.');
  }
  if (atuais.length >= 100) throw new Error('Limite de 100 registros atingido. Exporte um backup antes de continuar.');
  if (atuais.some(item => item.id === novo.id)) throw new Error('Identificador de decisão já utilizado.');
  return [...atuais, { ...novo }];
}

/** IDs compatíveis com navegadores/WebViews sem randomUUID funcional. */
export function gerarIdDecisaoMesa(provedor: { randomUUID?: unknown } | null = globalThis.crypto): string {
  if (typeof provedor?.randomUUID === 'function') {
    return (provedor.randomUUID as () => string).call(provedor);
  }
  const aleatorio = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, caractere => {
    const valor = Number.parseInt(aleatorio(), 16);
    return (caractere === 'x' ? valor : (valor & 0x3) | 0x8).toString(16);
  });
}
