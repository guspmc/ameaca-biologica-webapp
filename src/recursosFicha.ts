export type RecursosAtuais = { pvAtual: number; pvTemporarios: number; saAtual: number; biAtual: number };
export type RecursosPatch = RecursosAtuais;

const inteiro = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

export function recursosIniciais(valor: Record<string, unknown>, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!Number.isSafeInteger(pvMaximo) || pvMaximo < 0 || !Number.isSafeInteger(saMaximo) || saMaximo < 0) {
    throw new Error('Máximos de recursos inválidos.');
  }
  return {
    pvAtual: Object.hasOwn(valor, 'pvAtual') ? Number(valor.pvAtual) : pvMaximo,
    pvTemporarios: Object.hasOwn(valor, 'pvTemporarios') ? Number(valor.pvTemporarios) : 0,
    saAtual: Object.hasOwn(valor, 'saAtual') ? Number(valor.saAtual) : saMaximo,
    biAtual: Object.hasOwn(valor, 'biAtual') ? Number(valor.biAtual) : 0,
  };
}

export function recursosValidos(valor: unknown, pvMaximo: number, saMaximo: number): valor is RecursosAtuais {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const v = valor as Record<string, unknown>;
  return inteiro(v.pvAtual) && Number(v.pvAtual) <= pvMaximo
    && inteiro(v.pvTemporarios) && inteiro(v.saAtual) && Number(v.saAtual) <= saMaximo
    && inteiro(v.biAtual);
}

/** Cura só PV Atuais e nunca ultrapassa o máximo. */
export function curarPV(r: RecursosAtuais, quantidade: number, maximo: number): RecursosAtuais {
  if (!inteiro(quantidade) || !inteiro(maximo) || !recursosValidos(r, maximo, Number.MAX_SAFE_INTEGER)) throw new Error('Recursos ou cura inválidos.');
  return { ...r, pvAtual: Math.min(maximo, r.pvAtual + quantidade) };
}

/** Dano consome PV Temporários antes de PV Atuais. */
export function aplicarDanoPV(r: RecursosAtuais, quantidade: number, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!inteiro(quantidade) || !recursosValidos(r, pvMaximo, saMaximo)) throw new Error('Recursos ou dano inválidos.');
  const absorvido = Math.min(r.pvTemporarios, quantidade);
  const restante = quantidade - absorvido;
  return { ...r, pvTemporarios: r.pvTemporarios - absorvido, pvAtual: Math.max(0, r.pvAtual - restante) };
}

/** Novos PV Temporários substituem, nunca somam: conserva o maior valor. */
export function definirPVTemporarios(r: RecursosAtuais, quantidade: number, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!inteiro(quantidade) || !recursosValidos(r, pvMaximo, saMaximo)) throw new Error('Recursos ou PV Temporários inválidos.');
  return { ...r, pvTemporarios: Math.max(r.pvTemporarios, quantidade) };
}

export function ajustarSA(r: RecursosAtuais, delta: number, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!Number.isSafeInteger(delta) || !recursosValidos(r, pvMaximo, saMaximo)) throw new Error('Recursos ou ajuste de SA inválidos.');
  const proximo = r.saAtual + delta;
  if (proximo < 0 || proximo > saMaximo) throw new Error('SA Atual precisa permanecer entre 0 e o máximo.');
  return { ...r, saAtual: proximo };
}

/** BI pode alcançar ou ultrapassar o máximo e provocar Colapso Viral. */
export function ajustarBI(r: RecursosAtuais, delta: number, pvMaximo: number, saMaximo: number): RecursosAtuais {
  if (!Number.isSafeInteger(delta) || !recursosValidos(r, pvMaximo, saMaximo) || r.biAtual + delta < 0) throw new Error('BI Atual inválida.');
  return { ...r, biAtual: r.biAtual + delta };
}
