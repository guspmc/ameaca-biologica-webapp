-- PROPOSTA LOCAL. Requer ativacao/resumo; sem aplicacao remota autorizada.
-- Escopo: contexto Padrao nivel 1 e disponibilidade de FINALIZACAO, nao encerrar Mesa.
begin;
create function app_private.ler_contexto_criacao_autorizado(p_mesa uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c app_private.contextos_criacao_mesa%rowtype;uid uuid:=(select auth.uid());
begin
 if uid is null or not exists(select 1 from public.mesas t where t.id=p_mesa and
 (t.mestre_id=uid or exists(select 1 from public.mesa_participantes m where m.mesa_id=t.id and m.usuario_id=uid and m.papel='jogador'))) then
  raise exception using errcode='42501',message='Contexto indisponivel.';
 end if;
 select * into c from app_private.contextos_criacao_mesa where mesa_id=p_mesa;
 if not found then return jsonb_build_object('mesaId',p_mesa,'preparado',false,'metodo',null,'nivelInicial',null,'permiteFinalizar',false,'revisao',null);end if;
 if c.revisao>9007199254740991 then raise exception using errcode='PT422',message='Contexto fora do escopo.',detail='AB_REGRA';end if;
 return jsonb_build_object('mesaId',p_mesa,'preparado',true,'metodo',c.metodo,'nivelInicial',c.nivel_inicial,'permiteFinalizar',c.permite_criacao,'revisao',c.revisao);
end;
$$;
revoke all on function app_private.ler_contexto_criacao_autorizado(uuid) from public,anon,authenticated;
grant execute on function app_private.ler_contexto_criacao_autorizado(uuid) to authenticated;
create function public.consultar_contexto_criacao(p_mesa uuid) returns jsonb
language sql stable security invoker set search_path='' as $$select app_private.ler_contexto_criacao_autorizado(p_mesa);$$;
revoke all on function public.consultar_contexto_criacao(uuid) from public,anon,authenticated;
grant execute on function public.consultar_contexto_criacao(uuid) to authenticated;

create function app_private.salvar_contexto_criacao_autorizado(p_mesa uuid,p_permite_finalizar boolean,p_revisao bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());c app_private.contextos_criacao_mesa%rowtype;
begin
 if uid is null then raise exception using errcode='42501',message='Contexto indisponivel.';end if;
 -- Mesa antes do contexto. UPDATE tambem serializa insercoes com FK da Mesa,
 -- para nao preparar contexto enquanto uma primeira personagem esta entrando.
 perform 1 from public.mesas where id=p_mesa and mestre_id=uid for update;
 if not found then raise exception using errcode='42501',message='Contexto indisponivel.';end if;
 if p_permite_finalizar is null or (p_revisao is not null and p_revisao not between 0 and 9007199254740991) then
  raise exception using errcode='PT422',message='Configuracao invalida.',detail='AB_REGRA';end if;
 select * into c from app_private.contextos_criacao_mesa where mesa_id=p_mesa for update;
 if not found then
  if p_revisao is not null then raise exception using errcode='PT409',message='Contexto mudou. Consulte novamente.',detail='AB_REVISAO';end if;
  -- Nao presumir metodo/nivel de Mesa legada que ja possui qualquer personagem.
  if exists(select 1 from public.personagens where mesa_id=p_mesa) then
   raise exception using errcode='PT422',message='Mesa com personagens exige preparacao especifica do contexto.',detail='AB_REGRA';end if;
  insert into app_private.contextos_criacao_mesa(mesa_id,metodo,nivel_inicial,permite_criacao) values(p_mesa,'padrao',1,p_permite_finalizar);
 else
  if p_revisao is null or p_revisao<>c.revisao then raise exception using errcode='PT409',message='Contexto mudou. Consulte novamente.',detail='AB_REVISAO';end if;
  if c.metodo<>'padrao' or c.nivel_inicial<>1 then raise exception using errcode='PT422',message='Metodo ou nivel exige fluxo especifico.',detail='AB_REGRA';end if;
  if c.permite_criacao is distinct from p_permite_finalizar then
   if c.revisao>=9007199254740991 then raise exception using errcode='PT422',message='Revisao fora do escopo.',detail='AB_REGRA';end if;
   update app_private.contextos_criacao_mesa set permite_criacao=p_permite_finalizar where mesa_id=p_mesa;
  end if;
 end if;
 return app_private.ler_contexto_criacao_autorizado(p_mesa);
exception
 when insufficient_privilege then raise exception using errcode='42501',message='Contexto indisponivel.';
 when sqlstate 'PT409' or sqlstate 'PT422' then raise;
 when others then raise exception using errcode='PT500',message='Nao foi possivel confirmar a configuracao. Consulte novamente.',detail='AB_INCERTO';
end;
$$;
revoke all on function app_private.salvar_contexto_criacao_autorizado(uuid,boolean,bigint) from public,anon,authenticated;
grant execute on function app_private.salvar_contexto_criacao_autorizado(uuid,boolean,bigint) to authenticated;
create function public.salvar_contexto_criacao(p_mesa uuid,p_permite_finalizar boolean,p_revisao bigint) returns jsonb
language sql security invoker set search_path='' as $$select app_private.salvar_contexto_criacao_autorizado(p_mesa,p_permite_finalizar,p_revisao);$$;
revoke all on function public.salvar_contexto_criacao(uuid,boolean,bigint) from public,anon,authenticated;
grant execute on function public.salvar_contexto_criacao(uuid,boolean,bigint) to authenticated;
commit;
