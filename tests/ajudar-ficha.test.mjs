import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const painel = await readFile(new URL('../src/PainelAcoesLocal.tsx', import.meta.url), 'utf8');
const ficha = await readFile(new URL('../src/FichaLocal.tsx', import.meta.url), 'utf8');

test('Painel compacto não apresenta o bloco explicativo de Ajudar ou recursos normais por turno', () => {
  assert.doesNotMatch(painel, /Registrar Ajudar|registrarAjudar|Recursos normais/);
  assert.doesNotMatch(painel, /turnoEmAndamento|iniciarTurno|encerrarTurno/);
});

test('Painel de SA recebe apenas os dados necessários para registrar e ajustar o saldo', () => {
  assert.match(ficha, /PainelAcoesLocal dados=\\{dados\\} saAtual=\\{recursosAtuais\\.saAtual\\} saMaximo=\\{sa\\} aoSalvar=\\{aoSalvarRecursos\\}/);
});
