import { dadosDaClasse } from './classesFicha.ts';
import { capacidadeInventario } from './equipamento.ts';
import { HABILIDADES_BASICAS } from './habilidades.ts';
import { ORIGENS } from './origens.ts';

export type AtributosDerivados = {
  forca: number;
  agilidade: number;
  vigor: number;
  astucia: number;
};

export type EntradaDerivadosCriacao = {
  classe: string;
  origem: string;
  habilidadeBasica: string;
  atributos: AtributosDerivados;
  nivel?: number;
};

/**
 * Fórmulas-base do Arquivo do Jogador v1.0 (J 21-27) e Planejamento WebApp v2.1.
 * Os atributos recebidos já devem refletir as escolhas válidas da criação.
 * Efeitos condicionais não são convertidos em bônus permanentes aqui.
 */
export function calcularDerivadosCriacao(entrada: EntradaDerivadosCriacao) {
  const nivel = entrada.nivel ?? 1;
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 10) {
    throw new Error('Nível deve estar entre 1 e 10.');
  }
  const classe = dadosDaClasse(entrada.classe);
  if (!classe) throw new Error('Classe inválida para calcular a ficha.');
  if (entrada.origem && !ORIGENS.some(o => o.nome === entrada.origem)) throw new Error('Origem inválida para calcular a ficha.');
  const habilidade = HABILIDADES_BASICAS.find(h =>
    h.id === entrada.habilidadeBasica && h.classe === entrada.classe
  );
  if (entrada.habilidadeBasica && !habilidade) throw new Error('Habilidade Básica incompatível com a Classe.');

  const { forca, agilidade, vigor, astucia } = entrada.atributos;
  for (const [nome, valor] of Object.entries(entrada.atributos)) {
    if (!Number.isInteger(valor) || valor < 0 || valor > 5) {
      throw new Error('Atributo inválido: ' + nome + '.');
    }
  }

  const pvClasse = entrada.classe === 'Agente' ? 10 : entrada.classe === 'Autodidata' ? 8 : 12;
  const pvParrudo = habilidade?.id === 'parrudo' ? 5 : 0;
  const biParrudo = habilidade?.id === 'parrudo' ? 3 : 0;
  const biCobaia = entrada.origem === 'Cobaia' ? 2 : 0;
  const saUniversitaria = entrada.origem === 'Universitária' ? 1 : 0;
  const defesaPolicial = entrada.origem === 'Policial' ? 2 : 0;

  return {
    pvMaximo: (pvClasse + vigor) * nivel + pvParrudo,
    saMaximo: agilidade + astucia + saUniversitaria,
    biMaxima: classe.biBase + astucia + biCobaia + biParrudo,
    defesa: 10 + agilidade + defesaPolicial,
    inventario: capacidadeInventario(forca, entrada.origem),
    movimento: 9,
    componentes: {
      pvClasse, vigor, nivel, pvParrudo, biBase: classe.biBase, astucia,
      biCobaia, biParrudo, agilidade, saUniversitaria, defesaPolicial, forca,
      mochila: entrada.origem === 'Mochileiro' ? 1 : 0,
    },
  };
}
