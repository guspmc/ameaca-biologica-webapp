-- PROPOSTA LOCAL — limite concorrente de participantes por Mesa
-- Nao aplicar diretamente em producao. Validar em banco de teste e revisar
-- com o fluxo de convites antes de criar uma migration oficial.
--
-- Regra: no maximo 10 jogadores por Mesa; o Mestre nao ocupa vaga.
-- A linha da Mesa e bloqueada antes da contagem, serializando aprovacoes
-- distintas que disputam a ultima vaga.

create or replace function public.responder_solicitacao_mesa(
  p_solicitacao uuid,
  p_aprovar boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_solicitacao public.solicitacoes_entrada%rowtype;
  v_mesa_id uuid;
  v_total_jogadores integer;
  v_usuario uuid := (select auth.uid());
begin
  if v_usuario is null then
    raise exception 'Autenticacao necessaria.';
  end if;

  if p_aprovar is null then
    raise exception 'Informe se a solicitacao foi aprovada.';
  end if;

  select * into v_solicitacao
  from public.solicitacoes_entrada
  where id = p_solicitacao
  for update;

  if not found
     or not app_private.eh_mestre(v_solicitacao.mesa_id) then
    raise exception 'Solicitacao nao encontrada ou acesso negado.';
  end if;

  if v_solicitacao.status <> 'pendente' then
    raise exception 'Esta solicitacao ja foi avaliada.';
  end if;

  if p_aprovar then
    -- Bloqueio comum a todas as aprovacoes desta Mesa.
    select t.id into v_mesa_id
    from public.mesas t
    where t.id = v_solicitacao.mesa_id
      and t.mestre_id = v_usuario
    for no key update;

    if not found then
      raise exception 'Mesa indisponivel ou acesso negado.';
    end if;

    -- Repeticao idempotente: membro existente nao consome nova vaga.
    if not exists (
      select 1 from public.mesa_participantes p
      where p.mesa_id = v_mesa_id
        and p.usuario_id = v_solicitacao.usuario_id
    ) then
      select count(*)::integer into v_total_jogadores
      from public.mesa_participantes p
      where p.mesa_id = v_mesa_id
        and p.papel = 'jogador';

      if v_total_jogadores >= 10 then
        raise exception 'Esta Mesa ja atingiu o limite de 10 jogadores.';
      end if;

      insert into public.mesa_participantes
        (mesa_id, usuario_id, papel, apelido)
      values
        (v_mesa_id, v_solicitacao.usuario_id, 'jogador', v_solicitacao.apelido)
      on conflict (mesa_id, usuario_id) do nothing;
    end if;
  end if;

  update public.solicitacoes_entrada
  set status = case when p_aprovar then 'aprovada' else 'recusada' end,
      respondida_em = now()
  where id = p_solicitacao;
end;
$$;

-- Inclusao de jogadores passa a ocorrer somente pela RPC acima.
-- O trigger SECURITY DEFINER registrar_mestre continua podendo inserir
-- o Mestre automaticamente ao criar a Mesa.
drop policy if exists participantes_adicionar
  on public.mesa_participantes;

revoke insert on public.mesa_participantes
  from public, anon, authenticated;

-- Mantem apenas os privilegios usados pela interface atual.
grant select, delete on public.mesa_participantes
  to authenticated;

revoke all on function public.responder_solicitacao_mesa(uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.responder_solicitacao_mesa(uuid,boolean)
  to authenticated;
