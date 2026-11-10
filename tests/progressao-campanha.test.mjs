import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarBeneficiosNivelProgressao } from '../src/progressaoCampanha.ts';
import { criarEstadoProgressaoInicial, solicitarGanhoNivel, confirmarDescansoCompletoProgressao } from '../src/progressaoPersistente.ts';
import { validarPersonagemLocal } from '../src/validacaoPersonagemLocal.ts';

const personagem = dados => ({
  id: 'claire', geracao: 'geracao-claire', nome: 'Claire Redfield',
  criadoEm: '2026-11-03T10:00:00.000Z', atualizadoEm: '2026-11-03T11:00:00.000Z',
  dados,
});

const escolhasPorNivel = {
  2: { habilidadeId: 'nao-vai-escapar' },
  3: { atributo: 'forca' },
  4: { habilidadeId: 'finalizacao-a-distancia', pericia: 'Luta' },
  5: { atributo: 'forca' },
  6: { habilidadeId: 'na-minha-mira' },
  7: { atributo: 'forca' },
  8: { habilidadeId: 'luta-livre', pericia: 'Luta' },
  9: { atributo: 'forca' },
  10: { habilidadeId: 'voce-aparou-um-missil' },
};

test('aplica sequencialmente todos os benefícios dos níveis 2 a 10 e preserva o histórico exato', () => {
  const progressao = criarEstadoProgressaoInicial('missoes');
  progressao.missoesCompletadas = 42;
  let dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    nivel: 1, habilidadeBasica: 'anatomia-de-combate',
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'anatomia-de-combate' }],
    atributos: { forca: 1, agilidade: 2, vigor: 2, astucia: 2 },
    periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Luta: 0 },
    progressao, pedidoProgressao: null,
  };
  assert.equal(validarPersonagemLocal(personagem(dados)), true);

  for (let nivel = 2; nivel <= 10; nivel++) {
    const pedido = solicitarGanhoNivel(dados.progressao, 'Agente');
    const confirmado = confirmarDescansoCompletoProgressao(pedido, dados.progressao, 'Agente', 'sala_descanso');
    dados = { ...dados, pedidoProgressao: confirmado };
    const original = structuredClone(dados);
    const patch = aplicarBeneficiosNivelProgressao(dados, escolhasPorNivel[nivel]);
    assert.deepEqual(dados, original, `a aplicação do nível ${nivel} não deve mutar a ficha recebida`);
    dados = { ...dados, ...patch };
    assert.equal(dados.nivel, nivel);
    assert.equal(dados.progressao.nivelAtual, nivel);
    assert.equal(dados.pedidoProgressao, null);
    assert.equal(validarPersonagemLocal(personagem(dados)), true, `ficha inválida após aplicar o nível ${nivel}`);
  }

  assert.equal(dados.atributos.forca, 5);
  assert.equal(dados.distribuicaoPericias.Luta, 2);
  assert.equal(dados.habilidadesAdquiridas.length, 6);
  assert.equal(dados.progressao.beneficiosPorNivel.length, 9);
});

test('não aplica benefícios antes de Descanso Completo confirmado nem aceita Habilidade sem pré-requisito', () => {
  const progressao = criarEstadoProgressaoInicial('missoes');
  progressao.missoesCompletadas = 1;
  const dados = {
    versaoModelo: 1, estadoFicha: 'rascunho', classe: 'Agente', origem: 'Acadêmico',
    nivel: 1, habilidadeBasica: 'anatomia-de-combate',
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'anatomia-de-combate' }],
    atributos: { forca: 1, agilidade: 2, vigor: 2, astucia: 2 },
    periciaOrigemTreinada: 'Investigação', periciaOrigemExtra: null,
    distribuicaoPericias: { Luta: 0 }, progressao,
    pedidoProgressao: { nivel: 2, estado: 'aguardando_descanso' },
  };
  assert.throws(() => aplicarBeneficiosNivelProgressao(dados, { habilidadeId: 'nao-vai-escapar' }), /Descanso Completo confirmado/);
  const pedido = confirmarDescansoCompletoProgressao(dados.pedidoProgressao, progressao, 'Agente', 'sala_descanso');
  assert.throws(() => aplicarBeneficiosNivelProgressao({ ...dados, pedidoProgressao: pedido }, { habilidadeId: 'anatomia-de-combate' }), /pré-requisitos/);
});

test('a tela de Progressão oferece escolhas após Descanso Completo e salva os benefícios', async () => {
  const ui = await readFile(new URL('../src/ProgressaoFichaLocal.tsx', import.meta.url), 'utf8');
  assert.match(ui, /habilidadesDisponiveisParaEscolha/);
  assert.match(ui, /PERICIAS_CLASSE\[classe\]/);
  assert.match(ui, /Atributo \+1/);
  assert.match(ui, /Confirmar benefícios e subir de Nível/);
  assert.match(ui, /aplicarBeneficiosNivelProgressao\(dados/);
  assert.match(ui, /aoSalvar\(patch\)/);
  assert.match(ui, /origemDados === 'servidor'/);
});

test('Morte reverte Habilidade, Atributo e Perícia do último Nível como operação única', async () => {
  const { aplicarMorteNaFicha } = await import('../src/progressaoCampanha.ts');
  const progressao = criarEstadoProgressaoInicial('missoes');
  progressao.missoesCompletadas = 6;
  progressao.nivelAtual = 4;
  progressao.beneficiosPorNivel = [
    { nivel: 2, beneficios: [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }] },
    { nivel: 3, beneficios: [{ nivel: 3, tipo: 'atributo', atributo: 'forca', valorAntes: 2, valorDepois: 3 }] },
    { nivel: 4, beneficios: [
      { nivel: 4, tipo: 'habilidade', habilidadeId: 'finalizacao-a-distancia' },
      { nivel: 4, tipo: 'pericia', pericia: 'Luta', grauAntes: 0, grauDepois: 1 },
    ] },
  ];
  const ficha = {
    classe: 'Agente', nivel: 4, progressao, pedidoProgressao: null,
    habilidadeBasica: 'anatomia-de-combate',
    habilidadesAdquiridas: [
      { nivel: 1, habilidadeId: 'anatomia-de-combate' },
      { nivel: 2, habilidadeId: 'nao-vai-escapar' },
      { nivel: 4, habilidadeId: 'finalizacao-a-distancia' },
    ],
    atributos: { forca: 3, agilidade: 2, vigor: 2, astucia: 2 },
    periciaOrigemTreinada: 'Investigação',
    distribuicaoPericias: { Luta: 1 },
  };
  const original = structuredClone(ficha);
  const patch = aplicarMorteNaFicha(ficha);
  assert.equal(patch.nivel, 3);
  assert.equal(patch.progressao.nivelAtual, 3);
  assert.equal(patch.atributos.forca, 3);
  assert.deepEqual(patch.habilidadesAdquiridas.map(x => x.nivel), [1, 2]);
  assert.equal(patch.distribuicaoPericias.Luta, 0);
  assert.equal(patch.progressao.beneficiosPorNivel.length, 2);
  assert.deepEqual(ficha, original);
});

test('Morte bloqueia reversão se um valor da ficha divergir do benefício registrado', async () => {
  const { aplicarMorteNaFicha } = await import('../src/progressaoCampanha.ts');
  const progressao = criarEstadoProgressaoInicial('missoes');
  progressao.missoesCompletadas = 1;
  progressao.nivelAtual = 2;
  progressao.beneficiosPorNivel = [{ nivel: 2, beneficios: [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }] }];
  const ficha = {
    classe: 'Agente', nivel: 2, progressao, habilidadeBasica: 'anatomia-de-combate',
    habilidadesAdquiridas: [{ nivel: 1, habilidadeId: 'anatomia-de-combate' }],
    atributos: { forca: 2, agilidade: 2, vigor: 2, astucia: 2 },
    periciaOrigemTreinada: 'Investigação', distribuicaoPericias: {},
  };
  assert.throws(() => aplicarMorteNaFicha(ficha), /Habilidade atual não corresponde/);
});
