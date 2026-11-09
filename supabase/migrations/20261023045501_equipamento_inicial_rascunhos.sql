-- Criacao somente. Nao concede inventario ativo, compras ou consumo.
begin;
alter table public.personagens add column equipamento_inicial text
  check (equipamento_inicial in ('A','B','C'));
revoke update (equipamento_inicial) on public.personagens from public,anon,authenticated;

create function public.definir_equipamento_rascunho(p_personagem uuid,p_opcao text)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_usuario uuid := (select auth.uid());
  v_ficha public.personagens%rowtype;
  v_espacos integer;
begin
  if v_usuario is null then raise exception 'Autenticacao necessaria.'; end if;
  select * into v_ficha from public.personagens p
  where p.id=p_personagem and p.jogador_id=v_usuario and p.estado_ficha='rascunho'
    and exists(select 1 from public.mesa_participantes m where m.mesa_id=p.mesa_id
      and m.usuario_id=v_usuario and m.papel='jogador')
  for update;
  if not found then raise exception 'Rascunho indisponivel ou acesso negado.'; end if;
  if v_ficha.nivel<>1 or v_ficha.classe is null then
    raise exception 'Equipamento inicial disponivel apenas para Classe valida no nivel 1.';
  end if;
  if p_opcao is not null and p_opcao not in ('A','B','C') then
    raise exception 'Opcao de equipamento inicial invalida.';
  end if;
  -- Erva + Lanterna; A: arma/colete (+moeda fora de Agente); B: pistola/moeda; C: 3 moedas em um bloco.
  v_espacos := case when p_opcao is null then 0 when p_opcao='C' then 3
    when p_opcao='A' and v_ficha.classe<>'Agente' then 5 else 4 end;
  if v_espacos>4+v_ficha.forca+(case when v_ficha.origem='Mochileiro' then 1 else 0 end) then
    raise exception 'Equipamento excede a capacidade de Inventario. Escolha outra opcao.';
  end if;
  -- Armazena escolha de criacao, sem inserir/duplicar itens ou recalcular recursos.
  update public.personagens set equipamento_inicial=p_opcao where id=v_ficha.id;
end;
$$;
revoke all on function public.definir_equipamento_rascunho(uuid,text) from public,anon,authenticated;
grant execute on function public.definir_equipamento_rascunho(uuid,text) to authenticated;
commit;
