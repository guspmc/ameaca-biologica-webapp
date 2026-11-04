/**
 * Fila serializada para operações locais que não podem se sobrepor.
 * Uma falha não interrompe as próximas operações; cada chamada recebe
 * sua própria Promise e o chamador decide como apresentar o resultado.
 */
export function criarFilaSerializada() {
  let cauda: Promise<void> = Promise.resolve();

  return {
    enfileirar<T>(operacao: () => Promise<T> | T): Promise<T> {
      const atual = cauda.then(operacao);
      cauda = atual.then(() => undefined, () => undefined);
      return atual;
    },
    async aguardar(): Promise<void> {
      await cauda;
    },
  };
}
