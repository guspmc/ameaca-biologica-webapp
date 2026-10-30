import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DADOS_CLASSES, dadosDaClasse } from '../src/classesFicha.ts';

test('mantém as características oficiais das três Classes', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(DADOS_CLASSES).map(([nome, dados]) => [
      nome,
      { pv: dados.pvPorNivel, bi: dados.biBase, sa: dados.saMaxima, pontos: dados.pontosPericia },
    ])),
    {
      Agente: { pv: '10 + VIG', bi: 8, sa: 'AGI + AST', pontos: 4 },
      Autodidata: { pv: '8 + VIG', bi: 10, sa: 'AGI + AST', pontos: 5 },
      Operador: { pv: '12 + VIG', bi: 6, sa: 'AGI + AST', pontos: 3 },
    },
  );
});

test('expõe proficiências, ramos e itens característicos de cada Classe', () => {
  for (const classe of ['Agente', 'Autodidata', 'Operador']) {
    const dados = dadosDaClasse(classe);
    assert.ok(dados);
    assert.ok(dados.proficiencias.length > 0);
    assert.equal(dados.ramos.length, 3);
    assert.equal(dados.itensCaracteristicos.length, 2);
  }
});

test('não inventa dados para classe ausente ou inválida', () => {
  assert.equal(dadosDaClasse(null), null);
  assert.equal(dadosDaClasse('Médico'), null);
});
