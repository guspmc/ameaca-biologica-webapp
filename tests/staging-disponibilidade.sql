-- Fixtures novas sem email/senha; nenhuma Mesa existente e consultada.
begin;
set local statement_timeout='20s';
select set_config('ab.dm_m',gen_random_uuid()::text,true);
select set_config('ab.dm_j',gen_random_uuid()::text,true);
select set_config('ab.dm_t',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.dm_m')::uuid),(current_setting('ab.dm_j')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.dm_t')::uuid,'Fixture disponibilidade',current_setting('ab.dm_m')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.dm_t')::uuid,current_setting('ab.dm_j')::uuid,'jogador');
select set_config('request.jwt.claim.sub',current_setting('ab.dm_m'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.listar_disponibilidade_inicial(current_setting('ab.dm_t')::uuid)) then raise exception 'Disponibilidade automatica';end if;
 perform public.definir_disponibilidade_inicial(current_setting('ab.dm_t')::uuid,'faca',true,false);
 if not exists(select 1 from public.listar_disponibilidade_inicial(current_setting('ab.dm_t')::uuid) where item_id='faca') then raise exception 'Item nao liberado';end if;
 begin
  insert into app_private.disponibilidade_compra_inicial values(current_setting('ab.dm_t')::uuid,'bastao');
  raise exception 'Escrita direta aceita';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.dm_j'),true);
set local role authenticated;
select set_config('ab.dm_f',public.criar_personagem_rascunho(current_setting('ab.dm_t')::uuid,'Fixture','Agente',2,2,2,1)::text,true);
select public.definir_equipamento_rascunho(current_setting('ab.dm_f')::uuid,'C');
select public.salvar_compras_rascunho(current_setting('ab.dm_f')::uuid,'{"faca":1}',0);
do $$ begin
 begin
  perform public.definir_disponibilidade_inicial(current_setting('ab.dm_t')::uuid,'bastao',true,false);
  raise exception 'Jogador configurou';
 exception when others then if sqlerrm not like '%negado%' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.dm_m'),true);
set local role authenticated;
select public.definir_disponibilidade_inicial(current_setting('ab.dm_t')::uuid,'faca',false,true);
reset role;
do $$ begin
 if (select compras_iniciais from public.personagens where id=current_setting('ab.dm_f')::uuid)<>'{"faca":1}'::jsonb then raise exception 'Plano alterado';end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform public.listar_disponibilidade_inicial(current_setting('ab.dm_t')::uuid);
  raise exception 'Anon leu disponibilidade';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'disponibilidade_smoke_aprovado_com_rollback' resultado;
