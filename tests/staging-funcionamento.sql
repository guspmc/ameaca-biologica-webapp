-- SOMENTE apos checkpoint e aplicacao no TESTE; fixtures novas sem email/senha.
begin;
set local statement_timeout='20s';
select set_config('ab.fc_m',gen_random_uuid()::text,true);
select set_config('ab.fc_j',gen_random_uuid()::text,true);
select set_config('ab.fc_t',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.fc_m')::uuid),(current_setting('ab.fc_j')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.fc_t')::uuid,'Fixture funcionamento',current_setting('ab.fc_m')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.fc_t')::uuid,current_setting('ab.fc_j')::uuid,'jogador');
select set_config('request.jwt.claim.sub',current_setting('ab.fc_j'),true);
set local role authenticated;
select set_config('ab.fc_f',public.criar_personagem_rascunho(current_setting('ab.fc_t')::uuid,'Fixture','Agente',2,2,2,1)::text,true);
do $$ declare c jsonb:='{"modo":"manual","preferenciasMisto":{"municao":false,"inventario":true,"duracaoEfeitos":true,"biInfectante":null,"durabilidadeAparar":false}}';
begin
 if public.salvar_funcionamento_rascunho(current_setting('ab.fc_f')::uuid,c,0)<>1 then raise exception 'Versao inesperada';end if;
 if public.salvar_funcionamento_rascunho(current_setting('ab.fc_f')::uuid,c,0)<>1 then raise exception 'Repeticao duplicou';end if;
 if (select configuracao_funcionamento from public.personagens where id=current_setting('ab.fc_f')::uuid)<>c then raise exception 'Preferencias divergentes';end if;
 begin
  update public.personagens set revisao_funcionamento=9 where id=current_setting('ab.fc_f')::uuid;
  raise exception 'Escrita direta aceita';
 exception when insufficient_privilege then null;end;
 begin
  perform public.salvar_funcionamento_rascunho(current_setting('ab.fc_f')::uuid,jsonb_set(c,'{modo}','"automatico"'),0);
  raise exception 'Versao antiga aceita';
 exception when others then if sqlerrm not like '%desatualizada%' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.fc_m'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.personagens where id=current_setting('ab.fc_f')::uuid) then raise exception 'Mestre leu rascunho';end if;
 begin
  perform public.salvar_funcionamento_rascunho(current_setting('ab.fc_f')::uuid,'{}',1);
  raise exception 'Mestre gravou preferencias';
 exception when others then if sqlerrm not like '%negado%' then raise;end if;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform public.salvar_funcionamento_rascunho(current_setting('ab.fc_f')::uuid,'{}',1);
  raise exception 'Anon gravou preferencias';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'funcionamento_smoke_aprovado_com_rollback' resultado;
