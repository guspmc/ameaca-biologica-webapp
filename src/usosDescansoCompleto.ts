export const FONTES_USO_DESCANSO_COMPLETO = [
  {
    chave: 'habilidade:curiosa',
    nome: 'Curiosa',
    tipo: 'Habilidade',
    descricao: 'Com tempo para análise e sem Pressão Imediata, permite AST DT 12 para pedir direção ou pista curta dedutível.',
  },
  {
    chave: 'origem:academico',
    nome: 'Saber é Poder',
    tipo: 'Origem · Acadêmico',
    descricao: 'Uma vez por Descanso Completo, Vantagem em um Teste baseado em AST.',
  },
  {
    chave: 'origem:criminoso',
    nome: 'Procurar itens ou recursos',
    tipo: 'Origem · Criminoso',
    descricao: 'Uma vez por Descanso Completo, Vantagem em Investigação ao procurar itens ou recursos.',
  },
  {
    chave: 'origem:mercenario',
    nome: 'Resposta ao hostil oculto',
    tipo: 'Origem · Mercenário',
    descricao: 'Uma vez por Descanso Completo, pode usar Reação para sacar arma de fogo carregada e atacar o hostil oculto que iria Surpreendê-lo, sem ficar Surpreendido.',
  },
] as const;

export type ChaveUsoDescansoCompleto = typeof FONTES_USO_DESCANSO_COMPLETO[number]['chave'];
export type FonteUsoDescansoCompleto = typeof FONTES_USO_DESCANSO_COMPLETO[number];

const CHAVES_VALIDAS = new Set<string>(FONTES_USO_DESCANSO_COMPLETO.map(fonte => fonte.chave));

function objetoSimples(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && (Object.getPrototypeOf(valor) === Object.prototype || Object.getPrototypeOf(valor) === null);
}

/** Lista apenas os benefícios efetivamente presentes na personagem. */
export function listarFontesUsosDescansoCompleto(origem: string, habilidades: readonly string[]): FonteUsoDescansoCompleto[] {
  const fontes: FonteUsoDescansoCompleto[] = [];
  if (habilidades.includes('curiosa')) fontes.push(FONTES_USO_DESCANSO_COMPLETO[0]);
  const porOrigem: Record<string, ChaveUsoDescansoCompleto> = {
    'Acadêmico': 'origem:academico',
    'Criminoso': 'origem:criminoso',
    'Mercenário': 'origem:mercenario',
  };
  const chave = porOrigem[origem];
  if (chave) {
    const fonte = FONTES_USO_DESCANSO_COMPLETO.find(item => item.chave === chave);
    if (fonte) fontes.push(fonte);
  }
  return fontes;
}

/** O registro guarda somente usos consumidos; chaves desconhecidas são recusadas. */
export function usosDescansoCompletoValido(valor: unknown): boolean {
  if (!objetoSimples(valor)) return false;
  return Object.entries(valor).every(([chave, usado]) => CHAVES_VALIDAS.has(chave) && usado === true);
}

/** Marca um uso após a confirmação manual do jogador; não executa o efeito da regra. */
export function registrarUsoDescansoCompleto(
  usos: unknown,
  chave: ChaveUsoDescansoCompleto,
  fontesAtivas: readonly FonteUsoDescansoCompleto[],
): Record<string, true> {
  if (!usosDescansoCompletoValido(usos)) throw new Error('Registro de usos por Descanso Completo inválido.');
  if (!fontesAtivas.some(fonte => fonte.chave === chave)) throw new Error('Este benefício não está disponível para a personagem.');
  if ((usos as Record<string, unknown>)[chave] === true) throw new Error('Este uso já foi marcado até o próximo Descanso Completo.');
  return { ...(usos as Record<string, true>), [chave]: true };
}

/** Renovação ocorre somente quando a conclusão do Descanso Completo é salva. */
export function renovarUsosDescansoCompleto(): Record<string, never> {
  return {};
}
