import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
test('revalidação remove personagens de Mesas que deixaram de estar autorizadas',()=>{
 assert.match(appSource,/removerSnapshotsDeMesasNaoAutorizadas\(sessao\.user\.id, autorizadas\.map/);
 assert.match(cacheSource,/!permitidas\.has\(row\.mesaId\)/);
});
test('logout voluntário limpa snapshots da conta e não existe fila de escrita compartilhada offline',()=>{
 assert.match(appSource,/limparCacheUsuario\(sessao\.user\.id\)/);
 assert.match(sheetSource,/Modo offline: criação de personagens e alterações compartilhadas ficam bloqueadas/);
 assert.match(sheetSource,/leituraSomente\|\|!ficha\|\|!dona/);
 assert.doesNotMatch(cacheSource,/filaOffline|pendenciasCompartilhadas|replayAutomatico/i);
});
test('edição de identidade e equipamento é somente leitura ao usar snapshot local',()=>{
 assert.match(identitySource,/!somenteLeituraOffline/);
 assert.match(equipmentSource,/!somenteLeituraOffline/);
 assert.match(sheetSource,/Ficha em cache local · somente leitura/);
 assert.match(sheetSource,/Modo offline: Perícias de Classe em consulta somente/);
});
test('migration da proteção de convites habilita RLS sem criar política de acesso direto',()=>{
 assert.match(migrationSource,/ALTER TABLE app_private\.convites_mesa ENABLE ROW LEVEL SECURITY/i);
 assert.doesNotMatch(migrationSource,/CREATE POLICY|GRANT\s+(SELECT|INSERT|UPDATE|DELETE)/i);
});
