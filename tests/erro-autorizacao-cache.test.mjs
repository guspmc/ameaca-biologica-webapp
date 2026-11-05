import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {erroExigeBloqueioCache} from '../src/erroAutorizacaoCache.ts';

test('autorização: 401, 403 e privilégio negado bloqueiam cache; falhas transitórias não',()=>{
 for(const erro of [{status:401},{status:403},{code:'42501'}])assert.equal(erroExigeBloqueioCache(erro),true);
 for(const erro of [{status:0},{status:408},{status:429},{status:500},{code:'PGRST116'},null,'erro'])assert.equal(erroExigeBloqueioCache(erro),false);
});

test('aplicação não exibe cache após erro de autenticação/autorização, inclusive exceção',async()=>{
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/if \(erroExigeBloqueioCache\(error\)\)/);
 assert.match(app,/if \(erroExigeBloqueioCache\(falha\)\)/);
 assert.match(app,/localStorage\.setItem\(chaveBloqueioCache, '1'\)/);
 assert.match(app,/setMesas\(\[\]\); setMesasCacheAtualizadoEm\(null\)/);
});
