import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {atualizarAutorizacaoOffline,lerMesasOffline,lerPersonagensOffline,salvarPersonagensOffline,limparCacheUsuario} from '../src/offlineCache.ts';
const cacheSource=await readFile(new URL('../src/offlineCache.ts',import.meta.url),'utf8');
const appSource=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const sheetSource=await readFile(new URL('../src/FichasJogador.tsx',import.meta.url),'utf8');
const identitySource=await readFile(new URL('../src/IdentidadeRascunho.tsx',import.meta.url),'utf8');
const equipmentSource=await readFile(new URL('../src/EquipamentoRascunho.tsx',import.meta.url),'utf8');
const migrationSource=await readFile(new URL('../supabase/migrations/20261028122021_rls_convites_mesa.sql',import.meta.url),'utf8');
test('cache local é isolado por usuário, Mesa e personagem',()=>{
 assert.match(cacheSource,/usuarioId \+ ':mesas'/);
 assert.match(cacheSource,/usuarioId \+ ':personagem:' \+ personagem\.mesa_id \+ ':' \+ personagem\.id/);
 assert.match(cacheSource,/mesaId: personagem\.mesa_id/);
 assert.match(cacheSource,/personagemId: personagem\.id/);
 assert.match(cacheSource,/personagem\.jogador_id === usuarioId/);
});
test('snapshot de personagens só é gravado após consulta online autorizada',()=>{
 assert.match(sheetSource,/salvarPersonagensOffline\(usuarioId,lista\)/);
 assert.match(sheetSource,/lerPersonagensOffline<Personagem>\(usuarioId\)/);
 assert.match(cacheSource,/personagens-indice/);
});
test('autorização e remoção de snapshots revogados são atualizadas em conjunto',async()=>{
 const usuario='teste-cache-'+crypto.randomUUID();
 try {
  await atualizarAutorizacaoOffline(usuario,[{id:'mesa-a',nome:'A',mestre_id:usuario,criada_em:'2026-01-01'}]);
  await salvarPersonagensOffline(usuario,[{id:'p-a',mesa_id:'mesa-a',jogador_id:usuario},{id:'p-b',mesa_id:'mesa-b',jogador_id:usuario}]);
  assert.deepEqual((await lerPersonagensOffline(usuario))?.dados.map(p=>p.id),['p-a']);
  await atualizarAutorizacaoOffline(usuario,[]);
  assert.deepEqual((await lerMesasOffline(usuario))?.dados,[]);
  assert.deepEqual((await lerPersonagensOffline(usuario))?.dados,[]);
 } finally { await limparCacheUsuario(usuario); }
});
test('leitura offline filtra snapshots pela última lista autorizada',async()=>{
 const usuario='teste-cache-filtro-'+crypto.randomUUID();
 try {
  await atualizarAutorizacaoOffline(usuario,[{id:'mesa-ok',nome:'OK',mestre_id:usuario,criada_em:'2026-01-01'}]);
  await salvarPersonagensOffline(usuario,[{id:'visivel',mesa_id:'mesa-ok',jogador_id:usuario},{id:'fora',mesa_id:'mesa-revogada',jogador_id:usuario}]);
  assert.deepEqual((await lerPersonagensOffline(usuario))?.dados.map(p=>p.id),['visivel']);
 } finally { await limparCacheUsuario(usuario); }
});
test('revalidação usa refresh atômico e não ignora falha',()=>{
 assert.match(appSource,/atualizarAutorizacaoOffline\(sessao\.user\.id, autorizadas\)/);
 assert.doesNotMatch(appSource,/removerSnapshotsDeMesasNaoAutorizadas|salvarMesasOffline\(sessao\.user\.id, autorizadas\)\.catch/);
});
test('logout voluntário limpa snapshots e não existe fila de escrita compartilhada offline',()=>{
 assert.match(appSource,/limparCacheUsuario\(sessao\.user\.id\)/);
 assert.match(sheetSource,/Modo offline: criação de personagens e alterações compartilhadas ficam bloqueadas/);
 assert.match(sheetSource,/leituraSomente\|\|!ficha\|\|!dona/);
 assert.doesNotMatch(cacheSource,/filaOffline|pendenciasCompartilhadas|replayAutomatico/i);
});
test('edição de identidade e equipamento é somente leitura ao usar snapshot local',()=>{
 assert.match(identitySource,/!somenteLeituraOffline/); assert.match(equipmentSource,/!somenteLeituraOffline/);
 assert.match(sheetSource,/Ficha em cache local · somente leitura/); assert.match(sheetSource,/Modo offline · ficha somente leitura/);
 assert.match(sheetSource,/Modo offline: Perícias de Classe em consulta somente/);
});
test('migration da proteção de convites habilita RLS sem criar política de acesso direto',()=>{
 assert.match(migrationSource,/ALTER TABLE app_private\.convites_mesa ENABLE ROW LEVEL SECURITY/i);
 assert.doesNotMatch(migrationSource,/CREATE POLICY|GRANT\s+(SELECT|INSERT|UPDATE|DELETE)/i);
});
