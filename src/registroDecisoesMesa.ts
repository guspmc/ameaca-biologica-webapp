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
  /** ID do registro corrigido; obrigatório quando tipo=retificacao. */
  retificaRegistroId?: string;
  /** ID da instância de Reanimação cujo desfecho foi decidido pela Mesa. */
  reanimacaoId?: string;
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
  const chavesObrigatorias = 'descricao|id|ocorridoEm|registradoEm|responsavel|tipo';
  const chavesPermitidas = new Set([...chavesObrigatorias.split('|'), 'retificaRegistroId', 'reanimacaoId']);
  if (Object.keys(valor).some(chave => !chavesPermitidas.has(chave))) return false;
  if (['descricao', 'id', 'ocorridoEm', 'registradoEm', 'responsavel', 'tipo'].some(chave => !(chave in valor))) return false;
  return chaves.split('|').length >= 6
    && typeof valor.id === 'string' && valor.id.trim().length > 0 && valor.id.length <= 100
    && typeof valor.tipo === 'string' && Object.prototype.hasOwnProperty.call(TIPOS_DECISAO_MESA, valor.tipo)
    && typeof valor.descricao === 'string' && valor.descricao.trim().length > 0 && valor.descricao.length <= 500
    && typeof valor.responsavel === 'string' && valor.responsavel.trim().length > 0 && valor.responsavel.length <= 80
    && dataValida(valor.ocorridoEm) && dataValida(valor.registradoEm)
    && (valor.retificaRegistroId === undefined || (typeof valor.retificaRegistroId === 'string' && valor.retificaRegistroId.trim().length > 0 && valor.retificaRegistroId.length <= 100))
    && (valor.reanimacaoId === undefined || (typeof valor.reanimacaoId === 'string' && valor.reanimacaoId.trim().length > 0 && valor.reanimacaoId.length <= 100))
    && (valor.tipo === 'retificacao' ? (valor.retificaRegistroId === undefined || typeof valor.retificaRegistroId === 'string') : valor.retificaRegistroId === undefined);
}

export function listaDecisoesMesaValida(valor: unknown): valor is RegistroDecisaoMesa[] {
  if (!Array.isArray(valor) || valor.length > 30) return false;
  const ids = new Set<string>();
  for (const item of valor) {
    if (!registroDecisaoMesaValido(item) || ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return valor.every((item, indice) => item.tipo !== 'retificacao' || item.retificaRegistroId === undefined
    || (item.retificaRegistroId !== item.id && ids.has(item.retificaRegistroId)
      && valor.findIndex(alvo => alvo.id === item.retificaRegistroId) < indice));
}

export function adicionarDecisaoMesa(
  atuais: RegistroDecisaoMesa[],
  novo: RegistroDecisaoMesa,
): RegistroDecisaoMesa[] {
  if (!listaDecisoesMesaValida(atuais) || !registroDecisaoMesaValido(novo)) {
    throw new Error('Registro de decisões da Mesa inválido.');
  }
  if (atuais.length >= 30) throw new Error('Limite de 30 registros atingido. Exporte um backup antes de continuar.');
  if (atuais.some(item => item.id === novo.id)) throw new Error('Identificador de decisão já utilizado.');
  if (novo.tipo === 'retificacao' && !novo.retificaRegistroId) throw new Error('Uma nova Retificação precisa identificar o registro anterior.');
  const atualizados = [...atuais, { ...novo }];
  if (!listaDecisoesMesaValida(atualizados)) throw new Error('A referência da Retificação precisa apontar para um registro anterior existente.');
  return atualizados;
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
