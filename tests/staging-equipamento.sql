-- SOMENTE teste. Fixtures isoladas sem email/senha. Tudo desfeito no ROLLBACK.
begin;
set local statement_timeout='20s';
select set_config('ab.eq_m',gen_random_uuid()::text,true);
select set_config('ab.eq_p',gen_random_uuid()::text,true);
select set_config('ab.eq_t',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.eq_m')::uuid),(current_setting('ab.eq_p')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.eq_t')::uuid,'Fixture equipamento',current_setting('ab.eq_m')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.eq_t')::uuid,current_setting('ab.eq_p')::uuid,'jogador');
select set_config('request.jwt.claim.sub',current_setting('ab.eq_p'),true);
set local role authenticated;
select set_config('ab.eq_f',public.criar_personagem_rascunho(current_setting('ab.eq_t')::uuid,'Fixture Operador','Operador',0,3,3,1)::text,true);
select public.definir_equipamento_rascunho(current_setting('ab.eq_f')::uuid,'B');
do $$ begin
  begin
    perform public.definir_equipamento_rascunho(current_setting('ab.eq_f')::uuid,'A');
    raise exception 'Kit acima da capacidade aceito.';
  exception when others then if sqlerrm not like '%capacidade%' then raise; end if; end;
  begin
    update public.personagens set equipamento_inicial='C' where id=current_setting('ab.eq_f')::uuid;
    raise exception 'Escrita direta aceita.';
  exception when insufficient_privilege then null; end;
end $$;
select public.definir_origem_rascunho(current_setting('ab.eq_f')::uuid,'Mochileiro','Atletismo');
select public.definir_equipamento_rascunho(current_setting('ab.eq_f')::uuid,'A');
select public.definir_equipamento_rascunho(current_setting('ab.eq_f')::uuid,'A');
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.eq_f')::uuid and equipamento_inicial='A' and pv_maximo=15 and pv_atual=15 and defesa=13) then raise exception 'Escolha ou recursos incorretos.'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.eq_m'),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.personagens where id=current_setting('ab.eq_f')::uuid) then raise exception 'Mestre leu rascunho.'; end if;
  begin
    perform public.definir_equipamento_rascunho(current_setting('ab.eq_f')::uuid,'C');
    raise exception 'Mestre editou kit.';
  exception when others then if sqlerrm not like '%acesso negado%' then raise; end if; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.definir_equipamento_rascunho(current_setting('ab.eq_f')::uuid,'C');
    raise exception 'Anon editou kit.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'equipamento_staging_aprovado_com_rollback' resultado;
