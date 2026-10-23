-- SOMENTE apos autorizacao e aplicacao da estrutura no projeto de teste.
-- Fixtures novas sem email/senha; transacao integralmente desfeita.
begin;
set local statement_timeout='20s';
select set_config('ab.cp_m',gen_random_uuid()::text,true);
select set_config('ab.cp_p',gen_random_uuid()::text,true);
select set_config('ab.cp_t',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('ab.cp_m')::uuid),(current_setting('ab.cp_p')::uuid);
insert into public.mesas(id,nome,mestre_id) values(current_setting('ab.cp_t')::uuid,'Fixture compras',current_setting('ab.cp_m')::uuid);
insert into public.mesa_participantes(mesa_id,usuario_id,papel) values(current_setting('ab.cp_t')::uuid,current_setting('ab.cp_p')::uuid,'jogador');
insert into app_private.disponibilidade_compra_inicial(mesa_id,item_id) values(current_setting('ab.cp_t')::uuid,'faca'),(current_setting('ab.cp_t')::uuid,'municao-9mm');
select set_config('request.jwt.claim.sub',current_setting('ab.cp_p'),true);
set local role authenticated;
select set_config('ab.cp_f',public.criar_personagem_rascunho(current_setting('ab.cp_t')::uuid,'Fixture compras','Operador',0,3,3,1)::text,true);
select public.definir_equipamento_rascunho(current_setting('ab.cp_f')::uuid,'C');
select public.salvar_compras_rascunho(current_setting('ab.cp_f')::uuid,'{"municao-9mm":2}',0);
do $$ begin
 if public.salvar_compras_rascunho(current_setting('ab.cp_f')::uuid,'{"municao-9mm":2}',0)<>1 then raise exception 'Repeticao duplicou.'; end if;
 begin
  perform public.salvar_compras_rascunho(current_setting('ab.cp_f')::uuid,'{"faca":1}',0);
  raise exception 'Versao antiga aceita.';
 exception when others then if sqlerrm not like '%desatualizada%' then raise; end if; end;
 begin
  perform public.salvar_compras_rascunho(current_setting('ab.cp_f')::uuid,'{"bastao":1}',1);
  raise exception 'Item indisponivel aceito.';
 exception when others then if sqlerrm not like '%indisponivel%' then raise; end if; end;
 begin
  perform public.definir_equipamento_rascunho(current_setting('ab.cp_f')::uuid,'B');
  raise exception 'Compras descartadas silenciosamente.';
 exception when others then if sqlerrm not like '%compras vazias%' then raise; end if; end;
 begin
  update public.personagens set revisao_compras=9 where id=current_setting('ab.cp_f')::uuid;
  raise exception 'Escrita direta aceita.';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ab.cp_m'),true);
set local role authenticated;
do $$ begin
 begin
  perform public.salvar_compras_rascunho(current_setting('ab.cp_f')::uuid,'{}',1);
  raise exception 'Mestre editou compras.';
 exception when others then if sqlerrm not like '%acesso negado%' then raise; end if; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform public.salvar_compras_rascunho(current_setting('ab.cp_f')::uuid,'{}',1);
  raise exception 'Anon executou compras.';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'compras_smoke_aprovado_com_rollback' resultado;
