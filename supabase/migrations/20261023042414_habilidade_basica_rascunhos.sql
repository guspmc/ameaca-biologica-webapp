-- Nivel 1: uma Habilidade Basica. Proposta nao autorizada para producao.
begin;
alter table public.personagens add column habilidade_basica text,
  add constraint personagens_habilidade_basica_valida check (
    habilidade_basica is null or (classe is not null and (
      (classe='Agente' and habilidade_basica in ('anatomia-de-combate','nao-vai-escapar','rolamento')) or
      (classe='Autodidata' and habilidade_basica in ('ambidestria','curiosa','herbalista')) or
      (classe='Operador' and habilidade_basica in ('golpe-sujo','armeiro','parrudo'))
    ))
  );
revoke update (habilidade_basica) on public.personagens from public, anon, authenticated;

create function public.definir_habilidade_rascunho(p_personagem uuid,p_habilidade text)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_usuario uuid := (select auth.uid());
  v_ficha public.personagens%rowtype;
  v_opcoes text[];
  v_pv integer;
  v_bi integer;
begin
  if v_usuario is null then raise exception 'Autenticacao necessaria.'; end if;
  select * into v_ficha from public.personagens p
  where p.id=p_personagem and p.jogador_id=v_usuario and p.estado_ficha='rascunho'
    and exists(select 1 from public.mesa_participantes m where m.mesa_id=p.mesa_id
      and m.usuario_id=v_usuario and m.papel='jogador')
  for update;
  if not found then raise exception 'Rascunho indisponivel ou acesso negado.'; end if;
  if v_ficha.nivel<>1 then raise exception 'Escolha Basica disponivel nesta etapa apenas no nivel 1.'; end if;
  v_opcoes := case v_ficha.classe
    when 'Agente' then array['anatomia-de-combate','nao-vai-escapar','rolamento']
    when 'Autodidata' then array['ambidestria','curiosa','herbalista']
    when 'Operador' then array['golpe-sujo','armeiro','parrudo']
  end;
  if v_opcoes is null or (p_habilidade is not null and not(p_habilidade=any(v_opcoes))) then
    raise exception 'Habilidade Basica invalida para a Classe.';
  end if;
  if v_ficha.pv_maximo is null then raise exception 'Complete os recursos da ficha antes da Habilidade.'; end if;
  v_pv := (case v_ficha.classe when 'Agente' then 10 when 'Autodidata' then 8 when 'Operador' then 12 end)
    +v_ficha.vigor+(case when p_habilidade='parrudo' then 5 else 0 end);
  v_bi := (case v_ficha.classe when 'Agente' then 8 when 'Autodidata' then 10 when 'Operador' then 6 end)
    +v_ficha.astucia+(case when v_ficha.origem='Cobaia' then 2 else 0 end)
    +(case when p_habilidade='parrudo' then 3 else 0 end);
  if coalesce(v_ficha.bi_atual,0)>v_bi then
    raise exception 'A BI atual excede o novo maximo. Revise a ficha antes de trocar a Habilidade.';
  end if;
  update public.personagens set habilidade_basica=p_habilidade,
    pv_maximo=v_pv,
    pv_atual=least(v_pv,greatest(0,coalesce(v_ficha.pv_atual,v_ficha.pv_maximo)+v_pv-v_ficha.pv_maximo)),
    bi_maximo=v_bi
  where id=v_ficha.id;
end;
$$;
revoke all on function public.definir_habilidade_rascunho(uuid,text) from public,anon,authenticated;
-- Ativacao para authenticated somente na migracao de compatibilidade.


commit;
