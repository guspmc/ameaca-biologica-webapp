export type VarianteDanoEspecial = 'normal' | 'carregado' | 'chama-3' | 'chama-4' | 'chama-5' | 'chama-6';

/** Fórmula manual escolhida para modos especiais já previstos no catálogo canônico. */
export function consultarFormulaDanoEspecial(
  armaId: string,
  variante: VarianteDanoEspecial,
): string | null {
  if (armaId === 'spark-shot') {
    return variante === 'carregado' ? '4d4' : '1d4';
  }
  if (armaId === 'lanca-chamas-quimico') {
    const dados = variante === 'chama-6' ? 6
      : variante === 'chama-5' ? 5
      : variante === 'chama-4' ? 4
      : 3;
    return `${dados}d6`;
  }
  return null;
}
