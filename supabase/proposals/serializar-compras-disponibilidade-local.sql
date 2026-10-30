-- PROPOSTA LOCAL: serializar compras iniciais com a disponibilidade da Mesa.
-- NAO aplicar remotamente sem revisao, testes concorrentes e autorizacao especifica.
--
-- Motivo:
-- definir_disponibilidade_inicial bloqueia public.mesas;
-- salvar_compras_rascunho bloqueava public.personagens e depois lia disponibilidade
-- sem bloquear a Mesa. As operacoes podiam se cruzar.
--
-- Ordem adotada: Mesa -> ficha. A ordem e compativel com a ativacao integrada,
-- que tambem bloqueia Mesa antes da ficha. As demais RPCs de edicao de rascunho
-- inspecionadas bloqueiam somente a ficha e nao tentam adquirir lock da Mesa.
--
-- Comportamento preservado:
-- * disponibilidade controla novos salvamentos;
-- * planos ja salvos continuam preservados quando o Mestre bloqueia um item;
-- * uma compra concorrente e ordenada antes ou depois do bloqueio da Mesa;
-- * nenhuma compra e apagada automaticamente.

create or replace function public.salvar_compras_rascunho(
 p_personagem uuid,
 p_plano jsonb,
 p_revisao integer
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
 v_uid uuid := (select auth.uid());
 v_mesa uuid;
 v_f public.personagens%rowtype;
 v_id text;
 v_q jsonb;
 v_n integer;
 v_preco integer;
 v_gasto integer:=0;
 v_espacos integer:=2;
 v_plano jsonb:='{}'::jsonb;
begin
 if v_uid is null then raise exception 'Autenticacao necessaria.'; end if;

 -- Primeira leitura identifica a Mesa sem manter lock da ficha.
 select p.mesa_id into v_mesa
 from public.personagens p
 where p.id=p_personagem
   and p.jogador_id=v_uid
   and p.estado_ficha='rascunho'
   and exists(
     select 1 from public.mesa_participantes m
     where m.mesa_id=p.mesa_id
       and m.usuario_id=v_uid
       and m.papel='jogador'
   );
 if not found then
   raise exception 'Rascunho indisponivel ou acesso negado.';
 end if;

 -- Mesmo lock-base da configuracao de disponibilidade e da ativacao.
 perform 1 from public.mesas m
 where m.id=v_mesa
 for no key update;
 if not found then
   raise exception 'Rascunho indisponivel ou acesso negado.';
 end if;

 -- Revalidar tudo depois do lock da Mesa; somente agora bloquear a ficha.
 select * into v_f
 from public.personagens p
 where p.id=p_personagem
   and p.mesa_id=v_mesa
   and p.jogador_id=v_uid
   and p.estado_ficha='rascunho'
   and exists(
     select 1 from public.mesa_participantes m
     where m.mesa_id=p.mesa_id
       and m.usuario_id=v_uid
       and m.papel='jogador'
   )
 for update;
 if not found then
   raise exception 'Rascunho indisponivel ou acesso negado.';
 end if;

 if v_f.nivel<>1 or v_f.classe is null
   or v_f.equipamento_inicial is distinct from 'C' then
   raise exception 'Compras disponiveis apenas no Personalizado de nivel 1.';
 end if;
 if p_revisao is null or p_revisao<0 then
   raise exception 'Revisao invalida.';
 end if;
 if p_plano is null or jsonb_typeof(p_plano)<>'object' then
   raise exception 'Plano invalido.';
 end if;

 for v_id,v_q in select * from jsonb_each(p_plano) loop
   v_preco:=case
     when v_id='colete-leve' then 2
     when v_id in ('bastao','faca','colete-acolchoado','lanterna-simples','municao-9mm') then 1
     else null
   end;
   if v_preco is null or jsonb_typeof(v_q)<>'number'
     or v_q::text !~ '^[0-3]$' then
     raise exception 'Item ou quantidade invalida.';
   end if;
   v_n:=(v_q::text)::integer;
   if v_n=0 then continue; end if;

   -- A Mesa continua bloqueada: a disponibilidade nao pode mudar
   -- entre esta leitura e a gravacao do plano.
   if not exists(
     select 1 from app_private.disponibilidade_compra_inicial d
     where d.mesa_id=v_f.mesa_id and d.item_id=v_id
   ) then
     raise exception 'Item indisponivel para compra nesta Mesa.';
   end if;

   v_plano:=v_plano||jsonb_build_object(v_id,v_n);
   v_gasto:=v_gasto+v_preco*v_n;
   v_espacos:=v_espacos+
     case when v_id='municao-9mm' then (v_n*15+29)/30 else v_n end;
 end loop;

 if v_gasto>3 then raise exception 'Saldo insuficiente.'; end if;
 if v_gasto<3 then v_espacos:=v_espacos+1; end if;
 if v_espacos>4+v_f.forca+
   (case when v_f.origem='Mochileiro' then 1 else 0 end) then
   raise exception 'Capacidade insuficiente.';
 end if;

 -- Repeticao idempotente preservada.
 if v_plano=v_f.compras_iniciais
   and p_revisao in (v_f.revisao_compras,v_f.revisao_compras-1) then
   return v_f.revisao_compras;
 end if;
 if p_revisao<>v_f.revisao_compras then
   raise exception 'Revisao desatualizada. Recarregue antes de salvar.';
 end if;

 update public.personagens
 set compras_iniciais=v_plano,
     revisao_compras=revisao_compras+1
 where id=v_f.id;

 return v_f.revisao_compras+1;
end;
$$;

-- Manter a mesma superficie de permissao da funcao substituida.
revoke all on function public.salvar_compras_rascunho(uuid,jsonb,integer)
 from public,anon,authenticated;
grant execute on function public.salvar_compras_rascunho(uuid,jsonb,integer)
 to authenticated;

-- Cenarios obrigatorios antes de qualquer aplicacao:
-- 1. Mestre bloqueia primeiro: compra concorrente aguarda e falha como indisponivel.
-- 2. Jogador salva primeiro: bloqueio do Mestre aguarda; plano fica salvo e preservado.
-- 3. Duas compras simultaneas na mesma ficha: revisao impede sobrescrita silenciosa.
-- 4. Remocao do participante entre leitura inicial e lock: revalidacao nega o salvamento.
-- 5. Ficha muda de kit/estado durante a espera: revalidacao nega ou aplica revisao atual.
-- 6. Duas Mesas distintas: operacoes nao devem bloquear umas as outras.
