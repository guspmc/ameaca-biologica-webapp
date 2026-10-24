-- PROPOSTA LOCAL: nao aplicar em teste remoto/producao sem autorizacao especifica.
begin;
create table app_private.disponibilidade_compra_inicial(
 mesa_id uuid not null references public.mesas(id) on delete cascade,
 item_id text not null check(item_id in ('bastao','faca','colete-acolchoado','colete-leve','lanterna-simples','municao-9mm')),
 primary key(mesa_id,item_id)
);
alter table app_private.disponibilidade_compra_inicial enable row level security;
revoke all on app_private.disponibilidade_compra_inicial from public,anon,authenticated;
-- Nenhum item habilitado automaticamente em Mesas existentes.
alter table public.personagens
 add column compras_iniciais jsonb not null default '{}'::jsonb check(jsonb_typeof(compras_iniciais)='object'),
 add column revisao_compras integer not null default 0 check(revisao_compras>=0);
revoke update(compras_iniciais,revisao_compras) on public.personagens from public,anon,authenticated;
create function public.salvar_compras_rascunho(p_personagem uuid,p_plano jsonb,p_revisao integer)
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid := (select auth.uid());
 v_f public.personagens%rowtype;
 v_id text; v_q jsonb; v_n integer; v_preco integer;
 v_gasto integer:=0; v_espacos integer:=2;
 v_plano jsonb:='{}'::jsonb;
begin
 if v_uid is null then raise exception 'Autenticacao necessaria.'; end if;
 select * into v_f from public.personagens p where p.id=p_personagem and p.jogador_id=v_uid
 and p.estado_ficha='rascunho' and exists(select 1 from public.mesa_participantes m
 where m.mesa_id=p.mesa_id and m.usuario_id=v_uid and m.papel='jogador') for update;
 if not found then raise exception 'Rascunho indisponivel ou acesso negado.'; end if;
 if v_f.nivel<>1 or v_f.classe is null or v_f.equipamento_inicial is distinct from 'C' then
  raise exception 'Compras disponiveis apenas no Personalizado de nivel 1.'; end if;
 if p_revisao is null or p_revisao<0 then raise exception 'Revisao invalida.'; end if;
 if p_plano is null or jsonb_typeof(p_plano)<>'object' then raise exception 'Plano invalido.'; end if;
 for v_id,v_q in select * from jsonb_each(p_plano) loop
  v_preco:=case when v_id='colete-leve' then 2
   when v_id in ('bastao','faca','colete-acolchoado','lanterna-simples','municao-9mm') then 1 else null end;
  if v_preco is null or jsonb_typeof(v_q)<>'number' or v_q::text !~ '^[0-3]$' then
   raise exception 'Item ou quantidade invalida.'; end if;
  v_n:=(v_q::text)::integer;
  if v_n=0 then continue; end if;
  if not exists(select 1 from app_private.disponibilidade_compra_inicial d where d.mesa_id=v_f.mesa_id and d.item_id=v_id) then
   raise exception 'Item indisponivel para compra nesta Mesa.'; end if;
  v_plano:=v_plano||jsonb_build_object(v_id,v_n);
  v_gasto:=v_gasto+v_preco*v_n;
  v_espacos:=v_espacos+case when v_id='municao-9mm' then (v_n*15+29)/30 else v_n end;
 end loop;
 if v_gasto>3 then raise exception 'Saldo insuficiente.'; end if;
 if v_gasto<3 then v_espacos:=v_espacos+1; end if;
 if v_espacos>4+v_f.forca+(case when v_f.origem='Mochileiro' then 1 else 0 end) then
  raise exception 'Capacidade insuficiente.'; end if;
 -- Repeticao da mesma requisicao aceita sem duplicar nem aumentar a versao.
 if v_plano=v_f.compras_iniciais and p_revisao in (v_f.revisao_compras,v_f.revisao_compras-1) then
  return v_f.revisao_compras; end if;
 if p_revisao<>v_f.revisao_compras then raise exception 'Revisao desatualizada. Recarregue antes de salvar.'; end if;
 update public.personagens set compras_iniciais=v_plano,revisao_compras=revisao_compras+1 where id=v_f.id;
 return v_f.revisao_compras+1;
end;
$$;
revoke all on function public.salvar_compras_rascunho(uuid,jsonb,integer) from public,anon,authenticated;
grant execute on function public.salvar_compras_rascunho(uuid,jsonb,integer) to authenticated;
create function app_private.proteger_kit_com_compras() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.equipamento_inicial is distinct from old.equipamento_inicial and old.compras_iniciais<>'{}'::jsonb then
  raise exception 'Salve compras vazias antes de trocar o conjunto inicial.';
 end if;
 return new;
end;
$$;
revoke all on function app_private.proteger_kit_com_compras() from public,anon,authenticated;
create trigger proteger_kit_com_compras before update of equipamento_inicial on public.personagens
 for each row execute function app_private.proteger_kit_com_compras();
commit;
