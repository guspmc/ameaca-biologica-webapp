export type AlvoFichaLocal = { mesaId: string; personagemId: string };

export type FichaAbertaLocal = {
  mesa: { id: string; role: string };
  personagem: { id: string };
};

/** Impede que respostas HTTP tardias restaurem uma ficha após logout,
 * revogação de acesso ou troca do alvo atualmente aberto.
 */
export function fichaContinuaSendoAlvo(
  atual: FichaAbertaLocal | null,
  alvo: AlvoFichaLocal
): boolean {
  return Boolean(
    atual &&
    atual.mesa.role === 'jogador' &&
    atual.mesa.id === alvo.mesaId &&
    atual.personagem.id === alvo.personagemId
  );
}
