export type RegistroOffline = {
  id: string;
  usuarioId: string;
  tipo: 'mesas' | 'personagem' | 'personagens-indice';
  mesaId: string | null;
  personagemId: string | null;
  atualizadoEm: string;
  dados: unknown;
};
export type LeituraOffline<T> = { dados: T; atualizadoEm: string };
type MesaCache = { id: string; nome: string; mestre_id: string; criada_em: string };
type PersonagemCache = { id: string; mesa_id: string; jogador_id: string | null };
const BANCO = 'ameaca-biologica-offline-v1';
const VERSAO_BANCO = 1;
const ARMAZENAMENTO = 'registros';

function abrirBanco(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB indisponível neste navegador.'));
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BANCO, VERSAO_BANCO);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains(ARMAZENAMENTO)) db.createObjectStore(ARMAZENAMENTO, { keyPath: 'id' });
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error ?? new Error('Não foi possível abrir o cache local.'));
    pedido.onblocked = () => reject(new Error('O cache local está ocupado por outra aba.'));
  });
}
function listarRegistros(): Promise<RegistroOffline[]> {
  return new Promise((resolve, reject) => {
    void abrirBanco().then(db => {
      const tx = db.transaction(ARMAZENAMENTO, 'readonly');
      const req = tx.objectStore(ARMAZENAMENTO).getAll();
      let rows: RegistroOffline[] = [];
      req.onsuccess = () => { rows = req.result as RegistroOffline[]; };
      tx.oncomplete = () => { db.close(); resolve(rows); };
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Falha ao ler cache local.')); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Leitura do cache local cancelada.')); };
    }).catch(reject);
  });
}
function lerRegistro(id: string): Promise<RegistroOffline | null> {
  return new Promise((resolve, reject) => {
    void abrirBanco().then(db => {
      const tx = db.transaction(ARMAZENAMENTO, 'readonly');
      const req = tx.objectStore(ARMAZENAMENTO).get(id);
      let row: RegistroOffline | null = null;
      req.onsuccess = () => { row = (req.result as RegistroOffline | undefined) ?? null; };
      tx.oncomplete = () => { db.close(); resolve(row); };
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Falha ao ler cache local.')); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Leitura do cache local cancelada.')); };
    }).catch(reject);
  });
}
function salvarRegistro(registro: RegistroOffline): Promise<void> {
  return new Promise((resolve, reject) => {
    void abrirBanco().then(db => {
      const tx = db.transaction(ARMAZENAMENTO, 'readwrite');
      tx.objectStore(ARMAZENAMENTO).put(registro);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Falha ao gravar cache local.')); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Gravação do cache local cancelada.')); };
    }).catch(reject);
  });
}
export async function salvarMesasOffline(usuarioId: string, mesas: MesaCache[]): Promise<string> {
  const atualizadoEm = new Date().toISOString();
  await salvarRegistro({ id: usuarioId + ':mesas', usuarioId, tipo: 'mesas', mesaId: null, personagemId: null, atualizadoEm, dados: mesas });
  return atualizadoEm;
}
export async function lerMesasOffline(usuarioId: string): Promise<LeituraOffline<MesaCache[]> | null> {
  const row = await lerRegistro(usuarioId + ':mesas');
  if (!row || row.tipo !== 'mesas' || !Array.isArray(row.dados)) return null;
  return { dados: row.dados as MesaCache[], atualizadoEm: row.atualizadoEm };
}
export async function salvarPersonagensOffline<T extends PersonagemCache>(usuarioId: string, personagens: T[]): Promise<string> {
  // Não persistir fichas completas de outras pessoas que o Mestre consiga consultar online.
  const proprias = personagens.filter(personagem => personagem.jogador_id === usuarioId);
  const db = await abrirBanco();
  const atualizadoEm = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ARMAZENAMENTO, 'readwrite');
    const store = tx.objectStore(ARMAZENAMENTO);
    const req = store.getAll();
    req.onsuccess = () => {
      for (const row of req.result as RegistroOffline[]) {
        if (row.usuarioId === usuarioId && (row.tipo === 'personagem' || row.tipo === 'personagens-indice')) store.delete(row.id);
      }
      store.put({
        id: usuarioId + ':personagens-indice', usuarioId, tipo: 'personagens-indice',
        mesaId: null, personagemId: null, atualizadoEm, dados: { quantidade: proprias.length }
      } satisfies RegistroOffline);
      for (const personagem of proprias) {
        store.put({
          id: usuarioId + ':personagem:' + personagem.mesa_id + ':' + personagem.id,
          usuarioId, tipo: 'personagem', mesaId: personagem.mesa_id,
          personagemId: personagem.id, atualizadoEm, dados: personagem
        } satisfies RegistroOffline);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(atualizadoEm); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Falha ao gravar personagens no cache local.')); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Gravação de personagens no cache local cancelada.')); };
  });
}
export async function lerPersonagensOffline<T>(usuarioId: string): Promise<LeituraOffline<T[]> | null> {
  const rows = await listarRegistros();
  const indice = rows.find(row => row.usuarioId === usuarioId && row.tipo === 'personagens-indice');
  if (!indice) return null;
  return {
    dados: rows.filter(row => row.usuarioId === usuarioId && row.tipo === 'personagem').map(row => row.dados as T),
    atualizadoEm: indice.atualizadoEm
  };
}
export async function removerSnapshotsDeMesasNaoAutorizadas(usuarioId: string, mesasAutorizadas: string[]): Promise<void> {
  const permitidas = new Set(mesasAutorizadas);
  const db = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ARMAZENAMENTO, 'readwrite');
    const store = tx.objectStore(ARMAZENAMENTO);
    const req = store.getAll();
    req.onsuccess = () => {
      for (const row of req.result as RegistroOffline[]) {
        if (row.usuarioId === usuarioId && row.tipo === 'personagem' && row.mesaId !== null && !permitidas.has(row.mesaId)) store.delete(row.id);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Falha ao limpar snapshots sem autorização.')); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Limpeza de snapshots cancelada.')); };
  });
}
export async function limparCacheUsuario(usuarioId: string): Promise<void> {
  const db = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ARMAZENAMENTO, 'readwrite');
    const store = tx.objectStore(ARMAZENAMENTO);
    const req = store.getAll();
    req.onsuccess = () => {
      for (const row of req.result as RegistroOffline[]) if (row.usuarioId === usuarioId) store.delete(row.id);
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Falha ao limpar cache da conta.')); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Limpeza do cache cancelada.')); };
  });
}
