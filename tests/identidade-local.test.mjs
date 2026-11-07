import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ler = async caminho => readFile(new URL('../src/' + caminho, import.meta.url), 'utf8');

test('a ficha offline usa o gênero declarado apenas para flexões previstas', async () => {
  const ficha = await ler('FichaLocal.tsx');
  assert.match(ficha, /import \{ classePersonagem, termoPersonagem \} from '.\/textoPersonagem'/);
  assert.match(ficha, /classePersonagem\(classe \|\| null, genero\)/);
  assert.match(ficha, /termo\('REGISTRO DO SOBREVIVENTE'\)/);
  assert.match(ficha, /termo\(origem \|\| 'Pendente'\)/);
});

test('o editor narrativo mantém os campos opcionais e envia nome e identidade no mesmo salvamento', async () => {
  const editor = await ler('IdentidadeLocal.tsx');
  const ficha = await ler('FichaLocal.tsx');
  const app = await ler('FichaOfflineApp.tsx');
  const storage = await ler('persistenciaFicha.ts');
  for (const field of ['idade','genero','ocupacao','apelido','afiliacao','aparencia','personalidade','objetivo','medo','lacos','historia']) {
    assert.ok(editor.includes("id: '" + field + "'"), 'Campo ausente: ' + field);
  }
  assert.match(editor, /const valor = \{ nome: nome\.trim\(\), identidade \}/);
  assert.match(editor, /useSalvamentoEditorLocal/);
  assert.match(editor, /aoSalvar,/);
  assert.match(ficha, /<IdentidadeLocal/);
  const tag = ficha.match(/<IdentidadeLocal\b[\s\S]*?\/>/)?.[0] ?? '';
  assert.ok(tag);
  assert.doesNotMatch(tag, /\bkey=/);
  assert.match(ui, /useEffect/);
  assert.match(app, /aoSalvarIdentidade=\{\(\{ nome, identidade \}\) => salvarDados\(\{ identidade \}, nome\)\}/);
  assert.match(storage, /nome: nomeAtualizado\?\.trim\(\) \|\| atual\.nome/);
});

test('a identidade é armazenada nos dados locais sem alterar o esquema do IndexedDB', async () => {
  const storage = await ler('persistenciaFicha.ts');
  assert.match(storage, /dados: Record<string, unknown>/);
  assert.doesNotMatch(storage, /identidade:/);
});
