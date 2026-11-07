-- PROPOSTA: aplicar somente apos checkpoint especifico do Gus.
-- Preserva fichas existentes, inclusive rascunhos excedentes legados.
-- Dez personagens ativas sera validado na futura finalizacao da ficha.
begin;

alter policy personagens_visualizar on public.personagens
using (
  (jogador_id = (select auth.uid()) and app_private.esta_na_mesa(mesa_id))
  or (estado_ficha = 'completa' and app_private.eh_mestre(mesa_id))
);

create or replace function public.criar_personagem_rascunho(
  p_mesa uuid, p_nome text, p_classe text,
  p_for integer, p_agi integer, p_vig integer, p_ast integer
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
  if p_classe is null or p_classe not in ('Agente','Autodidata','Operador') then
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

  -- Serializa criacoes da mesma conta/Mesa e a remocao desse vinculo.
  -- O bloqueio so pode ser adquirido por jogador ja admitido.
  perform 1 from public.mesa_participantes p
  where p.mesa_id = p_mesa and p.usuario_id = v_usuario
    and p.papel = 'jogador'
  for update;
  if not found then
    raise exception 'Apenas jogadores aprovados podem criar personagens nesta Mesa.';
  end if;

  if (select count(*) from public.personagens p
      where p.mesa_id = p_mesa and p.jogador_id = v_usuario
        and p.estado_ficha = 'rascunho') >= 3 then
    raise exception 'Voce ja possui tres rascunhos nesta Mesa.';
  end if;

  v_pv_base := case p_classe
    when 'Agente' then 10 when 'Autodidata' then 8 when 'Operador' then 12
  end;
  v_bi_base := case p_classe
    when 'Agente' then 8 when 'Autodidata' then 10 when 'Operador' then 6
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

commit;
