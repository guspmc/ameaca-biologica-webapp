-- PROPOSTA LOCAL DE LEITURA. Requer as propostas de ativacao/resumo/ciclo.
-- Fora das migracoes; nao aplicar remotamente sem checkpoint do conjunto.
begin;
create function app_private.consultar_resultado_ativacao_autorizado(p_personagem uuid,p_operacao uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=(select auth.uid()); f public.personagens%rowtype; a app_private.ativacoes_ficha%rowtype;
begin
 if uid is null then raise sqlstate '42501' using message='Consulta indisponivel ou acesso negado.';end if;
 select p.* into f from public.personagens p
 where p.id=p_personagem and p.jogador_id=uid and p.estado_ficha in('rascunho','completa')
 and exists(select 1 from public.mesa_participantes m join public.mesas t on t.id=m.mesa_id
 where m.mesa_id=p.mesa_id and m.usuario_id=uid and m.papel='jogador' and t.mestre_id<>uid);
 if not found then raise sqlstate '42501' using message='Consulta indisponivel ou acesso negado.';end if;
 select * into a from app_private.ativacoes_ficha
 where personagem_id=f.id and mesa_id=f.mesa_id and usuario_id=uid;
 if not found then
  -- Ausencia neste snapshot nao prova que outro pedido nao esta em andamento.
  return jsonb_build_object('situacao','sem_recibo','estadoFicha',f.estado_ficha,'pedido',null,'recibo',null);
 end if;
 if p_operacao is not null and p_operacao<>a.operacao_id then
  raise sqlstate 'PT409' using message='Pedido divergente; conferir resultado autorizado.',detail='AB_PEDIDO_DIVERGENTE';
 end if;
 if f.estado_ficha<>'completa' or a.resposta->>'personagemId' is distinct from a.personagem_id::text
 or a.resposta->>'operacaoId' is distinct from a.operacao_id::text or a.resposta->>'estado' is distinct from 'completa'
 or jsonb_typeof(a.resposta->'quantidadeInstancias') is distinct from 'number'
 or (a.resposta->>'quantidadeInstancias') !~ '^[0-9]+$'
 or jsonb_typeof(a.resposta->'revisaoCriacao') is distinct from 'number'
 or (a.resposta->>'revisaoCriacao') !~ '^[0-9]+$' then
  raise sqlstate 'PT422' using message='Resultado indisponivel para conferencia.',detail='AB_RESULTADO_INVALIDO';
 end if;
 if (a.resposta->>'revisaoCriacao')::numeric<=a.revisao_ficha_pedida then
  raise sqlstate 'PT422' using message='Resultado indisponivel para conferencia.',detail='AB_RESULTADO_INVALIDO';
 end if;
 -- Projecao fechada: nao devolver JSON bruto do registro, autoria ou dados da ficha.
 return jsonb_build_object('situacao','confirmada','estadoFicha','completa',
 'pedido',jsonb_build_object('personagemId',f.id,'operacaoId',a.operacao_id,'revisaoFicha',a.revisao_ficha_pedida,'revisaoMesa',a.revisao_mesa_pedida),
 'recibo',jsonb_build_object('personagemId',f.id,'operacaoId',a.operacao_id,'estado','completa',
 'quantidadeInstancias',a.resposta->'quantidadeInstancias','revisaoCriacao',a.resposta->'revisaoCriacao'));
end;
$$;
revoke all on function app_private.consultar_resultado_ativacao_autorizado(uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.consultar_resultado_ativacao_autorizado(uuid,uuid) to authenticated;
create function public.consultar_resultado_ativacao(p_personagem uuid,p_operacao uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.consultar_resultado_ativacao_autorizado(p_personagem,p_operacao);
$$;
revoke all on function public.consultar_resultado_ativacao(uuid,uuid) from public,anon,authenticated;
grant execute on function public.consultar_resultado_ativacao(uuid,uuid) to authenticated;
commit;
