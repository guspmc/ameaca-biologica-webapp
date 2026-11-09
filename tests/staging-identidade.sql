-- SOMENTE ambiente de teste. Fixtures ficticias, sem email/senha. ROLLBACK integral.
begin;
set local statement_timeout='20s';
select set_config('ab.id_m',gen_random_uuid()::text,true);
select set_config('ab.id_p',gen_random_uuid()::text,true);
select set_config('ab.id_t',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.id_m')::uuid),(current_setting('ab.id_p')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.id_t')::uuid,'Fixture identidade',current_setting('ab.id_m')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.id_t')::uuid,current_setting('ab.id_p')::uuid,'jogador');
select set_config('request.jwt.claim.sub',current_setting('ab.id_p'),true);
set local role authenticated;
select set_config('ab.id_f',public.criar_personagem_rascunho(current_setting('ab.id_t')::uuid,'Fixture identidade','Agente',2,2,2,1)::text,true);
select public.definir_identidade_rascunho(current_setting('ab.id_f')::uuid,'  Nome ficticio  ',jsonb_build_object('ocupacao','Medica','historia',E'Linha 1\nLinha 2'));
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.id_f')::uuid and nome='Nome ficticio' and identidade->>'historia'=E'Linha 1\nLinha 2' and pv_atual=12 and estado_ficha='rascunho') then raise exception 'Identidade ou recursos incorretos.'; end if;
  begin
    perform public.definir_identidade_rascunho(current_setting('ab.id_f')::uuid,'Nome ficticio','{"pv_atual":"100"}');
    raise exception 'Chave mecanica aceita.';
  exception when others then if sqlerrm not like '%invalido%' then raise; end if; end;
  begin
    update public.personagens set identidade='{}' where id=current_setting('ab.id_f')::uuid;
    raise exception 'Escrita direta aceita.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.id_m'),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.personagens where id=current_setting('ab.id_f')::uuid) then raise exception 'Mestre leu rascunho.'; end if;
  begin
    perform public.definir_identidade_rascunho(current_setting('ab.id_f')::uuid,'Alheio','{}');
    raise exception 'Mestre editou identidade.';
  exception when others then if sqlerrm not like '%acesso negado%' then raise; end if; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.definir_identidade_rascunho(current_setting('ab.id_f')::uuid,'Anon','{}');
    raise exception 'Anon editou identidade.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'identidade_staging_aprovada_com_rollback' resultado;
