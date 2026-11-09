-- AMEACA BIOLOGICA RPG - MIGRACAO 004
-- Identificacao dos participantes e atualizacao ao vivo da Mesa.
-- Preserva os registros de Mesas e personagens existentes.

alter table public.mesa_participantes
  add column apelido text;

alter table public.mesa_participantes
  add constraint mesa_participantes_apelido_valido
  check (apelido is null or char_length(btrim(apelido)) between 2 and 40);

-- Identificamos o Mestre sem expor e-mail ou dados de autenticacao.
update public.mesa_participantes
set apelido = 'Mestre'
where papel = 'mestre' and apelido is null;

-- Recupera o apelido de quem ja foi aprovado, como a primeira
-- participante de "Something Valentine". Nenhuma Mesa e recriada.
update public.mesa_participantes p
set apelido = s.apelido
from public.solicitacoes_entrada s
where s.mesa_id = p.mesa_id
  and s.usuario_id = p.usuario_id
  and s.status = 'aprovada'
  and p.papel = 'jogador'
  and p.apelido is null;

-- A lista de membros e visivel APENAS a quem participa da mesma Mesa.
-- A funcao interna security definer evita recursao da propria RLS.
drop policy if exists participantes_visualizar on public.mesa_participantes;
create policy participantes_visualizar
on public.mesa_participantes
for select to authenticated
using (app_private.esta_na_mesa(mesa_id));

-- Novas Mesas registram automaticamente o Mestre e seu rotulo.
create or replace function app_private.registrar_mestre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.mesa_participantes
    (mesa_id, usuario_id, papel, apelido)
  values (new.id, new.mestre_id, 'mestre', 'Mestre');
  return new;
end;
$$;

-- Novas aprovacoes preservam o apelido escolhido na solicitacao.
-- Todo o processo permanece em uma transacao e valida o Mestre.
create or replace function public.responder_solicitacao_mesa(
  p_solicitacao uuid,
  p_aprovar boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_solicitacao public.solicitacoes_entrada%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticacao necessaria.';
  end if;

  select * into v_solicitacao
  from public.solicitacoes_entrada
  where id = p_solicitacao
  for update;

  if not found
     or not app_private.eh_mestre(v_solicitacao.mesa_id) then
    raise exception 'Solicitacao nao encontrada ou acesso negado.';
  end if;

  if v_solicitacao.status <> 'pendente' then
    raise exception 'Esta solicitacao ja foi avaliada.';
  end if;

  if p_aprovar is null then
    raise exception 'Informe se a solicitacao foi aprovada.';
  end if;

  if p_aprovar then
    insert into public.mesa_participantes
      (mesa_id, usuario_id, papel, apelido)
    values
      (v_solicitacao.mesa_id, v_solicitacao.usuario_id, 'jogador', v_solicitacao.apelido)
    on conflict (mesa_id, usuario_id) do nothing;
  end if;

  update public.solicitacoes_entrada
  set status = case when p_aprovar then 'aprovada' else 'recusada' end,
      respondida_em = now()
  where id = p_solicitacao;
end;
$$;

-- Continua sem haver permissao direta de UPDATE nos membros,
-- nem de alterar o papel do Mestre pela interface.
revoke all on function public.responder_solicitacao_mesa(uuid,boolean)
  from public, anon;
grant execute on function public.responder_solicitacao_mesa(uuid,boolean)
  to authenticated;

-- Supabase Realtime: apenas alteracoes publicadas; acesso aos dados
-- permanece sujeito as politicas RLS de cada tabela.
do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'mesas', 'mesa_participantes', 'solicitacoes_entrada'
  ] loop
    if not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_tabela
    ) then
      execute pg_catalog.format(
        'alter publication supabase_realtime add table public.%I',
        v_tabela
      );
    end if;
  end loop;
end;
$$;
