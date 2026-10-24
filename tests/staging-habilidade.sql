-- Somente projeto de teste: fixtures isoladas, sem senha/email, desfeitas por ROLLBACK.
begin;
set local statement_timeout='20s';
select set_config('ab.h_master',gen_random_uuid()::text,true);
select set_config('ab.h_player',gen_random_uuid()::text,true);
select set_config('ab.h_mesa',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.h_master')::uuid),(current_setting('ab.h_player')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.h_mesa')::uuid,'Fixture descartavel Habilidade',current_setting('ab.h_master')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.h_mesa')::uuid,current_setting('ab.h_player')::uuid,'jogador');
select set_config('request.jwt.claim.sub',current_setting('ab.h_player'),true);
set local role authenticated;
select set_config('ab.h_ficha',public.criar_personagem_rascunho(current_setting('ab.h_mesa')::uuid,'Fixture Operador','Operador',2,2,2,1)::text,true);
update public.personagens set pv_atual=9 where id=current_setting('ab.h_ficha')::uuid;
select public.definir_origem_rascunho(current_setting('ab.h_ficha')::uuid,'Cobaia','Reflexos');
select public.definir_habilidade_rascunho(current_setting('ab.h_ficha')::uuid,'parrudo');
select public.definir_habilidade_rascunho(current_setting('ab.h_ficha')::uuid,'parrudo');
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.h_ficha')::uuid
    and habilidade_basica='parrudo' and pv_maximo=19 and pv_atual=14 and bi_maximo=12 and bi_atual=0) then
    raise exception 'Parrudo incorreto ou acumulado.';
  end if;
end $$;
update public.personagens set bi_atual=10 where id=current_setting('ab.h_ficha')::uuid;
select public.definir_origem_rascunho(current_setting('ab.h_ficha')::uuid,'Policial','Pontaria');
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.h_ficha')::uuid and bi_maximo=10 and bi_atual=10) then
    raise exception 'Troca de Origem perdeu bonus de Parrudo.';
  end if;
  begin
    perform public.definir_habilidade_rascunho(current_setting('ab.h_ficha')::uuid,'armeiro');
    raise exception 'Troca descartou BI.';
  exception when others then if sqlerrm not like '%BI atual excede%' then raise; end if; end;
  begin
    update public.personagens set habilidade_basica='armeiro' where id=current_setting('ab.h_ficha')::uuid;
    raise exception 'Escrita direta indevida.';
  exception when insufficient_privilege then null; end;
end $$;
update public.personagens set bi_atual=0 where id=current_setting('ab.h_ficha')::uuid;
select public.definir_habilidade_rascunho(current_setting('ab.h_ficha')::uuid,'armeiro');
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.h_ficha')::uuid
    and habilidade_basica='armeiro' and pv_maximo=14 and pv_atual=9 and bi_maximo=7) then
    raise exception 'Troca nao preservou dano.';
  end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.h_master'),true);
set local role authenticated;
do $$ begin
  begin
    perform public.definir_habilidade_rascunho(current_setting('ab.h_ficha')::uuid,'parrudo');
    raise exception 'Mestre editou ficha.';
  exception when others then if sqlerrm not like '%acesso negado%' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  begin
    perform public.definir_habilidade_rascunho(current_setting('ab.h_ficha')::uuid,'parrudo');
    raise exception 'Anon executou RPC.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'habilidade_staging_aprovada_com_rollback' resultado;
