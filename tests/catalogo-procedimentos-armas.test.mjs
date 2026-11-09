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

test('sacar, guardar e restaurar Durabilidade seguem a regra geral da página 48', () => {
  const procedimento = consultarProcedimentoArma('bastao');
  assert.match(procedimento.foraDeCombate, /Interação Gratuita com Objeto/);
  assert.match(procedimento.foraDeCombate, /duas interações/);
  assert.match(procedimento.foraDeCombate, /30 minutos em Sala de Descanso/);
  assert.match(procedimento.foraDeCombate, /Kit de Ferramentas/);
  assert.match(procedimento.emCombate.join(' '), /reduza 1 a cada uso de Aparar/);
  assert.match(procedimento.emCombate.join(' '), /Ataques e uso comum não gastam Durabilidade/);
});

test('Bear Commander mantém o lançador integrado como sistema separado', () => {
  const procedimento = consultarProcedimentoArma('bear-commander');
  assert.match(procedimento.emCombate.join(' '), /capacidade separada de 1 Cartucho GM 79/);
  assert.match(procedimento.emCombate.join(' '), /reserva de munição própria/);
  assert.match(procedimento.emCombate.join(' '), /recarga por Ação Bônus/);
});

test('armas sem Disparo Único não recebem ataque padrão de um cartucho', () => {
  for (const id of ['gal', 'clatter-carbine', 'chicago-sweeper']) {
    const texto = consultarProcedimentoArma(id).emCombate.join(' ');
    assert.match(texto, /não possui Disparo Único/);
    assert.match(texto, /não pode realizar o Ataque à Distância padrão de um cartucho/);
  }
  assert.doesNotMatch(consultarProcedimentoArma('jmb-hp3').emCombate.join(' '), /não possui Disparo Único/);
});

test('S&W M29 aplica o procedimento específico de Poder de Parada', () => {
  const texto = consultarProcedimentoArma('sw-m29').emCombate.join(' ');
  assert.match(texto, /Poder de Parada/);
  assert.match(texto, /em Acerto Crítico no Ataque/);
  assert.match(texto, /Fortitude DT 15/);
  assert.match(texto, /Atordoado até o fim do próximo turno/);
});
 
test('Hatchet indestrutível não perde Durabilidade ao Aparar', () => {
  const texto = consultarProcedimentoArma('hatchet').emCombate.join(' ');
  assert.match(texto, /Durabilidade: Indestrutível/);
  assert.match(texto, /não perde Durabilidade/);
  assert.doesNotMatch(texto, /reduza 1 a cada uso de Aparar/);
});
 
test('Redemption conserva munição de Rifle, tiro único e uso com uma mão', () => {
  const texto = consultarProcedimentoArma('redemption').emCombate.join(' ');
  assert.match(texto, /Tiro único/);
  assert.match(texto, /usa munição de Rifle/);
  assert.match(texto, /1 mão/);
  assert.match(texto, /Forte Coice narrativo/);
  assert.match(texto, /Recarga: Ação Bônus/);
});
 
test('Coronhada respeita autorização e exceções expressas de cada arma', () => {
  assert.match(consultarProcedimentoArma('riot-gun').emCombate.join(' '), /Coronhada permitida pela ficha/);
  assert.match(consultarProcedimentoArma('hydra').emCombate.join(' '), /não permite Coronhada/);
  assert.match(consultarProcedimentoArma('striker').emCombate.join(' '), /não permite Coronhada/);
  assert.match(consultarProcedimentoArma('tmp').emCombate.join(' '), /não permite Coronhada/);
  assert.match(consultarProcedimentoArma('dragoon').emCombate.join(' '), /somente é permitida se a ficha autorizar explicitamente/);
  assert.match(consultarProcedimentoArma('riot-gun').emCombate.join(' '), /Dano 1d6 \+ FOR/);
});
