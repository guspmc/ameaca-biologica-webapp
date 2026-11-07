-- PROTOTIPO LOCAL. Sem API publica, ativacao ou aplicacao remota autorizada.
begin;
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
commit;
