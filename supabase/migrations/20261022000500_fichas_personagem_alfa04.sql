-- AMEACA BIOLOGICA RPG - MIGRACAO 005 - Ficha do Jogador / alfa 0.4
-- A ficha inicial e um RASCUNHO. Origem, Treinamento, Equipamento,
-- habilidades e Inventario serao implementados progressivamente.
-- Nao altera Mesas, Participantes ou campanhas ja existentes.

alter table public.personagens
  add column if not exists classe text,
  add column if not exists origem text,
  add column if not exists nivel integer not null default 1,
  add column if not exists forca integer not null default 1,
  add column if not exists agilidade integer not null default 1,
  add column if not exists vigor integer not null default 1,
  add column if not exists astucia integer not null default 1,
  add column if not exists sa_atual integer,
  add column if not exists sa_maximo integer,
  add column if not exists bi_atual integer,
  add column if not exists bi_maximo integer,
  add column if not exists defesa integer,
  add column if not exists estado_ficha text not null default 'rascunho';

alter table public.personagens
  add constraint personagens_classe_valida
  check (classe is null or classe in ('Agente','Autodidata','Operador')),
  add constraint personagens_atributos_validos
  check (
    forca between 0 and 5 and agilidade between 0 and 5
    and vigor between 0 and 5 and astucia between 0 and 5
  ),
  add constraint personagens_nivel_valido
  check (nivel >= 1),
  add constraint personagens_estado_valido
  check (estado_ficha in ('rascunho','completa')),
  add constraint personagens_recursos_validos
  check (
    (pv_atual is null or pv_atual >= 0) and
    (pv_maximo is null or pv_maximo >= 0) and
    (pv_atual is null or pv_maximo is null or pv_atual <= pv_maximo) and
    (sa_atual is null or sa_atual >= 0) and
    (sa_maximo is null or sa_maximo >= 0) and
    (sa_atual is null or sa_maximo is null or sa_atual <= sa_maximo) and
    (bi_atual is null or bi_atual >= 0) and
    (bi_maximo is null or bi_maximo >= 0) and
    (bi_atual is null or bi_maximo is null or bi_atual <= bi_maximo)
  );

-- Apenas dono autenticado ainda participante consegue ajustar recursos.
-- O Mestre pode visualizar por RLS, mas nao escrever.
revoke insert on public.personagens from authenticated;
revoke update (nome, pv_atual, pv_maximo)
  on public.personagens from authenticated;
grant update (pv_atual, sa_atual, bi_atual)
  on public.personagens to authenticated;

-- Funcao transacional: somente jogador previamente aprovado, atributos
-- de criacao legais, maxima de dez fichas por Mesa.
create function public.criar_personagem_rascunho(
  p_mesa uuid,
  p_nome text,
  p_classe text,
  p_for integer,
  p_agi integer,
  p_vig integer,
  p_ast integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_id uuid;
  v_pv_base integer;
  v_bi_base integer;
begin
  if v_usuario is null then
    raise exception 'Autenticacao necessaria.';
  end if;

  if char_length(btrim(coalesce(p_nome,''))) not between 2 and 60 then
    raise exception 'O nome deve ter entre 2 e 60 caracteres.';
  end if;

  if p_classe not in ('Agente','Autodidata','Operador') or p_classe is null then
    raise exception 'Classe invalida.';
  end if;

  if p_for is null or p_agi is null or p_vig is null or p_ast is null
    or p_for not between 0 and 3 or p_agi not between 0 and 3
    or p_vig not between 0 and 3 or p_ast not between 0 and 3
    or (p_for+p_agi+p_vig+p_ast) <> 7
    or ((p_for=0)::int+(p_agi=0)::int+(p_vig=0)::int+(p_ast=0)::int)>1
  then
    raise exception 'Distribuicao inicial de Atributos invalida.';
  end if;

  -- Trava a Mesa para limitar a dez personagens mesmo em criacoes
  -- simultaneas. Nao bloqueia personagens existentes.
  perform 1 from public.mesas m where m.id = p_mesa for update;
  if not found then raise exception 'Mesa nao encontrada.'; end if;

  if not exists (
    select 1 from public.mesa_participantes p
    where p.mesa_id=p_mesa and p.usuario_id=v_usuario and p.papel='jogador'
  ) then
    raise exception 'Apenas jogadores aprovados podem criar personagens nesta Mesa.';
  end if;

  if (select count(*) from public.personagens p where p.mesa_id = p_mesa) >= 10 then
    raise exception 'A Mesa ja possui dez personagens.';
  end if;

  v_pv_base := case p_classe
    when 'Agente' then 10
    when 'Autodidata' then 8
    when 'Operador' then 12
  end;
  v_bi_base := case p_classe
    when 'Agente' then 8
    when 'Autodidata' then 10
    when 'Operador' then 6
  end;

  insert into public.personagens (
    mesa_id, jogador_id, nome, classe, nivel,
    forca, agilidade, vigor, astucia,
    pv_maximo, pv_atual, sa_maximo, sa_atual,
    bi_maximo, bi_atual, defesa, estado_ficha
  ) values (
    p_mesa, v_usuario, btrim(p_nome), p_classe, 1,
    p_for, p_agi, p_vig, p_ast,
    v_pv_base+p_vig, v_pv_base+p_vig,
    p_agi+p_ast, p_agi+p_ast,
    v_bi_base+p_ast, 0, 10+p_agi, 'rascunho'
  ) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.criar_personagem_rascunho(
  uuid,text,text,integer,integer,integer,integer
) from public, anon, authenticated;
grant execute on function public.criar_personagem_rascunho(
  uuid,text,text,integer,integer,integer,integer
) to authenticated;

-- Eventos das fichas devem ser recebidos apenas por membros autorizados
-- pelas politicas RLS; nenhuma role administrativa e exposta no cliente.
do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname='public' and tablename='personagens'
  ) then
    alter publication supabase_realtime add table public.personagens;
  end if;
end;
$$;
