
-- AMEACA BIOLOGICA RPG
-- Migracao 001: estrutura inicial das Mesas
-- As contas de usuarios sao gerenciadas pelo Supabase Auth.

create table public.mesas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  mestre_id uuid not null references auth.users(id),
  criada_em timestamptz not null default now()
);

create table public.mesa_participantes (
  mesa_id uuid not null
    references public.mesas(id) on delete cascade,
  usuario_id uuid not null
    references auth.users(id) on delete cascade,
  papel text not null
    check (papel in ('mestre', 'jogador')),
  entrou_em timestamptz not null default now(),
  primary key (mesa_id, usuario_id)
);

create table public.personagens (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null
    references public.mesas(id) on delete cascade,
  jogador_id uuid
    references auth.users(id) on delete set null,
  nome text not null,
  pv_atual integer,
  pv_maximo integer,
  criado_em timestamptz not null default now()
);

-- Indices para consultas frequentes
create index idx_mesas_mestre
  on public.mesas(mestre_id);

create index idx_participantes_usuario
  on public.mesa_participantes(usuario_id);

create index idx_personagens_mesa
  on public.personagens(mesa_id);

-- Protecao inicial: acesso bloqueado ate
-- definirmos as politicas de cada participante.
alter table public.mesas enable row level security;
alter table public.mesa_participantes
  enable row level security;
alter table public.personagens enable row level security;
