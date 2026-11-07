import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/conexao.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { escolherConexao, URL_PRODUCAO } = await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const chave = 'sb_publishable_fixture_publica';
const url = 'https://projeto-ficticio.supabase.co';

test('teste usa apenas configuracao explicita e ignora producao guardada', () => {
  assert.deepEqual(escolherConexao({teste:true,url,chave,guardada:JSON.stringify({url:URL_PRODUCAO,chave})}),{url,chave});
});
test('teste falha fechado sem URL, sem chave, com segredo ou com projeto de producao', () => {
  for (const config of [{chave},{url},{url,chave:'sb_secret_fixture'},{url:URL_PRODUCAO,chave},{url:URL_PRODUCAO+'/',chave},{url:'javascript:alert(1)',chave}]) {
    assert.equal(escolherConexao({teste:true,...config}),null);
  }
});
test('modo normal preserva conexao guardada valida e usa ambiente se armazenamento invalido', () => {
  assert.deepEqual(escolherConexao({teste:false,url,chave,guardada:JSON.stringify({url:URL_PRODUCAO,chave})}),{url:URL_PRODUCAO,chave});
  for (const guardada of ['{invalido','{"url":42,"chave":true}','null']) {
    assert.deepEqual(escolherConexao({teste:false,url,chave,guardada}),{url,chave});
  }
});
