-- SOMENTE PROPOSTA LOCAL. Requer inventario, ativacao e resumo locais.
-- Nao aplicar remotamente: altera ciclo, exclusao e permissoes existentes.
begin;
alter table public.personagens drop constraint personagens_estado_valido;
alter table public.personagens add constraint personagens_estado_valido check(estado_ficha in('rascunho','completa','arquivada'));
alter table public.personagens add column revisao_inventario bigint not null default 0 check(revisao_inventario>=0);
revoke update(revisao_inventario) on public.personagens from public,anon,authenticated;

-- Exclusao da Mesa elimina tambem o contexto e os recibos, sem remover contas.
alter table app_private.contextos_criacao_mesa drop constraint contextos_criacao_mesa_mesa_id_fkey;
alter table app_private.contextos_criacao_mesa add foreign key(mesa_id) references public.mesas(id) on delete cascade;
alter table app_private.ativacoes_ficha drop constraint ativacoes_ficha_mesa_id_fkey;
alter table app_private.ativacoes_ficha add foreign key(mesa_id) references public.mesas(id) on delete cascade;
alter table app_private.ativacoes_ficha drop constraint ativacoes_ficha_personagem_id_fkey;
alter table app_private.ativacoes_ficha add foreign key(personagem_id) references public.personagens(id) on delete cascade;

-- personagem_id permanece a proveniencia da criacao; destino/portador sao atuais.
alter table app_private.inventario_instancias
 add column mesa_id uuid references public.mesas(id) on delete cascade,
 add column portador_id uuid references public.personagens(id) on delete cascade,
 add column destino text not null default 'personagem' check(destino in('personagem','bau','perdido')),
 add column vinculo text not null default 'comum' check(vinculo in('comum','caracteristico','expansao'));
update app_private.inventario_instancias i set mesa_id=p.mesa_id,portador_id=p.id,
 vinculo=case when (i.dados->>'vinculadoClasse')::boolean then 'caracteristico' else 'comum' end
from public.personagens p where p.id=i.personagem_id;
alter table app_private.inventario_instancias alter column mesa_id set not null;
alter table app_private.inventario_instancias add constraint inventario_destino_portador check(
 (destino='personagem' and portador_id is not null) or (destino in('bau','perdido') and portador_id is null));
create index inventario_local_idx on app_private.inventario_instancias(mesa_id,destino,portador_id);
create index inventario_portador_idx on app_private.inventario_instancias(portador_id);

create function app_private.localizar_instancia_nova() returns trigger
language plpgsql security invoker set search_path='' as $$
declare m uuid;
begin
 if tg_op='UPDATE' and (new.personagem_id is distinct from old.personagem_id or new.mesa_id is distinct from old.mesa_id
 or new.id is distinct from old.id or new.chave_criacao is distinct from old.chave_criacao) then raise exception 'Proveniencia da instancia e imutavel.';end if;
 select p.mesa_id into m from public.personagens p where p.id=new.personagem_id;
 if m is null then raise exception 'Origem da instancia indisponivel.';end if;
 if new.mesa_id is null then new.mesa_id:=m;end if;
 if new.mesa_id<>m then raise exception 'Instancia em Mesa divergente.';end if;
 if tg_op='INSERT' and new.destino='personagem' and new.portador_id is null then new.portador_id:=new.personagem_id;end if;
 if new.portador_id is not null and not exists(select 1 from public.personagens p where p.id=new.portador_id and p.mesa_id=new.mesa_id) then raise exception 'Portador em Mesa divergente.';end if;
 if (new.dados->>'vinculadoClasse')::boolean then new.vinculo:='caracteristico';end if;
 return new;
end;
$$;
revoke all on function app_private.localizar_instancia_nova() from public,anon,authenticated;
create trigger localizar_instancia_nova before insert or update on app_private.inventario_instancias
for each row execute function app_private.localizar_instancia_nova();

create function app_private.versionar_inventario_local() returns trigger
language plpgsql security invoker set search_path='' as $$
declare ids uuid[]; alvo uuid;
begin
 if tg_op='INSERT' then ids:=array[new.personagem_id,new.portador_id];
 elsif tg_op='DELETE' then ids:=array[old.personagem_id,old.portador_id];
 else
  if new is not distinct from old then return new;end if;
  ids:=array[old.personagem_id,old.portador_id,new.personagem_id,new.portador_id];
 end if;
 for alvo in select distinct unnest(ids) order by 1 loop
  update public.personagens set revisao_inventario=revisao_inventario+1 where id=alvo;
 end loop;
 if tg_op='DELETE' then return old;end if;return new;
end;
$$;
revoke all on function app_private.versionar_inventario_local() from public,anon,authenticated;
create trigger versionar_inventario_local after insert or update or delete on app_private.inventario_instancias
for each row execute function app_private.versionar_inventario_local();

-- Nao decidir P06 (exclusao individual de completas/arquivadas) por conveniencia.
create function app_private.proteger_exclusao_ficha_local() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.estado_ficha<>'rascunho' and exists(select 1 from public.mesas t where t.id=old.mesa_id) then
  raise exception 'Exclusao individual de ficha completa ou arquivada ainda indisponivel.';
 end if;
 return old;
end;
$$;
revoke all on function app_private.proteger_exclusao_ficha_local() from public,anon,authenticated;
create trigger proteger_exclusao_ficha_local before delete on public.personagens
for each row execute function app_private.proteger_exclusao_ficha_local();

-- Trigger precisa ultrapassar RLS do autor para cumprir a saida/remocao autorizada.
create function app_private.apagar_rascunhos_na_saida_local() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.papel='jogador' then delete from public.personagens p
 where p.mesa_id=old.mesa_id and p.jogador_id=old.usuario_id and p.estado_ficha='rascunho';end if;
 return old;
end;
$$;
revoke all on function app_private.apagar_rascunhos_na_saida_local() from public,anon,authenticated;
create trigger apagar_rascunhos_na_saida_local before delete on public.mesa_participantes
for each row execute function app_private.apagar_rascunhos_na_saida_local();

create table app_private.operacoes_ciclo_ficha(
 operacao_id uuid primary key,personagem_id uuid not null references public.personagens(id) on delete cascade,
 mesa_id uuid not null references public.mesas(id) on delete cascade,
 usuario_id uuid not null references auth.users(id),tipo text not null check(tipo in('arquivar','assumir')),
 revisao_pedida bigint not null,resposta jsonb not null
);
create index ciclo_personagem_idx on app_private.operacoes_ciclo_ficha(personagem_id);
create index ciclo_mesa_idx on app_private.operacoes_ciclo_ficha(mesa_id);
create index ciclo_usuario_idx on app_private.operacoes_ciclo_ficha(usuario_id);
alter table app_private.operacoes_ciclo_ficha enable row level security;
revoke all on app_private.operacoes_ciclo_ficha from public,anon,authenticated;

create function app_private.prever_arquivamento_local(p_personagem uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare f public.personagens%rowtype; itens jsonb;
begin
 if auth.uid() is null then raise exception 'Autenticacao necessaria.';end if;
 select p.* into f from public.personagens p join public.mesas t on t.id=p.mesa_id
 where p.id=p_personagem and t.mestre_id=auth.uid() and p.estado_ficha='completa';
 if not found then raise exception 'Arquivamento indisponivel ou acesso negado.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'nome',i.dados->>'nome','quantidade',i.dados->'quantidade') order by i.id),'[]')
 into itens from app_private.inventario_instancias i
 where i.portador_id=f.id and i.destino='personagem' and i.vinculo='comum';
 return jsonb_build_object('personagemId',f.id,'nome',f.nome,'revisao',f.revisao_criacao,'itensParaBau',itens);
end;
$$;
revoke all on function app_private.prever_arquivamento_local(uuid) from public,anon,authenticated;

create function app_private.executar_ciclo_ficha_local(p_personagem uuid,p_operacao uuid,p_revisao bigint,p_tipo text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare uid uuid:=(select auth.uid()); mesa uuid; f public.personagens%rowtype;
 anterior app_private.operacoes_ciclo_ficha%rowtype; n integer:=0; resposta jsonb; nova bigint;
begin
 if uid is null then raise exception 'Autenticacao necessaria.';end if;
 if p_operacao is null or p_revisao is null or p_revisao<0 or p_tipo is null or p_tipo not in('arquivar','assumir') then raise exception 'Pedido invalido.';end if;
 select p.mesa_id into mesa from public.personagens p join public.mesas t on t.id=p.mesa_id
 where p.id=p_personagem and
 ((p_tipo='arquivar' and t.mestre_id=uid) or (p_tipo='assumir' and t.mestre_id<>uid and
 exists(select 1 from public.mesa_participantes m where m.mesa_id=p.mesa_id and m.usuario_id=uid and m.papel='jogador')));
 if not found then raise exception 'Operacao indisponivel ou acesso negado.';end if;
 perform 1 from public.mesas t where t.id=mesa and
 ((p_tipo='arquivar' and t.mestre_id=uid) or (p_tipo='assumir' and t.mestre_id<>uid)) for no key update;
 if not found then raise exception 'Papel na Mesa alterado; acesso negado.';end if;
 if p_tipo='assumir' then
  perform 1 from public.mesa_participantes m where m.mesa_id=mesa and m.usuario_id=uid and m.papel='jogador' for share;
  if not found then raise exception 'Acesso negado.';end if;
 end if;
 select * into f from public.personagens p where p.id=p_personagem and p.mesa_id=mesa for update;
 if not found then raise exception 'Ficha indisponivel.';end if;
 select * into anterior from app_private.operacoes_ciclo_ficha o where o.operacao_id=p_operacao;
 if found then
  if anterior.personagem_id=f.id and anterior.usuario_id=uid and anterior.tipo=p_tipo and anterior.revisao_pedida=p_revisao
  and (p_tipo='arquivar' or (f.jogador_id=uid and f.estado_ficha='completa')) then return anterior.resposta;end if;
  raise exception 'Operacao anterior ou situacao atual divergente.';
 end if;
 if f.revisao_criacao<>p_revisao then raise exception 'Revisao desatualizada; conferir novamente.';end if;
 if (p_tipo='arquivar' and f.estado_ficha<>'completa') or (p_tipo='assumir' and f.estado_ficha<>'arquivada') then raise exception 'Estado da ficha incompativel.';end if;
 update app_private.contextos_criacao_mesa set sequencia_ativacao=sequencia_ativacao+1 where mesa_id=mesa;
 if not found then raise exception 'Contexto ainda nao preparado.';end if;
 if p_tipo='assumir' then
  if (select count(*) from public.personagens p where p.mesa_id=mesa and p.estado_ficha='completa')>=10 then raise exception 'Limite de dez personagens ativas.';end if;
  update public.personagens set estado_ficha='completa',jogador_id=uid where id=f.id returning revisao_criacao into nova;
 else
  -- Move as mesmas linhas/IDs; o JSON integral conserva arma, pecas e municao.
  update app_private.inventario_instancias set destino='bau',portador_id=null
  where portador_id=f.id and destino='personagem' and vinculo='comum';
  get diagnostics n=row_count;
  update public.personagens set estado_ficha='arquivada',jogador_id=null where id=f.id returning revisao_criacao into nova;
 end if;
 resposta:=jsonb_build_object('personagemId',f.id,'operacaoId',p_operacao,'estado',case p_tipo when 'arquivar' then 'arquivada' else 'completa' end,'itensEnviadosBau',n,'revisaoCriacao',nova);
 insert into app_private.operacoes_ciclo_ficha values(p_operacao,f.id,mesa,uid,p_tipo,p_revisao,resposta);
 return resposta;
end;
$$;
revoke all on function app_private.executar_ciclo_ficha_local(uuid,uuid,bigint,text) from public,anon,authenticated;

create function app_private.excluir_rascunho_local(p_personagem uuid,p_revisao bigint,p_confirmado boolean)
returns void language plpgsql security invoker set search_path='' as $$
declare uid uuid:=(select auth.uid()); mesa uuid;
begin
 if uid is null or p_confirmado is distinct from true then raise exception 'Confirmacao explicita necessaria.';end if;
 select p.mesa_id into mesa from public.personagens p
 where p.id=p_personagem and p.jogador_id=uid and p.estado_ficha='rascunho' and app_private.jogador_admitido(p.mesa_id);
 if not found then raise exception 'Rascunho indisponivel ou acesso negado.';end if;
 perform 1 from public.mesas where id=mesa and mestre_id<>uid for no key update;
 if not found then raise exception 'Acesso negado.';end if;
 perform 1 from public.mesa_participantes where mesa_id=mesa and usuario_id=uid and papel='jogador' for share;
 if not found then raise exception 'Acesso negado.';end if;
 perform 1 from app_private.contextos_criacao_mesa where mesa_id=mesa and permite_criacao for share;
 if not found then raise exception 'Criacao indisponivel; rascunho preservado.';end if;
 perform 1 from public.personagens where id=p_personagem and jogador_id=uid and estado_ficha='rascunho' and revisao_criacao=p_revisao for update;
 if not found then raise exception 'Revisao ou estado desatualizado.';end if;
 delete from public.personagens where id=p_personagem;
end;
$$;
revoke all on function app_private.excluir_rascunho_local(uuid,bigint,boolean) from public,anon,authenticated;

create function app_private.sair_mesa_local(p_mesa uuid,p_confirmado boolean) returns void
language plpgsql security invoker set search_path='' as $$
declare uid uuid:=(select auth.uid());
begin
 if uid is null or p_confirmado is distinct from true then raise exception 'Confirmacao explicita necessaria.';end if;
 perform 1 from public.mesas t where t.id=p_mesa and t.mestre_id<>uid for no key update;
 if not found then raise exception 'Saida indisponivel ou acesso negado.';end if;
 perform 1 from public.mesa_participantes m where m.mesa_id=p_mesa and m.usuario_id=uid and m.papel='jogador' for update;
 if not found then raise exception 'Participacao indisponivel.';end if;
 delete from public.mesa_participantes where mesa_id=p_mesa and usuario_id=uid and papel='jogador';
end;
$$;
revoke all on function app_private.sair_mesa_local(uuid,boolean) from public,anon,authenticated;
commit;

