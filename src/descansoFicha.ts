import { recursosValidos, curarPV, type RecursosAtuais } from './recursosFicha';

export type ClasseDescanso = 'Agente' | 'Autodidata' | 'Operador';
export type LocalDescanso = 'sala_descanso' | 'sala_segura';
export function dadoVidaClasse(classe: string): 8 | 10 | 12 {
  if (classe === 'Autodidata') return 8;
  if (classe === 'Agente') return 10;
  if (classe === 'Operador') return 12;
  throw new Error('Classe não definida para Descanso Parcial.');
}

/** Soma os Dados de Vida rolados expressamente: um por Nível da personagem. */
export function concluirDescansoParcial(r: RecursosAtuais, resultadosDadoVida: number | number[], dadoVida: number, pvMaximo: number, saMaximo: number, nivel = 1): RecursosAtuais {
  const resultados = Array.isArray(resultadosDadoVida) ? resultadosDadoVida : [resultadosDadoVida];
  if (!recursosValidos(r, pvMaximo, saMaximo) || !Number.isSafeInteger(dadoVida) || ![8,10,12].includes(dadoVida)
    || !Number.isSafeInteger(nivel) || nivel < 1 || nivel > 10 || resultados.length !== nivel
    || resultados.some(face => !Number.isSafeInteger(face) || face < 1 || face > dadoVida)) {
    throw new Error('Resultados físicos ou recursos inválidos para Descanso Parcial.');
  }
  return curarPV(r, resultados.reduce((total, face) => total + face, 0), pvMaximo);
}
/** Descanso Completo restaura PV/SA, encerra PV Temporários e preserva BI e demais consequências. */
export function concluirDescansoCompleto(r: RecursosAtuais, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!Number.isSafeInteger(pvMaximo) || pvMaximo < 0 || !Number.isSafeInteger(saMaximo) || saMaximo < 0
    || !recursosValidos(r, pvMaximo, saMaximo)) throw new Error('Recursos inválidos para Descanso Completo.');
  return { pvAtual: pvMaximo, pvTemporarios: 0, saAtual: saMaximo, biAtual: r.biAtual };
}

export function localPermiteDescanso(tipo: 'parcial' | 'completo', local: LocalDescanso | ''): boolean {
  return tipo === 'completo' ? local === 'sala_descanso' : local === 'sala_descanso' || local === 'sala_segura';
}
