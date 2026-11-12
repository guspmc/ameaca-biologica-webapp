import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/FichaOfflineApp.tsx', import.meta.url), 'utf8');
const editores = await Promise.all([
  readFile(new URL('../src/EditorCaracteristicasLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/EditorAtributosPericiasLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/IdentidadeLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/EditorInventarioLocal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/FuncionamentoFichaLocal.tsx', import.meta.url), 'utf8'),
]);

test('recarregar ficha descarta o estado interno dos editores junto com as pendências externas', () => {
  assert.match(app, /const \[revisaoMontagemFicha, setRevisaoMontagemFicha\] = useState\(0\)/);
  assert.match(app, /if \(!atualizada\) \{/);
  assert.match(app, /await filaGravacao\.current\.aguardar\(\);[\s\S]*?const atualizada = await obterPersonagem\(atual\.id\)/);
  assert.match(app, /setRevisaoMontagemFicha\(revisao => revisao \+ 1\)/);
  assert.match(app, /key=\{\x60\$\{selecionado\.id\}:\$\{revisaoMontagemFicha\}\x60\}/);
  assert.match(app, /camposPendentesRef\.current\.clear\(\);[\s\S]*?secoesNaoSalvasRef\.current\.clear\(\);[\s\S]*?setRevisaoMontagemFicha/);
});

test('editores preservam rascunhos sujos por conta própria e, por isso, precisam ser remontados na recarga explícita', () => {
  for (const editor of editores) assert.match(editor, /if \(sujo\) return|if \(!sujo\)/);
});
