import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoProgressaoPersistenteValido, atualizarContadorMissoes } from '../src/progressaoPersistente.ts';

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

test('estrutura desconhecida, campos extras e contadores inválidos são recusados', () => {
  assert.equal(estadoProgressaoPersistenteValido({ ...nivel1(), admin: true }, 'Agente'), false);
  assert.equal(estadoProgressaoPersistenteValido({ ...nivel1(), versao: 2 }, 'Agente'), false);
  assert.equal(estadoProgressaoPersistenteValido({ ...nivel1(), missoesCompletadas: -1 }, 'Agente'), false);
  assert.throws(() => atualizarContadorMissoes(nivel1(), 'Agente', -1), /inválido/);
});
