export type FacesDado = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export function sortearDados(
  quantidade: number,
  faces: FacesDado,
  obterUint32: () => number = () => {
    const valor = new Uint32Array(1);
    globalThis.crypto.getRandomValues(valor);
    return valor[0];
  },
): number[] {
  if (!Number.isSafeInteger(quantidade) || quantidade < 1) {
    throw new Error('A quantidade de dados deve ser um inteiro positivo.');
  }
  if (![4, 6, 8, 10, 12, 20, 100].includes(faces)) {
    throw new Error('Tipo de dado não permitido.');
  }

  const universo = 2 ** 32;
  const limite = Math.floor(universo / faces) * faces;
  const resultados: number[] = [];
  while (resultados.length < quantidade) {
    const bruto = obterUint32();
    if (!Number.isInteger(bruto) || bruto < 0 || bruto >= universo) {
      throw new Error('A fonte aleatória retornou um valor inválido.');
    }
    if (bruto < limite) resultados.push((bruto % faces) + 1);
  }
  return resultados;
}

export function validarResultadosFisicos(texto: string, quantidade: number, faces: FacesDado): number[] {
  const partes = texto.trim().split(/[\s,;]+/).filter(Boolean);
  if (partes.length !== quantidade) {
    throw new Error(`Informe exatamente ${quantidade} resultado(s) físico(s).`);
  }
  const resultados = partes.map(Number);
  if (resultados.some(valor => !Number.isInteger(valor) || valor < 1 || valor > faces)) {
    throw new Error(`Cada resultado deve ser um número inteiro entre 1 e ${faces}.`);
  }
  return resultados;
}
