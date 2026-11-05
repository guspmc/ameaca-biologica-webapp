import { planejarInventarioCriacao, type EntradaInventarioCriacao } from './inventarioCriacao.ts';
import { lerInventarioConsulta, type InventarioConsulta } from './inventarioConsulta.ts';

export function materializarInventarioInicial(
  entrada: EntradaInventarioCriacao,
  personagemId: string,
  gerarId: () => string,
): InventarioConsulta {
  if (typeof gerarId !== 'function') throw new Error('Gerador de identificadores inválido.');
  const plano = planejarInventarioCriacao(entrada);
  const ids = new Set<string>();
  const itens = plano.itens.map(item => {
    const instanciaId = gerarId();
    if (typeof instanciaId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(instanciaId) || ids.has(instanciaId)) {
      throw new Error('Não foi possível gerar identificadores únicos para os exemplares. Nenhum inventário foi materializado.');
    }
    ids.add(instanciaId);
    return {
      instanciaId,
      catalogoId: item.catalogoId,
      nome: item.nome,
      quantidade: item.quantidade,
      espacos: item.espacos,
      local: item.local,
      posicao: item.posicao,
      estado: structuredClone(item.estado),
    };
  });
  return lerInventarioConsulta({ personagemId, revisao: 1, capacidade: plano.capacidade, itens }, personagemId);
}

export function validarInventarioAtivo(valor: unknown, personagemId: string): InventarioConsulta {
  return lerInventarioConsulta(valor, personagemId);
}
