import test from 'node:test';
import assert from 'node:assert/strict';
import {
  beneficioAmnesicoInicial, registrarVislumbresDoPassado, renovarSessaoAmnesico,
  consumirVantagemAmnesico, beneficioMilitarInicial, registrarMorteComArmaDeFogo,
  consumirVantagemMilitar,
} from '../src/beneficiosOrigensContextuais.ts';
import { readFile } from 'node:fs/promises';

test('Amnésico exige local conhecido e tentativa AST DT 10; informação útil gera Vantagem pendente', () => {
  const inicial = beneficioAmnesicoInicial();
  assert.throws(() => registrarVislumbresDoPassado(inicial, {
    localConhecido: false, tentativaRealizada: true, informacaoUtil: true,
  }), /local conhecido/);
  const usado = registrarVislumbresDoPassado(inicial, {
    localConhecido: true, tentativaRealizada: true, informacaoUtil: true,
  });
  assert.equal(usado.usadoNaSessao, true);
  assert.equal(usado.vantagemSobrevivenciaPendente, true);
  assert.throws(() => registrarVislumbresDoPassado(usado, {
    localConhecido: true, tentativaRealizada: true, informacaoUtil: true,
  }), /já foi usado/);
  const novaSessao = renovarSessaoAmnesico(usado);
  assert.equal(novaSessao.usadoNaSessao, false);
  assert.equal(novaSessao.vantagemSobrevivenciaPendente, true);
  assert.equal(consumirVantagemAmnesico(novaSessao).vantagemSobrevivenciaPendente, false);
});

test('Amnésico consome a tentativa quando a informação não é útil, sem conceder Vantagem', () => {
  const usado = registrarVislumbresDoPassado(beneficioAmnesicoInicial(), {
    localConhecido: true, tentativaRealizada: true, informacaoUtil: false,
  });
  assert.equal(usado.usadoNaSessao, true);
  assert.equal(usado.vantagemSobrevivenciaPendente, false);
});

test('Militar exige morte causada por arma de fogo e consome Vantagem no primeiro Ataque do próximo turno', () => {
  const inicial = beneficioMilitarInicial();
  assert.throws(() => registrarMorteComArmaDeFogo(inicial, { inimigoMorto: true, armaDeFogo: false }), /arma de fogo/);
  const pendente = registrarMorteComArmaDeFogo(inicial, { inimigoMorto: true, armaDeFogo: true });
  assert.equal(pendente.vantagemAtaqueFogoPendente, true);
  assert.throws(() => consumirVantagemMilitar(pendente, false), /primeiro Ataque/);
  assert.equal(consumirVantagemMilitar(pendente, true).vantagemAtaqueFogoPendente, false);
});

test('benefícios Amnésico e Militar estão integrados à Ficha Offline', async () => {
  const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');
  const componente = await readFile(new URL('../src/BeneficiosOrigemContextuaisLocal.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /BeneficiosOrigemContextuaisLocal/);
  assert.match(componente, /Vislumbres do Passado/);
  assert.match(componente, /AST DT 10/);
  assert.match(componente, /Vantagem pendente no próximo Teste relacionado de Sobrevivência/);
  assert.match(componente, /primeiro Ataque com arma de fogo do próximo turno/);
  assert.match(componente, /aoSalvar\(patch\)/);
});
