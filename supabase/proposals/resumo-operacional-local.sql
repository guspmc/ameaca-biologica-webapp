-- PROPOSTA LOCAL de privacidade. Sem aplicacao remota ou integracao de interface.
-- Requer ativacao-local.sql para a rodada integrada de testes.
begin;
create function app_private.jogador_admitido(p_mesa uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists(
  select 1 from public.mesa_participantes m join public.mesas t on t.id=m.mesa_id
  where m.mesa_id=p_mesa and m.usuario_id=(select auth.uid()) and m.papel='jogador' and t.mestre_id<>(select auth.uid()));
$$;
create function app_private.tem_personagem_ativa(p_mesa uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select app_private.jogador_admitido(p_mesa) and exists(
  select 1 from public.personagens p where p.mesa_id=p_mesa
  and p.jogador_id=(select auth.uid()) and p.estado_ficha='completa');
$$;
revoke all on function app_private.jogador_admitido(uuid),app_private.tem_personagem_ativa(uuid) from public,anon,authenticated;
grant execute on function app_private.jogador_admitido(uuid),app_private.tem_personagem_ativa(uuid) to authenticated;

-- Mestre nao le ficha completa. Outro jogador precisa ter ativa na mesma Mesa.
alter policy personagens_visualizar on public.personagens using(
 (jogador_id=(select auth.uid()) and app_private.jogador_admitido(mesa_id))
 or (estado_ficha='completa' and app_private.tem_personagem_ativa(mesa_id)
 and exists(select 1 from public.mesa_participantes m join public.mesas t on t.id=m.mesa_id
 where m.mesa_id=personagens.mesa_id and m.usuario_id=personagens.jogador_id
 and m.papel='jogador' and m.usuario_id<>t.mestre_id))
);
alter policy personagens_atualizar on public.personagens
using(jogador_id=(select auth.uid()) and app_private.jogador_admitido(mesa_id))
with check(jogador_id=(select auth.uid()) and app_private.jogador_admitido(mesa_id));

create function app_private.passivos_normais(f public.personagens) returns jsonb
language plpgsql immutable security invoker set search_path='' as $$
declare
 resultado jsonb:='{}'; pericia record; pontos integer; grau integer; valor integer;
begin
 for pericia in select * from (values
 ('Acrobacia',f.agilidade),('Atletismo',f.forca),('Fortitude',f.vigor),('Furtividade',f.agilidade),
 ('Investigação',f.astucia),('Luta',f.forca),('Medicina',f.astucia),('Percepção',f.astucia),
 ('Pontaria',f.agilidade),('Reflexos',f.agilidade),('Sobrevivência',f.astucia),('Vontade',f.astucia)) as p(nome,atributo)
 loop
  valor:=null;
  if jsonb_typeof(f.pontos_pericia_classe)='object'
  and (not(f.pontos_pericia_classe ? pericia.nome)
   or (jsonb_typeof(f.pontos_pericia_classe->pericia.nome)='number'
    and (f.pontos_pericia_classe->pericia.nome)::text ~ '^[0-2]$')) then
   pontos:=coalesce((f.pontos_pericia_classe->>pericia.nome)::integer,0);
   grau:=pontos+case when f.pericia_origem_treinada=pericia.nome then 1 else 0 end;
   if grau<=2 then valor:=10+pericia.atributo+case grau when 2 then 3 when 1 then 2 else 0 end;end if;
  end if;
  resultado:=resultado||jsonb_build_object(pericia.nome,valor);
 end loop;
 return resultado;
end;
$$;
revoke all on function app_private.passivos_normais(public.personagens) from public,anon,authenticated;

-- O desvio de RLS e restrito a uma projecao fechada e autorizacao explicita.
create function app_private.resumo_operacional_mestre(p_mesa uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare resultado jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.mesas t where t.id=p_mesa and t.mestre_id=(select auth.uid())) then
  raise exception 'Acesso ao resumo negado.';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'personagemId',p.id,'nome',p.nome,'classe',case when p.classe='Operador' and lower(btrim(coalesce(p.identidade->>'genero',''))) in('feminino','feminina','mulher','f') then 'Operadora' else p.classe end,'nivel',p.nivel,
  'pv',jsonb_build_object('atual',p.pv_atual,'maximo',p.pv_maximo),
  'sa',jsonb_build_object('atual',p.sa_atual,'maximo',p.sa_maximo),
  'bi',jsonb_build_object('atual',p.bi_atual,'maximo',p.bi_maximo),'defesa',p.defesa,
  'passivos',app_private.passivos_normais(p),'condicoes',null
 ) order by p.criado_em,p.id),'[]'::jsonb) into resultado
 from public.personagens p where p.mesa_id=p_mesa and p.estado_ficha='completa'
 and exists(select 1 from public.mesa_participantes m where m.mesa_id=p.mesa_id
 and m.usuario_id=p.jogador_id and m.papel='jogador' and m.usuario_id<>(select auth.uid()));
 return resultado;
end;
$$;
revoke all on function app_private.resumo_operacional_mestre(uuid) from public,anon,authenticated;
grant execute on function app_private.resumo_operacional_mestre(uuid) to authenticated;

create function public.resumo_operacional_mesa(p_mesa uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select app_private.resumo_operacional_mestre(p_mesa);
$$;
revoke all on function public.resumo_operacional_mesa(uuid) from public,anon,authenticated;
grant execute on function public.resumo_operacional_mesa(uuid) to authenticated;
commit;

