-- Checkpoint de Gus: adicionar somente ao TESTE; nenhuma disponibilidade automatica.
-- A tabela privada existente continua sem acesso direto de usuarios.
create function public.listar_disponibilidade_inicial(p_mesa uuid)
returns table(item_id text) language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.mesas m where m.id=p_mesa and m.mestre_id=auth.uid()) then
  raise exception 'Mesa indisponivel ou acesso negado';
 end if;
 return query select d.item_id from app_private.disponibilidade_compra_inicial d where d.mesa_id=p_mesa order by d.item_id;
end;
$$;
revoke all on function public.listar_disponibilidade_inicial(uuid) from public,anon,authenticated;
grant execute on function public.listar_disponibilidade_inicial(uuid) to authenticated;

create function public.definir_disponibilidade_inicial(p_mesa uuid,p_item text,p_liberado boolean,p_esperado boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_atual boolean;
begin
 if auth.uid() is null then raise exception 'Autenticacao necessaria'; end if;
 -- Bloqueio da Mesa serializa configuracoes concorrentes sem expor fichas.
 perform 1 from public.mesas m where m.id=p_mesa and m.mestre_id=auth.uid() for update;
 if not found then raise exception 'Mesa indisponivel ou acesso negado'; end if;
 if p_item is null or p_item not in ('bastao','faca','colete-acolchoado','colete-leve','lanterna-simples','municao-9mm')
 or p_liberado is null or p_esperado is null then raise exception 'Configuracao invalida'; end if;
 select exists(select 1 from app_private.disponibilidade_compra_inicial d where d.mesa_id=p_mesa and d.item_id=p_item) into v_atual;
 -- Repetir o mesmo resultado e seguro. Outro estado exige recarregar.
 if v_atual=p_liberado then return v_atual; end if;
 if v_atual<>p_esperado then raise exception 'Disponibilidade desatualizada. Atualize a lista'; end if;
 if p_liberado then
  insert into app_private.disponibilidade_compra_inicial(mesa_id,item_id) values(p_mesa,p_item);
 else
  delete from app_private.disponibilidade_compra_inicial d where d.mesa_id=p_mesa and d.item_id=p_item;
 end if;
 return p_liberado;
end;
$$;
revoke all on function public.definir_disponibilidade_inicial(uuid,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.definir_disponibilidade_inicial(uuid,text,boolean,boolean) to authenticated;
