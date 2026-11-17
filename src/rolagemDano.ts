import { sortearDados, type FacesDado } from './rolagemDados.ts';

export type ResultadoRolagemDano = {
  resultados: number[];
  total: number;
  dadosExtrasEncadeados: number;
};

const FACES_DANO: FacesDado[] = [4, 6, 8, 10, 12];

function analisarFormula(formula: string): Array<{ quantidade: number; faces: FacesDado }> {
  const partes = formula.toLowerCase().replace(/\s+/g, '').split('+');
  if (!partes.length || partes.some(parte => !parte)) {
    throw new Error('A fórmula de Dano está vazia ou malformada.');
  }
  return partes.map(parte => {
    const match = /^(\d+)d(4|6|8|10|12)$/.exec(parte);
    if (!match) throw new Error(`Fórmula de Dano não reconhecida: ${parte}.`);
    const quantidade = Number(match[1]);
    const faces = Number(match[2]) as FacesDado;
    if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > 100) {
      throw new Error('A quantidade de Dados de Dano deve ficar entre 1 e 100 por fórmula.');
    }
    if (!FACES_DANO.includes(faces)) throw new Error('Tipo de Dado de Dano não permitido.');
    return { quantidade, faces };
  });
}

/** Rola uma fórmula de Dano somente quando chamada explicitamente pelo jogador.
 *  Motosserra: cada resultado 6 gera outro dado do mesmo tipo; os encadeamentos continuam.
 */
export function rolarFormulaDanoVirtual(
  formula: string,
  encadearSeis = false,
  obterUint32?: () => number,
): ResultadoRolagemDano {
  const grupos = analisarFormula(formula);
  const resultados: number[] = [];
  const facesPorResultado: FacesDado[] = [];
  for (const grupo of grupos) {
    const dados = sortearDados(grupo.quantidade, grupo.faces, obterUint32);
    resultados.push(...dados);
    facesPorResultado.push(...dados.map(() => grupo.faces));
  }

  let dadosExtrasEncadeados = 0;
  for (let indice = 0; indice < resultados.length; indice += 1) {
    if (!encadearSeis || resultados[indice] !== 6 || facesPorResultado[indice] < 6) continue;
    if (resultados.length >= 1000) throw new Error('A sequência de Dados extras excedeu o limite de segurança de 1.000 Dados.');
    const face = facesPorResultado[indice];
    const extra = sortearDados(1, face, obterUint32)[0];
    resultados.push(extra);
    facesPorResultado.push(face);
    dadosExtrasEncadeados += 1;
  }
  return { resultados, total: resultados.reduce((soma, valor) => soma + valor, 0), dadosExtrasEncadeados };
}
