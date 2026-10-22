export type Conexao = { url: string; chave: string };
export const URL_PRODUCAO = 'https://pftuhqioutvwnmvlbtrt.supabase.co';

export function chavePublica(chave: string): boolean {
  if (chave.startsWith('sb_publishable_')) return true;
  if (!chave.startsWith('eyJ')) return false;
  try {
    const trecho = chave.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(trecho)) as { role?: string }).role === 'anon';
  } catch { return false; }
}

export function urlPermitida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname));
  } catch { return false; }
}

export function escolherConexao({ teste, url, chave, guardada }: {
  teste: boolean; url?: string; chave?: string; guardada?: string | null;
}): Conexao | null {
  const configurada = { url: (url || URL_PRODUCAO).replace(/\/$/, ''), chave: chave ?? '' };
  const valida = (dados: Conexao) => typeof dados.url === 'string' &&
    typeof dados.chave === 'string' && urlPermitida(dados.url) && chavePublica(dados.chave);
  // No modo de teste, configuracao ausente/invalida falha fechada.
  // Nunca usa conexao guardada ou o projeto de producao como alternativa.
  if (teste) {
    return valida(configurada) &&
      new URL(configurada.url).hostname !== new URL(URL_PRODUCAO).hostname
      ? configurada : null;
  }
  try {
    const dados = JSON.parse(guardada ?? 'null') as Conexao | null;
    if (dados && valida(dados)) return dados;
  } catch { /* Configuracao antiga invalida; tenta valores de ambiente. */ }
  return valida(configurada) ? configurada : null;
}
