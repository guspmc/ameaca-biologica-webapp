import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoProgressaoPersistenteValido, atualizarContadorMissoes, criarEstadoProgressaoInicial } from '../src/progressaoPersistente.ts';

const nivel1 = () => ({
  versao: 1, nivelAtual: 1, metodo: 'missoes', missoesCompletadas: 0,
  marcoNarrativoConcedido: false, missoesCompletadasNaUltimaMorte: null,
  nivelNaUltimaMorte: null, marcoNarrativoAposUltimaMorte: false,
  penalidadeMorteNivel1: false, beneficiosPorNivel: [],
});

const nivel4 = () => ({
  ...nivel1(), nivelAtual: 4, missoesCompletadas: 6,
  beneficiosPorNivel: [
    { nivel: 2, beneficios: [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }] },
    { nivel: 3, beneficios: [{ nivel: 3, tipo: 'atributo', atributo: 'forca', valorAntes: 2, valorDepois: 3 }] },
    { nivel: 4, beneficios: [
      { nivel: 4, tipo: 'habilidade', habilidadeId: 'finalizacao-a-distancia' },
      { nivel: 4, tipo: 'pericia', pericia: 'Luta', grauAntes: 1, grauDepois: 2 },
    ] },
  ],
});

test('contrato inicial de nível 1 é válido sem histórico de níveis posteriores', () => {
  assert.equal(estadoProgressaoPersistenteValido(nivel1(), 'Agente'), true);
});

test('histórico de níveis 2 a 4 exige benefícios exatos, na ordem e compatíveis com Classe', () => {
  assert.equal(estadoProgressaoPersistenteValido(nivel4(), 'Agente'), true);
  assert.equal(estadoProgressaoPersistenteValido(nivel4(), 'Operador'), false);
  const semBeneficio = nivel4();
  semBeneficio.beneficiosPorNivel[2].beneficios.pop();
  assert.equal(estadoProgressaoPersistenteValido(semBeneficio, 'Agente'), false);
  const grauErrado = nivel4();
  grauErrado.beneficiosPorNivel[2].beneficios[0].habilidadeId = 'anatomia-de-combate';
  assert.equal(estadoProgressaoPersistenteValido(grauErrado, 'Agente'), false);
});

test('registro de Morte distingue perda do nível 2 da penalidade por Morte no nível 1', () => {
  const morteNivel2 = {
    ...nivel1(), missoesCompletadas: 1, missoesCompletadasNaUltimaMorte: 1,
    nivelNaUltimaMorte: 2, penalidadeMorteNivel1: false,
  };
  assert.equal(estadoProgressaoPersistenteValido(morteNivel2, 'Agente'), true);
  const morteNivel1 = {
    ...nivel1(), missoesCompletadasNaUltimaMorte: 0,
    nivelNaUltimaMorte: 1, penalidadeMorteNivel1: true,
  };
  assert.equal(estadoProgressaoPersistenteValido(morteNivel1, 'Agente'), true);
  assert.equal(estadoProgressaoPersistenteValido({ ...morteNivel2, penalidadeMorteNivel1: true }, 'Agente'), false);
  const recuperadoNivel2 = {
    ...morteNivel1, nivelAtual: 2, missoesCompletadas: 1, penalidadeMorteNivel1: false,
    beneficiosPorNivel: [{ nivel: 2, beneficios: [{ nivel: 2, tipo: 'habilidade', habilidadeId: 'nao-vai-escapar' }] }],
  };
  assert.equal(estadoProgressaoPersistenteValido(recuperadoNivel2, 'Agente'), true);
});

test('contador de Missões pode ser editado sem conceder nível nem alterar histórico', () => {
  const original = nivel4();
  const atualizado = atualizarContadorMissoes(original, 'Agente', 7);
  assert.equal(atualizado.missoesCompletadas, 7);
  assert.equal(atualizado.nivelAtual, 4);
  assert.deepEqual(atualizado.beneficiosPorNivel, original.beneficiosPorNivel);
  assert.equal(original.missoesCompletadas, 6);
});

test('edição do contador para baixo preserva o marco histórico de Morte e exige superar o snapshot', () => {
  const aposMorte = {
    ...nivel1(), missoesCompletadas: 1, missoesCompletadasNaUltimaMorte: 3,
    nivelNaUltimaMorte: 2, penalidadeMorteNivel1: false,
  };
  assert.equal(estadoProgressaoPersistenteValido(aposMorte, 'Agente'), true);
  const editado = atualizarContadorMissoes(aposMorte, 'Agente', 0);
  assert.equal(editado.missoesCompletadas, 0);
  assert.equal(editado.missoesCompletadasNaUltimaMorte, 3);
  assert.equal(estadoProgressaoPersistenteValido(editado, 'Agente'), true);
});

test('estrutura desconhecida, campos extras e contadores inválidos são recusados', () => {
  assert.equal(estadoProgressaoPersistenteValido({ ...nivel1(), admin: true }, 'Agente'), false);
  assert.equal(estadoProgressaoPersistenteValido({ ...nivel1(), versao: 2 }, 'Agente'), false);
  assert.equal(estadoProgressaoPersistenteValido({ ...nivel1(), missoesCompletadas: -1 }, 'Agente'), false);
  assert.throws(() => atualizarContadorMissoes(nivel1(), 'Agente', -1), /inválido/);
});


test('novo estado de Progressão não exige método e aguarda autorização externa do grupo', async () => {
  const { criarEstadoProgressaoInicial, registrarAvancoAutorizadoGrupo, solicitarGanhoNivel } = await import('../src/progressaoPersistente.ts');
  const inicial = criarEstadoProgressaoInicial();
  assert.equal(inicial.nivelAtual, 1);
  assert.equal('metodo' in inicial, false);
  assert.equal(inicial.avancoAutorizado, false);
  assert.equal(estadoProgressaoPersistenteValido(inicial, 'Agente'), true);
  assert.throws(() => solicitarGanhoNivel(inicial, 'Agente'), /autorização de avanço/);
  const autorizado = registrarAvancoAutorizadoGrupo(inicial, 'Agente');
  assert.equal(autorizado.avancoAutorizado, true);
  assert.equal('metodo' in autorizado, false);
  assert.deepEqual(solicitarGanhoNivel(autorizado, 'Agente'), { nivel: 2, estado: 'aguardando_descanso' });
  assert.throws(() => registrarAvancoAutorizadoGrupo(autorizado, 'Agente'), /já foi autorizado/);
  const legado = criarEstadoProgressaoInicial('missoes');
  assert.equal(legado.metodo, 'missoes');
  assert.equal(estadoProgressaoPersistenteValido(legado, 'Operador'), true);
  assert.throws(() => criarEstadoProgressaoInicial('mesa'), /Método/);
});

test('registrar Marco Narrativo não concede nível e registra progresso posterior à Morte', async () => {
  const { criarEstadoProgressaoInicial, registrarMarcoNarrativo } = await import('../src/progressaoPersistente.ts');
  const inicial = criarEstadoProgressaoInicial('marco_narrativo');
  const concedido = registrarMarcoNarrativo(inicial, 'Agente');
  assert.equal(concedido.marcoNarrativoConcedido, true);
  assert.equal(concedido.nivelAtual, 1);
  assert.equal(concedido.beneficiosPorNivel.length, 0);
  const aposMorte = {
    ...inicial,
    missoesCompletadasNaUltimaMorte: 0,
    nivelNaUltimaMorte: 1,
    penalidadeMorteNivel1: true,
  };
  const marcoNovo = registrarMarcoNarrativo(aposMorte, 'Agente');
  assert.equal(marcoNovo.marcoNarrativoAposUltimaMorte, true);
  assert.equal(marcoNovo.nivelAtual, 1);
  assert.equal(estadoProgressaoPersistenteValido(marcoNovo, 'Agente'), true);
  assert.throws(() => registrarMarcoNarrativo({ ...inicial, metodo: 'missoes' }, 'Agente'), /Missões/);
});


test('solicitação de avanço é persistida sem conceder Nível antes do Descanso Completo', async () => {
  const { solicitarGanhoNivel, pedidoProgressaoPersistenteValido } = await import('../src/progressaoPersistente.ts');
  const estado = { ...nivel1(), missoesCompletadas: 1 };
  const pedido = solicitarGanhoNivel(estado, 'Agente');
  assert.deepEqual(pedido, { nivel: 2, estado: 'aguardando_descanso' });
  assert.equal(estado.nivelAtual, 1);
  assert.equal(estado.beneficiosPorNivel.length, 0);
  assert.equal(pedidoProgressaoPersistenteValido(pedido, estado, 'Agente'), true);
  assert.equal(pedidoProgressaoPersistenteValido({ ...pedido, nivel: 3 }, estado, 'Agente'), false);
  assert.throws(() => solicitarGanhoNivel(nivel1(), 'Agente'), /Missões Completadas/);
});

test('pedido de Progressão após Morte exige novo avanço além do marco registrado', async () => {
  const { solicitarGanhoNivel } = await import('../src/progressaoPersistente.ts');
  const aposMorte = {
    ...nivel1(), missoesCompletadas: 3, missoesCompletadasNaUltimaMorte: 3,
    nivelNaUltimaMorte: 2,
  };
  assert.throws(() => solicitarGanhoNivel(aposMorte, 'Agente'), /nova Missão/);
  const avancou = { ...aposMorte, missoesCompletadas: 4 };
  assert.deepEqual(solicitarGanhoNivel(avancou, 'Agente'), { nivel: 2, estado: 'aguardando_descanso' });
});

test('Descanso Completo confirma o pedido apenas na Sala de Descanso', async () => {
  const { solicitarGanhoNivel, confirmarDescansoCompletoProgressao } = await import('../src/progressaoPersistente.ts');
  const estado = { ...nivel1(), missoesCompletadas: 1 };
  const pedido = solicitarGanhoNivel(estado, 'Agente');
  assert.throws(() => confirmarDescansoCompletoProgressao(pedido, estado, 'Agente', 'sala_segura'), /Sala de Descanso/);
  const confirmado = confirmarDescansoCompletoProgressao(pedido, estado, 'Agente', 'sala_descanso');
  assert.deepEqual(confirmado, { nivel: 2, estado: 'descanso_confirmado' });
  assert.throws(() => confirmarDescansoCompletoProgressao(confirmado, estado, 'Agente', 'sala_descanso'), /já foi confirmada/);
});

test('Morte em Progressão neutra remove autorização anterior e exige nova autorização do grupo', async () => {
  const { criarEstadoProgressaoInicial, registrarAvancoAutorizadoGrupo, registrarMorteProgressao, solicitarGanhoNivel } = await import('../src/progressaoPersistente.ts');
  const inicial = criarEstadoProgressaoInicial();
  const autorizado = registrarAvancoAutorizadoGrupo(inicial, 'Agente');
  const morte = registrarMorteProgressao(autorizado, 'Agente');
  assert.equal(morte.avancoAutorizado, false);
  assert.equal(estadoProgressaoPersistenteValido(morte, 'Agente'), true);
  assert.throws(() => solicitarGanhoNivel(morte, 'Agente'), /nova autorização de avanço/);
  const novoAvanco = registrarAvancoAutorizadoGrupo(morte, 'Agente');
  assert.deepEqual(solicitarGanhoNivel(novoAvanco, 'Agente'), { nivel: 2, estado: 'aguardando_descanso' });
});

test('registro de Morte no nível 1 ativa penalidade e preserva progresso de Missões', async () => {
  const { registrarMorteProgressao } = await import('../src/progressaoPersistente.ts');
  const original = nivel1();
  original.missoesCompletadas = 3;
  const morte = registrarMorteProgressao(original, 'Agente');
  assert.equal(morte.nivelAtual, 1);
  assert.equal(morte.morteLocalNaoConfirmada, true);
  assert.equal(morte.nivelNaUltimaMorte, 1);
  assert.equal(morte.missoesCompletadasNaUltimaMorte, 3);
  assert.equal(morte.missoesCompletadas, 3);
  assert.equal(morte.penalidadeMorteNivel1, true);
  assert.equal(estadoProgressaoPersistenteValido(morte, 'Agente'), true);
  assert.deepEqual(original, { ...nivel1(), missoesCompletadas: 3 });
});

test('registro de Morte acima do nível 1 reverte apenas o último nível e preserva histórico anterior', async () => {
  const { registrarMorteProgressao } = await import('../src/progressaoPersistente.ts');
  const original = nivel4();
  const morte = registrarMorteProgressao(original, 'Agente');
  assert.equal(morte.nivelAtual, 3);
  assert.equal(morte.morteLocalNaoConfirmada, true);
  assert.equal(morte.nivelNaUltimaMorte, 4);
  assert.equal(morte.missoesCompletadasNaUltimaMorte, 6);
  assert.equal(morte.missoesCompletadas, 6);
  assert.equal(morte.penalidadeMorteNivel1, false);
  assert.equal(morte.beneficiosPorNivel.length, 2);
  assert.deepEqual(morte.beneficiosPorNivel, original.beneficiosPorNivel.slice(0, 2));
  assert.equal(estadoProgressaoPersistenteValido(morte, 'Agente'), true);
  assert.equal(original.nivelAtual, 4);
});

test('registro de Morte bloqueia histórico incompleto sem alterar a origem', async () => {
  const { registrarMorteProgressao } = await import('../src/progressaoPersistente.ts');
  const original = nivel4();
  original.beneficiosPorNivel[2].beneficios.pop();
  assert.throws(() => registrarMorteProgressao(original, 'Agente'), /inválido/);
  assert.equal(original.nivelAtual, 4);
});
