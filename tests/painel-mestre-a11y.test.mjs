import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Painel do Mestre mantém referências ARIA dos três destinos principais',async()=>{
 const fonte=await readFile(new URL('../src/PainelMestreLocal.tsx',import.meta.url),'utf8');
 const ids=new Set([...fonte.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]));
 const rotulos=[...fonte.matchAll(/aria-labelledby="([^"]+)"/g)].map(m=>m[1]);
 const controles=[...fonte.matchAll(/aria-controls="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual([...new Set(rotulos)].sort(),['painel-mestre-tab-arquivos','painel-mestre-tab-encontros','painel-mestre-tab-mesa']);
 assert.deepEqual([...new Set(controles)].sort(),['painel-mestre-panel-arquivos','painel-mestre-panel-encontros','painel-mestre-panel-mesa']);
 for(const id of [...rotulos,...controles])assert.ok(ids.has(id),'Referência ARIA sem destino: '+id);
});
