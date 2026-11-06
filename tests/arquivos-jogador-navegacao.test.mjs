import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Arquivos do Jogador restaura somente a categoria válida e separada por Mesa',async()=>{
 const fonte=await readFile(new URL('../src/ArquivosJogadorLocal.tsx',import.meta.url),'utf8');
 assert.ok(fonte.includes("'ameaca-biologica:arquivos-jogador:aba:v1:' + mesaId"));
 assert.match(fonte,/salva === 'mapa' \|\| salva === 'anotacoes' \? salva : 'documentos'/);
 assert.ok(fonte.includes("sessionStorage.setItem(chaveAba, proxima)"));
 assert.match(fonte,/id=\\{'arquivos-jogador-tab-' \\+ id\\}/);
 assert.match(fonte,/id=\\{'arquivos-jogador-panel-' \\+ aba\\}/);
 assert.match(fonte,/aria-labelledby=\\{'arquivos-jogador-tab-' \\+ aba\\}/);
 assert.ok(fonte.includes('CONSULTA, PUBLICAÇÃO E SINCRONIZAÇÃO AINDA NÃO INTEGRADAS'));
});
