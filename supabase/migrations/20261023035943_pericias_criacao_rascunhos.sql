-- PROPOSTA: nao aplicar em producao sem checkpoint especifico do Gus.
-- J 26, 42: pontos da Classe na criacao de nivel 1, separados da Origem gratuita.
begin;
alter table public.personagens
  add column pontos_pericia_classe jsonb not null default '{}'::jsonb,
  add constraint personagens_pontos_pericia_objeto
    check (jsonb_typeof(pontos_pericia_classe) = 'object');

create function public.definir_pericias_rascunho(p_personagem uuid, p_pontos jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_usuario uuid := (select auth.uid());
  v_ficha public.personagens%rowtype;
  v_permitidas text[];
  v_origem text[];
  v_extra text;
  v_limite integer;
  v_total integer := 0;
  v_item record;
  v_pontos integer;
  v_normalizado jsonb := '{}'::jsonb;
begin
  if v_usuario is null then raise exception 'Autenticacao necessaria.'; end if;
  select * into v_ficha from public.personagens p
  where p.id = p_personagem and p.jogador_id = v_usuario
    and p.estado_ficha = 'rascunho'
    and exists (select 1 from public.mesa_participantes m
      where m.mesa_id = p.mesa_id and m.usuario_id = v_usuario and m.papel = 'jogador')
  for update;
  if not found then raise exception 'Rascunho indisponivel ou acesso negado.'; end if;
  if v_ficha.nivel <> 1 then
    raise exception 'Esta etapa permite apenas Pericias da criacao no nivel 1.';
  end if;
  v_limite := case v_ficha.classe when 'Agente' then 4 when 'Autodidata' then 5 when 'Operador' then 3 end;
  v_permitidas := case v_ficha.classe
    when 'Agente' then array['Acrobacia','Furtividade','Investigação','Luta','Percepção','Pontaria','Reflexos','Sobrevivência']
    when 'Autodidata' then array['Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade']
    when 'Operador' then array['Atletismo','Fortitude','Investigação','Luta','Percepção','Pontaria']
  end;
  if v_limite is null then raise exception 'Defina uma Classe valida antes das Pericias.'; end if;
  v_origem := case v_ficha.origem
    when 'Acadêmico' then array['Investigação','Medicina']
    when 'Agente de Saúde' then array['Medicina','Sobrevivência']
    when 'Atleta' then array['Acrobacia','Atletismo']
    when 'Chef' then array['Fortitude','Sobrevivência']
    when 'Cobaia' then array['Reflexos','Vontade']
    when 'Criminoso' then array['Investigação','Furtividade']
    when 'Desgarrado' then array['Fortitude','Sobrevivência']
    when 'Investigador' then array['Investigação','Percepção']
    when 'Lutador' then array['Luta','Reflexos']
    when 'Mercenário' then array['Pontaria','Fortitude']
    when 'Militar' then array['Pontaria','Percepção']
    when 'Mochileiro' then array['Sobrevivência','Atletismo']
    when 'Operário' then array['Fortitude','Atletismo']
    when 'Policial' then array['Percepção','Pontaria']
    when 'Servidor Público' then array['Investigação','Vontade']
    when 'Universitária' then array['Medicina','Investigação']
    when 'Amnésico' then array[v_ficha.pericia_origem_treinada,v_ficha.pericia_origem_extra]
  end;
  if v_origem is null or v_ficha.pericia_origem_treinada is null
    or not (v_ficha.pericia_origem_treinada = any(v_origem)) then
    raise exception 'Defina uma Origem e seu Treinamento antes das Pericias.';
  end if;
  if v_ficha.origem = 'Amnésico' then
    if v_ficha.pericia_origem_extra is null
      or v_ficha.pericia_origem_extra = v_ficha.pericia_origem_treinada
      or not (v_ficha.pericia_origem_extra = any(array['Acrobacia','Atletismo','Fortitude','Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade']))
      or not (v_ficha.pericia_origem_treinada = any(array['Acrobacia','Atletismo','Fortitude','Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade'])) then
      raise exception 'Escolhas de Amnesico invalidas.';
    end if;
    v_extra := v_ficha.pericia_origem_extra;
  else
    v_extra := (array_remove(v_origem,v_ficha.pericia_origem_treinada))[1];
  end if;
  v_permitidas := array_append(v_permitidas,v_extra);
  if p_pontos is null or jsonb_typeof(p_pontos) <> 'object' then
    raise exception 'Informe um objeto de Pontos de Pericia.';
  end if;
  for v_item in select key,value from jsonb_each(p_pontos) loop
    if not (v_item.key = any(v_permitidas))
      or jsonb_typeof(v_item.value) <> 'number'
      or v_item.value::text !~ '^[0-2]$' then
      raise exception 'Pericia ou quantidade de pontos invalida.';
    end if;
    v_pontos := (v_item.value::text)::integer;
    if v_pontos + (case when v_item.key = v_ficha.pericia_origem_treinada then 1 else 0 end) > 2 then
      raise exception 'O grau maximo de Pericia e Mestre.';
    end if;
    v_total := v_total + v_pontos;
    if v_pontos > 0 then
      v_normalizado := v_normalizado || jsonb_build_object(v_item.key,v_pontos);
    end if;
  end loop;
  if v_total > v_limite then raise exception 'Pontos de Pericia excedem o limite da Classe.'; end if;
  update public.personagens set pontos_pericia_classe = v_normalizado where id = v_ficha.id;
end;
$$;
revoke all on function public.definir_pericias_rascunho(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.definir_pericias_rascunho(uuid,jsonb) to authenticated;
revoke update (pontos_pericia_classe) on public.personagens from public, anon, authenticated;

-- Nao invalidar uma distribuicao salva por troca de Origem/Pericia gratuita.
create function app_private.proteger_pericias_na_troca_origem()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.pontos_pericia_classe <> '{}'::jsonb and (
    new.origem is distinct from old.origem
    or new.pericia_origem_treinada is distinct from old.pericia_origem_treinada
    or new.pericia_origem_extra is distinct from old.pericia_origem_extra
  ) then
    raise exception 'Revise as Pericias: salve a distribuicao vazia antes de trocar a Origem ou suas escolhas.';
  end if;
  return new;
end;
$$;
revoke all on function app_private.proteger_pericias_na_troca_origem() from public, anon, authenticated;
create trigger proteger_pericias_na_troca_origem
before update of origem, pericia_origem_treinada, pericia_origem_extra on public.personagens
for each row execute function app_private.proteger_pericias_na_troca_origem();
commit;
