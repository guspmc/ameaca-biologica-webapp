-- PACOTE DE COMPOSICAO LOCAL PARA TESTES AUTOMATIZADOS.
-- ATENCAO: NAO E MIGRACAO E NAO DEVE SER APLICADO A UM PROJETO SUPABASE.
-- Combina propostas existentes para verificar dependencias e ordem numa transacao.
-- Antes de qualquer migracao: reconciliar historico local/remoto, revisar RLS e obter checkpoint explicito.

begin;

-- ============================================================================
-- FONTE: supabase/proposals/inventario-instancias.sql
-- ETAPA: Inventário por instância
-- ============================================================================
-- PROTOTIPO LOCAL. Sem API publica, ativacao ou aplicacao remota autorizada.

create table app_private.materializacoes_inventario(
 personagem_id uuid primary key references public.personagens(id) on delete cascade,
 fonte jsonb not null, quantidade_instancias integer not null default 0 check(quantidade_instancias>=0)
);
create table app_private.inventario_instancias(
 id uuid primary key default gen_random_uuid(),
 personagem_id uuid not null references app_private.materializacoes_inventario(personagem_id) on delete cascade,
 chave_criacao text not null, dados jsonb not null check(jsonb_typeof(dados)='object'),
 unique(personagem_id,chave_criacao)
);
alter table app_private.materializacoes_inventario enable row level security;
alter table app_private.inventario_instancias enable row level security;
revoke all on app_private.materializacoes_inventario,app_private.inventario_instancias from public,anon,authenticated;
create function app_private.catalogo_inventario_criacao(p_id text) returns jsonb
language sql immutable security invoker set search_path='' as $$
 select '{"gazua-profissional":{"nome":"Gazua Profissional","estado":{"tipo":"ferramenta"}},"hatchet":{"nome":"Hatchet","estado":{"tipo":"arma_corpo","durabilidadeAtual":null,"durabilidadeMaxima":null,"indestrutivel":true,"arremessavel":true,"equipada":false}},"erva-verde":{"nome":"Erva Verde","estado":{"tipo":"consumivel"}},"lanterna-simples":{"nome":"Lanterna Simples","estado":{"tipo":"lanterna","equipada":false}},"sentinel-nine":{"nome":"Sentinel Nine","estado":{"tipo":"arma_fogo","calibre":"9mm","carregada":19,"capacidade":19,"equipada":false}},"colete-acolchoado":{"nome":"Colete Acolchoado","estado":{"tipo":"colete","equipado":false}},"jmb-hp3":{"nome":"JMB Hp3","estado":{"tipo":"arma_fogo","calibre":"9mm","carregada":13,"capacidade":13,"equipada":false}},"moedas":{"nome":"Moedas Antigas","estado":{"tipo":"moedas","limiteBloco":3}},"kit-socorros":{"nome":"Kit de Primeiros Socorros","estado":{"tipo":"ferramenta"}},"pente-estendido":{"nome":"Pente Estendido 9 mm","estado":{"tipo":"peca","instaladaEm":null}},"bastao":{"nome":"Bastão de Beisebol","estado":{"tipo":"arma_corpo","durabilidadeAtual":2,"durabilidadeMaxima":2,"indestrutivel":false,"arremessavel":false,"equipada":false}},"lemi":{"nome":"LEMI","estado":{"tipo":"arma_fogo","calibre":"9mm","carregada":10,"capacidade":10,"equipada":false}},"kendo":{"nome":"Colete de Placas Kendo","estado":{"tipo":"colete","equipado":false,"placas":0}},"kit-ferramentas":{"nome":"Kit de Ferramentas","estado":{"tipo":"ferramenta"}},"faca":{"nome":"Faca","estado":{"tipo":"arma_corpo","durabilidadeAtual":2,"durabilidadeMaxima":2,"indestrutivel":false,"arremessavel":true,"equipada":false}},"colete-leve":{"nome":"Colete Balístico Leve","estado":{"tipo":"colete","equipado":false}},"municao-9mm":{"nome":"Munição 9 mm","estado":{"tipo":"municao","calibre":"9mm","limitePilha":30}}}'::jsonb->p_id;
$$;
revoke all on function app_private.catalogo_inventario_criacao(text) from public,anon,authenticated;
create function app_private.persistir_inventario_criacao(p_personagem uuid) returns integer
language plpgsql security invoker set search_path='' as $$
declare
 f public.personagens%rowtype; fonte jsonb; anterior record; sementes jsonb:='[]';
 s jsonb; catalogo jsonb; item jsonb; id_item text; qtd integer; restante integer; limite integer;
 indice integer; posicao integer:=0; total integer:=0; saldo integer:=3; compra record; n integer; custo integer;
 capacidade integer;
begin
 if auth.uid() is null then raise exception 'Autenticacao necessaria';end if;
 select * into f from public.personagens p where p.id=p_personagem and p.jogador_id=auth.uid()
 and exists(select 1 from public.mesa_participantes m where m.mesa_id=p.mesa_id and m.usuario_id=auth.uid() and m.papel='jogador') for update;
 if not found then raise exception 'Acesso negado';end if;
 if f.estado_ficha<>'rascunho' or f.nivel<>1 then raise exception 'Somente rascunho nivel 1';end if;
 if f.classe is null or f.classe not in('Agente','Autodidata','Operador') or f.equipamento_inicial is null or f.equipamento_inicial not in('A','B','C') then raise exception 'Classe ou kit invalido';end if;
 if f.forca<0 or f.forca>3 then raise exception 'FOR invalida';end if;
 if f.origem is not null and not(f.origem=any(array['Acadêmico','Agente de Saúde','Amnésico','Atleta','Chef','Cobaia','Criminoso','Desgarrado','Investigador','Lutador','Mercenário','Militar','Mochileiro','Operário','Policial','Servidor Público','Universitária'])) then raise exception 'Origem invalida';end if;
 fonte:=jsonb_build_object('classe',f.classe,'kit',f.equipamento_inicial,'forca',f.forca,'origem',f.origem,'nivel',f.nivel,'compras',f.compras_iniciais);
 select * into anterior from app_private.materializacoes_inventario where personagem_id=f.id;
 if found then
  if anterior.fonte<>fonte then raise exception 'Fonte alterada apos materializacao';end if;
  return anterior.quantidade_instancias;
 end if;
 capacidade:=4+f.forca+case when f.origem='Mochileiro' then 1 else 0 end;
 if f.classe='Agente' then sementes:='[["gazua-profissional",1,"caracteristico",true],["hatchet",1,"caracteristico",true]]';
 elsif f.classe='Autodidata' then sementes:='[["kit-socorros",1,"caracteristico",true],["pente-estendido",1,"caracteristico",true]]';
 else sementes:='[["kendo",1,"caracteristico",true],["kit-ferramentas",1,"caracteristico",true]]';end if;
 sementes:=sementes||'[["erva-verde",1,"comum",false],["lanterna-simples",1,"comum",false]]';
 if f.equipamento_inicial='A' then
  sementes:=sementes||jsonb_build_array(jsonb_build_array(case when f.classe='Agente' then 'sentinel-nine' else 'bastao' end,1,'kit',false),jsonb_build_array('colete-acolchoado',1,'kit',false));
 elsif f.equipamento_inicial='B' then
  sementes:=sementes||jsonb_build_array(jsonb_build_array(case when f.classe='Agente' then 'jmb-hp3' else 'lemi' end,1,'kit',false));
 end if;
 if f.equipamento_inicial='C' then
  for compra in select * from jsonb_each(f.compras_iniciais) order by key collate "C" loop
   custo:=case when compra.key='colete-leve' then 2 when compra.key in('bastao','faca','colete-acolchoado','lanterna-simples','municao-9mm') then 1 else null end;
   if custo is null or jsonb_typeof(compra.value)<>'number' or compra.value::text !~ '^[0-3]$' then raise exception 'Compra invalida';end if;
   n:=compra.value::text::integer;
   saldo:=saldo-custo*n;
   if n>0 then sementes:=sementes||jsonb_build_array(jsonb_build_array(compra.key,n*case when compra.key='municao-9mm' then 15 else 1 end,'compra',false));end if;
  end loop;
  if saldo<0 then raise exception 'Saldo excedido';end if;
  if saldo>0 then sementes:=sementes||jsonb_build_array(jsonb_build_array('moedas',saldo,'saldo',false));end if;
 else
  if f.compras_iniciais<>'{}'::jsonb then raise exception 'Compras exigem kit C';end if;
  if f.equipamento_inicial='B' or f.classe<>'Agente' then sementes:=sementes||'[["moedas",1,"kit",false]]';end if;
 end if;
 insert into app_private.materializacoes_inventario(personagem_id,fonte) values(f.id,fonte);
 for s in select * from jsonb_array_elements(sementes) loop
  id_item:=s->>0;restante:=(s->>1)::integer;indice:=0;
  catalogo:=app_private.catalogo_inventario_criacao(id_item);
  if catalogo is null then raise exception 'Item sem estado conferido';end if;
  limite:=case when id_item='municao-9mm' then 30 when id_item='moedas' then 3 else 1 end;
  while restante>0 loop
   qtd:=least(restante,limite);
   item:=jsonb_build_object('chaveCriacao',(s->>2)||':'||id_item||':'||indice,'catalogoId',id_item,'nome',catalogo->>'nome','quantidade',qtd,
    'espacos',case when (s->>3)::boolean then 0 else 1 end,'local',case when (s->>3)::boolean then 'caracteristico' else 'inventario' end,
    'posicao',case when (s->>3)::boolean then null else posicao end,'vinculadoClasse',(s->>3)::boolean,'estado',catalogo->'estado');
   insert into app_private.inventario_instancias(personagem_id,chave_criacao,dados) values(f.id,item->>'chaveCriacao',item);
   if not(s->>3)::boolean then posicao:=posicao+1;end if;
   total:=total+1;indice:=indice+1;restante:=restante-qtd;
  end loop;
 end loop;
 if posicao>capacidade then raise exception 'Capacidade excedida';end if;
 update app_private.materializacoes_inventario set quantidade_instancias=total where personagem_id=f.id;
 return total;
end;
$$;
revoke all on function app_private.persistir_inventario_criacao(uuid) from public,anon,authenticated;

-- ============================================================================
-- FONTE: supabase/proposals/ativacao-local.sql
-- ETAPA: Ativação transacional
-- ============================================================================
-- PROPOSTA LOCAL, fora das migracoes. Nao aplicar remotamente de forma isolada.
-- Requer inventario-instancias.sql. Sem RPC de ativacao para clientes.

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

-- ============================================================================
-- FONTE: supabase/proposals/resumo-operacional-local.sql
-- ETAPA: Privacidade e resumo operacional
-- ============================================================================
-- PROPOSTA LOCAL de privacidade. Sem aplicacao remota ou integracao de interface.
-- Requer ativacao-local.sql para a rodada integrada de testes.

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
 ('Percepção',f.astucia),('Vontade',f.astucia),('Fortitude',f.vigor),('Reflexos',f.agilidade)) as p(nome,atributo)
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

-- ============================================================================
-- FONTE: supabase/proposals/ciclo-ficha-local.sql
-- ETAPA: Ciclo ativo/arquivado
-- ============================================================================
-- SOMENTE PROPOSTA LOCAL. Requer inventario, ativacao e resumo locais.
-- Nao aplicar remotamente: altera ciclo, exclusao e permissoes existentes.

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

-- ============================================================================
-- FONTE: supabase/proposals/consulta-ativacao-local.sql
-- ETAPA: Consulta e recuperação do recibo
-- ============================================================================
-- PROPOSTA LOCAL DE LEITURA. Requer as propostas de ativacao/resumo/ciclo.
-- Fora das migracoes; nao aplicar remotamente sem checkpoint do conjunto.

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

-- ============================================================================
-- FONTE: supabase/proposals/contexto-criacao-local.sql
-- ETAPA: Contexto de criação da Mesa
-- ============================================================================
-- PROPOSTA LOCAL. Requer ativacao/resumo; sem aplicacao remota autorizada.
-- Escopo: contexto Padrao nivel 1 e disponibilidade de FINALIZACAO, nao encerrar Mesa.

create function app_private.ler_contexto_criacao_autorizado(p_mesa uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c app_private.contextos_criacao_mesa%rowtype;uid uuid:=(select auth.uid());
begin
 if uid is null or not exists(select 1 from public.mesas t where t.id=p_mesa and
 (t.mestre_id=uid or exists(select 1 from public.mesa_participantes m where m.mesa_id=t.id and m.usuario_id=uid and m.papel='jogador'))) then
  raise exception using errcode='42501',message='Contexto indisponivel.';
 end if;
 select * into c from app_private.contextos_criacao_mesa where mesa_id=p_mesa;
 if not found then return jsonb_build_object('mesaId',p_mesa,'preparado',false,'metodo',null,'nivelInicial',null,'permiteFinalizar',false,'revisao',null);end if;
 if c.revisao>9007199254740991 then raise exception using errcode='PT422',message='Contexto fora do escopo.',detail='AB_REGRA';end if;
 return jsonb_build_object('mesaId',p_mesa,'preparado',true,'metodo',c.metodo,'nivelInicial',c.nivel_inicial,'permiteFinalizar',c.permite_criacao,'revisao',c.revisao);
end;
$$;
revoke all on function app_private.ler_contexto_criacao_autorizado(uuid) from public,anon,authenticated;
grant execute on function app_private.ler_contexto_criacao_autorizado(uuid) to authenticated;
create function public.consultar_contexto_criacao(p_mesa uuid) returns jsonb
language sql stable security invoker set search_path='' as $$select app_private.ler_contexto_criacao_autorizado(p_mesa);$$;
revoke all on function public.consultar_contexto_criacao(uuid) from public,anon,authenticated;
grant execute on function public.consultar_contexto_criacao(uuid) to authenticated;

create function app_private.salvar_contexto_criacao_autorizado(p_mesa uuid,p_permite_finalizar boolean,p_revisao bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());c app_private.contextos_criacao_mesa%rowtype;
begin
 if uid is null then raise exception using errcode='42501',message='Contexto indisponivel.';end if;
 -- Mesa antes do contexto. UPDATE tambem serializa insercoes com FK da Mesa,
 -- para nao preparar contexto enquanto uma primeira personagem esta entrando.
 perform 1 from public.mesas where id=p_mesa and mestre_id=uid for update;
 if not found then raise exception using errcode='42501',message='Contexto indisponivel.';end if;
 if p_permite_finalizar is null or (p_revisao is not null and p_revisao not between 0 and 9007199254740991) then
  raise exception using errcode='PT422',message='Configuracao invalida.',detail='AB_REGRA';end if;
 select * into c from app_private.contextos_criacao_mesa where mesa_id=p_mesa for update;
 if not found then
  if p_revisao is not null then raise exception using errcode='PT409',message='Contexto mudou. Consulte novamente.',detail='AB_REVISAO';end if;
  -- Nao presumir metodo/nivel de Mesa legada que ja possui qualquer personagem.
  if exists(select 1 from public.personagens where mesa_id=p_mesa) then
   raise exception using errcode='PT422',message='Mesa com personagens exige preparacao especifica do contexto.',detail='AB_REGRA';end if;
  insert into app_private.contextos_criacao_mesa(mesa_id,metodo,nivel_inicial,permite_criacao) values(p_mesa,'padrao',1,p_permite_finalizar);
 else
  if p_revisao is null or p_revisao<>c.revisao then raise exception using errcode='PT409',message='Contexto mudou. Consulte novamente.',detail='AB_REVISAO';end if;
  if c.metodo<>'padrao' or c.nivel_inicial<>1 then raise exception using errcode='PT422',message='Metodo ou nivel exige fluxo especifico.',detail='AB_REGRA';end if;
  if c.permite_criacao is distinct from p_permite_finalizar then
   if c.revisao>=9007199254740991 then raise exception using errcode='PT422',message='Revisao fora do escopo.',detail='AB_REGRA';end if;
   update app_private.contextos_criacao_mesa set permite_criacao=p_permite_finalizar where mesa_id=p_mesa;
  end if;
 end if;
 return app_private.ler_contexto_criacao_autorizado(p_mesa);
exception
 when insufficient_privilege then raise exception using errcode='42501',message='Contexto indisponivel.';
 when sqlstate 'PT409' or sqlstate 'PT422' then raise;
 when others then raise exception using errcode='PT500',message='Nao foi possivel confirmar a configuracao. Consulte novamente.',detail='AB_INCERTO';
end;
$$;
revoke all on function app_private.salvar_contexto_criacao_autorizado(uuid,boolean,bigint) from public,anon,authenticated;
grant execute on function app_private.salvar_contexto_criacao_autorizado(uuid,boolean,bigint) to authenticated;
create function public.salvar_contexto_criacao(p_mesa uuid,p_permite_finalizar boolean,p_revisao bigint) returns jsonb
language sql security invoker set search_path='' as $$select app_private.salvar_contexto_criacao_autorizado(p_mesa,p_permite_finalizar,p_revisao);$$;
revoke all on function public.salvar_contexto_criacao(uuid,boolean,bigint) from public,anon,authenticated;
grant execute on function public.salvar_contexto_criacao(uuid,boolean,bigint) to authenticated;

-- ============================================================================
-- FONTE: supabase/proposals/gateway-ativacao-local.sql
-- ETAPA: Gateway autenticado
-- ============================================================================
-- PROPOSTA LOCAL: requer as propostas de inventario, ativacao, resumo, ciclo e consulta.
-- Nao e migracao, nao aplicar remotamente ou habilitar na aplicacao isoladamente.

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
