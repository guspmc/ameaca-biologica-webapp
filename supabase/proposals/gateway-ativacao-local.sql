-- PROPOSTA LOCAL: requer as propostas de inventario, ativacao, resumo, ciclo e consulta.
-- Nao e migracao, nao aplicar remotamente ou habilitar na aplicacao isoladamente.
begin;
create function app_private.conferir_espacos_criacao(f public.personagens) returns void
language plpgsql stable security invoker set search_path='' as $$
declare ocupados integer:=2; saldo integer:=3; compra record; n integer; custo integer;
begin
 if f.equipamento_inicial is null or f.equipamento_inicial not in('A','B','C') then raise exception 'Kit pendente.';end if;
 if jsonb_typeof(f.compras_iniciais) is distinct from 'object' then raise exception 'Plano invalido.';end if;
 if f.equipamento_inicial='C' then
  for compra in select * from jsonb_each(f.compras_iniciais) loop
   custo:=case when compra.key='colete-leve' then 2 when compra.key in('bastao','faca','colete-acolchoado','lanterna-simples','municao-9mm') then 1 else null end;
   if custo is null or jsonb_typeof(compra.value)<>'number' or compra.value::text !~ '^[0-3]$' then raise exception 'Compra invalida.';end if;
   n:=compra.value::text::integer;saldo:=saldo-custo*n;
   ocupados:=ocupados+case when compra.key='municao-9mm' then (n*15+29)/30 else n end;
  end loop;
  if saldo<0 then raise exception 'Saldo excedido.';end if;
  if saldo>0 then ocupados:=ocupados+1;end if;
 else
  if f.compras_iniciais<>'{}'::jsonb then raise exception 'Compras exigem kit C.';end if;
  ocupados:=ocupados+case when f.equipamento_inicial='A' then 2 else 1 end;
  if f.equipamento_inicial='B' or f.classe<>'Agente' then ocupados:=ocupados+1;end if;
 end if;
 if ocupados>4+f.forca+(case when f.origem='Mochileiro' then 1 else 0 end) then raise exception 'Capacidade excedida.';end if;
end;
$$;
revoke all on function app_private.conferir_espacos_criacao(public.personagens) from public,anon,authenticated;

create function app_private.conferir_ativacao_autorizada(p_personagem uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());f public.personagens%rowtype;c app_private.contextos_criacao_mesa%rowtype;
 pendencias jsonb:='[]';ativas integer;revisao_mesa bigint:=0;
begin
 if uid is null then raise exception using errcode='42501',message='Acesso indisponivel.';end if;
 select p.* into f from public.personagens p where p.id=p_personagem and p.jogador_id=uid
 and p.estado_ficha in('rascunho','completa')
 and exists(select 1 from public.mesa_participantes m join public.mesas t on t.id=m.mesa_id
 where m.mesa_id=p.mesa_id and m.usuario_id=uid and m.papel='jogador' and t.mestre_id<>uid);
 if not found then raise exception using errcode='42501',message='Acesso indisponivel.';end if;
 select * into c from app_private.contextos_criacao_mesa where mesa_id=f.mesa_id;
 if not found then pendencias:=pendencias||jsonb_build_array('Contexto da Mesa ainda nao preparado.');
 else
  revisao_mesa:=c.revisao;
  if not c.permite_criacao or c.metodo<>'padrao' or c.nivel_inicial<>1 then pendencias:=pendencias||jsonb_build_array('Contexto fora da criacao Padrao de nivel 1.');end if;
 end if;
 if f.revisao_criacao>9007199254740991 or revisao_mesa>9007199254740991
 or (f.estado_ficha='rascunho' and f.revisao_criacao=9007199254740991) then raise exception using errcode='PT422',message='Revisao fora do escopo.',detail='AB_REGRA';end if;
 if f.estado_ficha<>'rascunho' then pendencias:=pendencias||jsonb_build_array('Ficha ja completa. Consulte o resultado da ativacao.');end if;
 select count(*)::integer into ativas from public.personagens where mesa_id=f.mesa_id and estado_ficha='completa';
 if ativas>=10 then pendencias:=pendencias||jsonb_build_array('Mesa com dez ou mais personagens ativas.');end if;
 if (select count(*) from public.mesa_participantes where mesa_id=f.mesa_id and papel='jogador')>10 then pendencias:=pendencias||jsonb_build_array('Mesa excede dez jogadores.');end if;
 begin
  perform app_private.validar_criacao_nivel_um(f);
  perform app_private.conferir_espacos_criacao(f);
 exception when raise_exception then
  -- Mensagens de validadores internos nunca sao projetadas para o cliente.
  pendencias:=pendencias||jsonb_build_array('Revise escolhas, recursos, preferencias e equipamento salvos.');
 end;
 return jsonb_build_object('personagemId',f.id,'nome',f.nome,'revisaoFicha',f.revisao_criacao,'revisaoMesa',revisao_mesa,'ativas',ativas,'pendencias',pendencias);
exception
 when insufficient_privilege then raise exception using errcode='42501',message='Acesso indisponivel.';
 when sqlstate 'PT422' then raise;
 when others then raise exception using errcode='PT500',message='Conferencia indisponivel.',detail='AB_INCERTO';
end;
$$;
revoke all on function app_private.conferir_ativacao_autorizada(uuid) from public,anon,authenticated;
grant execute on function app_private.conferir_ativacao_autorizada(uuid) to authenticated;
create function public.conferir_ativacao_personagem(p_personagem uuid) returns jsonb
language sql stable security invoker set search_path='' as $$select app_private.conferir_ativacao_autorizada(p_personagem);$$;
revoke all on function public.conferir_ativacao_personagem(uuid) from public,anon,authenticated;
grant execute on function public.conferir_ativacao_personagem(uuid) to authenticated;

create function app_private.ativar_personagem_autorizado(p_personagem uuid,p_operacao uuid,p_revisao_ficha bigint,p_revisao_mesa bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare consulta jsonb;conferencia jsonb;resposta jsonb;
begin
 -- A consulta verifica autoria/vinculo atuais antes de revelar estado ou revisoes.
 consulta:=app_private.consultar_resultado_ativacao_autorizado(p_personagem,p_operacao);
 if p_operacao is null or p_revisao_ficha is null or p_revisao_mesa is null
 or p_revisao_ficha not between 0 and 9007199254740991 or p_revisao_mesa not between 0 and 9007199254740991 then
  raise exception using errcode='PT422',message='Pedido invalido.',detail='AB_REGRA';
 end if;
 if consulta->>'situacao'='confirmada' then
  if (consulta->'pedido'->>'revisaoFicha')::bigint<>p_revisao_ficha or (consulta->'pedido'->>'revisaoMesa')::bigint<>p_revisao_mesa then
   raise exception using errcode='PT409',message='Pedido divergente.',detail='AB_PEDIDO_DIVERGENTE';
  end if;
  return consulta->'recibo';
 end if;
 conferencia:=app_private.conferir_ativacao_autorizada(p_personagem);
 if (conferencia->>'revisaoFicha')::bigint<>p_revisao_ficha or (conferencia->>'revisaoMesa')::bigint<>p_revisao_mesa then
  raise exception using errcode='PT409',message='Conferencia desatualizada.',detail='AB_REVISAO';
 end if;
 if jsonb_array_length(conferencia->'pendencias')>0 then raise exception using errcode='PT422',message='Criacao com impedimentos.',detail='AB_REGRA';end if;
 -- O comando interno revalida tudo sob bloqueio e faz estado/itens/recibo atomicos.
 resposta:=app_private.ativar_ficha_local(p_personagem,p_operacao,p_revisao_ficha,p_revisao_mesa);
 -- Projecao fechada tambem para a primeira resposta; nunca retorna JSON interno cru.
 consulta:=app_private.consultar_resultado_ativacao_autorizado(p_personagem,p_operacao);
 if consulta->>'situacao'<>'confirmada' then raise exception using errcode='PT500',message='Resultado indisponivel.',detail='AB_INCERTO';end if;
 return consulta->'recibo';
exception
 when insufficient_privilege then raise exception using errcode='42501',message='Acesso indisponivel.';
 when sqlstate 'PT409' or sqlstate 'PT422' then raise;
 when serialization_failure then raise exception using errcode='40001',message='Operacao interrompida.';
 when others then raise exception using errcode='PT500',message='Resultado indisponivel. Consulte antes de repetir.',detail='AB_INCERTO';
end;
$$;
revoke all on function app_private.ativar_personagem_autorizado(uuid,uuid,bigint,bigint) from public,anon,authenticated;
grant execute on function app_private.ativar_personagem_autorizado(uuid,uuid,bigint,bigint) to authenticated;
create function public.ativar_personagem(p_personagem uuid,p_operacao uuid,p_revisao_ficha bigint,p_revisao_mesa bigint) returns jsonb
language sql security invoker set search_path='' as $$select app_private.ativar_personagem_autorizado(p_personagem,p_operacao,p_revisao_ficha,p_revisao_mesa);$$;
revoke all on function public.ativar_personagem(uuid,uuid,bigint,bigint) from public,anon,authenticated;
grant execute on function public.ativar_personagem(uuid,uuid,bigint,bigint) to authenticated;
commit;
