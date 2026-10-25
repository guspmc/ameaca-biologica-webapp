-- PROPOSTA LOCAL, fora das migracoes. Nao aplicar remotamente de forma isolada.
-- Requer inventario-instancias.sql. Sem RPC de ativacao para clientes.
begin;
create table app_private.contextos_criacao_mesa(
 mesa_id uuid primary key references public.mesas(id),
 metodo text not null check(metodo in('padrao','casa')),
 nivel_inicial integer not null check(nivel_inicial between 1 and 10),
 permite_criacao boolean not null default false,
 revisao bigint not null default 0 check(revisao>=0),
 sequencia_ativacao bigint not null default 0 check(sequencia_ativacao>=0)
);
alter table app_private.contextos_criacao_mesa enable row level security;
revoke all on app_private.contextos_criacao_mesa from public,anon,authenticated;

alter table public.personagens add column revisao_criacao bigint not null default 0 check(revisao_criacao>=0);
alter table public.personagens add column metodo_criacao text check(metodo_criacao in('padrao','casa'));
revoke update(revisao_criacao) on public.personagens from public,anon,authenticated;
revoke update(metodo_criacao) on public.personagens from public,anon,authenticated;
create function app_private.versionar_criacao() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if (to_jsonb(new)-'revisao_criacao') is distinct from (to_jsonb(old)-'revisao_criacao')
 then new.revisao_criacao:=old.revisao_criacao+1;
 else new.revisao_criacao:=old.revisao_criacao;end if;
 return new;
end;
$$;
revoke all on function app_private.versionar_criacao() from public,anon,authenticated;
create trigger versionar_criacao before update on public.personagens
for each row execute function app_private.versionar_criacao();

create function app_private.versionar_contexto_criacao() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.mesa_id is distinct from old.mesa_id then raise exception 'Mesa do contexto e imutavel.';end if;
 if row(new.metodo,new.nivel_inicial,new.permite_criacao) is distinct from row(old.metodo,old.nivel_inicial,old.permite_criacao)
 then new.revisao:=old.revisao+1;else new.revisao:=old.revisao;end if;
 return new;
end;
$$;
revoke all on function app_private.versionar_contexto_criacao() from public,anon,authenticated;
create trigger versionar_contexto_criacao before update on app_private.contextos_criacao_mesa
for each row execute function app_private.versionar_contexto_criacao();

create table app_private.ativacoes_ficha(
 personagem_id uuid primary key references public.personagens(id),
 operacao_id uuid not null unique,
 mesa_id uuid not null references public.mesas(id),
 usuario_id uuid not null references auth.users(id),
 revisao_ficha_pedida bigint not null check(revisao_ficha_pedida>=0),
 revisao_mesa_pedida bigint not null check(revisao_mesa_pedida>=0),
 resposta jsonb not null check(jsonb_typeof(resposta)='object')
);
create index ativacoes_mesa_idx on app_private.ativacoes_ficha(mesa_id);
create index ativacoes_usuario_idx on app_private.ativacoes_ficha(usuario_id);
create index personagens_ativas_mesa_idx on public.personagens(mesa_id) where estado_ficha='completa';
alter table app_private.ativacoes_ficha enable row level security;
revoke all on app_private.ativacoes_ficha from public,anon,authenticated;

create function app_private.regras_criacao_nivel_um() returns jsonb
language sql immutable security invoker set search_path='' as $$
 select '{"origens":{"Acadêmico":["Investigação","Medicina"],"Agente de Saúde":["Medicina","Sobrevivência"],"Amnésico":[],"Atleta":["Acrobacia","Atletismo"],"Chef":["Fortitude","Sobrevivência"],"Cobaia":["Reflexos","Vontade"],"Criminoso":["Investigação","Furtividade"],"Desgarrado":["Fortitude","Sobrevivência"],"Investigador":["Investigação","Percepção"],"Lutador":["Luta","Reflexos"],"Mercenário":["Pontaria","Fortitude"],"Militar":["Pontaria","Percepção"],"Mochileiro":["Sobrevivência","Atletismo"],"Operário":["Fortitude","Atletismo"],"Policial":["Percepção","Pontaria"],"Servidor Público":["Investigação","Vontade"],"Universitária":["Medicina","Investigação"]},"habilidades":{"anatomia-de-combate":"Agente","nao-vai-escapar":"Agente","rolamento":"Agente","ambidestria":"Autodidata","curiosa":"Autodidata","herbalista":"Autodidata","golpe-sujo":"Operador","armeiro":"Operador","parrudo":"Operador"},"periciasClasse":{"Agente":["Acrobacia","Furtividade","Investigação","Luta","Percepção","Pontaria","Reflexos","Sobrevivência"],"Autodidata":["Furtividade","Investigação","Luta","Medicina","Percepção","Pontaria","Reflexos","Sobrevivência","Vontade"],"Operador":["Atletismo","Fortitude","Investigação","Luta","Percepção","Pontaria"]},"pontosClasse":{"Agente":4,"Autodidata":5,"Operador":3}}'::jsonb;
$$;
revoke all on function app_private.regras_criacao_nivel_um() from public,anon,authenticated;

create function app_private.validar_criacao_nivel_um(f public.personagens) returns void
language plpgsql security invoker set search_path='' as $$
declare
 r jsonb:=app_private.regras_criacao_nivel_um(); opcoes jsonb; permitidas jsonb; extra text;
 item record; n integer; total integer:=0; limite integer; pv integer; sa integer; bi integer; def integer;
 cfg jsonb:=f.configuracao_funcionamento; pref jsonb; tamanho integer;
 todas jsonb:='["Acrobacia","Atletismo","Fortitude","Furtividade","Investigação","Luta","Medicina","Percepção","Pontaria","Reflexos","Sobrevivência","Vontade"]';
begin
 if f.nivel<>1 or f.classe is null or not(r->'pontosClasse' ? f.classe) then raise exception 'Classe ou nivel fora do escopo.';end if;
 if char_length(btrim(coalesce(f.nome,''))) not between 2 and 60 then raise exception 'Nome invalido.';end if;
 if jsonb_typeof(f.identidade) is distinct from 'object' then raise exception 'Identidade invalida.';end if;
 for item in select * from jsonb_each(f.identidade) loop
  tamanho:=case when item.key in('idade','genero') then 40 when item.key in('ocupacao','apelido','afiliacao') then 120
   when item.key in('aparencia','personalidade','objetivo','medo','lacos') then 1000 when item.key='historia' then 4000 end;
  if tamanho is null or jsonb_typeof(item.value)<>'string' or char_length(item.value#>>'{}')>tamanho then raise exception 'Campo narrativo invalido.';end if;
 end loop;
 if f.forca not between 0 and 3 or f.agilidade not between 0 and 3 or f.vigor not between 0 and 3 or f.astucia not between 0 and 3
 or f.forca+f.agilidade+f.vigor+f.astucia<>7
 or ((f.forca=0)::int+(f.agilidade=0)::int+(f.vigor=0)::int+(f.astucia=0)::int)>1 then raise exception 'Atributos invalidos.';end if;
 opcoes:=r->'origens'->f.origem;
 if opcoes is null or f.pericia_origem_treinada is null then raise exception 'Origem ou Treinamento pendente.';end if;
 if f.origem='Amnésico' then
  if not(todas ? f.pericia_origem_treinada) or f.pericia_origem_extra is null
  or not(todas ? f.pericia_origem_extra) or f.pericia_origem_treinada=f.pericia_origem_extra then raise exception 'Escolhas de Amnesico invalidas.';end if;
  extra:=f.pericia_origem_extra;
 else
  if not(opcoes ? f.pericia_origem_treinada) or f.pericia_origem_extra is not null then raise exception 'Origem ou Treinamento invalido.';end if;
  select value into extra from jsonb_array_elements_text(opcoes) where value<>f.pericia_origem_treinada limit 1;
 end if;
 if jsonb_typeof(f.pontos_pericia_classe) is distinct from 'object' then raise exception 'Pericias invalidas.';end if;
 permitidas:=(r->'periciasClasse'->f.classe)||jsonb_build_array(extra);
 limite:=(r->'pontosClasse'->>f.classe)::integer;
 for item in select * from jsonb_each(f.pontos_pericia_classe) loop
  if not(permitidas ? item.key) or jsonb_typeof(item.value)<>'number' or item.value::text !~ '^[0-2]$' then raise exception 'Pericia ou quantidade invalida.';end if;
  n:=item.value::text::integer;
  if n+(case when item.key=f.pericia_origem_treinada then 1 else 0 end)>2 then raise exception 'Grau de Pericia invalido.';end if;
  total:=total+n;
 end loop;
 if total<>limite then raise exception 'Distribua todos os Pontos de Pericia.';end if;
 if f.habilidade_basica is null or (r->'habilidades'->>f.habilidade_basica) is distinct from f.classe then raise exception 'Habilidade Basica pendente ou invalida.';end if;
 pv:=case f.classe when 'Agente' then 10 when 'Autodidata' then 8 else 12 end+f.vigor+case when f.habilidade_basica='parrudo' then 5 else 0 end;
 sa:=f.agilidade+f.astucia+case when f.origem='Universitária' then 1 else 0 end;
 bi:=case f.classe when 'Agente' then 8 when 'Autodidata' then 10 else 6 end+f.astucia+case when f.origem='Cobaia' then 2 else 0 end+case when f.habilidade_basica='parrudo' then 3 else 0 end;
 def:=10+f.agilidade+case when f.origem='Policial' then 2 else 0 end;
 if f.pv_maximo is distinct from pv or f.sa_maximo is distinct from sa or f.bi_maximo is distinct from bi or f.defesa is distinct from def then raise exception 'Derivados divergentes; revisar sem restaurar recursos.';end if;
 if f.pv_atual is null or f.sa_atual is null or f.bi_atual is null or f.pv_atual not between 0 and pv or f.sa_atual not between 0 and sa or f.bi_atual not between 0 and bi then raise exception 'Recursos atuais invalidos.';end if;
 if jsonb_typeof(cfg) is distinct from 'object' then raise exception 'Configuracao invalida.';end if;
 if not(cfg ?& array['modo','preferenciasMisto']) or cfg-array['modo','preferenciasMisto']<>'{}'::jsonb
 or jsonb_typeof(cfg->'modo')<>'string' or cfg->>'modo' not in('misto','manual','automatico') then raise exception 'Configuracao invalida.';end if;
 pref:=cfg->'preferenciasMisto';
 if jsonb_typeof(pref) is distinct from 'object' then raise exception 'Preferencias invalidas.';end if;
 if not(pref ?& array['municao','inventario','duracaoEfeitos','biInfectante','durabilidadeAparar'])
 or pref-array['municao','inventario','duracaoEfeitos','biInfectante','durabilidadeAparar']<>'{}'::jsonb then raise exception 'Preferencias invalidas.';end if;
 for item in select * from jsonb_each(pref) loop
  if jsonb_typeof(item.value)<>'boolean' and not(item.key in('biInfectante','durabilidadeAparar') and item.value='null'::jsonb) then raise exception 'Preferencias invalidas.';end if;
 end loop;
 if cfg->>'modo'='misto' and (pref->'biInfectante'='null'::jsonb or pref->'durabilidadeAparar'='null'::jsonb) then raise exception 'Defina as opcoes pendentes do Misto.';end if;
 if jsonb_typeof(f.compras_iniciais) is distinct from 'object' or f.revisao_compras<0
 or (f.compras_iniciais<>'{}'::jsonb and f.revisao_compras=0) then raise exception 'Plano de compras sem revisao valida.';end if;
 -- Kit, custos, pilhas e capacidade sao derivados novamente na materializacao.
end;
$$;
revoke all on function app_private.validar_criacao_nivel_um(public.personagens) from public,anon,authenticated;

create function app_private.ativar_ficha_local(p_personagem uuid,p_operacao uuid,p_revisao_ficha bigint,p_revisao_mesa bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 uid uuid:=(select auth.uid()); mesa uuid; f public.personagens%rowtype;
 contexto app_private.contextos_criacao_mesa%rowtype; anterior app_private.ativacoes_ficha%rowtype;
 total integer; resposta jsonb; nova_revisao bigint;
begin
 if uid is null then raise exception 'Autenticacao necessaria.';end if;
 if p_operacao is null or p_revisao_ficha is null or p_revisao_mesa is null or p_revisao_ficha<0 or p_revisao_mesa<0 then raise exception 'Operacao ou revisao invalida.';end if;
 -- Nao adquirir bloqueio coletivo para um pedido sem autoria/vinculo.
 select p.mesa_id into mesa from public.personagens p
 where p.id=p_personagem and p.jogador_id=uid
 and exists(select 1 from public.mesa_participantes m join public.mesas t on t.id=m.mesa_id
 where m.mesa_id=p.mesa_id and m.usuario_id=uid and m.papel='jogador' and t.mestre_id<>uid);
 if not found then raise exception 'Ficha indisponivel ou acesso negado.';end if;
 -- Ordem: Mesa -> vinculo -> ficha -> contexto. Serializa o teto sem bloquear
 -- KEY SHARE das FKs de criacao de rascunho (que ja bloqueia o vinculo primeiro).
 perform 1 from public.mesas t where t.id=mesa and t.mestre_id<>uid for no key update;
 if not found then raise exception 'Ficha indisponivel ou acesso negado.';end if;
 perform 1 from public.mesa_participantes m where m.mesa_id=mesa and m.usuario_id=uid and m.papel='jogador' for share;
 if not found then raise exception 'Ficha indisponivel ou acesso negado.';end if;
 select * into f from public.personagens p where p.id=p_personagem and p.mesa_id=mesa and p.jogador_id=uid for update;
 if not found then raise exception 'Ficha indisponivel ou acesso negado.';end if;
 select * into anterior from app_private.ativacoes_ficha a where a.personagem_id=f.id;
 if found then
  if anterior.operacao_id=p_operacao and anterior.usuario_id=uid
  and anterior.revisao_ficha_pedida=p_revisao_ficha and anterior.revisao_mesa_pedida=p_revisao_mesa then return anterior.resposta;end if;
  raise exception 'Ficha ja ativada por outra operacao; nao repetir a criacao.';
 end if;
 if exists(select 1 from app_private.ativacoes_ficha a where a.operacao_id=p_operacao) then raise exception 'Identificador de operacao ja utilizado.';end if;
 if f.estado_ficha<>'rascunho' then raise exception 'Somente rascunhos podem iniciar ativacao.';end if;
 select * into contexto from app_private.contextos_criacao_mesa c where c.mesa_id=mesa for share;
 if not found then raise exception 'Contexto da Mesa ainda nao preparado.';end if;
 if contexto.metodo<>'padrao' or contexto.nivel_inicial<>1 or f.nivel<>1 then raise exception 'Somente criacao Padrao de nivel 1 contemplada.';end if;
 if not contexto.permite_criacao then raise exception 'Mesa nao permite criacao.';end if;
 if f.revisao_criacao<>p_revisao_ficha or contexto.revisao<>p_revisao_mesa then raise exception using errcode='PT409',message='Revisao da ficha ou da Mesa desatualizada; escolhas preservadas.',detail='AB_REVISAO';end if;
 -- Escreve a linha serializadora: snapshots de REPEATABLE READ/SERIALIZABLE
 -- devem abortar ao encontrar versao concorrente, em vez de contar snapshot antigo.
 -- Nao altera a revisao das escolhas da Mesa e nao e executado em repeticao.
 update app_private.contextos_criacao_mesa set sequencia_ativacao=sequencia_ativacao+1 where mesa_id=mesa;
 if (select count(*) from public.mesa_participantes m where m.mesa_id=mesa and m.papel='jogador')>10 then raise exception 'Mesa excede dez jogadores.';end if;
 -- Completas legadas tambem contam; rascunhos nao ocupam vaga ativa.
 if (select count(*) from public.personagens p where p.mesa_id=mesa and p.estado_ficha='completa')>=10 then raise exception 'Limite de dez personagens ativas.';end if;
 perform app_private.validar_criacao_nivel_um(f);
 total:=app_private.persistir_inventario_criacao(f.id);
 update public.personagens set estado_ficha='completa',metodo_criacao='padrao' where id=f.id returning revisao_criacao into nova_revisao;
 resposta:=jsonb_build_object('personagemId',f.id,'operacaoId',p_operacao,'estado','completa','quantidadeInstancias',total,'revisaoCriacao',nova_revisao);
 insert into app_private.ativacoes_ficha(personagem_id,operacao_id,mesa_id,usuario_id,revisao_ficha_pedida,revisao_mesa_pedida,resposta)
 values(f.id,p_operacao,mesa,uid,p_revisao_ficha,p_revisao_mesa,resposta);
 return resposta;
end;
$$;
revoke all on function app_private.ativar_ficha_local(uuid,uuid,bigint,bigint) from public,anon,authenticated;
commit;

