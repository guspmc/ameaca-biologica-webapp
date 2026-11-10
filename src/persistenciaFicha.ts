/**
 * Banco local primário da Ficha do Jogador.
 *
 * IndexedDB é a fonte de verdade no dispositivo. Este módulo não importa
 * autenticação, Supabase, fetch, servidor ou qualquer transporte de rede.
 */
export const BANCO_FICHA = 'ameaca-biologica-ficha';
export const VERSAO_BANCO_FICHA = 3;
export const STORE_PERSONAGENS = 'personagens';
export const STORE_VINCULOS_LAN = 'vinculosLan';
export const INDEX_VINCULOS_REMOTE_KEY = 'remoteKey';

export type EstadoSincronizacaoLan = 'sincronizado' | 'pendente' | 'conflito' | 'bloqueado-autorizacao';

export type OperacaoPendenteLan = {
  operationId: string;
  payloadHash: string;
  baseRevision: number;
  localVersion: number;
};

export type SnapshotLanConflito = {
  name: string;
  data: Record<string, unknown>;
  revision: number;
};

export type VinculoLan = {
  localId: string;
  accountId: string;
  mesaId: string;
  personagemId: string;
  remoteKey: string;
  baseRevision: number;
  syncState: EstadoSincronizacaoLan;
  pendingOperation?: OperacaoPendenteLan;
  snapshotLanConflito?: SnapshotLanConflito;
};

export function chaveRemotaVinculo(accountId: string, mesaId: string, personagemId: string): string {
  return JSON.stringify([accountId, mesaId, personagemId]);
}

function textoNaoVazio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function objetoEstrito(valor: unknown, chaves: string[]): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && Object.keys(valor).every(chave => chaves.includes(chave));
}

export function validarVinculoLan(valor: unknown): valor is VinculoLan {
  if (!objetoEstrito(valor, [
    'localId', 'accountId', 'mesaId', 'personagemId', 'remoteKey',
    'baseRevision', 'syncState', 'pendingOperation', 'snapshotLanConflito',
  ])) return false;
  const v = valor;
  if (![v.localId, v.accountId, v.mesaId, v.personagemId].every(textoNaoVazio)
    || !/^[a-f0-9]{32}$/i.test(v.personagemId as string)
    || v.remoteKey !== chaveRemotaVinculo(v.accountId as string, v.mesaId as string, v.personagemId as string)
    || !Number.isSafeInteger(v.baseRevision) || (v.baseRevision as number) < 0
    || !['sincronizado', 'pendente', 'conflito', 'bloqueado-autorizacao'].includes(v.syncState as string)) return false;

  if (v.pendingOperation !== undefined) {
    if (!objetoEstrito(v.pendingOperation, ['operationId', 'payloadHash', 'baseRevision', 'localVersion'])) return false;
    const op = v.pendingOperation;
    if (!textoNaoVazio(op.operationId) || !textoNaoVazio(op.payloadHash)
      || !Number.isSafeInteger(op.baseRevision) || (op.baseRevision as number) < 0
      || !Number.isSafeInteger(op.localVersion) || (op.localVersion as number) < 0) return false;
  }
  if (v.snapshotLanConflito !== undefined) {
    if (!objetoEstrito(v.snapshotLanConflito, ['name', 'data', 'revision'])) return false;
    const snapshot = v.snapshotLanConflito;
    if (!textoNaoVazio(snapshot.name) || !snapshot.data || typeof snapshot.data !== 'object'
      || Array.isArray(snapshot.data) || !Number.isSafeInteger(snapshot.revision)
      || (snapshot.revision as number) < 0) return false;
  }
  return true;
}

import { validarPersonagemLocal } from './validacaoPersonagemLocal.ts';

export type PersonagemLocal = {
  id: string;
  geracao: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
  dados: Record<string, unknown>;
};

function novoTokenGeracao(): string {
  return globalThis.crypto?.randomUUID?.() ?? `geracao-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function validarPersonagem(valor: unknown): valor is PersonagemLocal {
  return validarPersonagemLocal(valor);
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

  let requisicao: IDBOpenDBRequest;
  try {
    requisicao = exigirIndexedDB().open(BANCO_FICHA, VERSAO_BANCO_FICHA);
  } catch (erro) {
    return Promise.reject(erro);
  }

  let aberturaBloqueada = false;
  let promessa: Promise<IDBDatabase>;

  promessa = new Promise((resolve, reject) => {
    requisicao.onupgradeneeded = evento => {
      const banco = requisicao.result;
      let store: IDBObjectStore;
      if (!banco.objectStoreNames.contains(STORE_PERSONAGENS)) {
        store = banco.createObjectStore(STORE_PERSONAGENS, { keyPath: 'id' });
        store.createIndex('atualizadoEm', 'atualizadoEm', { unique: false });
      } else {
        store = requisicao.transaction!.objectStore(STORE_PERSONAGENS);
      }
      // A v3 adiciona metadados LAN em store separado; fichas existentes não são reescritas.
      if (!banco.objectStoreNames.contains(STORE_VINCULOS_LAN)) {
        const vinculos = banco.createObjectStore(STORE_VINCULOS_LAN, { keyPath: 'localId' });
        vinculos.createIndex(INDEX_VINCULOS_REMOTE_KEY, 'remoteKey', { unique: true });
      }
      // Migração transparente: fichas anteriores recebem uma geração inicial.
      if ((evento as IDBVersionChangeEvent).oldVersion < 2) {
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          const atual = cursor.result;
          if (!atual) return;
          const registro = atual.value as Record<string, unknown>;
          if (typeof registro.geracao !== 'string' || !registro.geracao.trim()) {
            atual.update({ ...registro, geracao: novoTokenGeracao() });
          }
          atual.continue();
        };
      }
    };
    requisicao.onsuccess = () => {
      const banco = requisicao.result;
      banco.onversionchange = () => {
        banco.close();
        if (abertura === promessa) abertura = null;
      };
      if (aberturaBloqueada) {
        banco.close();
        return;
      }
      resolve(banco);
    };
    requisicao.onerror = () => {
      if (abertura === promessa) abertura = null;
      reject(requisicao.error ?? new Error('Não foi possível abrir o banco local.'));
    };
    requisicao.onblocked = () => {
      aberturaBloqueada = true;
      if (abertura === promessa) abertura = null;
      reject(new Error('O banco local está sendo usado por outra aba. Feche as outras abas e tente novamente.'));
    };
  });

  abertura = promessa;
  return promessa;
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
  if (!validarPersonagem(personagem)) throw new Error('Ficha inválida. Revise nome (2 a 80 caracteres), identificador, datas e dados antes de salvar.');
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


/**
 * Atualiza somente as chaves indicadas, lendo a versão mais recente dentro
 * da mesma transação readwrite. Conflitos na mesma chave são recusados:
 * alterações em chaves diferentes podem ser mescladas sem sobrescrita.
 */
export async function salvarPatchPersonagem(
  id: string,
  patch: Record<string, unknown>,
  valoresBase: Record<string, unknown>,
  nomeAtualizado?: string,
  nomeBase?: string,
  geracaoBase?: string,
): Promise<PersonagemLocal> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readwrite');
    const store = transacao.objectStore(STORE_PERSONAGENS);
    const requisicao = store.get(id);
    let atualizado: PersonagemLocal | null = null;
    let falha: Error | null = null;

    requisicao.onsuccess = () => {
      const atual = requisicao.result;
      if (!validarPersonagem(atual)) {
        falha = new Error('A ficha não existe mais ou possui formato inválido. Reabra a ficha antes de salvar.');
        transacao.abort();
        return;
      }
      if (geracaoBase !== undefined && atual.geracao !== geracaoBase) {
        falha = new Error('A ficha foi substituída por uma restauração ou alteração em outra aba. Recarregue a ficha antes de salvar.');
        transacao.abort();
        return;
      }
      if (nomeAtualizado !== undefined && nomeBase !== undefined && atual.nome !== nomeBase) {
        falha = new Error('A ficha foi alterada em outra aba (conflito no nome). Reabra a ficha antes de salvar.');
        transacao.abort();
        return;
      }
      for (const chave of Object.keys(patch)) {
        const anterior = Object.prototype.hasOwnProperty.call(valoresBase, chave) ? valoresBase[chave] : undefined;
        const vigente = Object.prototype.hasOwnProperty.call(atual.dados, chave) ? atual.dados[chave] : undefined;
        if (JSON.stringify(anterior) !== JSON.stringify(vigente)) {
          falha = new Error('Esta seção foi alterada em outra aba. Reabra a ficha e reaplique suas alterações para evitar sobrescrever dados.');
          transacao.abort();
          return;
        }
      }
      atualizado = {
        ...atual,
        nome: nomeAtualizado?.trim() || atual.nome,
        atualizadoEm: new Date().toISOString(),
        dados: { ...atual.dados, ...structuredClone(patch) },
      };
      if (!validarPersonagem(atualizado)) {
        atualizado = null;
        falha = new Error('A alteração não atende ao formato válido da ficha. Revise os campos antes de salvar.');
        transacao.abort();
        return;
      }
      store.put(atualizado);
    };

    try {
      await aguardarTransacao(transacao);
    } catch (erroTransacao) {
      throw falha ?? erroTransacao;
    }
    if (!atualizado) throw falha ?? new Error('Não foi possível confirmar a atualização da ficha.');
    return atualizado;
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
    for (const personagem of personagens) store.put({ ...structuredClone(personagem), geracao: novoTokenGeracao() });
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

export async function adicionarPersonagens(personagens: PersonagemLocal[]): Promise<void> {
  if (!Array.isArray(personagens) || !personagens.every(validarPersonagem)
    || new Set(personagens.map(item => item.id)).size !== personagens.length) {
    throw new Error('O lote de fichas é inválido ou contém identificadores repetidos. Nada foi importado.');
  }
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_PERSONAGENS, 'readwrite');
    const store = transacao.objectStore(STORE_PERSONAGENS);
    for (const personagem of personagens) store.add({ ...structuredClone(personagem), geracao: novoTokenGeracao() });
    await aguardarTransacao(transacao);
  } catch (erro) {
    throw mensagemErro(erro);
  }
}


/** Consulta vínculo explícito; o ID remoto nunca substitui autenticação/autorização. */
export async function obterVinculoLan(localId: string): Promise<VinculoLan | null> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_VINCULOS_LAN, 'readonly');
    const requisicao = transacao.objectStore(STORE_VINCULOS_LAN).get(localId);
    const valor = await new Promise<unknown>((resolve, reject) => {
      requisicao.onsuccess = () => resolve(requisicao.result ?? null);
      requisicao.onerror = () => reject(requisicao.error);
    });
    await aguardarTransacao(transacao);
    if (valor === null) return null;
    if (!validarVinculoLan(valor)) throw new Error('O vínculo LAN possui formato inválido. Nenhum dado foi alterado.');
    return valor;
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export async function listarVinculosLan(): Promise<VinculoLan[]> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_VINCULOS_LAN, 'readonly');
    const requisicao = transacao.objectStore(STORE_VINCULOS_LAN).getAll();
    const valores = await new Promise<unknown[]>((resolve, reject) => {
      requisicao.onsuccess = () => resolve(requisicao.result as unknown[]);
      requisicao.onerror = () => reject(requisicao.error);
    });
    await aguardarTransacao(transacao);
    if (!valores.every(validarVinculoLan)) throw new Error('Há vínculos LAN com formato inválido. Nenhum dado foi alterado.');
    return valores;
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export async function salvarVinculoLan(vinculo: VinculoLan): Promise<VinculoLan> {
  if (!validarVinculoLan(vinculo)) throw new Error('Vínculo LAN inválido. Revise IDs, revisão, estado e operação pendente.');
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_VINCULOS_LAN, 'readwrite');
    transacao.objectStore(STORE_VINCULOS_LAN).put(structuredClone(vinculo));
    await aguardarTransacao(transacao);
    return vinculo;
  } catch (erro) {
    throw mensagemErro(erro);
  }
}

export async function excluirVinculoLan(localId: string): Promise<void> {
  try {
    const banco = await abrirBanco();
    const transacao = banco.transaction(STORE_VINCULOS_LAN, 'readwrite');
    transacao.objectStore(STORE_VINCULOS_LAN).delete(localId);
    await aguardarTransacao(transacao);
  } catch (erro) {
    throw mensagemErro(erro);
  }
}
