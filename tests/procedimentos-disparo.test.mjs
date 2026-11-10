import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarModosDisparoArmaFogo } from '../src/procedimentosDisparoArmas.ts';
import { consultarPerfilArmaFogo } from '../src/catalogoArmasFogo.ts';

test('Disparo Cadenciado respeita compatibilidade e custo especial da Matilda', () => {
  const matilda = consultarPerfilArmaFogo('matilda');
  assert.equal(consultarModosDisparoArmaFogo(matilda).cadenciado, false);
  assert.equal(consultarModosDisparoArmaFogo(matilda, true).cartuchosCadenciado, 3);
  assert.equal(consultarModosDisparoArmaFogo(matilda, true).cadenciado, true);
  assert.equal(consultarModosDisparoArmaFogo(consultarPerfilArmaFogo('tmp')).cartuchosCadenciado, 5);
});

test('Rajada só aparece para perfis que concedem a propriedade', () => {
  assert.equal(consultarModosDisparoArmaFogo(consultarPerfilArmaFogo('gal')).rajada, true);
  assert.equal(consultarModosDisparoArmaFogo(consultarPerfilArmaFogo('chicago-sweeper')).disparoUnico, false);
  assert.equal(consultarModosDisparoArmaFogo(consultarPerfilArmaFogo('jmb-hp3')).rajada, false);
});

test('Perfuração diferencia a exceção da Punisher', () => {
  const punisher = consultarModosDisparoArmaFogo(consultarPerfilArmaFogo('punisher')).perfuracao;
  const svd = consultarModosDisparoArmaFogo(consultarPerfilArmaFogo('svd')).perfuracao;
  assert.match(punisher, /1 alvo adicional de tamanho Médio ou menor/);
  assert.match(punisher, /não perde Dados de Dano/);
  assert.match(svd, /remova 1 Dado de Dano/);
  assert.match(svd, /não some AGI ao Dano/);
});
