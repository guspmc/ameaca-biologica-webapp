import { revisarCriacao, type FichaRevisao } from './conferenciaCriacao.ts';
import { planejarInventarioCriacao } from './inventarioCriacao.ts';

type Objeto = Record<string, unknown>;

function objeto(valor: unknown): Objeto {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? valor as Objeto
    : {};
}

function textoOuNulo(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor : null;
}

function numeroOuInvalido(valor: unknown): number {
  return typeof valor === 'number' ? valor : Number.NaN;
}

/**
 * Reconstitui no servidor o mesmo contrato de revisão usado pela FichaLocal.
 * O cliente envia apenas os dados persistidos do rascunho; nenhum resultado
 * de conferência calculado no navegador é aceito como autoridade.
 */
export function validarCriacaoNoServidor(nome: string, dadosRecebidos: unknown) {
  const dados = objeto(dadosRecebidos);
  const atributos = objeto(dados.atributos);
  const distribuicao = objeto(dados.distribuicaoPericias);
  const identidade = objeto(dados.identidade);
  const compras = objeto(dados.comprasIniciais);
  const classe = textoOuNulo(dados.classe);
  const origem = textoOuNulo(dados.origem);
  const habilidade = textoOuNulo(dados.habilidadeBasica);
  const kit = textoOuNulo(dados.equipamentoInicial);

  const forca = numeroOuInvalido(atributos.forca);
  const agilidade = numeroOuInvalido(atributos.agilidade);
  const vigor = numeroOuInvalido(atributos.vigor);
  const astucia = numeroOuInvalido(atributos.astucia);

  const pvBase = classe === 'Agente' ? 10 : classe === 'Autodidata' ? 8 : classe === 'Operador' ? 12 : 0;
  const biBase = classe === 'Agente' ? 8 : classe === 'Autodidata' ? 10 : classe === 'Operador' ? 6 : 0;
  const pv = pvBase + vigor + (habilidade === 'parrudo' ? 5 : 0);
  const sa = agilidade + astucia + (origem === 'Universitária' ? 1 : 0);
  const bi = biBase + astucia + (origem === 'Cobaia' ? 2 : 0) + (habilidade === 'parrudo' ? 3 : 0);
  const defesa = 10 + agilidade + (origem === 'Policial' ? 2 : 0);

  const ficha: FichaRevisao = {
    identidade: typeof identidade.genero === 'string' ? { genero: identidade.genero } : {},
    nome,
    classe,
    nivel: 1,
    forca,
    agilidade,
    vigor,
    astucia,
    origem,
    pericia_origem_treinada: textoOuNulo(dados.periciaOrigemTreinada),
    pericia_origem_extra: textoOuNulo(dados.periciaOrigemExtra),
    pontos_pericia_classe: distribuicao as Record<string, number>,
    habilidade_basica: habilidade,
    equipamento_inicial: kit,
    compras_iniciais: compras as Record<string, number>,
    revisao_compras: numeroOuInvalido(dados.revisaoCompras),
    pv_maximo: pv,
    sa_maximo: sa,
    bi_maximo: bi,
    defesa,
  };

  const conferencia = revisarCriacao(ficha);
  const pendencias = conferencia.filter(item => item.estado !== 'conferido');
  if (pendencias.length) {
    return { valido: false as const, pendencias, conferencia };
  }

  try {
    const inventario = planejarInventarioCriacao({
      classe,
      equipamento_inicial: kit,
      forca,
      origem,
      nivel: 1,
      estado_ficha: 'rascunho',
      compras_iniciais: compras as Record<string, number>,
    });
    return { valido: true as const, pendencias: [], conferencia, inventario };
  } catch {
    return {
      valido: false as const,
      pendencias: [{
        nome: 'Inventário inicial',
        estado: 'revisar' as const,
        detalhe: 'O servidor não conseguiu validar o planejamento do inventário.',
        secao: 'itens',
      }],
      conferencia,
    };
  }
}
