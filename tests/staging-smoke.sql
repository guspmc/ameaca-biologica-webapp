-- SOMENTE projeto Supabase de teste vazio. Nunca executar em producao.
-- Identidades ficticias nao autenticaveis; nenhuma senha ou e-mail.
-- Tudo, inclusive fixtures auth.users, e desfeito no ROLLBACK final.
begin;
set local statement_timeout = '20s';
do $$ begin
  if exists(select 1 from public.mesas) or exists(select 1 from public.personagens) then
    raise exception 'Teste requer ambiente isolado vazio.';
  end if;
end $$;
select set_config('ab.test_master',gen_random_uuid()::text,true);
select set_config('ab.test_player',gen_random_uuid()::text,true);
select set_config('ab.test_other',gen_random_uuid()::text,true);
select set_config('ab.test_mesa',gen_random_uuid()::text,true);
insert into auth.users(id) values
  (current_setting('ab.test_master')::uuid),
  (current_setting('ab.test_player')::uuid),
  (current_setting('ab.test_other')::uuid);
insert into public.mesas(id,nome,mestre_id) values
  (current_setting('ab.test_mesa')::uuid,'Fixture descartavel',current_setting('ab.test_master')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values
  (current_setting('ab.test_mesa')::uuid,current_setting('ab.test_player')::uuid,'jogador'),
  (current_setting('ab.test_mesa')::uuid,current_setting('ab.test_other')::uuid,'jogador');

select set_config('request.jwt.claim.sub',current_setting('ab.test_player'),true);
set local role authenticated;
select set_config('ab.test_ficha',public.criar_personagem_rascunho(
  current_setting('ab.test_mesa')::uuid,'Fixture principal','Agente',2,2,2,1)::text,true);
select public.definir_origem_rascunho(current_setting('ab.test_ficha')::uuid,'Policial','Pontaria');
select public.definir_origem_rascunho(current_setting('ab.test_ficha')::uuid,'Policial','Pontaria');
do $$ begin
  if not exists(select 1 from public.personagens where id=current_setting('ab.test_ficha')::uuid
    and defesa=14 and pericia_origem_treinada='Pontaria' and estado_ficha='rascunho') then
    raise exception 'Falha em persistencia/bonus repetido de Policial.';
  end if;
end $$;
select public.criar_personagem_rascunho(current_setting('ab.test_mesa')::uuid,'Fixture 2','Autodidata',2,2,2,1);
select public.criar_personagem_rascunho(current_setting('ab.test_mesa')::uuid,'Fixture 3','Operador',2,2,2,1);
do $$ begin
  begin
    perform public.criar_personagem_rascunho(current_setting('ab.test_mesa')::uuid,'Quarta proibida','Agente',2,2,2,1);
    raise exception 'Quarto rascunho aceito indevidamente.';
  exception when others then
    if sqlerrm not like '%tres rascunhos%' then raise; end if;
  end;
  begin
    update public.personagens set origem='Cobaia' where id=current_setting('ab.test_ficha')::uuid;
    raise exception 'Escrita direta aceita indevidamente.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.test_other'),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.personagens) then
    raise exception 'Outro jogador leu rascunho alheio.';
  end if;
  begin
    perform public.definir_origem_rascunho(current_setting('ab.test_ficha')::uuid,'Cobaia','Reflexos');
    raise exception 'RPC alheia aceita indevidamente.';
  exception when others then
    if sqlerrm not like '%acesso negado%' then raise; end if;
  end;
end $$;
select public.criar_personagem_rascunho(current_setting('ab.test_mesa')::uuid,'Outra conta','Agente',2,2,2,1);

reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.test_master'),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.personagens) then
    raise exception 'Mestre leu rascunhos alheios.';
  end if;
end $$;
reset role;
update public.personagens set estado_ficha='completa' where id=current_setting('ab.test_ficha')::uuid;
set local role authenticated;
do $$ declare n integer; begin
  if (select count(*) from public.personagens) <> 1 then
    raise exception 'Mestre nao leu somente a ficha completa.';
  end if;
  update public.personagens set pv_atual=1 where id=current_setting('ab.test_ficha')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Mestre editou recurso alheio.'; end if;
end $$;

reset role;
delete from public.mesa_participantes
where mesa_id=current_setting('ab.test_mesa')::uuid and usuario_id=current_setting('ab.test_player')::uuid;
select set_config('request.jwt.claim.sub',current_setting('ab.test_player'),true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.personagens) then
    raise exception 'Removido manteve leitura.';
  end if;
  begin
    perform public.criar_personagem_rascunho(current_setting('ab.test_mesa')::uuid,'Removido','Agente',2,2,2,1);
    raise exception 'Removido criou ficha.';
  exception when others then
    if sqlerrm not like '%jogadores aprovados%' then raise; end if;
  end;
end $$;

reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  begin
    perform public.definir_origem_rascunho(current_setting('ab.test_ficha')::uuid,'Policial','Pontaria');
    raise exception 'Anon executou RPC.';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select json_build_object('resultado','smoke_staging_aprovado',
  'mesas_apos_rollback',(select count(*) from public.mesas),
  'personagens_apos_rollback',(select count(*) from public.personagens)) resultado;
