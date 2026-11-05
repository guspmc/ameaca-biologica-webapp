import {test} from 'node:test';
import assert from 'node:assert/strict';
import {A,setup,criar,pedido,assertVazio} from './helpers/ciclo-fixture.mjs';

test('ativação integrada faz rollback completo se a materialização falhar',async()=>{
 const db=await setup({integrada:true});
 try{
  const id=await criar(db,A,'Agente','C');
  const args=await pedido(db,id);
  await db.exec(`
   create function app_private.teste_falha_materializacao()
   returns trigger language plpgsql as $$
   begin
    raise exception 'falha de teste durante materializacao';
   end $$;
   create trigger teste_falha_materializacao
   before insert on app_private.inventario_instancias
   for each row execute function app_private.teste_falha_materializacao();
  `);
  await assert.rejects(
   db.query('select public.ativar_personagem($1,$2,$3,$4)',args),
   /Resultado indisponivel|Resultado indisponível|error:/
  );
  await assertVazio(db,id);
 }finally{await db.close();}
});
