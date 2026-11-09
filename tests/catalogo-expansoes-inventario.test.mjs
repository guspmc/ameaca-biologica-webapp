import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularBonusExpansaoInventario,
  consultarExpansaoInventario,
  listarExpansoesInventario,
} from '../src/catalogoExpansoesInventario.ts';

test('catálogo reproduz as duas expansões e seus preços oficiais', () => {
  assert.deepEqual(
    listarExpansoesInventario().map(item => [item.id, item.nome, item.espacosAdicionais, item.precoMoedasAntigas]),
    [['pochete', 'Pochete', 2, 3], ['bolsa', 'Bolsa', 3, 4]],
  );
  for (const item of listarExpansoesInventario()) {
    assert.equal(item.permanente, true);
    assert.equal(item.acumulaComOutraExpansao, false);
    assert.equal(item.referencia, 'Arquivo do Jogador v1.0, pp. 48 e 73');
  }
});

test('a capacidade adicional considera apenas o maior benefício, sem acumular Bolsa e Pochete', () => {
  assert.equal(calcularBonusExpansaoInventario([]), 0);
  assert.equal(calcularBonusExpansaoInventario(['pochete']), 2);
  assert.equal(calcularBonusExpansaoInventario(['bolsa']), 3);
  assert.equal(calcularBonusExpansaoInventario(['pochete', 'bolsa']), 3);
  assert.equal(calcularBonusExpansaoInventario(['bolsa', 'pochete']), 3);
  assert.equal(calcularBonusExpansaoInventario(['pochete', 'pochete']), 2);
});

test('consulta retorna cópia e não permite mutação do catálogo interno', () => {
  const item = consultarExpansaoInventario('bolsa');
  item.espacosAdicionais = 99;
  assert.equal(consultarExpansaoInventario('bolsa').espacosAdicionais, 3);
  const lista = listarExpansoesInventario();
  lista[0].espacosAdicionais = 99;
  assert.equal(consultarExpansaoInventario('pochete').espacosAdicionais, 2);
  assert.equal(consultarExpansaoInventario('inexistente'), null);
});

test('identificadores desconhecidos ou malformados são recusados', () => {
  assert.throws(() => calcularBonusExpansaoInventario(['bolsa', 'intruso']), /desconhecida/);
  assert.throws(() => calcularBonusExpansaoInventario([null]), /Identificador/);
  assert.throws(() => calcularBonusExpansaoInventario(null), /Lista/);
});
