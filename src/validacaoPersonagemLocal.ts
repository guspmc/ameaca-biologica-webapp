import { atributosIniciaisValidos } from './atributosCriacao.ts';
import { armaOperarioValida } from './armaOperario.ts';
import { distribuicaoPericiasValida, NOMES_PERICIAS } from './periciasCriacao.ts';
import { ORIGENS } from './origens.ts';
import { HABILIDADES_BASICAS } from './habilidades.ts';
import { opcoesEquipamento } from './equipamento.ts';
import { planejarInventarioCriacao } from './inventarioCriacao.ts';
import { simularCompras } from './comprasIniciais.ts';
import { configuracaoFuncionamentoValida } from './funcionamentoFicha.ts';
import { reanimacaoValida } from './reanimacaoFicha.ts';
import { estadoEconomiaAcoesValido } from './economiaAcoes.ts';
import { estadoTurnoCombateValido, estadoTurnoCombateCompostoLegadoReconhecido } from './estadoTurnoCombate.ts';
import { listaCondicoesValida } from './condicoesFicha.ts';
import { listaDecisoesMesaValida } from './registroDecisoesMesa.ts';
import { HABILIDADES_PROGRESSAO, ganhosProgressaoAte, validarProgressaoHabilidades } from './progressaoHabilidades.ts';
import { usosDescansoCompletoValido } from './usosDescansoCompleto.ts';
import { beneficioAmnesicoValido, beneficioMilitarValido } from './beneficiosOrigensContextuais.ts';
import { estadoProgressaoPersistenteValido, pedidoProgressaoPersistenteValido, type EstadoProgressaoPersistente } from './progressaoPersistente.ts';

export type PersonagemValidavel = {
  id: string;
  geracao?: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
  dados: Record<string, unknown>;
};

export type OpcoesValidacaoPersonagem = {
  permitirGeracaoAusente?: boolean;
};

/** Garante que dados conhecidos e futuros possam atravessar o backup JSON sem perda silenciosa. */
function valorJsonSeguro(valor: unknown, visitados = new Set<object>()): boolean {
  if (valor === null || typeof valor === 'string' || typeof valor === 'boolean') return true;
  if (typeof valor === 'number') return Number.isFinite(valor) && !Object.is(valor, -0);
  if (typeof valor !== 'object') return false;
  if (visitados.has(valor)) return false;
  visitados.add(valor);

  const chaves = Reflect.ownKeys(valor);
  if (chaves.some(chave => typeof chave !== 'string')) {
    visitados.delete(valor);
    return false;
  }

  if (Array.isArray(valor)) {
    // JSON transforma lacunas em null e ignora propriedades extras do array.
    const indices = chaves.filter(chave => chave !== 'length') as string[];
    if (indices.length !== valor.length || indices.some(chave => {
      const indice = Number(chave);
      return !Number.isInteger(indice) || String(indice) !== chave || indice >= valor.length;
    })) {
      visitados.delete(valor);
      return false;
    }
    for (const chave of indices) {
      const descritor = Object.getOwnPropertyDescriptor(valor, chave);
      if (!descritor?.enumerable || !('value' in descritor)
        || !valorJsonSeguro(descritor.value, visitados)) {
        visitados.delete(valor);
        return false;
      }
    }
    visitados.delete(valor);
    return true;
  }

  const prototipo = Object.getPrototypeOf(valor);
  if (prototipo !== Object.prototype && prototipo !== null) {
    visitados.delete(valor);
    return false;
  }
  for (const chave of chaves as string[]) {
    const descritor = Object.getOwnPropertyDescriptor(valor, chave);
    if (!descritor?.enumerable || !('value' in descritor)
      || !valorJsonSeguro(descritor.value, visitados)) {
      visitados.delete(valor);
      return false;
    }
  }
  visitados.delete(valor);
  return true;
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && (Object.getPrototypeOf(valor) === Object.prototype || Object.getPrototypeOf(valor) === null);
}

/** Reconstrói os Atributos de criação revertendo o histórico exato da Progressão. */
function reconstruirAtributosDeCriacao(
  atuais: Record<string, unknown>,
  progressao: EstadoProgressaoPersistente,
): Record<string, number> | null {
  const base: Record<string, number> = {
    forca: atuais.forca as number,
    agilidade: atuais.agilidade as number,
    vigor: atuais.vigor as number,
    astucia: atuais.astucia as number,
  };
  for (const registro of [...progressao.beneficiosPorNivel].reverse()) {
    for (const beneficio of [...registro.beneficios].reverse()) {
      if (beneficio.tipo !== 'atributo') continue;
      if (base[beneficio.atributo] !== beneficio.valorDepois) return null;
      base[beneficio.atributo] = beneficio.valorAntes;
    }
  }
  return base;
}

/** Reverte Pontos de Perícia registrados para conferir a distribuição original da Classe. */
function reconstruirPericiasDeCriacao(
  atuais: Record<string, number>,
  progressao: EstadoProgressaoPersistente,
  periciaOrigemTreinada: string,
): Record<string, number> | null {
  const base = { ...atuais };
  for (const registro of [...progressao.beneficiosPorNivel].reverse()) {
    for (const beneficio of [...registro.beneficios].reverse()) {
      if (beneficio.tipo !== 'pericia') continue;
      const pontosAtuais = base[beneficio.pericia] ?? 0;
      const grauAtual = pontosAtuais + (beneficio.pericia === periciaOrigemTreinada ? 1 : 0);
      if (grauAtual !== beneficio.grauDepois || pontosAtuais < 1) return null;
      base[beneficio.pericia] = pontosAtuais - 1;
    }
  }
  return base;
}

function validarDadosFicha(valor: unknown): valor is Record<string, unknown> {
  if (!objeto(valor) || !valorJsonSeguro(valor)) return false;

  // Ausência identifica registros legados/incompletos; valores presentes precisam ser explícitos.
  if ('versaoModelo' in valor && valor.versaoModelo !== 1) return false;
  if ('estadoFicha' in valor && valor.estadoFicha !== 'rascunho') return false;
  if ('biAtual' in valor && (!Number.isSafeInteger(valor.biAtual) || (valor.biAtual as number) < 0)) return false;
  if ('nivel' in valor && (!Number.isSafeInteger(valor.nivel) || (valor.nivel as number) < 1 || (valor.nivel as number) > 10)) return false;
  if ('planejamentoCriacao' in valor) {
    const plano = valor.planejamentoCriacao;
    if (!objeto(plano) || Object.keys(plano).sort().join('|') !== 'habilidades|nivelAlvo'
      || !Number.isSafeInteger(plano.nivelAlvo) || (plano.nivelAlvo as number) < 1 || (plano.nivelAlvo as number) > 10
      || !Array.isArray(plano.habilidades) || typeof valor.classe !== 'string') return false;
    const ganhosPlanejados = ganhosProgressaoAte(plano.nivelAlvo as number).habilidades;
    const niveisPermitidos = new Map(ganhosPlanejados.map(item => [item.nivel, item.grau]));
    const niveisEscolhidos = new Set<number>();
    const idsEscolhidos = new Set<string>();
    for (const escolha of plano.habilidades) {
      if (!objeto(escolha) || Object.keys(escolha).sort().join('|') !== 'habilidadeId|nivel'
        || !Number.isSafeInteger(escolha.nivel) || typeof escolha.habilidadeId !== 'string'
        || !niveisPermitidos.has(escolha.nivel as number)
        || niveisEscolhidos.has(escolha.nivel as number) || idsEscolhidos.has(escolha.habilidadeId)) return false;
      const catalogada = HABILIDADES_PROGRESSAO.find(item => item.id === escolha.habilidadeId);
      if (!catalogada || catalogada.classe !== valor.classe
        || catalogada.grau !== niveisPermitidos.get(escolha.nivel as number)) return false;
      niveisEscolhidos.add(escolha.nivel as number);
      idsEscolhidos.add(escolha.habilidadeId);
    }
    if (plano.habilidades.length === ganhosPlanejados.length
      && !validarProgressaoHabilidades(valor.classe, plano.nivelAlvo as number, plano.habilidades as never).valida) return false;
  }
  let progressaoFicha: EstadoProgressaoPersistente | null = null;
  if ('progressao' in valor) {
    if (typeof valor.classe !== 'string' || !Number.isSafeInteger(valor.nivel)
      || !objeto(valor.progressao)
      || valor.progressao.nivelAtual !== valor.nivel
      || !estadoProgressaoPersistenteValido(valor.progressao, valor.classe)) return false;
    progressaoFicha = valor.progressao as EstadoProgressaoPersistente;
  }
  if ('pedidoProgressao' in valor && valor.pedidoProgressao !== null) {
    if (!progressaoFicha || typeof valor.classe !== 'string'
      || !pedidoProgressaoPersistenteValido(valor.pedidoProgressao, progressaoFicha, valor.classe)) return false;
  }
  if ('habilidadesAdquiridas' in valor) {
    if (!Array.isArray(valor.habilidadesAdquiridas) || typeof valor.classe !== 'string'
      || !Number.isSafeInteger(valor.nivel)) return false;
    const progressao = validarProgressaoHabilidades(valor.classe, valor.nivel as number, valor.habilidadesAdquiridas as never);
    if (!progressao.valida) return false;
    const habilidadeNivel1 = (valor.habilidadesAdquiridas as { nivel: number; habilidadeId: string }[])
      .find(escolha => escolha.nivel === 1)?.habilidadeId;
    if (typeof valor.habilidadeBasica === 'string' && habilidadeNivel1 !== valor.habilidadeBasica) return false;
  }
  if (progressaoFicha) {
    if (progressaoFicha.nivelAtual > 1
      && (!Array.isArray(valor.habilidadesAdquiridas) || typeof valor.habilidadeBasica !== 'string')) return false;
    if (Array.isArray(valor.habilidadesAdquiridas) && typeof valor.habilidadeBasica === 'string') {
      const habilidadesHistorico = progressaoFicha.beneficiosPorNivel.flatMap(registro =>
        registro.beneficios.filter(beneficio => beneficio.tipo === 'habilidade')
          .map(beneficio => ({ nivel: beneficio.nivel, habilidadeId: beneficio.habilidadeId })),
      );
      const esperadas = [{ nivel: 1, habilidadeId: valor.habilidadeBasica }, ...habilidadesHistorico]
        .sort((a, b) => a.nivel - b.nivel);
      const registradas = (valor.habilidadesAdquiridas as { nivel: number; habilidadeId: string }[])
        .map(escolha => ({ nivel: escolha.nivel, habilidadeId: escolha.habilidadeId }))
        .sort((a, b) => a.nivel - b.nivel);
      if (JSON.stringify(registradas) !== JSON.stringify(esperadas)) return false;
    }
  }
  if ('usosDescansoCompleto' in valor && !usosDescansoCompletoValido(valor.usosDescansoCompleto)) return false;
  if ('beneficioAmnesico' in valor && !beneficioAmnesicoValido(valor.beneficioAmnesico)) return false;
  if ('beneficioMilitar' in valor && !beneficioMilitarValido(valor.beneficioMilitar)) return false;
  for (const campo of ['pvAtual', 'pvTemporarios', 'saAtual'] as const) {
    if (campo in valor && (!Number.isSafeInteger(valor[campo]) || (valor[campo] as number) < 0)) return false;
  }
  if ('configuracaoFuncionamento' in valor && !configuracaoFuncionamentoValida(valor.configuracaoFuncionamento)) return false;
  if ('reanimacao' in valor && valor.reanimacao !== null && !reanimacaoValida(valor.reanimacao)) return false;
  if ('condicoes' in valor && !listaCondicoesValida(valor.condicoes)) return false;
  if ('registrosMesa' in valor && !listaDecisoesMesaValida(valor.registrosMesa)) return false;
  if ('estadoTurnoCombate' in valor) {
    if (!(estadoTurnoCombateValido(valor.estadoTurnoCombate) || estadoTurnoCombateCompostoLegadoReconhecido(valor.estadoTurnoCombate))
      || !Number.isSafeInteger(valor.saAtual)
      || (valor.estadoTurnoCombate as { economia: { saAtual: number } }).economia.saAtual !== valor.saAtual) return false;
  }
  if ('economiaAcoes' in valor) {
    if (!estadoEconomiaAcoesValido(valor.economiaAcoes)) return false;
    // SA é exibida e administrada também no painel de Recursos; os dois registros
    // precisam permanecer idênticos para impedir uma ficha com saldos divergentes.
    if (!Number.isSafeInteger(valor.saAtual) || (valor.economiaAcoes as { saAtual: number }).saAtual !== valor.saAtual) return false;
  }

  if ('classe' in valor
    && (typeof valor.classe !== 'string' || !['Agente', 'Autodidata', 'Operador'].includes(valor.classe))) return false;
  if ('origem' in valor
    && (typeof valor.origem !== 'string' || !ORIGENS.some(item => item.nome === valor.origem))) return false;
  if ('armaOperario' in valor) {
    if (typeof valor.armaOperario !== 'string') return false;
    if (valor.armaOperario !== '' && !armaOperarioValida(valor.armaOperario)) return false;
  }
  if ('habilidadeBasica' in valor) {
    if (typeof valor.habilidadeBasica !== 'string') return false;
    if (valor.habilidadeBasica !== '' && !HABILIDADES_BASICAS.some(item =>
      item.id === valor.habilidadeBasica && (!('classe' in valor) || item.classe === valor.classe)
    )) return false;
  }
  if ('equipamentoInicial' in valor) {
    if (typeof valor.equipamentoInicial !== 'string') return false;
    if (valor.equipamentoInicial !== '' && !opcoesEquipamento(typeof valor.classe === 'string' ? valor.classe : null)
      .some(item => item.id === valor.equipamentoInicial)) return false;
  }
  const caracteristicasCompletas = ['classe', 'origem', 'armaOperario', 'habilidadeBasica', 'equipamentoInicial'].every(chave => chave in valor);
  if (caracteristicasCompletas) {
    if (typeof valor.classe !== 'string' || typeof valor.origem !== 'string'
      || typeof valor.armaOperario !== 'string' || typeof valor.habilidadeBasica !== 'string'
      || typeof valor.equipamentoInicial !== 'string') return false;
    if (!HABILIDADES_BASICAS.some(item => item.id === valor.habilidadeBasica && item.classe === valor.classe)) return false;
    if (!opcoesEquipamento(valor.classe).some(item => item.id === valor.equipamentoInicial)) return false;
    if (valor.origem === 'Operário' && !armaOperarioValida(valor.armaOperario)) return false;
  }

  if ('atributos' in valor) {
    if (!objeto(valor.atributos)) return false;
    const chavesAtributos = Object.keys(valor.atributos).sort();
    if (chavesAtributos.join('|') !== ['agilidade', 'astucia', 'forca', 'vigor'].join('|')) return false;
    const atributosBase = progressaoFicha
      ? reconstruirAtributosDeCriacao(valor.atributos, progressaoFicha)
      : valor.atributos as Record<string, number>;
    if (!atributosBase || !atributosIniciaisValidos(atributosBase as never)) return false;
  }
  if ('periciaOrigemTreinada' in valor) {
    if (typeof valor.periciaOrigemTreinada !== 'string') return false;
    if (valor.periciaOrigemTreinada !== '' && !NOMES_PERICIAS.includes(valor.periciaOrigemTreinada as never)) return false;
    if (valor.periciaOrigemTreinada && typeof valor.origem === 'string') {
      const origemTreinamento = ORIGENS.find(item => item.nome === valor.origem);
      if (!origemTreinamento) return false;
      if (valor.origem !== 'Amnésico' && !origemTreinamento.pericias.includes(valor.periciaOrigemTreinada)) return false;
    }
  }
  if ('periciaOrigemExtra' in valor) {
    if (valor.periciaOrigemExtra !== null && typeof valor.periciaOrigemExtra !== 'string') return false;
    if (typeof valor.periciaOrigemExtra === 'string' && valor.periciaOrigemExtra !== ''
      && !NOMES_PERICIAS.includes(valor.periciaOrigemExtra as never)) return false;
    if (typeof valor.periciaOrigemExtra === 'string' && valor.periciaOrigemExtra !== '') {
      if (valor.origem !== 'Amnésico' || valor.periciaOrigemExtra === valor.periciaOrigemTreinada) return false;
    }
  }
  if ('periciaTentativaErroTreinada' in valor) {
    const escolha = valor.periciaTentativaErroTreinada;
    if (escolha !== null && typeof escolha !== 'string') return false;
    if (typeof escolha === 'string' && escolha !== '') {
      if (!NOMES_PERICIAS.includes(escolha as never)) return false;
      const adquirida = Array.isArray(valor.habilidadesAdquiridas)
        && valor.habilidadesAdquiridas.some(item => !!item && typeof item === 'object' && !Array.isArray(item)
          && (item as Record<string, unknown>).habilidadeId === 'tentativa-e-erro');
      if (!adquirida || escolha === valor.periciaOrigemTreinada || escolha === valor.periciaOrigemExtra) return false;
      if (objeto(valor.distribuicaoPericias) && Number(valor.distribuicaoPericias[escolha] ?? 0) > 1) return false;
    }
  }
  if ('distribuicaoPericias' in valor) {
    if (!objeto(valor.distribuicaoPericias)
      || Object.entries(valor.distribuicaoPericias).some(([nome, grau]) =>
        !NOMES_PERICIAS.includes(nome as never) || !Number.isInteger(grau) || (grau as number) < 0 || (grau as number) > 2
      )) return false;
  }

  const contextoPericiasCompleto = 'atributos' in valor && 'classe' in valor && 'origem' in valor
    && 'periciaOrigemTreinada' in valor && 'distribuicaoPericias' in valor;
  if (contextoPericiasCompleto) {
    const extra = valor.periciaOrigemExtra;
    const distribuicaoBase = progressaoFicha
      ? reconstruirPericiasDeCriacao(
          valor.distribuicaoPericias as Record<string, number>,
          progressaoFicha,
          valor.periciaOrigemTreinada as string,
        )
      : valor.distribuicaoPericias as Record<string, number>;
    if (!distribuicaoBase || !distribuicaoPericiasValida(
      valor.classe as string,
      valor.origem as string,
      valor.periciaOrigemTreinada as string,
      distribuicaoBase,
      typeof extra === 'string' ? extra : undefined,
    )) return false;
  }

  if ('identidade' in valor) {
    if (!objeto(valor.identidade)) return false;
    const limites: Record<string, number> = {
      idade: 40, genero: 40, ocupacao: 120, apelido: 120, afiliacao: 120,
      aparencia: 1000, personalidade: 1000, objetivo: 1000, medo: 1000, lacos: 1000, historia: 4000,
    };
    for (const [campo, limite] of Object.entries(limites)) {
      if (campo in valor.identidade
        && (typeof valor.identidade[campo] !== 'string' || valor.identidade[campo].length > limite)) return false;
    }
  }

  if ('comprasIniciais' in valor) {
    if (!objeto(valor.comprasIniciais)) return false;
    try {
      if (!simularCompras(valor.comprasIniciais as Record<string, number>, 100).orcamentoValido) return false;
    } catch {
      return false;
    }
    if (valor.equipamentoInicial !== undefined && valor.equipamentoInicial !== 'C'
      && Object.keys(valor.comprasIniciais).length > 0) return false;
  }
  if ('revisaoCompras' in valor
    && (!Number.isInteger(valor.revisaoCompras) || (valor.revisaoCompras as number) < 0)) return false;

  const contextoInventarioCompleto = 'comprasIniciais' in valor && 'revisaoCompras' in valor
    && typeof valor.classe === 'string' && typeof valor.equipamentoInicial === 'string'
    && typeof valor.origem === 'string' && objeto(valor.atributos);
  if (contextoInventarioCompleto) {
    try {
      planejarInventarioCriacao({
        classe: valor.classe as string,
        equipamento_inicial: valor.equipamentoInicial as string,
        forca: (valor.atributos as Record<string, unknown>).forca as number,
        origem: valor.origem as string,
        nivel: 1,
        estado_ficha: 'rascunho',
        compras_iniciais: valor.comprasIniciais as Record<string, number>,
      });
    } catch {
      return false;
    }
  }

  return true;
}

export function validarPersonagemLocal(
  valor: unknown,
  opcoes: OpcoesValidacaoPersonagem = {},
): valor is PersonagemValidavel {
  if (!objeto(valor)) return false;
  const item = valor as Record<string, unknown>;
  const geracaoValida = typeof item.geracao === 'string' && item.geracao.trim().length > 0;
  if (!geracaoValida && !(opcoes.permitirGeracaoAusente && item.geracao === undefined)) return false;
  return typeof item.id === 'string' && item.id.trim().length > 0
    && typeof item.nome === 'string' && item.nome.trim().length >= 2 && item.nome.trim().length <= 80
    && typeof item.criadoEm === 'string' && !Number.isNaN(Date.parse(item.criadoEm))
    && typeof item.atualizadoEm === 'string' && !Number.isNaN(Date.parse(item.atualizadoEm))
    && validarDadosFicha(item.dados);
}
