export function calcularAtrasoReconexao(tentativa: number): number {
  const indice = Number.isFinite(tentativa) ? Math.max(0, Math.floor(tentativa)) : 0;
  return Math.min(3000 * 2 ** Math.min(indice, 4), 30000);
}
