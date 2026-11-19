import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('Painel compacto não tenta administrar janelas de Reação defensiva', () => {
  assert.doesNotMatch(painel, /avaliarJanelaReacao|registrarReacaoDefensiva|janelaDefensiva|Reações defensivas/);
});

test('Aparar e Esquivar permanecem fora do controle de turnos da Ficha', () => {
  assert.doesNotMatch(painel, /turnoEmAndamento|iniciarTurno|encerrarTurno|JANELA DE 3 SA/);
});
