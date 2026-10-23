begin;
alter table public.personagens add column identidade jsonb not null default '{}'::jsonb
  check (jsonb_typeof(identidade)='object');
revoke update (identidade) on public.personagens from public,anon,authenticated;
create function public.definir_identidade_rascunho(p_personagem uuid,p_nome text,p_identidade jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_usuario uuid := (select auth.uid());
  v_id uuid;
  v_chave text;
  v_valor jsonb;
  v_limite integer;
  v_dados jsonb := '{}'::jsonb;
begin
  if v_usuario is null then raise exception 'Autenticacao necessaria.'; end if;
  select p.id into v_id from public.personagens p
  where p.id=p_personagem and p.jogador_id=v_usuario and p.estado_ficha='rascunho'
    and exists(select 1 from public.mesa_participantes m where m.mesa_id=p.mesa_id
      and m.usuario_id=v_usuario and m.papel='jogador') for update;
  if not found then raise exception 'Rascunho indisponivel ou acesso negado.'; end if;
  if char_length(btrim(coalesce(p_nome,''))) not between 2 and 60 then
    raise exception 'Nome deve ter entre 2 e 60 caracteres.';
  end if;
  if p_identidade is null or jsonb_typeof(p_identidade)<>'object' then
    raise exception 'Identidade deve ser um objeto de textos.';
  end if;
  for v_chave,v_valor in select * from jsonb_each(p_identidade) loop
    v_limite := case when v_chave in ('idade','genero') then 40
      when v_chave in ('ocupacao','apelido','afiliacao') then 120
      when v_chave in ('aparencia','personalidade','objetivo','medo','lacos') then 1000
      when v_chave='historia' then 4000 else null end;
    if v_limite is null or jsonb_typeof(v_valor)<>'string' then
      raise exception 'Campo narrativo invalido.';
    end if;
    if char_length(v_valor#>>'{}')>v_limite then raise exception 'Texto excede limite do campo %.',v_chave; end if;
    if btrim(v_valor#>>'{}')<>'' then
      v_dados := v_dados || jsonb_build_object(v_chave,btrim(v_valor#>>'{}'));
    end if;
  end loop;
  update public.personagens set nome=btrim(p_nome),identidade=v_dados where id=v_id;
end;
$$;
revoke all on function public.definir_identidade_rascunho(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.definir_identidade_rascunho(uuid,text,jsonb) to authenticated;
commit;
