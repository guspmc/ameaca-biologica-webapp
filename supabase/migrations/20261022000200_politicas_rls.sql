
-- AMEACA BIOLOGICA RPG
-- Migracao 002: permissoes e seguranca
-- Acesso restrito por Mesa e usuario.

-- Funcoes internas, fora da API publica.
create schema if not exists app_private;

revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

-- Identifica o Mestre oficial de uma Mesa.
create function app_private.eh_mestre(p_mesa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.mesas m
    where m.id = p_mesa
      and m.mestre_id = (select auth.uid())
  );
$$;

-- Verifica se o usuario participa da Mesa.
-- O Mestre tambem possui acesso.
create function app_private.esta_na_mesa(p_mesa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.eh_mestre(p_mesa)
     or exists (
       select 1
       from public.mesa_participantes p
       where p.mesa_id = p_mesa
         and p.usuario_id = (select auth.uid())
     );
$$;

-- Limita quem pode executar as funcoes.
revoke all on function
  app_private.eh_mestre(uuid) from public, anon;
revoke all on function
  app_private.esta_na_mesa(uuid) from public, anon;

grant execute on function
  app_private.eh_mestre(uuid) to authenticated;
grant execute on function
  app_private.esta_na_mesa(uuid) to authenticated;

-- Controla tambem as permissoes SQL.
revoke all on
  public.mesas,
  public.mesa_participantes,
  public.personagens
from public, anon, authenticated;

grant select, insert on public.mesas
  to authenticated;
grant update (nome) on public.mesas
  to authenticated;

grant select, insert, delete
  on public.mesa_participantes
  to authenticated;

grant select, insert on public.personagens
  to authenticated;
grant update (nome, pv_atual, pv_maximo)
  on public.personagens
  to authenticated;

-- Mantem RLS ativado.
alter table public.mesas
  enable row level security;
alter table public.mesa_participantes
  enable row level security;
alter table public.personagens
  enable row level security;

-- MESAS

create policy mesas_visualizar
on public.mesas
for select to authenticated
using (app_private.esta_na_mesa(id));

create policy mesas_criar
on public.mesas
for insert to authenticated
with check (mestre_id = (select auth.uid()));

create policy mesas_renomear
on public.mesas
for update to authenticated
using (mestre_id = (select auth.uid()))
with check (mestre_id = (select auth.uid()));

-- PARTICIPANTES

create policy participantes_visualizar
on public.mesa_participantes
for select to authenticated
using (
  usuario_id = (select auth.uid())
  or app_private.eh_mestre(mesa_id)
);

-- Somente o Mestre adiciona jogadores.
-- Convites e aceitacao serao implementados depois.
create policy participantes_adicionar
on public.mesa_participantes
for insert to authenticated
with check (
  app_private.eh_mestre(mesa_id)
  and papel = 'jogador'
  and usuario_id <> (select auth.uid())
);

create policy participantes_remover
on public.mesa_participantes
for delete to authenticated
using (
  app_private.eh_mestre(mesa_id)
  and papel = 'jogador'
);

-- PERSONAGENS

create policy personagens_visualizar
on public.personagens
for select to authenticated
using (
  app_private.eh_mestre(mesa_id)
  or (
    jogador_id = (select auth.uid())
    and app_private.esta_na_mesa(mesa_id)
  )
);

create policy personagens_criar
on public.personagens
for insert to authenticated
with check (
  jogador_id = (select auth.uid())
  and exists (
    select 1
    from public.mesa_participantes p
    where p.mesa_id = personagens.mesa_id
      and p.usuario_id = (select auth.uid())
      and p.papel = 'jogador'
  )
);

create policy personagens_atualizar
on public.personagens
for update to authenticated
using (
  jogador_id = (select auth.uid())
  and app_private.esta_na_mesa(mesa_id)
)
with check (
  jogador_id = (select auth.uid())
  and app_private.esta_na_mesa(mesa_id)
);

-- Registra automaticamente o Mestre
-- como participante ao criar uma Mesa.
create function app_private.registrar_mestre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.mesa_participantes
    (mesa_id, usuario_id, papel)
  values
    (new.id, new.mestre_id, 'mestre');

  return new;
end;
$$;

revoke all on function
  app_private.registrar_mestre()
from public, anon, authenticated;

create trigger registrar_mestre_na_mesa
after insert on public.mesas
for each row
execute function app_private.registrar_mestre();
