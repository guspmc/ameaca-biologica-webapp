import { revisarCriacao, type FichaRevisao } from './conferenciaCriacao.ts';
import { planejarInventarioCriacao } from './inventarioCriacao.ts';
import { calcularDerivadosCriacao } from './derivadosCriacao.ts';
import { ORIGENS } from './origens.ts';

type Objeto = Record<string, unknown>;

function objeto(valor: unknown): Objeto {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? valor as Objeto
    : {};
}

function textoOuNulo(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor : null;
}

function numeroOuZero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
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

  const atributosAusentes = !dados.atributos || typeof dados.atributos !== 'object' || Array.isArray(dados.atributos);
  const forca = atributosAusentes ? 1 : numeroOuZero(atributos.forca);
  const agilidade = atributosAusentes ? 1 : numeroOuZero(atributos.agilidade);
  const vigor = atributosAusentes ? 1 : numeroOuZero(atributos.vigor);
  const astucia = atributosAusentes ? 1 : numeroOuZero(atributos.astucia);

  const origemParaCalculo = origem && ORIGENS.some(item => item.nome === origem) ? origem : '';
  const habilidadeParaCalculo = habilidade && classe
    ? habilidade
    : '';
  const derivados = classe
    ? calcularDerivadosCriacao({
        classe,
        origem: origemParaCalculo,
        habilidadeBasica: habilidadeParaCalculo,
        atributos: { forca, agilidade, vigor, astucia },
        nivel: 1,
      })
    : null;
  const pv = derivados?.pvMaximo ?? 0;
  const sa = derivados?.saMaximo ?? 0;
  const bi = derivados?.biMaxima ?? 0;
  const defesa = derivados?.defesa ?? 0;

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
    arma_operario: textoOuNulo(dados.armaOperario),
    equipamento_inicial: kit,
    compras_iniciais: compras as Record<string, number>,
    revisao_compras: numeroOuZero(dados.revisaoCompras),
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
