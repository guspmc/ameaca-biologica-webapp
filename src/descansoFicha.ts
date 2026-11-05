import { recursosValidos, curarPV, type RecursosAtuais } from './recursosFicha';

export type ClasseDescanso = 'Agente' | 'Autodidata' | 'Operador';
export type LocalDescanso = 'sala_descanso' | 'sala_segura';
export function dadoVidaClasse(classe: string): 8 | 10 | 12 {
  if (classe === 'Autodidata') return 8;
  if (classe === 'Agente') return 10;
  if (classe === 'Operador') return 12;
  throw new Error('Classe não definida para Descanso Parcial.');
}

/** Nível 1 no escopo atual: recebe uma face física do Dado de Vida da Classe. */
export function concluirDescansoParcial(r: RecursosAtuais, resultadoDadoVida: number, dadoVida: number, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!recursosValidos(r, pvMaximo, saMaximo) || !Number.isSafeInteger(dadoVida) || ![8,10,12].includes(dadoVida)
    || !Number.isSafeInteger(resultadoDadoVida) || resultadoDadoVida < 1 || resultadoDadoVida > dadoVida) {
    throw new Error('Resultado físico ou recursos inválidos para Descanso Parcial.');
  }
  return curarPV(r, resultadoDadoVida, pvMaximo);
}

/** Descanso Completo restaura PV/SA, encerra PV Temporários e preserva BI e demais consequências. */
export function concluirDescansoCompleto(r: RecursosAtuais, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!Number.isSafeInteger(pvMaximo) || pvMaximo < 0 || !Number.isSafeInteger(saMaximo) || saMaximo < 0
    || !Number.isSafeInteger(r.biAtual) || r.biAtual < 0) throw new Error('Recursos inválidos para Descanso Completo.');
  return { pvAtual: pvMaximo, pvTemporarios: 0, saAtual: saMaximo, biAtual: r.biAtual };
}

export function localPermiteDescanso(tipo: 'parcial' | 'completo', local: LocalDescanso | ''): boolean {
  return tipo === 'completo' ? local === 'sala_descanso' : local === 'sala_descanso' || local === 'sala_segura';
}
