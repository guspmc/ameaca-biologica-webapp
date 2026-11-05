export type AlvoFichaLocal = { mesaId: string; personagemId: string };

export type FichaAbertaLocal = {
  mesa: { id: string; role: string };
  personagem: { id: string };
};

/** Impede que respostas HTTP tardias restaurem uma ficha após logout,
 * revogação de acesso ou troca do alvo atualmente aberto.
 */
export function fichaContinuaSendoAlvo<T extends FichaAbertaLocal>(
  atual: T | null,
  alvo: AlvoFichaLocal
): atual is T {
  return Boolean(
    atual &&
    atual.mesa.role === 'jogador' &&
    atual.mesa.id === alvo.mesaId &&
    atual.personagem.id === alvo.personagemId
  );
}

/** Rejeita respostas pertencentes a uma sessão anterior, mesmo se a conta e a ficha forem as mesmas. */
export function sessaoContinuaSendoAtual(geracaoAtual: number, geracaoSolicitada: number): boolean {
  return Number.isSafeInteger(geracaoAtual) && Number.isSafeInteger(geracaoSolicitada) && geracaoAtual === geracaoSolicitada;
}
