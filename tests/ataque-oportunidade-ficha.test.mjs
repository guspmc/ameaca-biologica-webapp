import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');

test('Painel compacto não apresenta painel de Ataque de Oportunidade ou contagem de Reações', () => {
  assert.doesNotMatch(painel, /Ataque de Oportunidade|avaliarAtaqueOportunidade|registrarAtaqueOportunidade/);
  assert.doesNotMatch(painel, /turnoEmAndamento|janela >= 3/);
});

test('SA de manobras é registrado por custo e pode ser corrigido manualmente', () => {
  assert.match(painel, /nome: 'Contra-Ataque', custo: 1/);
  assert.match(painel, /Gastar · \\{manobra\\.custo\\} SA/);
  assert.match(painel, /−1 SA/);
  assert.match(painel, /\+1 SA/);
});
