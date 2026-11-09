import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listarManobrasUniversais, consultarManobraUniversal } from '../src/manobrasUniversais.ts';

test('catálogo contém as 14 Ações e Manobras Universais das páginas 77–79', () => {
  const itens = listarManobrasUniversais();
  assert.equal(itens.length, 14);
  assert.deepEqual(itens.map(item => item.id), [
    'adiar-acao', 'agarrar', 'ajudar', 'atacar', 'combate-duas-armas',
    'desengajar', 'disparada', 'empurrar-derrubar', 'esconder-se',
    'finalizacao-dupla', 'finalizar', 'fuga', 'mirar', 'usar-objeto',
  ]);
});

test('custos e categorias de ação preservam as distinções do livro', () => {
  const itens = Object.fromEntries(listarManobrasUniversais().map(item => [item.id, item]));
  assert.equal(itens['adiar-acao'].custo, 'Sem SA.');
  assert.equal(itens.agarrar.categoriaCusto, 'substitui-ataque');
  assert.equal(itens.ajudar.custo, 'Ação em combate.');
  assert.equal(itens['combate-duas-armas'].custo, 'Ação Bônus.');
  assert.equal(itens.desengajar.custo, 'Movimento.');
  assert.equal(itens.disparada.categoriaCusto, 'acao-convertida-em-movimento');
  assert.equal(itens['empurrar-derrubar'].categoriaCusto, 'substitui-ataque');
  assert.equal(itens['finalizacao-dupla'].custo, 'Reação + 3 SA.');
  assert.equal(itens.finalizar.custo, '3 SA.');
  assert.equal(itens.fuga.custo, 'Disparada + 1 SA.');
  assert.equal(itens.mirar.custo, '1 SA.');
  assert.equal(itens['usar-objeto'].custo, 'Ação.');
});

test('Finalizar preserva o procedimento e não consome Ação nem Movimento normais', () => {
  const item = consultarManobraUniversal('finalizar');
  assert.ok(item);
  assert.equal(item.limite, 'Os 3 SA constituem o custo completo da Manobra.');
  assert.ok(item.procedimento.some(texto => texto.includes('Fortitude')));
  assert.ok(item.efeitos.some(texto => texto.includes('Dano normal +3d6')));
  assert.ok(item.restricoes.some(texto => texto.includes('Não consome a Ação nem o Movimento')));
});

test('Finalização Dupla registra o compromisso do próximo turno', () => {
  const item = consultarManobraUniversal('finalizacao-dupla');
  assert.ok(item);
  assert.ok(item.requisitos.some(texto => texto.includes('O alvo sobreviveu')));
  assert.ok(item.restricoes.some(texto => texto.includes('Ação e o Movimento do próximo turno')));
  assert.ok(item.restricoes.some(texto => texto.includes('Preserva Ação Bônus')));
});

test('Mirar e Fuga preservam seus custos e limites', () => {
  const mirar = consultarManobraUniversal('mirar');
  const fuga = consultarManobraUniversal('fuga');
  assert.ok(mirar && fuga);
  assert.ok(mirar.efeitos.some(texto => texto.includes('+2')));
  assert.ok(mirar.restricoes.some(texto => texto.includes('Não remove Desvantagem')));
  assert.ok(fuga.requisitos.some(texto => texto.includes('Disparada')));
  assert.ok(fuga.efeitos.some(texto => texto.includes('terceiro Movimento')));
});

test('Agarrar e Empurrar/Derrubar preservam a disputa e os requisitos', () => {
  const agarrar = consultarManobraUniversal('agarrar');
  const empurrar = consultarManobraUniversal('empurrar-derrubar');
  assert.ok(agarrar && empurrar);
  assert.ok(agarrar.requisitos.some(texto => texto.includes('mão livre')));
  assert.ok(agarrar.procedimento.some(texto => texto.includes('Atletismo')));
  assert.ok(agarrar.restricoes.some(texto => texto.includes('DT do resultado original')));
  assert.ok(empurrar.efeitos.some(texto => texto.includes('1,5 m')));
  assert.ok(empurrar.restricoes.some(texto => texto.includes('Não causa Dano')));
});

test('todos os registros possuem referência e campos textuais válidos', () => {
  for (const item of listarManobrasUniversais()) {
    assert.ok(item.id.length > 0);
    assert.ok(item.nome.length > 0);
    assert.ok(item.referencia.includes('Arquivo do Jogador v1.0, p.'));
    assert.ok(item.custo.length > 0);
    for (const campo of [item.requisitos, item.procedimento, item.efeitos, item.restricoes]) {
      assert.ok(Array.isArray(campo));
      assert.ok(campo.every(texto => typeof texto === 'string' && texto.length > 0));
    }
  }
});

test('consultas devolvem cópias e não permitem mutar o catálogo', () => {
  const primeiro = consultarManobraUniversal('finalizar');
  assert.ok(primeiro);
  primeiro.efeitos.push('efeito adulterado');
  primeiro.procedimento[0] = 'procedimento adulterado';
  const segundo = consultarManobraUniversal('finalizar');
  assert.ok(segundo);
  assert.equal(segundo.efeitos.includes('efeito adulterado'), false);
  assert.notEqual(segundo.procedimento[0], 'procedimento adulterado');
  assert.equal(consultarManobraUniversal('inexistente'), null);
});
