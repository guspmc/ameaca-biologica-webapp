type ArmazenamentoNotas = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const PREFIXO = 'ameaca-biologica:notas-pessoais:v1';

export function chaveNotaPessoal(usuarioId: string, mesaId: string, personagemId: string): string {
  return [
    PREFIXO,
    encodeURIComponent(usuarioId),
    encodeURIComponent(mesaId),
    encodeURIComponent(personagemId),
  ].join(':');
}

export function lerNotaPessoal(
  armazenamento: ArmazenamentoNotas,
  usuarioId: string,
  mesaId: string,
  personagemId: string,
): string {
  return armazenamento.getItem(chaveNotaPessoal(usuarioId, mesaId, personagemId)) ?? '';
}

export function salvarNotaPessoal(
  armazenamento: ArmazenamentoNotas,
  usuarioId: string,
  mesaId: string,
  personagemId: string,
  texto: string,
): void {
  const chave = chaveNotaPessoal(usuarioId, mesaId, personagemId);
  if (texto.length === 0) {
    armazenamento.removeItem(chave);
    return;
  }
  armazenamento.setItem(chave, texto);
}
