export type AtributosIniciais = {
  forca: number;
  agilidade: number;
  vigor: number;
  astucia: number;
};

/**
 * Regras do Arquivo do Jogador v1.0, p. 22:
 * quatro atributos começam em 1; distribuem-se +3 pontos;
 * um único atributo pode cair de 1 para 0 para conceder +1 ponto;
 * nenhum atributo supera 3 durante a criação.
 */
export function atributosIniciaisValidos(atributos: AtributosIniciais): boolean {
  const valores = Object.values(atributos);
  if (valores.some(valor => !Number.isInteger(valor) || valor < 0 || valor > 3)) return false;
  if (valores.filter(valor => valor === 0).length > 1) return false;
  return valores.reduce((total, valor) => total + valor, 0) === 7;
}

export function pontosRestantesAtributos(atributos: AtributosIniciais): number {
  return 7 - Object.values(atributos).reduce((total, valor) => total + valor, 0);
}
