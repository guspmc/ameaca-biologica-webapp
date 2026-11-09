import test from 'node:test';
import assert from 'node:assert/strict';
import { validarPersonagemLocal } from '../src/validacaoPersonagemLocal.ts';
import { configuracaoInicial } from '../src/funcionamentoFicha.ts';
import { economiaAcoesInicial } from '../src/economiaAcoes.ts';
import { estadoTurnoCombateInicial } from '../src/estadoTurnoCombate.ts';

const base = (dados = { versaoModelo: 1, estadoFicha: 'rascunho' }) => ({
  id: 'claire', geracao: 'geracao-claire', nome: 'Claire Redfield',
  criadoEm: '2026-11-03T10:00:00.000Z',
  atualizadoEm: '2026-11-03T11:00:00.000Z',
  dados,
});

const atributos = { forca: 1, agilidade: 2, vigor: 2, astucia: 2 };

test('aceita rascunho mínimo e seções parciais legítimas', () => {
  assert.equal(validarPersonagemLocal(base()), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente' })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', identidade: { apelido: 'Claire' } })), true);
});

test('valida atributos e Perícias com as regras existentes de criação', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    atributos, periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Percepção: 1 },
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, atributos: { ...atributos, vigor: 9 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, atributos: { ...atributos, sorte: 1 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Vontade: 2 } })), false);
});

test('Tentativa e Erro só registra Perícia adicional após aquisição e sem duplicar treinamentos', () => {
  const habilidadesAdquiridas = [
    { nivel: 1, habilidadeId: 'ambidestria' },
    { nivel: 2, habilidadeId: 'curiosa' },
    { nivel: 4, habilidadeId: 'armeira-autodidata' },
    { nivel: 6, habilidadeId: 'tentativa-e-erro' },
  ];
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Autodidata', origem: 'Acadêmico',
    nivel: 6, habilidadesAdquiridas, atributos,
    periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Furtividade: 1 }, periciaTentativaErroTreinada: 'Medicina',
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Furtividade: 1, Medicina: 1 } })), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Furtividade: 1, Medicina: 2 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, periciaTentativaErroTreinada: 'Investigação' })), false);
  // Um ponto posterior pode elevar a Perícia escolhida a Mestre; o seletor impede escolhê-la se já estava treinada antes.
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Furtividade: 1, Medicina: 1 } })), true);
  const amnesico = { ...dados, origem: 'Amnésico', periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: 'Pontaria', distribuicaoPericias: {}, periciaTentativaErroTreinada: 'Pontaria' };
  assert.equal(validarPersonagemLocal(base(amnesico)), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, periciaTentativaErroTreinada: 'Perícia Inventada' })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, habilidadesAdquiridas: habilidadesAdquiridas.slice(0, 3) })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, periciaTentativaErroTreinada: null })), true);
});

test('valida Características e compatibilidade entre Classe, Origem e Habilidade', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    armaOperario: '', habilidadeBasica: 'anatomia-de-combate', equipamentoInicial: 'A',
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, habilidadeBasica: 'parrudo' })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, equipamentoInicial: 'kit-inexistente' })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, origem: 'Operário', armaOperario: '' })), false);
});

test('valida compras iniciais usando o simulador de inventário existente', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    atributos, periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: {}, armaOperario: '', habilidadeBasica: 'anatomia-de-combate',
    equipamentoInicial: 'C', comprasIniciais: { 'municao-9mm': 1 }, revisaoCompras: 1,
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, comprasIniciais: { 'item-desconhecido': 1 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, revisaoCompras: -1 })), false);
});

test('valida BI atual como inteiro não negativo quando o campo estiver presente', () => {
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', biAtual: 0 })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', biAtual: 8 })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', biAtual: -1 })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', biAtual: 1.5 })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', biAtual: '2' })), false);
});

test('valida PV, PV Temporários e SA como inteiros não negativos', () => {
  const baseDados = { versaoModelo: 1, estadoFicha: 'rascunho', pvAtual: 10, pvTemporarios: 0, saAtual: 4, biAtual: 0 };
  assert.equal(validarPersonagemLocal(base(baseDados)), true);
  for (const campo of ['pvAtual', 'pvTemporarios', 'saAtual']) {
    assert.equal(validarPersonagemLocal(base({ ...baseDados, [campo]: -1 })), false);
    assert.equal(validarPersonagemLocal(base({ ...baseDados, [campo]: 1.5 })), false);
    assert.equal(validarPersonagemLocal(base({ ...baseDados, [campo]: '2' })), false);
  }
});

test('valida modos e preferências de funcionamento sem aceitar chaves ou valores desconhecidos', () => {
  const configuracao = configuracaoInicial();
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', configuracaoFuncionamento: configuracao })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', configuracaoFuncionamento: { ...configuracao, modo: 'improvisado' } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', configuracaoFuncionamento: { ...configuracao, preferenciasMisto: { ...configuracao.preferenciasMisto, municao: null } } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', configuracaoFuncionamento: { ...configuracao, preferenciasMisto: { ...configuracao.preferenciasMisto, biInfectante: 'talvez' } } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', configuracaoFuncionamento: { ...configuracao, campoExtra: true } })), false);
 });

test('valida limites da Identidade e preserva campos desconhecidos JSON válidos', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho',
    identidade: { apelido: 'Claire', historia: 'x'.repeat(4000), campoFuturo: { valor: 7 } },
    campoFuturoDaFicha: ['preservar', 1, true],
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, identidade: { historia: 'x'.repeat(4001) } })), false);
});

test('recusa versões, estados e valores que não podem ser preservados no backup JSON', () => {
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 2, estadoFicha: 'rascunho' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'ativa' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', campo: undefined })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', campo: new Date() })), false);
});

test('aceita geração ausente somente no caminho explícito de legado', () => {
  const legado = base();
  delete legado.geracao;
  assert.equal(validarPersonagemLocal(legado), false);
  assert.equal(validarPersonagemLocal(legado, { permitirGeracaoAusente: true }), true);
});


test('valida nomes e escolhas de Perícia mesmo quando a seção ainda está incompleta', () => {
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', periciaOrigemTreinada: 'Percepção' })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', periciaOrigemTreinada: 'Perícia Inventada' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', origem: 'Acadêmico', periciaOrigemTreinada: 'Pontaria' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', origem: 'Amnésico', periciaOrigemExtra: 'Perícia Inventada' })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', distribuicaoPericias: { 'Perícia Inventada': 1 } })), false);
});


test('rejeita propriedades que JSON.stringify descartaria ou transformaria', () => {
  const comSimbolo = { versaoModelo: 1, estadoFicha: 'rascunho' };
  comSimbolo[Symbol('campo')] = 'perdido no JSON';
  const naoEnumeravel = { versaoModelo: 1, estadoFicha: 'rascunho' };
  Object.defineProperty(naoEnumeravel, 'campoOculto', { value: 'perdido no JSON', enumerable: false });
  const comLacuna = { versaoModelo: 1, estadoFicha: 'rascunho', campoFuturo: new Array(2) };
  const comAtributoCalculado = { versaoModelo: 1, estadoFicha: 'rascunho' };
  Object.defineProperty(comAtributoCalculado, 'campoCalculado', {
    enumerable: true, get() { return 'valor'; },
  });
  const arrayComGetter = [];
  Object.defineProperty(arrayComGetter, '0', { enumerable: true, get() { return 'valor'; } });
  arrayComGetter.length = 1;
  assert.equal(validarPersonagemLocal(base(comSimbolo)), false);
  assert.equal(validarPersonagemLocal(base(naoEnumeravel)), false);
  assert.equal(validarPersonagemLocal(base(comLacuna)), false);
  assert.equal(validarPersonagemLocal(base(comAtributoCalculado)), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', campo: arrayComGetter })), false);
});

test('valida o estado persistível de Reanimação sem misturar causas ou contadores', async () => {
  const { iniciarReanimacao, iniciarTurnoReanimacao, resolverTesteReanimacao } = await import('../src/reanimacaoFicha.ts');
  let r = iniciarTurnoReanimacao(iniciarReanimacao('pv_zero'));
  r = resolverTesteReanimacao(r, 12, 12).reanimacao;
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: r })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, causa: 'colapso_bi', curaAcumulada: 3 } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, sucessos: 3 } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, tentativas: 4 } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, estado: 'morte_automatica' } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, estado: 'aguardando_proximo_turno', sucessos: 1, tentativas: 1 } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, estado: 'em_andamento', sucessos: 3, tentativas: 3 } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: { ...r, causa: 'colapso_bi', estado: 'aguardando_proximo_turno' } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', reanimacao: null })), true);
});


test('valida Condições persistidas e preserva múltiplas fontes sem duplicar IDs', () => {
  const a = { id: 'cond-1', condicao: 'exposto', fonte: 'Falha Crítica', duracao: 'até o fim do próximo turno', observacao: '' };
  const b = { id: 'cond-2', condicao: 'exposto', fonte: 'Habilidade', duracao: 'até o fim da rodada', observacao: '' };
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', condicoes: [a, b] })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', condicoes: [a, a] })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', condicoes: [{ ...a, condicao: 'inventada' }] })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', condicoes: [{ ...a, campoExtra: true }] })), false);
});

test('valida a economia de ações persistida e mantém o saldo de SA sincronizado', () => {
  const economia = economiaAcoesInicial(4);
  const dados = { versaoModelo: 1, estadoFicha: 'rascunho', saAtual: 4, economiaAcoes: economia };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, saAtual: 3 })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, economiaAcoes: { ...economia, saAtual: -1 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, economiaAcoes: { ...economia, saGastaNaJanela: 4 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, economiaAcoes: { ...economia, normaisUsados: { ...economia.normaisUsados, recursoExtra: true } } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, economiaAcoes: { ...economia, campoExtra: true } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', economiaAcoes: economia })), false);
});

test('valida Nível persistido para suportar Dados de Vida por Nível no Descanso Parcial', () => {
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', nivel: 1 })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', nivel: 10 })), true);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', nivel: 0 })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', nivel: 11 })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho', nivel: 1.5 })), false);
});


test('valida escolhas de Habilidades adquiridas sequencialmente por Nível', () => {
  const baseHabilidades = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Autodidata', nivel: 1,
    habilidadeBasica: 'ambidestria',
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'ambidestria' }],
  };
  assert.equal(validarPersonagemLocal(base(baseHabilidades)), true);
  assert.equal(validarPersonagemLocal(base({
    ...baseHabilidades, nivel: 2,
    habilidadesAdquiridas: [
      { nivel: 1, habilidadeId: 'ambidestria' },
      { nivel: 2, habilidadeId: 'curiosa' },
    ],
  })), true);
  assert.equal(validarPersonagemLocal(base({
    ...baseHabilidades, nivel: 2,
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'ambidestria' }],
  })), false);
  assert.equal(validarPersonagemLocal(base({
    ...baseHabilidades,
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'curiosa' }],
  })), false);
  assert.equal(validarPersonagemLocal(base({
    ...baseHabilidades,
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'ambidestria', extra: true }],
  })), false);
});

test('valida usos limitados a Descanso Completo sem aceitar estados desconhecidos', () => {
  assert.equal(validarPersonagemLocal(base({
    versaoModelo: 1, estadoFicha: 'rascunho', origem: 'Acadêmico',
    habilidadeBasica: 'curiosa', classe: 'Autodidata',
    usosDescansoCompleto: { 'habilidade:curiosa': true, 'origem:academico': true },
  })), true);
  assert.equal(validarPersonagemLocal(base({
    versaoModelo: 1, estadoFicha: 'rascunho',
    usosDescansoCompleto: { 'origem:inventada': true },
  })), false);
  assert.equal(validarPersonagemLocal(base({
    versaoModelo: 1, estadoFicha: 'rascunho',
    usosDescansoCompleto: { 'origem:academico': false },
  })), false);
});


test('valida planejamento parcial e completo de Habilidades para criação em Nível superior', () => {
  const planoParcial = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente',
    planejamentoCriacao: {
      nivelAlvo: 4,
      habilidades: [
        { nivel: 1, habilidadeId: 'anatomia-de-combate' },
        { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      ],
    },
  };
  assert.equal(validarPersonagemLocal(base(planoParcial)), true);
  const planoCompleto = {
    ...planoParcial,
    planejamentoCriacao: {
      nivelAlvo: 4,
      habilidades: [
        { nivel: 1, habilidadeId: 'anatomia-de-combate' },
        { nivel: 2, habilidadeId: 'nao-vai-escapar' },
        { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
      ],
    },
  };
  assert.equal(validarPersonagemLocal(base(planoCompleto)), true);
  assert.equal(validarPersonagemLocal(base({
    ...planoCompleto,
    planejamentoCriacao: { ...planoCompleto.planejamentoCriacao, habilidades: [
      { nivel: 1, habilidadeId: 'anatomia-de-combate' },
      { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      { nivel: 4, habilidadeId: 'retaliacao' },
    ] },
  })), false);
  assert.equal(validarPersonagemLocal(base({
    ...planoCompleto,
    planejamentoCriacao: { ...planoCompleto.planejamentoCriacao, habilidades: [
      ...planoCompleto.planejamentoCriacao.habilidades,
      { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
    ] },
  })), false);
  assert.equal(validarPersonagemLocal(base({
    ...planoCompleto,
    planejamentoCriacao: { ...planoCompleto.planejamentoCriacao, nivelAlvo: 11 },
  })), false);
});


test('valida o estado integrado de Combate e impede divergência com o saldo de SA', () => {
  const estado = estadoTurnoCombateInicial(4);
  const dados = { versaoModelo: 1, estadoFicha: 'rascunho', saAtual: 4, estadoTurnoCombate: estado };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, saAtual: 3 })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, estadoTurnoCombate: { ...estado, versao: 99 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, estadoTurnoCombate: { ...estado, ataqueAdicionalAutorizado: 'sim' } })), false);
});


test('backup e persistência aceitam somente formatos compostos históricos reconhecidos para migração', () => {
  const economia = economiaAcoesInicial(4);
  const legado = {
    versao: 1,
    economia,
    manobras: { disparadaUsada: false, fugaUsada: false, mirarPreparado: true, combateDuasArmasUsado: false },
  };
  const dados = { versaoModelo: 1, estadoFicha: 'rascunho', saAtual: 4, estadoTurnoCombate: legado };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, estadoTurnoCombate: { ...legado, campoExtra: true } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, saAtual: 3 })), false);
});


test('valida Progressão persistente quando presente e exige sincronização com o Nível', () => {
  const progressao = {
    versao: 1, nivelAtual: 1, metodo: 'missoes', missoesCompletadas: 0,
    marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
    nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
    penalidadeMorteNivel1: false, beneficiosPorNivel: [],
  };
  const dados = { versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', nivel: 1, progressao };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, nivel: 2 })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, progressao: { ...progressao, campoExtra: true } })), false);
  assert.equal(validarPersonagemLocal(base({ versaoModelo: 1, estadoFicha: 'rascunho' })), true);
});


test('valida a segunda Perícia do Amnésico como opção de Classe sem Treinamento gratuito', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Amnésico',
    atributos, periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: 'Vontade',
    distribuicaoPericias: { Vontade: 2 },
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Vontade: 3 } })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, periciaOrigemExtra: 'Investigação' })), false);
});


test('Progressão valida Atributos acima do limite de criação reconstruindo o histórico exato', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    nivel: 3, habilidadeBasica: 'anatomia-de-combate',
    habilidadesAdquiridas: [
      { nivel: 1, habilidadeId: 'anatomia-de-combate' },
      { nivel: 2, habilidadeId: 'nao-vai-escapar' },
    ],
    atributos: { forca: 4, agilidade: 2, vigor: 1, astucia: 1 },
    periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Luta: 1 },
    progressao: {
      versao: 1, nivelAtual: 3, metodo: 'missoes', missoesCompletadas: 3,
      marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
      nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
      penalidadeMorteNivel1: false,
      beneficiosPorNivel: [
        { nivel: 2, beneficios: [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }] },
        { nivel: 3, beneficios: [{ nivel: 3, tipo: 'atributo', atributo: 'forca', valorAntes: 3, valorDepois: 4 }] },
      ],
    },
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, atributos: { ...dados.atributos, forca: 3 } })), false);
  assert.equal(validarPersonagemLocal(base({
    ...dados,
    progressao: { ...dados.progressao, beneficiosPorNivel: [
      dados.progressao.beneficiosPorNivel[0],
      { nivel: 3, beneficios: [{ nivel: 3, tipo: 'atributo', atributo: 'forca', valorAntes: 2, valorDepois: 3 }] },
    ] },
  })), false);
});

test('Progressão valida Perícias acima do orçamento de criação revertendo somente pontos registrados', () => {
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    nivel: 4, habilidadeBasica: 'anatomia-de-combate',
    habilidadesAdquiridas: [
      { nivel: 1, habilidadeId: 'anatomia-de-combate' },
      { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
    ],
    atributos: { forca: 4, agilidade: 2, vigor: 1, astucia: 1 },
    periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Luta: 2 },
    progressao: {
      versao: 1, nivelAtual: 4, metodo: 'missoes', missoesCompletadas: 6,
      marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
      nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
      penalidadeMorteNivel1: false,
      beneficiosPorNivel: [
        { nivel: 2, beneficios: [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }] },
        { nivel: 3, beneficios: [{ nivel: 3, tipo: 'atributo', atributo: 'forca', valorAntes: 3, valorDepois: 4 }] },
        { nivel: 4, beneficios: [
          { nivel: 4, tipo: 'habilidade', habilidadeId: 'finalizacao-a-distancia' },
          { nivel: 4, tipo: 'pericia', pericia: 'Luta', grauAntes: 1, grauDepois: 2 },
        ] },
      ],
    },
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({ ...dados, distribuicaoPericias: { Luta: 1 } })), false);
  assert.equal(validarPersonagemLocal(base({
    ...dados,
    progressao: { ...dados.progressao, beneficiosPorNivel: [
      dados.progressao.beneficiosPorNivel[0],
      dados.progressao.beneficiosPorNivel[1],
      { nivel: 4, beneficios: [
        { nivel: 4, tipo: 'habilidade', habilidadeId: 'finalizacao-a-distancia' },
        { nivel: 4, tipo: 'pericia', pericia: 'Luta', grauAntes: 0, grauDepois: 1 },
      ] },
    ] },
  })), false);
});


test('valida pedido de Progressão vinculado ao próximo Nível e ao requisito já cumprido', () => {
  const progressao = {
    versao: 1, nivelAtual: 1, metodo: 'missoes', missoesCompletadas: 1,
    marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
    nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
    penalidadeMorteNivel1: false, beneficiosPorNivel: [],
  };
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', nivel: 1,
    progressao, pedidoProgressao: { nivel: 2, estado: 'aguardando_descanso' },
  };
  assert.equal(validarPersonagemLocal(base(dados)), true);
  assert.equal(validarPersonagemLocal(base({
    ...dados, pedidoProgressao: { nivel: 3, estado: 'aguardando_descanso' },
  })), false);
  assert.equal(validarPersonagemLocal(base({
    ...dados, pedidoProgressao: { nivel: 2, estado: 'inventado' },
  })), false);
  assert.equal(validarPersonagemLocal(base({
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', nivel: 1,
    pedidoProgressao: { nivel: 2, estado: 'aguardando_descanso' },
  })), false);
  assert.equal(validarPersonagemLocal(base({ ...dados, pedidoProgressao: null })), true);
});
