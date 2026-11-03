/**
 * Banco local primário da Ficha do Jogador.
 *
 * IndexedDB é a fonte de verdade no dispositivo. Este módulo não importa
 * autenticação, Supabase, fetch, servidor ou qualquer transporte de rede.
 */
export const BANCO_FICHA = 'ameaca-biologica-ficha';
export const VERSAO_BANCO_FICHA = 1;
export const STORE_PERSONAGENS = 'personagens';

export type PersonagemLocal = {
  id: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
  dados: Record<string, unknown>;
};

function validarPersonagem(valor: unknown): valor is PersonagemLocal {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const item = valor as Partial<PersonagemLocal>;
  return typeof item.id === 'string' && item.id.trim().length > 0
    && typeof item.nome === 'string' && item.nome.trim().length > 0
    && typeof item.criadoEm === 'string' && !Number.isNaN(Date.parse(item.criadoEm))
    && typeof item.atualizadoEm === 'string' && !Number.isNaN(Date.parse(item.atualizadoEm))
    && !!item.dados && typeof item.dados === 'object' && !Array.isArray(item.dados);
}

function exigirIndexedDB(): IDBFactory {
  if (typeof indexedDB === 'undefined') {
    throw new Error('O armazenamento local deste navegador não está disponível. Nenhuma alteração foi salva.');
  }
  return indexedDB;
}

let abertura: Promise<IDBDatabase> | null = null;

function abrirBanco(): Promise<IDBDatabase> {
  if (abertura) return abertura;
  abertura = new Promise((resolve, reject) => {
    let requisicao: IDBOpenDBRequest;
    try {
      requisicao = exigirIndexedDB().open(BANCO_FICHA, VERSAO_BANCO_FICHA);
    } catch (erro) {
      abertura = null;
      reject(erro);
      return;
    }
    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;
      if (!banco.objectStoreNames.contains(STORE_PERSONAGENS)) {
        const store = banco.createObjectStore(STORE_PERSONAGENS, { keyPath: 'id' });
        store.createIndex('atualizadoEm', 'atualizadoEm', { unique: false });
      }
    };
    requisicao.onsuccess = () => {
      const banco = requisicao.result;
      banco.onversionchange = () => banco.close();
      resolve(banco);
    };
    requisicao.onerror = () => {
      abertura = null;
      reject(requisicao.error ?? new Error('Não foi possível abrir o banco local.'));
    };
    requisicao.onblocked = () => {
      abertura = null;
      reject(new Error('O banco local está sendo usado por outra aba. Feche as outras abas e tente novamente.'));
    };
  });
  return abertura;
}

function aguardarTransacao(transacao: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transacao.oncomplete = () => resolve();
    transacao.onabort = () => reject(transacao.error ?? new Error('A gravação local foi cancelada.'));
    transacao.onerror = () => reject(transacao.error ?? new Error('Falha durante a gravação local.'));
  });
}

function mensagemErro(erro: unknown): Error {
  if (erro instanceof DOMException && erro.name === 'QuotaExceededError') {
    return new Error('O aparelho está sem espaço para armazenar a ficha. Exporte um backup e libere espaço antes de tentar novamente.');
  }
  return erro instanceof Error ? erro : new Error('Falha no armazenamento local. Nenhuma alteração foi confirmada.');
}

export async function listarPersonagens(): Promise<PersonagemLocal[]> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readonly');
    const requisicao = transacao.objectStore(STORE_PERSONAGENS).getAll();
    const resultado = await new Promise<unknown[]>((resolve, reject) => {
      requisicao.onsuccess = () => resolve(requisicao.result as unknown[]);
      requisicao.onerror = () => reject(requisicao.error);
    });
    await aguardarTransacao(transacao);
    if (!resultado.every(validarPersonagem)) {
      throw new Error('Há registros locais com formato inválido. Os dados não foram alterados; faça uma cópia do perfil do navegador antes de continuar.');
    }
    return resultado.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export async function obterPersonagem(id: string): Promise<PersonagemLocal | null> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readonly');
    const requisicao = transacao.objectStore(STORE_PERSONAGENS).get(id);
    const valor = await new Promise<unknown>((resolve, reject) => {
      requisicao.onsuccess = () => resolve(requisicao.result ?? null);
      requisicao.onerror = () => reject(requisicao.error);
    });
    await aguardarTransacao(transacao);
    if (valor === null) return null;
    if (!validarPersonagem(valor)) throw new Error('O registro solicitado possui formato inválido. Nenhum dado foi alterado.');
    return valor;
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export async function salvarPersonagem(personagem: PersonagemLocal): Promise<PersonagemLocal> {
  if (!validarPersonagem(personagem)) throw new Error('Ficha inválida. Revise nome, identificador, datas e dados antes de salvar.');
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readwrite');
    transacao.objectStore(STORE_PERSONAGENS).put(structuredClone(personagem));
    await aguardarTransacao(transacao);
    return personagem;
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export async function excluirPersonagem(id: string): Promise<void> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readwrite');
    transacao.objectStore(STORE_PERSONAGENS).delete(id);
    await aguardarTransacao(transacao);
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

/** Substituição atômica usada na restauração de backup. */
export async function substituirPersonagens(personagens: PersonagemLocal[]): Promise<void> {
  if (!Array.isArray(personagens) || !personagens.every(validarPersonagem)
    || new Set(personagens.map(item => item.id)).size !== personagens.length) {
    throw new Error('O conjunto de fichas é inválido ou contém identificadores repetidos. Nada foi restaurado.');
  }
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readwrite');
    const store = transacao.objectStore(STORE_PERSONAGENS);
    store.clear();
    for (const personagem of personagens) store.put(structuredClone(personagem));
    await aguardarTransacao(transacao);
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export function fecharBancoFicha(): void {
  if (!abertura) return;
  void abertura.then(banco => banco.close()).catch(() => undefined);
  abertura = null;
}

/** Adiciona um lote inteiro em uma única transação, sem apagar fichas existentes. */
export async function adicionarPersonagens(personagens: PersonagemLocal[]): Promise<void> {
  if (!Array.isArray(personagens) || !personagens.every(validarPersonagem)
    || new Set(personagens.map(item => item.id)).size !== personagens.length) {
    throw new Error('O lote de fichas é inválido ou contém identificadores repetidos. Nada foi importado.');
  }
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readwrite');
    const store = transacao.objectStore(STORE_PERSONAGENS);
    for (const personagem of personagens) store.add(structuredClone(personagem));
    await aguardarTransacao(transacao);
  } catch (erro) {
    throw mensagemErro(erro);
  }
}
