/** Seleção obrigatória da arma da Origem Operário durante a criação. */
export const ARMAS_OPERARIO = [
  'Cutelo',
  'Martelo',
  'Machadinha',
  'Machado',
  'Marreta',
  'Motosserra',
] as const;

export type ArmaOperario = typeof ARMAS_OPERARIO[number];

export function armaOperarioValida(valor: unknown): valor is ArmaOperario {
  return typeof valor === 'string' && ARMAS_OPERARIO.includes(valor as ArmaOperario);
}
