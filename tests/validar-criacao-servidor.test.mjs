import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarCriacaoNoServidor } from '../src/validarCriacaoServidor.ts';

function fichaValida() {
  return {
    classe: 'Agente',
    origem: 'Acadêmico',
    atributos: { forca: 2, agilidade: 2, vigor: 2, astucia: 1 },
    periciaOrigemTreinada: 'Investigação',
    distribuicaoPericias: {
      Acrobacia: 1,
      Furtividade: 1,
      Luta: 1,
      Percepção: 1,
    },
    habilidadeBasica: 'anatomia-de-combate',
    equipamentoInicial: 'A',
  };
}

test('validador compartilhado aceita criação completa e monta inventário no servidor', () => {
  const resultado = validarCriacaoNoServidor('Claire Redfield', fichaValida());
  assert.equal(resultado.valido, true);
  assert.deepEqual(resultado.pendencias, []);
  assert.equal(resultado.inventario.capacidade, 6);
  assert.ok(resultado.inventario.itens.some(item => item.catalogoId === 'sentinel-nine'));
  assert.ok(resultado.inventario.itens.some(item => item.catalogoId === 'gazua-profissional'));
});

test('validador compartilhado rejeita criação incompleta', () => {
  const dados = fichaValida();
  delete dados.origem;
  const resultado = validarCriacaoNoServidor('Claire Redfield', dados);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.pendencias.some(item => item.nome === 'Origem e Treinamento'));
});

test('validador compartilhado rejeita valores derivados manipulados indiretamente por dados inválidos', () => {
  const dados = fichaValida();
  dados.atributos.forca = 9;
  const resultado = validarCriacaoNoServidor('Claire Redfield', dados);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.pendencias.some(item => item.nome === 'Atributos'));
});

test('validador compartilhado rejeita kit incompatível com a classe', () => {
  const dados = fichaValida();
  dados.equipamentoInicial = 'Z';
  const resultado = validarCriacaoNoServidor('Claire Redfield', dados);
  assert.equal(resultado.valido, false);
  assert.ok(resultado.pendencias.some(item => item.nome === 'Equipamento inicial'));
});

test('validador compartilhado não aceita nome inválido', () => {
  const resultado = validarCriacaoNoServidor(' ', fichaValida());
  assert.equal(resultado.valido, false);
  assert.ok(resultado.pendencias.some(item => item.nome === 'Identificação'));
});
