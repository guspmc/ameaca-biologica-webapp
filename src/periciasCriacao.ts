import { PONTOS_CLASSE, PERICIAS_CLASSE, totalPontos } from './pericias.ts';
import { ORIGENS } from './origens.ts';

export const NOMES_PERICIAS = [
  'Acrobacia','Atletismo','Fortitude','Furtividade','Investigação','Luta',
  'Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade',
] as const;

export type DistribuicaoPericias = Record<string, number>;

export function periciasPermitidasNaCriacao(
  classe: string,
  origem: string,
  periciaTreinada: string,
  periciaExtraAmnesico?: string,
): string[] {
  const dadosOrigem = ORIGENS.find(item => item.nome === origem);
  if (!dadosOrigem || !(classe in PERICIAS_CLASSE)) return [];
  const extra = origem === 'Amnésico'
    ? periciaExtraAmnesico
    : dadosOrigem.pericias.find(item => item !== periciaTreinada);
  const permitidas = new Set([
    ...(PERICIAS_CLASSE[classe] ?? []),
    ...(extra ? [extra] : []),
  ]);
  return [...permitidas].sort((a,b) => NOMES_PERICIAS.indexOf(a as typeof NOMES_PERICIAS[number]) - NOMES_PERICIAS.indexOf(b as typeof NOMES_PERICIAS[number]));
}

export function pontosGastosPericias(distribuicao: DistribuicaoPericias): number {
  return totalPontos(distribuicao);
}

/** Um ponto sobe Não Treinada→Treinada ou Treinada→Mestre. */
export function distribuicaoPericiasValida(
  classe: string,
  origem: string,
  periciaTreinada: string,
  distribuicao: DistribuicaoPericias,
  periciaExtraAmnesico?: string,
): boolean {
  const limite = PONTOS_CLASSE[classe] ?? 0;
  const origemValida = ORIGENS.find(item => item.nome === origem);
  if (!origemValida) return false;
  const opcoesOrigem = origem === 'Amnésico' ? NOMES_PERICIAS : origemValida.pericias;
  if (!opcoesOrigem.includes(periciaTreinada as never)) return false;
  if (origem === 'Amnésico' && (!periciaExtraAmnesico || periciaExtraAmnesico === periciaTreinada || !NOMES_PERICIAS.includes(periciaExtraAmnesico as never))) return false;
  const permitidas = new Set(periciasPermitidasNaCriacao(classe, origem, periciaTreinada, periciaExtraAmnesico));
  if (Object.entries(distribuicao).some(([nome, grau]) =>
    !permitidas.has(nome) || !Number.isInteger(grau) || grau < 0 || grau > 2
  )) return false;
  if ((distribuicao[periciaTreinada] ?? 0) > 1) return false;
  return pontosGastosPericias(distribuicao) === limite;
}
