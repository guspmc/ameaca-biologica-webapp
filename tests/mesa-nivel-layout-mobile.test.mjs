import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('hub de Mesas exibe o nível máximo recebido do servidor', async () => {
  const fonte = await readFile(new URL('../src/ConexaoServidorLocal.tsx', import.meta.url), 'utf8');
  assert.match(fonte, /<strong>\{mesa\.name\} · Nível \{mesa\.maxLevel\}<\/strong>/);
});

test('Ficha móvel ocupa a altura útil da viewport e mantém o conteúdo expansível', async () => {
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const bloco = css.slice(css.lastIndexOf('/* Em telas móveis, a Ficha ocupa toda a área útil disponível'));
  assert.match(bloco, /@media\s*\(max-width:\s*760px\),\s*\(max-height:\s*560px\)/);
  assert.match(bloco, /\.ficha-local-fundo\s*\{[^}]*height:\s*100dvh/);
  assert.match(bloco, /\.ficha-local\s*\{[^}]*height:\s*100dvh[^}]*max-height:\s*100dvh/);
  assert.match(bloco, /\.ficha-local-corpo\s*\{[^}]*flex:\s*1[^}]*min-height:\s*0/);
});

test('Painel do Mestre mantém rolagem própria no conteúdo e na barra lateral', async () => {
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const bloco = css.slice(css.lastIndexOf('/* Rolagem independente do conteúdo do Terminal'));
  assert.match(bloco, /\.painel-mestre-shell\.servidor-local-controle-mesa\s*\{[^}]*overflow:\s*hidden/);
  assert.match(bloco, /\.painel-mestre-main\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(bloco, /\.painel-mestre-masthead\s*\{[^}]*flex:\s*none/);
  assert.match(bloco, /\.painel-mestre-sidebar\s*\{[^}]*overflow-y:\s*auto/);
});
