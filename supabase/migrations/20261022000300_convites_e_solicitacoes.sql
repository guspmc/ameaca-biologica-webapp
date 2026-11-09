-- AMEACA BIOLOGICA RPG — Migracao 003
-- Convites por codigo/link e solicitacoes aprovadas pelo Mestre.
-- O codigo nunca fica armazenado em texto puro e expira em 7 dias.

create table app_private.convites_mesa (
  mesa_id uuid primary key references public.mesas(id) on delete cascade,
  codigo_hash text not null unique,
  gerado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
revoke all on app_private.convites_mesa from public, anon, authenticated;

create table public.solicitacoes_entrada (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  apelido text not null check (char_length(apelido) between 2 and 40),
  status text not null default 'pendente'
    check (status in ('pendente','aprovada','recusada')),
  criada_em timestamptz not null default now(),
  respondida_em timestamptz,
  unique (mesa_id, usuario_id)
);

create index solicitacoes_mesa_status
  on public.solicitacoes_entrada(mesa_id, status, criada_em desc);
create index solicitacoes_usuario
  on public.solicitacoes_entrada(usuario_id);

alter table public.solicitacoes_entrada enable row level security;
revoke all on public.solicitacoes_entrada from public, anon, authenticated;
grant select on public.solicitacoes_entrada to authenticated;

-- Somente o proprio candidato e o Mestre podem consultar uma solicitacao.
-- Nenhuma escrita direta por usuarios comuns: apenas funcoes auditadas.
create policy solicitacoes_consultar
on public.solicitacoes_entrada
for select to authenticated
using (
  usuario_id = (select auth.uid())
  or app_private.eh_mestre(mesa_id)
);

-- Emite ou renova convite de uso compartilhado por sete dias.
-- Apenas o hash do codigo e persistido; novo convite revoga o antigo.
create function public.gerar_convite_mesa(p_mesa uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_codigo text;
begin
  if (select auth.uid()) is null
     or not app_private.eh_mestre(p_mesa) then
    raise exception 'Apenas o Mestre pode gerar convites.';
  end if;

  v_codigo := 'AB-' ||
    upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 24));

  insert into app_private.convites_mesa
    (mesa_id, codigo_hash, gerado_em, expira_em)
  values (
    p_mesa,
    encode(pg_catalog.sha256(pg_catalog.convert_to(v_codigo, 'UTF8')), 'hex'),
    now(),
    now() + interval '7 days'
  )
  on conflict (mesa_id) do update
  set codigo_hash = excluded.codigo_hash,
      gerado_em = excluded.gerado_em,
      expira_em = excluded.expira_em;

  return v_codigo;
end;
$$;

-- Um convite valido apenas solicita entrada: NAO concede acesso.
create function public.solicitar_entrada_mesa(
  p_codigo text,
  p_apelido text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_mesa uuid;
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_apelido text := trim(coalesce(p_apelido, ''));
begin
  if v_usuario is null then
    raise exception 'Entre em sua conta para solicitar acesso.';
  end if;

  if char_length(v_apelido) < 2 or char_length(v_apelido) > 40 then
    raise exception 'O apelido deve ter de 2 a 40 caracteres.';
  end if;

  if v_codigo !~ '^AB-[A-F0-9]{24}$' then
    raise exception 'Convite invalido ou expirado.';
  end if;

  select c.mesa_id into v_mesa
  from app_private.convites_mesa c
  where c.codigo_hash =
    encode(pg_catalog.sha256(pg_catalog.convert_to(v_codigo, 'UTF8')), 'hex')
    and c.expira_em > now();

  if v_mesa is null then
    raise exception 'Convite invalido ou expirado.';
  end if;

  if exists (
    select 1 from public.mesa_participantes p
    where p.mesa_id = v_mesa and p.usuario_id = v_usuario
  ) then
    raise exception 'Voce ja participa desta Mesa.';
  end if;

  if exists (
    select 1 from public.solicitacoes_entrada s
    where s.mesa_id = v_mesa and s.usuario_id = v_usuario
      and s.status = 'pendente'
  ) then
    raise exception 'Sua solicitacao ja esta aguardando aprovacao.';
  end if;

  -- Limite modesto para evitar envios repetidos acidentais.
  if (
    select count(*) from public.solicitacoes_entrada s
    where s.usuario_id = v_usuario
      and s.status = 'pendente'
      and s.criada_em > now() - interval '1 minute'
  ) >= 3 then
    raise exception 'Limite de solicitacoes recentes atingido.';
  end if;

  insert into public.solicitacoes_entrada
    (mesa_id, usuario_id, apelido, status)
  values (v_mesa, v_usuario, v_apelido, 'pendente')
  on conflict (mesa_id, usuario_id) do update
  set apelido = excluded.apelido,
      status = 'pendente',
      criada_em = now(),
      respondida_em = null;
end;
$$;

-- O Mestre aceita ou recusa. Uma aprovacao cria a participacao
-- em uma unica transacao, sem expor permissao direta ao candidato.
create function public.responder_solicitacao_mesa(
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
    insert into public.mesa_participantes (mesa_id, usuario_id, papel)
    values (v_solicitacao.mesa_id, v_solicitacao.usuario_id, 'jogador')
    on conflict (mesa_id, usuario_id) do nothing;
  end if;

  update public.solicitacoes_entrada
  set status = case when p_aprovar then 'aprovada' else 'recusada' end,
      respondida_em = now()
  where id = p_solicitacao;
end;
$$;

-- O PostgreSQL permite EXECUTE a PUBLIC por padrao:
-- revogar explicitamente antes de liberar apenas autenticados.
revoke all on function public.gerar_convite_mesa(uuid)
  from public, anon, authenticated;
revoke all on function public.solicitar_entrada_mesa(text,text)
  from public, anon, authenticated;
revoke all on function public.responder_solicitacao_mesa(uuid,boolean)
  from public, anon, authenticated;

grant execute on function public.gerar_convite_mesa(uuid)
  to authenticated;
grant execute on function public.solicitar_entrada_mesa(text,text)
  to authenticated;
grant execute on function public.responder_solicitacao_mesa(uuid,boolean)
  to authenticated;
