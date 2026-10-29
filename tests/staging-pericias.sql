-- SOMENTE ambiente de teste. Cria fixtures isoladas e desfaz tudo no ROLLBACK.
begin;
set local statement_timeout='20s';
select set_config('ab.skill_master',gen_random_uuid()::text,true);
select set_config('ab.skill_player',gen_random_uuid()::text,true);
select set_config('ab.skill_mesa',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.skill_master')::uuid),(current_setting('ab.skill_player')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.skill_mesa')::uuid,'Fixture descartavel Pericias',current_setting('ab.skill_master')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.skill_mesa')::uuid,current_setting('ab.skill_player')::uuid,'jogador');
select set_config('request.jwt.claim.sub',current_setting('ab.skill_player'),true);
set local role authenticated;
select set_config('ab.skill_ficha',public.criar_personagem_rascunho(current_setting('ab.skill_mesa')::uuid,'Fixture Operador','Operador',2,2,2,1)::text,true);
select public.definir_origem_rascunho(current_setting('ab.skill_ficha')::uuid,'Acadêmico','Investigação');
select public.definir_pericias_rascunho(current_setting('ab.skill_ficha')::uuid,'{"Medicina":2,"Luta":1}');
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.skill_ficha')::uuid
    and pontos_pericia_classe='{"Medicina":2,"Luta":1}'::jsonb and pv_atual=14 and bi_atual=0 and estado_ficha='rascunho') then
    raise exception 'Falha na distribuicao ou preservacao de recursos.';
  end if;
  begin
    perform public.definir_pericias_rascunho(current_setting('ab.skill_ficha')::uuid,'{"Medicina":2,"Luta":2}');
    raise exception 'Orcamento excedido foi aceito.';
  exception when others then if sqlerrm not like '%excedem%' then raise; end if; end;
  begin
    perform public.definir_origem_rascunho(current_setting('ab.skill_ficha')::uuid,'Policial','Pontaria');
    raise exception 'Troca de Origem invalidou pontos.';
  exception when others then if sqlerrm not like '%distribuicao vazia%' then raise; end if; end;
  begin
    update public.personagens set pontos_pericia_classe='{}' where id=current_setting('ab.skill_ficha')::uuid;
    raise exception 'Escrita direta indevida.';
  exception when insufficient_privilege then null; end;
end $$;
select public.definir_pericias_rascunho(current_setting('ab.skill_ficha')::uuid,'{}');
select public.definir_origem_rascunho(current_setting('ab.skill_ficha')::uuid,'Amnésico','Medicina','Vontade');
select public.definir_pericias_rascunho(current_setting('ab.skill_ficha')::uuid,'{"Vontade":2,"Luta":1}');
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.skill_master'),true);
set local role authenticated;
do $$ begin
  begin
    perform public.definir_pericias_rascunho(current_setting('ab.skill_ficha')::uuid,'{}');
    raise exception 'Mestre editou Pericias alheias.';
  exception when others then if sqlerrm not like '%acesso negado%' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  begin
    perform public.definir_pericias_rascunho(current_setting('ab.skill_ficha')::uuid,'{}');
    raise exception 'Anon executou RPC.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'pericias_staging_aprovado_com_rollback' as resultado;
