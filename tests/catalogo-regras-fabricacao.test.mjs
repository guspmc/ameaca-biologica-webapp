import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularDTFabricacaoArmamento, consultarRegraFabricacaoMedicinal, raridadesFabricacao } from '../src/catalogoRegrasFabricacao.ts';

test('fabricação medicinal consolida tempo, Medicina, exceção de Treinamento e falha', () => {
  const regra = consultarRegraFabricacaoMedicinal();
  assert.equal(regra.tempoMinutos, 30);
  assert.equal(regra.teste, 'Medicina');
  assert.equal(regra.dt, 12);
  assert.equal(regra.semTesteSeTreinada, true);
  assert.equal(regra.ingredientesPreservadosNaFalha, true);
  assert.equal(regra.tempoConsumidoNaFalha, true);
  assert.equal(regra.habilidadesPodemReduzirTempo, true);
  assert.equal(regra.habilidadesPodemPermitirPreparoEmMovimento, true);
  assert.match(regra.requisito, /Sala de Descanso ou Kit de Primeiros Socorros/);
});

test('fabricação de armamento usa a maior DT entre raridade e calibre', () => {
  assert.deepEqual(raridadesFabricacao(), ['Comum','Incomum','Raro','Muito Raro','Lendário']);
  assert.equal(calcularDTFabricacaoArmamento('Comum','9mm').dt, 12);
  assert.equal(calcularDTFabricacaoArmamento('Comum','calibre12').dt, 15);
  assert.equal(calcularDTFabricacaoArmamento('Comum','especial').dt, 18);
  assert.equal(calcularDTFabricacaoArmamento('Raro','9mm').dt, 18);
  assert.equal(calcularDTFabricacaoArmamento('Muito Raro','calibre12').dt, 21);
  assert.equal(calcularDTFabricacaoArmamento('Lendário','especial').dt, 24);
  const regra = calcularDTFabricacaoArmamento('Incomum','calibre12');
  assert.equal(regra.tempoMinutos, 30);
  assert.equal(regra.teste, 'AST');
  assert.equal(regra.dt, Math.max(regra.dtRaridade, regra.dtMinimaCalibre));
  assert.match(regra.requisito, /Kit de Ferramentas/);
});

test('fabricação recusa raridade ou calibre desconhecidos', () => {
  assert.throws(() => calcularDTFabricacaoArmamento('secreto','9mm'), /inválido/);
  assert.throws(() => calcularDTFabricacaoArmamento('Comum','magico'), /inválido/);
});
