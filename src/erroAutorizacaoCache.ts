/** Erros de autenticação/autorização não podem ser tratados como mera indisponibilidade de rede. */
export function erroExigeBloqueioCache(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  const detalhe = erro as { status?: unknown; code?: unknown };
  return detalhe.status === 401 || detalhe.status === 403 || detalhe.code === '42501';
}
