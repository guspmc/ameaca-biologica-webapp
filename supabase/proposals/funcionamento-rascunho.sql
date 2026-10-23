-- PROPOSTA LOCAL: aplicar somente apos checkpoint especifico para TESTE.
-- Nenhuma automacao e executada; apenas preferencias de rascunho nivel 1.
begin;
alter table public.personagens
 add column configuracao_funcionamento jsonb not null default '{"modo":"misto","preferenciasMisto":{"municao":true,"inventario":true,"duracaoEfeitos":true,"biInfectante":null,"durabilidadeAparar":null}}'::jsonb check(jsonb_typeof(configuracao_funcionamento)='object'),
 add column revisao_funcionamento integer not null default 0 check(revisao_funcionamento>=0);
revoke update(configuracao_funcionamento,revisao_funcionamento) on public.personagens from public,anon,authenticated;
create function public.salvar_funcionamento_rascunho(p_personagem uuid,p_configuracao jsonb,p_revisao integer)
returns integer language plpgsql security definer set search_path='' as $$
declare v_f public.personagens%rowtype; v_p jsonb; v_chave text; v_valor jsonb;
begin
 if auth.uid() is null then raise exception 'Autenticacao necessaria.';end if;
 select * into v_f from public.personagens f where f.id=p_personagem and f.jogador_id=auth.uid()
 and f.estado_ficha='rascunho' and exists(select 1 from public.mesa_participantes m
 where m.mesa_id=f.mesa_id and m.usuario_id=auth.uid() and m.papel='jogador') for update;
 if not found then raise exception 'Rascunho indisponivel ou acesso negado.';end if;
 if v_f.nivel<>1 then raise exception 'Configuracao disponivel apenas no rascunho de nivel 1.';end if;
 if p_revisao is null or p_revisao<0 then raise exception 'Revisao invalida.';end if;
 if p_configuracao is null or jsonb_typeof(p_configuracao)<>'object' then raise exception 'Configuracao invalida.';end if;
 if not(p_configuracao ?& array['modo','preferenciasMisto'])
 or p_configuracao-array['modo','preferenciasMisto']<>'{}'::jsonb
 or jsonb_typeof(p_configuracao->'modo')<>'string'
 or p_configuracao->>'modo' not in ('automatico','misto','manual') then raise exception 'Configuracao invalida.';end if;
 v_p:=p_configuracao->'preferenciasMisto';
 if jsonb_typeof(v_p)<>'object' then raise exception 'Preferencias invalidas.';end if;
 if not(v_p ?& array['municao','inventario','duracaoEfeitos','biInfectante','durabilidadeAparar'])
 or v_p-array['municao','inventario','duracaoEfeitos','biInfectante','durabilidadeAparar']<>'{}'::jsonb then raise exception 'Preferencias invalidas.';end if;
 for v_chave,v_valor in select * from jsonb_each(v_p) loop
  if jsonb_typeof(v_valor)<>'boolean' and not(v_chave in ('biInfectante','durabilidadeAparar') and v_valor='null'::jsonb) then raise exception 'Preferencias invalidas.';end if;
 end loop;
 if p_configuracao=v_f.configuracao_funcionamento and p_revisao in(v_f.revisao_funcionamento,v_f.revisao_funcionamento-1) then return v_f.revisao_funcionamento;end if;
 if p_revisao<>v_f.revisao_funcionamento then raise exception 'Revisao desatualizada. Recarregue antes de salvar.';end if;
 update public.personagens set configuracao_funcionamento=p_configuracao,revisao_funcionamento=revisao_funcionamento+1 where id=v_f.id;
 return v_f.revisao_funcionamento+1;
end;
$$;
revoke all on function public.salvar_funcionamento_rascunho(uuid,jsonb,integer) from public,anon,authenticated;
grant execute on function public.salvar_funcionamento_rascunho(uuid,jsonb,integer) to authenticated;
commit;
