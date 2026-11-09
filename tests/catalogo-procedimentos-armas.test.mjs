import test from 'node:test';
import assert from 'node:assert/strict';
import { listarPerfisArma } from '../src/catalogoArmas.ts';
import { listarPerfisArmasFogo } from '../src/catalogoArmasFogo.ts';
import { catalogoProcedimentosArmasCompleto, consultarProcedimentoArma, listarProcedimentosArmas } from '../src/catalogoProcedimentosArmas.ts';

test('cada arma corpo a corpo e de fogo possui procedimento de combate e fora de combate', () => {
  const total = listarPerfisArma().length + listarPerfisArmasFogo().length;
  assert.equal(listarProcedimentosArmas().length, total);
  assert.equal(catalogoProcedimentosArmasCompleto(), true);
});

test('regras universais de disparo são consolidadas sem conceder modos não existentes', () => {
  assert.match(consultarProcedimentoArma('tmp').emCombate.join(' '), /Disparo Cadenciado/);
  assert.doesNotMatch(consultarProcedimentoArma('jmb-hp3').emCombate.join(' '), /Rajada é uma Manobra/);
  assert.match(consultarProcedimentoArma('gal').emCombate.join(' '), /Rajada, quando concedida/);
  assert.match(consultarProcedimentoArma('w-870').emCombate.join(' '), /Coice/);
  assert.match(consultarProcedimentoArma('w-870').emCombate.join(' '), /Escopetas podem atacar uma categoria além/);
  assert.match(consultarProcedimentoArma('hatchet').emCombate.join(' '), /Durabilidade 0/);
  assert.match(consultarProcedimentoArma('elephant-killer').emCombate.join(' '), /fica Caído/);
});

test('propriedades individuais especiais são preservadas', () => {
  assert.match(consultarProcedimentoArma('motosserra').emCombate.join(' '), /Cada resultado 6/);
  assert.match(consultarProcedimentoArma('punisher').emCombate.join(' '), /Punisher é exceção/);
  assert.match(consultarProcedimentoArma('spark-shot').emCombate.join(' '), /3 Cargas/);
  assert.match(consultarProcedimentoArma('spark-shot').emCombate.join(' '), /Bateria de Alta Capacidade/);
  assert.match(consultarProcedimentoArma('lanca-chamas-quimico').emCombate.join(' '), /10 unidades/);
  assert.match(consultarProcedimentoArma('lanca-chamas-quimico').emCombate.join(' '), /Reabastecer o reservatório exige Movimento/);
  assert.match(consultarProcedimentoArma('rpg-7').emCombate.join(' '), /Morte Instantânea/);
  assert.match(consultarProcedimentoArma('gm-79').emCombate.join(' '), /arma fica vazia e a recarga exige Movimento/);
  assert.match(consultarProcedimentoArma('besta').emCombate.join(' '), /se afastam 1,5 m entre si/);
});

test('consulta devolve cópia e não altera o catálogo', () => {
  const item = consultarProcedimentoArma('hatchet');
  item.emCombate.push('alterado');
  assert.equal(consultarProcedimentoArma('hatchet').emCombate.includes('alterado'), false);
  assert.equal(consultarProcedimentoArma('inexistente'), null);
});
