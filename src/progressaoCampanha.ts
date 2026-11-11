import { PERICIAS_CLASSE } from './pericias.ts';
import {
  aplicarGanhoAtributoProgressao,
  aplicarGanhoPericiaProgressao,
  habilidadesDisponiveisParaEscolha,
  ganhosProgressaoAte,
  validarGanhoPericiaProgressao,
  validarProgressaoHabilidades,
  type EscolhaHabilidadeProgressao,
} from './progressaoHabilidades.ts';
import {
  estadoProgressaoPersistenteValido,
  pedidoProgressaoPersistenteValido,
  type EstadoProgressaoPersistente,
  registrarMorteProgressao,
} from './progressaoPersistente.ts';
import type { AtributoProgressao, BeneficioNivelRegistrado } from './progressaoMorte.ts';

export type EscolhasBeneficiosProgressao = {
  habilidadeId?: string;
  atributo?: AtributoProgressao;
  pericia?: string;
};

const ATRIBUTOS = ['forca', 'agilidade', 'vigor', 'astucia'] as const;
const PERICIAS_CONHECIDAS = new Set(Object.values(PERICIAS_CLASSE).flat());

function objetoSimples(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && Object.getPrototypeOf(valor) === Object.prototype;
}

/**
 * Aplica os benefícios de um único Nível depois de Descanso Completo confirmado.
 * É uma transição pura: não grava, não altera o argumento e devolve um patch
 * que o armazenamento valida e confirma como uma única operação.
 */
export function aplicarBeneficiosNivelProgressao(
  dados: Record<string, unknown>,
  escolhas: EscolhasBeneficiosProgressao,
): Record<string, unknown> {
  if (!objetoSimples(dados) || !objetoSimples(escolhas)) {
    throw new Error('Ficha ou escolhas de Progressão inválidas.');
  }
  const classeValor = dados.classe;
  const estadoValor = dados.progressao;
  const pedidoValor = dados.pedidoProgressao;
  if (typeof classeValor !== 'string' || !Number.isSafeInteger(dados.nivel)
    || !estadoProgressaoPersistenteValido(estadoValor, classeValor)
    || !pedidoProgressaoPersistenteValido(pedidoValor, estadoValor, classeValor)) {
    throw new Error('A ficha precisa ter um pedido válido e Descanso Completo confirmado antes de aplicar benefícios.');
  }
  const classe = classeValor;
  const estado = estadoValor as EstadoProgressaoPersistente;
  const pedido = pedidoValor as { nivel: number; estado: 'aguardando_descanso' | 'descanso_confirmado' };
  if (pedido.estado !== 'descanso_confirmado' || dados.nivel !== estado.nivelAtual) {
    throw new Error('A ficha precisa ter um pedido válido e Descanso Completo confirmado antes de aplicar benefícios.');
  }
  const nivel = pedido.nivel;
  const ganhos = ganhosProgressaoAte(nivel);
  const recebeHabilidade = ganhos.habilidades.some(item => item.nivel === nivel);
  const recebeAtributo = ganhos.atributos.includes(nivel);
  const recebePericia = ganhos.pontosPericia.includes(nivel);
  const chavesEsperadas = [
    ...(recebeHabilidade ? ['habilidadeId'] : []),
    ...(recebeAtributo ? ['atributo'] : []),
    ...(recebePericia ? ['pericia'] : []),
  ].sort();
  if (Object.keys(escolhas).sort().join('|') !== chavesEsperadas.join('|')) {
    throw new Error('As escolhas não correspondem aos benefícios previstos para este Nível.');
  }

  const habilidadeBasica = dados.habilidadeBasica;
  if (typeof habilidadeBasica !== 'string' || !habilidadeBasica) {
    throw new Error('A Habilidade básica da criação precisa estar registrada.');
  }
  const habilidadesAtuais: EscolhaHabilidadeProgressao[] = Array.isArray(dados.habilidadesAdquiridas)
    ? dados.habilidadesAdquiridas as EscolhaHabilidadeProgressao[]
    : [{ nivel: 1, habilidadeId: habilidadeBasica }];
  const validacaoHabilidadesAtuais = validarProgressaoHabilidades(classe, estado.nivelAtual, habilidadesAtuais);
  const habilidadeNivel1 = habilidadesAtuais.find(item => item?.nivel === 1)?.habilidadeId;
  if (!validacaoHabilidadesAtuais.valida || habilidadeNivel1 !== habilidadeBasica) {
    throw new Error('O histórico de Habilidades atual está incompleto ou não corresponde à criação.');
  }

  if (!objetoSimples(dados.atributos)
    || Object.keys(dados.atributos).sort().join('|') !== [...ATRIBUTOS].sort().join('|')
    || Object.values(dados.atributos).some(valor => !Number.isSafeInteger(valor) || (valor as number) < 0 || (valor as number) > 5)) {
    throw new Error('A ficha precisa ter os quatro Atributos válidos antes de avançar.');
  }
  if (!objetoSimples(dados.distribuicaoPericias)
    || Object.entries(dados.distribuicaoPericias).some(([nome, pontos]) =>
      !PERICIAS_CONHECIDAS.has(nome) || !Number.isSafeInteger(pontos) || (pontos as number) < 0 || (pontos as number) > 2)
    || typeof dados.periciaOrigemTreinada !== 'string' || !dados.periciaOrigemTreinada) {
    throw new Error('A distribuição de Perícias e o Treinamento da Origem precisam estar completos.');
  }

  const beneficios: BeneficioNivelRegistrado[] = [];
  let atributosAtualizados: Record<string, number> | null = null;
  let periciasAtualizadas: Record<string, number> | null = null;
  let habilidadesAtualizadas = habilidadesAtuais;

  if (recebeHabilidade) {
    if (typeof escolhas.habilidadeId !== 'string') {
      throw new Error('Escolha a Habilidade concedida neste Nível.');
    }
    const opcoes = habilidadesDisponiveisParaEscolha(classe, nivel, habilidadesAtuais);
    if (!opcoes.some(item => item.id === escolhas.habilidadeId)) {
      throw new Error('A Habilidade escolhida não atende à Classe, ao grau ou aos pré-requisitos.');
    }
    habilidadesAtualizadas = [...habilidadesAtuais, { nivel, habilidadeId: escolhas.habilidadeId }];
    const validacao = validarProgressaoHabilidades(classe, nivel, habilidadesAtualizadas);
    if (!validacao.valida) throw new Error(validacao.pendencias[0]?.motivo ?? 'A sequência de Habilidades é inválida.');
    beneficios.push({ nivel, tipo: 'habilidade', habilidadeId: escolhas.habilidadeId });
  }

  if (recebeAtributo) {
    if (typeof escolhas.atributo !== 'string' || !ATRIBUTOS.includes(escolhas.atributo as typeof ATRIBUTOS[number])) {
      throw new Error('Escolha um Atributo válido para este Nível.');
    }
    const atuais = dados.atributos as Record<string, number>;
    const valorAntes = atuais[escolhas.atributo];
    atributosAtualizados = aplicarGanhoAtributoProgressao(nivel, escolhas.atributo, atuais);
    beneficios.push({
      nivel, tipo: 'atributo', atributo: escolhas.atributo,
      valorAntes, valorDepois: atributosAtualizados[escolhas.atributo],
    });
  }

  if (recebePericia) {
    if (typeof escolhas.pericia !== 'string') throw new Error('Escolha uma Perícia da Classe para este Nível.');
    const atuais = dados.distribuicaoPericias as Record<string, number>;
    const origem = dados.periciaOrigemTreinada as string;
    const grauAntes = (atuais[escolhas.pericia] ?? 0) + (escolhas.pericia === origem ? 1 : 0);
    const validacao = validarGanhoPericiaProgressao(classe, nivel, escolhas.pericia, grauAntes);
    if (!validacao.valido) throw new Error(validacao.motivo ?? 'A Perícia escolhida não pode receber este ponto.');
    periciasAtualizadas = aplicarGanhoPericiaProgressao(classe, nivel, escolhas.pericia, atuais, origem);
    beneficios.push({
      nivel, tipo: 'pericia', pericia: escolhas.pericia,
      grauAntes: grauAntes as 0 | 1, grauDepois: (grauAntes + 1) as 1 | 2,
    });
  }

  const progressaoAtualizada: EstadoProgressaoPersistente = {
    ...estado,
    nivelAtual: nivel,
    marcoNarrativoConcedido: false,
    ...(estado.metodo === undefined ? { avancoAutorizado: false } : {}),
    penalidadeMorteNivel1: false,
    beneficiosPorNivel: [...estado.beneficiosPorNivel, { nivel, beneficios }],
  };
  if (!estadoProgressaoPersistenteValido(progressaoAtualizada, classe)) {
    throw new Error('O histórico de benefícios resultante não passou pela validação.');
  }

  return {
    nivel,
    progressao: progressaoAtualizada,
    pedidoProgressao: null,
    habilidadesAdquiridas: habilidadesAtualizadas,
    ...(atributosAtualizados ? { atributos: atributosAtualizados } : {}),
    ...(periciasAtualizadas ? { distribuicaoPericias: periciasAtualizadas } : {}),
  };
}

/**
 * Prepara uma reversão de Morte completa e atômica para a Ficha.
 * Cada campo precisa corresponder exatamente ao benefício registrado; em caso
 * de divergência, bloqueia toda a operação em vez de sobrescrever escolhas.
 */
export function aplicarMorteNaFicha(dados: Record<string, unknown>): Record<string, unknown> {
  if (!objetoSimples(dados) || typeof dados.classe !== 'string'
    || !estadoProgressaoPersistenteValido(dados.progressao, dados.classe)) {
    throw new Error('Ficha ou histórico de Progressão inválido para registrar Morte.');
  }
  const classe = dados.classe;
  const estado = dados.progressao as EstadoProgressaoPersistente;
  const nivelPerdido = estado.nivelAtual;
  if (dados.nivel !== nivelPerdido) {
    throw new Error('O Nível atual da Ficha não corresponde ao histórico de Progressão; Morte bloqueada.');
  }
  const registro = nivelPerdido > 1 ? estado.beneficiosPorNivel[nivelPerdido - 2] : null;
  let habilidadesAtualizadas: EscolhaHabilidadeProgressao[] | undefined;
  let atributosAtualizados: Record<string, number> | undefined;
  let periciasAtualizadas: Record<string, number> | undefined;

  if (nivelPerdido > 1) {
    if (!registro || registro.nivel !== nivelPerdido || !Array.isArray(registro.beneficios)) {
      throw new Error('O histórico do Nível perdido não está disponível.');
    }
    for (const beneficio of registro.beneficios) {
      if (beneficio.tipo === 'habilidade') {
        if (!Array.isArray(dados.habilidadesAdquiridas)) {
          throw new Error('A lista atual de Habilidades não está disponível; reversão bloqueada.');
        }
        const atuais = dados.habilidadesAdquiridas as EscolhaHabilidadeProgressao[];
        const correspondentes = atuais.filter(item => item?.nivel === nivelPerdido && item?.habilidadeId === beneficio.habilidadeId);
        if (correspondentes.length !== 1 || atuais.some(item => item?.nivel === nivelPerdido && item?.habilidadeId !== beneficio.habilidadeId)) {
          throw new Error('A Habilidade atual não corresponde ao registro do Nível perdido; reversão bloqueada.');
        }
        habilidadesAtualizadas = atuais.filter(item => item.nivel !== nivelPerdido);
      } else if (beneficio.tipo === 'atributo') {
        if (!objetoSimples(dados.atributos)) throw new Error('Atributos atuais indisponíveis; reversão bloqueada.');
        const atuais = atributosAtualizados ?? { ...dados.atributos as Record<string, number> };
        if (atuais[beneficio.atributo] !== beneficio.valorDepois) {
          throw new Error(`O Atributo ${beneficio.atributo} não corresponde ao histórico; reversão bloqueada.`);
        }
        atuais[beneficio.atributo] = beneficio.valorAntes;
        atributosAtualizados = atuais;
      } else if (beneficio.tipo === 'pericia') {
        if (!objetoSimples(dados.distribuicaoPericias) || typeof dados.periciaOrigemTreinada !== 'string') {
          throw new Error('Distribuição de Perícias ou Treinamento de Origem indisponível; reversão bloqueada.');
        }
        const atuais = periciasAtualizadas ?? { ...dados.distribuicaoPericias as Record<string, number> };
        const pontosAtuais = atuais[beneficio.pericia] ?? 0;
        const grauAtual = pontosAtuais + (beneficio.pericia === dados.periciaOrigemTreinada ? 1 : 0);
        if (grauAtual !== beneficio.grauDepois || pontosAtuais < 1) {
          throw new Error(`A Perícia ${beneficio.pericia} não corresponde ao histórico; reversão bloqueada.`);
        }
        atuais[beneficio.pericia] = pontosAtuais - 1;
        const grauResultante = atuais[beneficio.pericia] + (beneficio.pericia === dados.periciaOrigemTreinada ? 1 : 0);
        if (grauResultante !== beneficio.grauAntes) {
          throw new Error(`A reversão da Perícia ${beneficio.pericia} não confere com o grau anterior.`);
        }
        periciasAtualizadas = atuais;
      }
    }
  }

  const progressao = registrarMorteProgressao(estado, classe);
  return {
    nivel: progressao.nivelAtual,
    progressao,
    pedidoProgressao: null,
    ...(habilidadesAtualizadas ? { habilidadesAdquiridas: habilidadesAtualizadas } : {}),
    ...(atributosAtualizados ? { atributos: atributosAtualizados } : {}),
    ...(periciasAtualizadas ? { distribuicaoPericias: periciasAtualizadas } : {}),
  };
}
