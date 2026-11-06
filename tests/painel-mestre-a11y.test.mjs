import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Painel do Mestre mantém referências ARIA dos destinos principais e das ferramentas de encontros',async()=>{
 const fonte=await readFile(new URL('../src/PainelMestreLocal.tsx',import.meta.url),'utf8');
 const ids=new Set([...fonte.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const rotulos=[...fonte.matchAll(/aria-labelledby="([^"]+)"/g)].map(m=>m[1]);
 const controles=[...fonte.matchAll(/aria-controls="([^"]+)"/g)].map(m=>m[1]);
 assert.match(fonte,/id=\{'painel-mestre-encontros-tab-' \+ id\}/);
 assert.deepEqual([...new Set(rotulos)].sort(),[
  'painel-mestre-encontros-tab-ao-vivo',
  'painel-mestre-encontros-tab-catalogo',
  'painel-mestre-encontros-tab-gerador',
  'painel-mestre-encontros-tab-perseguicao',
  'painel-mestre-encontros-tab-preparados',
  'painel-mestre-arquivos-tab-anotacoes',
  'painel-mestre-arquivos-tab-diario',
  'painel-mestre-arquivos-tab-documentos',
  'painel-mestre-arquivos-tab-mesa',
  'painel-mestre-arquivos-tab-narracao',
  'painel-mestre-tab-arquivos',
  'painel-mestre-tab-encontros',
  'painel-mestre-tab-mesa'
 ].sort());
 assert.deepEqual([...new Set(controles)].sort(),[
  'painel-mestre-panel-arquivos',
  'painel-mestre-panel-encontros',
  'painel-mestre-panel-mesa'
 ].sort());
 for(const id of [...rotulos,...controles]) {
  if(id.startsWith('painel-mestre-encontros-tab-')) {
   assert.ok(['ao-vivo','preparados','catalogo','gerador','perseguicao'].includes(id.slice('painel-mestre-encontros-tab-'.length)),'Rótulo de ferramenta desconhecido: '+id);
  } else if(id.startsWith('painel-mestre-arquivos-tab-')) {
   assert.ok(['documentos','anotacoes','diario','narracao','mesa'].includes(id.slice('painel-mestre-arquivos-tab-'.length)),'Categoria de arquivo desconhecida: '+id);
  } else assert.ok(ids.has(id),'Referência ARIA sem destino: '+id);
 }
 const paineis=[...fonte.matchAll(/id="(painel-mestre-encontros-panel-[^"]+)"/g)].map(m=>m[1]);
 const paineisArquivos=[...fonte.matchAll(/id="(painel-mestre-arquivos-panel-[^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(paineisArquivos.sort(),[
  'painel-mestre-arquivos-panel-anotacoes',
  'painel-mestre-arquivos-panel-diario',
  'painel-mestre-arquivos-panel-documentos',
  'painel-mestre-arquivos-panel-mesa',
  'painel-mestre-arquivos-panel-narracao'
 ].sort());
 assert.deepEqual(paineis.sort(),[
  'painel-mestre-encontros-panel-ao-vivo',
  'painel-mestre-encontros-panel-catalogo',
  'painel-mestre-encontros-panel-gerador',
  'painel-mestre-encontros-panel-perseguicao',
  'painel-mestre-encontros-panel-preparados'
 ].sort());
});
