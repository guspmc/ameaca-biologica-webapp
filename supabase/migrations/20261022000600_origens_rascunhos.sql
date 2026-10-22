-- AMEACA BIOLOGICA RPG - MIGRACAO 006 (PROPOSTA)
-- Origem e uma Pericia Treinada gratuita para rascunhos.
-- Nao ativa personagem, nao atribui Habilidades nem equipamento.
-- Aplicar SOMENTE depois de revisar e aprovar o checkpoint.

alter table public.personagens
  add column if not exists pericia_origem_treinada text,
  add column if not exists pericia_origem_extra text;

create function public.definir_origem_rascunho(
  p_personagem uuid,
  p_origem text,
  p_treinada text,
  p_extra text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_ficha public.personagens%rowtype;
  v_opcoes text[];
  v_pericias text[] := array[
    'Acrobacia','Atletismo','Fortitude','Furtividade',
    'Investigação','Luta','Medicina','Percepção',
    'Pontaria','Reflexos','Sobrevivência','Vontade'
  ];
  v_sa_ant integer;
  v_sa_novo integer;
  v_bi_novo integer;
begin
  if v_usuario is null then
    raise exception 'Autenticacao necessaria.';
  end if;

  select * into v_ficha
  from public.personagens
  where id = p_personagem
  for update;

  if not found
     or v_ficha.jogador_id is distinct from v_usuario
     or v_ficha.estado_ficha <> 'rascunho'
     or not exists (
       select 1 from public.mesa_participantes p
       where p.mesa_id = v_ficha.mesa_id
         and p.usuario_id = v_usuario and p.papel = 'jogador'
     )
  then
    raise exception 'Rascunho indisponivel ou acesso negado.';
  end if;

  v_opcoes := case p_origem
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
    else null
  end;

  if p_origem = 'Amnésico' then
    if p_treinada is null or p_extra is null
       or not (p_treinada = any(v_pericias))
       or not (p_extra = any(v_pericias))
       or p_treinada = p_extra then
      raise exception 'Amnesico exige duas Pericias distintas, uma Treinada.';
    end if;
  elsif v_opcoes is null
     or p_treinada is null or not (p_treinada = any(v_opcoes))
     or p_extra is not null then
    raise exception 'Origem ou Pericia invalida.';
  end if;

  v_sa_ant := v_ficha.agilidade + v_ficha.astucia
    + case when v_ficha.origem = 'Universitária' then 1 else 0 end;
  v_sa_novo := v_ficha.agilidade + v_ficha.astucia
    + case when p_origem = 'Universitária' then 1 else 0 end;
  v_bi_novo := case v_ficha.classe
    when 'Agente' then 8
    when 'Autodidata' then 10
    when 'Operador' then 6
    else 0
  end + v_ficha.astucia
    + case when p_origem = 'Cobaia' then 2 else 0 end;

  update public.personagens set
    origem = p_origem,
    pericia_origem_treinada = p_treinada,
    pericia_origem_extra = case when p_origem = 'Amnésico' then p_extra else null end,
    defesa = 10 + v_ficha.agilidade + case when p_origem = 'Policial' then 2 else 0 end,
    sa_maximo = v_sa_novo,
    -- Preserva SA ja gastos; acrescenta/remove apenas a diferenca do bonus.
    sa_atual = least(v_sa_novo, greatest(0,
      coalesce(v_ficha.sa_atual, v_sa_ant) + v_sa_novo - v_sa_ant)),
    bi_maximo = v_bi_novo,
    bi_atual = least(v_bi_novo, coalesce(v_ficha.bi_atual, 0))
  where id = v_ficha.id;
end;
$$;

revoke all on function public.definir_origem_rascunho(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.definir_origem_rascunho(uuid,text,text,text)
  to authenticated;
