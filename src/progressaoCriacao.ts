import { atributosIniciaisValidos } from './atributosCriacao.ts';
import { distribuicaoPericiasValida } from './periciasCriacao.ts';
import {
  ganhosProgressaoAte,
  validarProgressaoHabilidades,
  aplicarGanhoAtributoProgressao,
  aplicarGanhoPericiaProgressao,
  type EscolhaHabilidadeProgressao,
} from './progressaoHabilidades.ts';

export type EscolhaAtributoProgressao = { nivel: number; atributo: 'forca' | 'agilidade' | 'vigor' | 'astucia' };
export type EscolhaPericiaProgressao = { nivel: number; pericia: string };

export type EntradaProgressaoCriacao = {
  classe: string;
  origem: string;
  nivel: number;
  atributosIniciais: Record<string, number>;
  periciaOrigemTreinada: string;
  periciaOrigemExtra: string | null;
  distribuicaoPericiasInicial: Record<string, number>;
  habilidades: EscolhaHabilidadeProgressao[];
  ganhosAtributo: EscolhaAtributoProgressao[];
  ganhosPericia: EscolhaPericiaProgressao[];
};

export type ResultadoProgressaoCriacao = {
  valida: boolean;
  pendencias: string[];
  atributosFinais: Record<string, number> | null;
  distribuicaoPericiasFinal: Record<string, number> | null;
};

function objetoSimples(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && Object.getPrototypeOf(valor) === Object.prototype;
}

function escolhasValidas<T extends Record<string, unknown>>(
  valor: unknown,
  chaves: string[],
  niveisEsperados: number[],
): valor is T[] {
  if (!Array.isArray(valor) || valor.length !== niveisEsperados.length) return false;
  const niveis: number[] = [];
  for (const item of valor) {
    if (!objetoSimples(item) || Object.keys(item).sort().join('|') !== [...chaves].sort().join('|')
      || !Number.isSafeInteger(item.nivel) || typeof item[chaves.find(chave => chave !== 'nivel')!] !== 'string') return false;
    niveis.push(item.nivel as number);
  }
  return niveis.sort((a,b) => a-b).join('|') === [...niveisEsperados].sort((a,b) => a-b).join('|');
}

/**
 * Valida e calcula a criação em Nível superior, percorrendo todos os benefícios
 * desde o Nível 1. Não aplica Missões, Marco Narrativo nem requisito de Descanso:
 * esses pertencem exclusivamente à evolução durante a campanha.
 */
export function avaliarProgressaoCriacao(entrada: EntradaProgressaoCriacao): ResultadoProgressaoCriacao {
  const pendencias: string[] = [];
  if (!objetoSimples(entrada) || !Number.isSafeInteger(entrada.nivel) || entrada.nivel < 1 || entrada.nivel > 10) {
    return { valida: false, pendencias: ['Nível ou registro de criação inválido.'], atributosFinais: null, distribuicaoPericiasFinal: null };
  }
  const atributosBaseValidos = objetoSimples(entrada.atributosIniciais)
    && Object.keys(entrada.atributosIniciais).sort().join('|') === 'agilidade|astucia|forca|vigor'
    && atributosIniciaisValidos(entrada.atributosIniciais as never);
  if (!atributosBaseValidos) pendencias.push('A distribuição inicial de Atributos está inválida.');

  const periciasBaseValidas = objetoSimples(entrada.distribuicaoPericiasInicial)
    && typeof entrada.classe === 'string' && typeof entrada.origem === 'string'
    && typeof entrada.periciaOrigemTreinada === 'string'
    && (entrada.periciaOrigemExtra === null || typeof entrada.periciaOrigemExtra === 'string')
    && distribuicaoPericiasValida(entrada.classe, entrada.origem, entrada.periciaOrigemTreinada,
      entrada.distribuicaoPericiasInicial as Record<string, number>, entrada.periciaOrigemExtra ?? undefined);
  if (!periciasBaseValidas) pendencias.push('A distribuição inicial de Perícias, Classe ou Origem está inválida.');

  const ganhos = ganhosProgressaoAte(entrada.nivel);
  const validacaoHabilidades = validarProgressaoHabilidades(entrada.classe, entrada.nivel, entrada.habilidades);
  if (!validacaoHabilidades.valida) {
    pendencias.push(...validacaoHabilidades.pendencias.map(item => 'Nível ' + item.nivel + ': ' + item.motivo));
  }

  if (!escolhasValidas<EscolhaAtributoProgressao>(
    entrada.ganhosAtributo, ['nivel','atributo'], ganhos.atributos,
  ) || (entrada.ganhosAtributo as unknown[]).some(item =>
    !['forca','agilidade','vigor','astucia'].includes((item as Record<string, string>).atributo))) {
    pendencias.push('Escolhas de Atributo devem corresponder exatamente aos níveis 3, 5, 7 e 9 alcançados.');
  }

  if (!escolhasValidas<EscolhaPericiaProgressao>(
    entrada.ganhosPericia, ['nivel','pericia'], ganhos.pontosPericia,
  )) {
    pendencias.push('Escolhas de Perícia devem corresponder exatamente aos níveis 4 e 8 alcançados.');
  }

  if (pendencias.length) return { valida: false, pendencias, atributosFinais: null, distribuicaoPericiasFinal: null };

  let atributosFinais: Record<string, number> = { ...entrada.atributosIniciais };
  for (const escolha of entrada.ganhosAtributo) {
    try { atributosFinais = aplicarGanhoAtributoProgressao(escolha.nivel, escolha.atributo, atributosFinais); }
    catch (erro) { pendencias.push(erro instanceof Error ? erro.message : 'Ganho de Atributo inválido.'); }
  }

  let distribuicaoPericiasFinal: Record<string, number> = { ...entrada.distribuicaoPericiasInicial };
  for (const escolha of entrada.ganhosPericia) {
    try {
      distribuicaoPericiasFinal = aplicarGanhoPericiaProgressao(
        entrada.classe, escolha.nivel, escolha.pericia, distribuicaoPericiasFinal, entrada.periciaOrigemTreinada,
      );
    } catch (erro) { pendencias.push(erro instanceof Error ? erro.message : 'Ganho de Perícia inválido.'); }
  }

  return {
    valida: pendencias.length === 0,
    pendencias,
    atributosFinais: pendencias.length === 0 ? atributosFinais : null,
    distribuicaoPericiasFinal: pendencias.length === 0 ? distribuicaoPericiasFinal : null,
  };
}
