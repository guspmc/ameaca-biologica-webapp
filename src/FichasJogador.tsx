import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PONTOS_CLASSE, PERICIAS_CLASSE, grauPericia, bonusTreinamento, totalPontos } from './pericias';
import { HABILIDADES_BASICAS } from './habilidades';
import EquipamentoRascunho from './EquipamentoRascunho';
import IdentidadeRascunho from './IdentidadeRascunho';

type Mesa = { id: string; nome: string; mestre_id: string };
type Classe = 'Agente' | 'Autodidata' | 'Operador';
type Atributo = 'forca'|'agilidade'|'vigor'|'astucia';
type Recurso = 'PV'|'SA'|'BI'|'DEF';
type Personagem = {
  id:string; nome:string; mesa_id:string; jogador_id:string|null;
  classe:Classe|null; origem:string|null; pericia_origem_treinada:string|null; pericia_origem_extra:string|null; nivel:number;
  forca:number;agilidade:number;vigor:number;astucia:number;
  pv_atual:number|null;pv_maximo:number|null;
  sa_atual:number|null;sa_maximo:number|null;
  bi_atual:number|null;bi_maximo:number|null;defesa:number|null;
  estado_ficha:string;
  pontos_pericia_classe:Record<string,number>;
  habilidade_basica:string|null;
  equipamento_inicial:string|null;
  identidade:Record<string,string>;
};
type Props = {
  supabase:SupabaseClient; usuarioId:string; mesas:Mesa[];
  sinalAtualizacao:number;
};
type Stats = Record<Atributo,number>;
const INICIAIS:Stats = {forca:1,agilidade:1,vigor:1,astucia:1};
const ATRIBUTOS:{chave:Atributo;abreviacao:string}[]=[
  {chave:'forca',abreviacao:'FOR'},
  {chave:'agilidade',abreviacao:'AGI'},
  {chave:'vigor',abreviacao:'VIG'},
  {chave:'astucia',abreviacao:'AST'}
];
const PERICIAS:{nome:string;atributo:Atributo}[]=[
  {nome:'Acrobacia',atributo:'agilidade'},
  {nome:'Atletismo',atributo:'forca'},
  {nome:'Fortitude',atributo:'vigor'},
  {nome:'Furtividade',atributo:'agilidade'},
  {nome:'Investigação',atributo:'astucia'},
  {nome:'Luta',atributo:'forca'},
  {nome:'Medicina',atributo:'astucia'},
  {nome:'Percepção',atributo:'astucia'},
  {nome:'Pontaria',atributo:'agilidade'},
  {nome:'Reflexos',atributo:'agilidade'},
  {nome:'Sobrevivência',atributo:'astucia'},
  {nome:'Vontade',atributo:'astucia'}
];
const ORIGENS:{nome:string;pericias:string[];beneficio:string}[]=[
  {nome:'Acadêmico',pericias:['Investigação','Medicina'],beneficio:'Saber é Poder: 1/Descanso Completo, Vantagem em Teste baseado em AST.'},
  {nome:'Agente de Saúde',pericias:['Medicina','Sobrevivência'],beneficio:'Ao curar aliado com item ou efeito, +1d4 de Cura; não se aplica a si.'},
  {nome:'Amnésico',pericias:[],beneficio:'Vislumbres do Passado: 1/sessão, em local conhecido antes da amnésia, AST DT 10; informação útil e Vantagem no próximo Teste relacionado de Sobrevivência.'},
  {nome:'Atleta',pericias:['Acrobacia','Atletismo'],beneficio:'Por 1 SA, +5 em Teste de Perícia baseado em FOR ou AGI, exceto Luta e Pontaria.'},
  {nome:'Chef',pericias:['Fortitude','Sobrevivência'],beneficio:'Em Sala de Descanso, ao criar item, pode escolher 10 no d20.'},
  {nome:'Cobaia',pericias:['Reflexos','Vontade'],beneficio:'+2 BI Máxima e Vantagem em Reanimação durante Colapso Viral.'},
  {nome:'Criminoso',pericias:['Investigação','Furtividade'],beneficio:'1/Descanso Completo: Vantagem em Investigação ao procurar itens ou recursos.'},
  {nome:'Desgarrado',pericias:['Fortitude','Sobrevivência'],beneficio:'Ao aumentar BI, recebe PV Temporários iguais à metade da BI atual, arredondada para baixo.'},
  {nome:'Investigador',pericias:['Investigação','Percepção'],beneficio:'Por 1 SA, +5 no Teste de Investigação ao procurar uma pista.'},
  {nome:'Lutador',pericias:['Luta','Reflexos'],beneficio:'Ataque Desarmado e Arma Improvisada sobem uma categoria de dado; acumula com Casca-Grossa e não afeta Coronhada.'},
  {nome:'Mercenário',pericias:['Pontaria','Fortitude'],beneficio:'1/Descanso Completo, Reação para sacar arma de fogo carregada e atacar hostil oculto que iria Surpreender; não fica Surpreendido.'},
  {nome:'Militar',pericias:['Pontaria','Percepção'],beneficio:'Após matar inimigo com arma de fogo, Vantagem no primeiro Ataque com arma de fogo no próximo turno.'},
  {nome:'Mochileiro',pericias:['Sobrevivência','Atletismo'],beneficio:'+1 Espaço de Inventário.'},
  {nome:'Operário',pericias:['Fortitude','Atletismo'],beneficio:'Escolha uma Arma Corpo a Corpo semelhante a ferramenta: +1 no Teste de Ataque, Dano soma 2 × FOR em vez de FOR; bônus adicional não multiplica no Crítico.'},
  {nome:'Policial',pericias:['Percepção','Pontaria'],beneficio:'+2 Defesa.'},
  {nome:'Servidor Público',pericias:['Investigação','Vontade'],beneficio:'Ao Ajudar em Perícia Treinada ou Mestre, aliado recebe Vantagem e +2 no Teste.'},
  {nome:'Universitária',pericias:['Medicina','Investigação'],beneficio:'+1 SA Máxima.'}
];
const CLASSES:Classe[]=['Agente','Autodidata','Operador'];
const ABREV:Record<Atributo,string>={forca:'FOR',agilidade:'AGI',vigor:'VIG',astucia:'AST'};

export default function FichasJogador({supabase,usuarioId,mesas,sinalAtualizacao}:Props){
  const [personagens,setPersonagens]=useState<Personagem[]>([]);
  const [carregando,setCarregando]=useState(true);
  const [criando,setCriando]=useState(false);
  const [erro,setErro]=useState('');
  const [mensagem,setMensagem]=useState('');
  const [nome,setNome]=useState('');
  const [classe,setClasse]=useState<Classe>('Agente');
  const [stats,setStats]=useState<Stats>({...INICIAIS});
  const [mesaId,setMesaId]=useState('');
  const [abertoId,setAbertoId]=useState<string|null>(null);
  const [recursoAberto,setRecursoAberto]=useState<Recurso|null>(null);
  const [secaoAtiva,setSecaoAtiva]=useState('perfil');
  const [salvando,setSalvando]=useState(false);
  const [origemEscolhida,setOrigemEscolhida]=useState('');
  const [periciaTreinada,setPericiaTreinada]=useState('');
  const [periciaExtra,setPericiaExtra]=useState('');
  const [salvandoOrigem,setSalvandoOrigem]=useState(false);
  const [erroOrigem,setErroOrigem]=useState('');
  const [avisoOrigem,setAvisoOrigem]=useState('');
  const [distribuicao,setDistribuicao]=useState<Record<string,number>>({});
  const [salvandoPericias,setSalvandoPericias]=useState(false);
  const [erroPericias,setErroPericias]=useState('');
  const [avisoPericias,setAvisoPericias]=useState('');
  const [habilidadeEscolhida,setHabilidadeEscolhida]=useState('');
  const [salvandoHabilidade,setSalvandoHabilidade]=useState(false);
  const [erroHabilidade,setErroHabilidade]=useState('');
  const [avisoHabilidade,setAvisoHabilidade]=useState('');

  const carregar=useCallback(async()=>{
    const {data,error}=await supabase.from('personagens')
      .select('id,nome,mesa_id,jogador_id,classe,origem,pericia_origem_treinada,pericia_origem_extra,pontos_pericia_classe,habilidade_basica,equipamento_inicial,identidade,nivel,forca,agilidade,vigor,astucia,pv_atual,pv_maximo,sa_atual,sa_maximo,bi_atual,bi_maximo,defesa,estado_ficha')
      .order('criado_em',{ascending:false});
    if(error)setErro('Erro ao carregar personagens: '+error.message);
    else{setPersonagens((data??[]) as Personagem[]);setErro('');}
    setCarregando(false);
  },[supabase]);

  useEffect(()=>{void carregar();},[carregar,sinalAtualizacao]);
  const minhasMesas=useMemo(()=>mesas.filter(m=>m.mestre_id!==usuarioId),[mesas,usuarioId]);
  const mesaEscolhida=minhasMesas.some(m=>m.id===mesaId)?mesaId:(minhasMesas[0]?.id??'');
  const rascunhosNaMesa=personagens.filter(p=>p.mesa_id===mesaEscolhida&&p.jogador_id===usuarioId&&p.estado_ficha==='rascunho').length;
  const disponiveis=mesas.length>0;
  const pontos=7-(stats.forca+stats.agilidade+stats.vigor+stats.astucia);
  const zeros=Object.values(stats).filter(v=>v===0).length;
  const ficha=personagens.find(p=>p.id===abertoId)??null;
  const dona=ficha?.jogador_id===usuarioId;
  const dadosOrigem=ORIGENS.find(o=>o.nome===origemEscolhida);
  const opcoesOrigem=origemEscolhida==='Amnésico'?PERICIAS.map(p=>p.nome):(dadosOrigem?.pericias??[]);
  const origemFicha=ORIGENS.find(o=>o.nome===ficha?.origem);
  const extraFicha=ficha?.origem==='Amnésico'?ficha.pericia_origem_extra:
    origemFicha?.pericias.find(p=>p!==ficha?.pericia_origem_treinada);
  const permitidasPericia=new Set([...(PERICIAS_CLASSE[ficha?.classe??'']??[]),...(extraFicha?[extraFicha]:[])]);
  const limitePericias=PONTOS_CLASSE[ficha?.classe??'']??0;
  const gastosPericias=totalPontos(distribuicao);
  const habilidadesDaClasse=HABILIDADES_BASICAS.filter(h=>h.classe===ficha?.classe);
  const habilidadeSalva=HABILIDADES_BASICAS.find(h=>h.id===ficha?.habilidade_basica);
  const previaHabilidade=habilidadesDaClasse.find(h=>h.id===habilidadeEscolhida);
  const nomeMesa=(id:string)=>mesas.find(m=>m.id===id)?.nome??'Mesa autorizada';

  function mudarAtributo(chave:Atributo,direcao:-1|1){
    setStats(anterior=>{
      const novo=anterior[chave]+direcao;
      if(novo<0||novo>3)return anterior;
      if(direcao===1 && 7-Object.values(anterior).reduce((a,b)=>a+b,0)<=0)return anterior;
      if(novo===0 && Object.entries(anterior).some(([a,v])=>a!==chave&&v===0))return anterior;
      return {...anterior,[chave]:novo};
    });
  }

  async function criar(evento:FormEvent<HTMLFormElement>){
    evento.preventDefault();setErro('');setMensagem('');
    if(!mesaEscolhida){setErro('Selecione uma Mesa em que você seja jogador.');return;}
    if(rascunhosNaMesa>=3){setErro('Você já possui três rascunhos nesta Mesa. Continue um dos existentes.');return;}
    if(pontos!==0||zeros>1){setErro('Distribua todos os 3 pontos iniciais (ou 4 com um atributo reduzido a 0).');return;}
    setCriando(true);
    const {data,error}=await supabase.rpc('criar_personagem_rascunho',{
      p_mesa:mesaEscolhida,p_nome:nome.trim(),p_classe:classe,
      p_for:stats.forca,p_agi:stats.agilidade,p_vig:stats.vigor,p_ast:stats.astucia
    });
    if(error){setErro('Não foi possível criar o personagem: '+error.message);}
    else {
      setMensagem('Rascunho criado e salvo! Escolha Origem, Perícias e Habilidade Básica na ficha. Equipamento e finalização ainda estão pendentes.');
      setNome('');setStats({...INICIAIS});await carregar();
      if(typeof data==='string'){
        setOrigemEscolhida('');setPericiaTreinada('');setPericiaExtra('');
        setErroOrigem('');setAvisoOrigem('');
        setDistribuicao({});setErroPericias('');setAvisoPericias('');
        setHabilidadeEscolhida('');setErroHabilidade('');setAvisoHabilidade('');
        setAbertoId(data);setRecursoAberto(null);setSecaoAtiva('perfil');
      }
    }
    setCriando(false);
  }

  async function salvarOrigem(){
    if(!ficha||!dona||ficha.estado_ficha!=='rascunho'||salvandoOrigem||salvandoPericias||salvandoHabilidade||salvando)return;
    if(!dadosOrigem||!periciaTreinada||!opcoesOrigem.includes(periciaTreinada)||
      (origemEscolhida==='Amnésico'&&(!periciaExtra||periciaExtra===periciaTreinada))){
      setErroOrigem('Escolha Origem e Perícia Treinada; Amnésico exige duas Perícias distintas.');
      return;
    }
    setErroOrigem('');setAvisoOrigem('');setSalvandoOrigem(true);
    const {error}=await supabase.rpc('definir_origem_rascunho',{
      p_personagem:ficha.id,p_origem:origemEscolhida,p_treinada:periciaTreinada,
      p_extra:origemEscolhida==='Amnésico'?periciaExtra:null
    });
    if(error)setErroOrigem('Não foi possível salvar a Origem: '+error.message);
    else {
      await carregar();
      setAvisoOrigem('Origem e Treinamento salvos no servidor. A ficha continua em rascunho.');
    }
    setSalvandoOrigem(false);
  }

  async function salvarPericias(){
    if(!ficha||!dona||ficha.estado_ficha!=='rascunho'||salvandoPericias||salvandoOrigem||salvandoHabilidade)return;
    setSalvandoPericias(true);setErroPericias('');setAvisoPericias('');
    try{
      const {error}=await supabase.rpc('definir_pericias_rascunho',{
        p_personagem:ficha.id,p_pontos:distribuicao
      });
      if(error){setErroPericias('Não foi possível salvar as Perícias: '+error.message);return;}
      await carregar();
      setAvisoPericias('Distribuição salva. A ficha continua em rascunho.');
    }catch(problema){
      setErroPericias(problema instanceof Error?problema.message:'Não foi possível salvar as Perícias.');
    }finally{setSalvandoPericias(false);}
  }

  async function ajustar(recurso:Recurso,delta:-1|1){
    if(recurso==='DEF')return;
    if(!ficha||!dona||salvando||salvandoHabilidade||salvandoOrigem)return;
    const [campo,maximo]=recurso==='PV'?['pv_atual','pv_maximo']:
      recurso==='SA'?['sa_atual','sa_maximo']:['bi_atual','bi_maximo'];
    const atual=Number(ficha[campo as keyof Personagem]??0);
    const max=Number(ficha[maximo as keyof Personagem]??0);
    const novo=Math.max(0,Math.min(max,atual+delta));
    if(novo===atual)return;
    setSalvando(true);setErro('');
    const {error}=await supabase.from('personagens')
      .update({[campo]:novo}).eq('id',ficha.id).eq('jogador_id',usuarioId);
    if(error)setErro('Falha ao salvar '+recurso+': '+error.message);
    else setPersonagens(ant=>ant.map(p=>p.id===ficha.id?{...p,[campo]:novo}:p));
    setSalvando(false);
  }

  async function salvarHabilidade(){
    if(!ficha||!dona||ficha.estado_ficha!=='rascunho'||salvandoHabilidade||salvandoOrigem||salvandoPericias||salvando)return;
    setSalvandoHabilidade(true);setErroHabilidade('');setAvisoHabilidade('');
    try{
      const {error}=await supabase.rpc('definir_habilidade_rascunho',{
        p_personagem:ficha.id,p_habilidade:habilidadeEscolhida||null
      });
      if(error){setErroHabilidade('Não foi possível salvar a Habilidade: '+error.message);return;}
      await carregar();
      setAvisoHabilidade('Escolha salva. A ficha continua em rascunho.');
    }catch(problema){setErroHabilidade(problema instanceof Error?problema.message:'Falha ao salvar Habilidade.');}
    finally{setSalvandoHabilidade(false);}
  }

  function abrirFicha(id:string){
    const registro=personagens.find(p=>p.id===id);
    setOrigemEscolhida(registro?.origem??'');
    setPericiaTreinada(registro?.pericia_origem_treinada??'');
    setPericiaExtra(registro?.pericia_origem_extra??'');
    setErroOrigem('');setAvisoOrigem('');
    setDistribuicao({...registro?.pontos_pericia_classe});setErroPericias('');setAvisoPericias('');
    setHabilidadeEscolhida(registro?.habilidade_basica??'');setErroHabilidade('');setAvisoHabilidade('');
    setAbertoId(id);setRecursoAberto(null);setSecaoAtiva('perfil');
  }
  function irPara(secao:string){
    setSecaoAtiva(secao);
    document.getElementById('ficha-'+secao)?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  useEffect(()=>{
    if(!abertoId)return;
    function esc(e:KeyboardEvent){if(e.key==='Escape')setAbertoId(null);}
    window.addEventListener('keydown',esc);
    return ()=>window.removeEventListener('keydown',esc);
  },[abertoId]);

  return <section className="area-fichas" aria-labelledby="titulo-fichas">
    <div className="titulo-area">
      <span className="sobretitulo"><i/> ARQUIVO DE SOBREVIVENTES</span>
      <h2 id="titulo-fichas">Ficha do Jogador</h2>
      <p className="secundario">Personagens vinculados à Mesa, com dados persistentes. A ficha completa continua em desenvolvimento.</p>
    </div>
    <div className="grade-fichas">
      <section className="cartao cartao-padrao">
        <p className="rotulo">NOVO SOBREVIVENTE</p>
        <h3>Criar rascunho de personagem</h3>
        <p className="secundario">Criação inicial por pontos do Arquivo do Jogador v1.0. Após criar, escolha Origem, Perícias, uma Habilidade Básica e equipamento inicial. A finalização ainda está pendente.</p>
        {minhasMesas.length===0 ? <p className="dica">Você precisa ter sido aprovado como jogador em uma Mesa para criar um personagem.</p>:
          <form onSubmit={criar} className="formulario">
            <label>Mesa <select value={mesaEscolhida} onChange={e=>setMesaId(e.target.value)}>
              {minhasMesas.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select></label>
            <label>Nome da personagem
              <input type="text" minLength={2} maxLength={60} required placeholder="Ex.: Claire Redfield" value={nome} onChange={e=>setNome(e.target.value)}/>
            </label>
            <label>Classe <select value={classe} onChange={e=>setClasse(e.target.value as Classe)}>
              {CLASSES.map(c=><option key={c}>{c}</option>)}
            </select></label>
            <div className="criar-atributos">
              <div className="criar-linha"><strong>Atributos iniciais</strong>
                <span className={pontos===0?'pontos-prontos':'pontos-restantes'}>{pontos} ponto(s) restante(s)</span></div>
              <p className="ajuda-atributos">Todos começam em 1. Distribua +3. Opcionalmente reduza um a 0 para obter +1 ponto. Nenhum ultrapassa 3 na criação.</p>
              <div className="criar-grid">{ATRIBUTOS.map(a=><div className="criar-stat" key={a.chave}>
                <small>{a.abreviacao}</small><div className="controle-stat">
                  <button type="button" aria-label={'Diminuir '+a.abreviacao} onClick={()=>mudarAtributo(a.chave,-1)} disabled={stats[a.chave]===0}>−</button>
                  <b>{stats[a.chave]}</b>
                  <button type="button" aria-label={'Aumentar '+a.abreviacao} onClick={()=>mudarAtributo(a.chave,1)} disabled={stats[a.chave]===3||pontos===0}>+</button>
                </div></div>)}</div>
            </div>
            <p className="dica">Rascunhos nesta Mesa: {rascunhosNaMesa}/3. {rascunhosNaMesa>=3?'Continue um dos rascunhos existentes para prosseguir.':''}</p>
            <button className="acao" type="submit" disabled={carregando||criando||pontos!==0||rascunhosNaMesa>=3}>
              {criando?'Salvando...':'+ Criar rascunho'} <span>→</span>
            </button>
          </form>}
        <p className="aviso">Até três rascunhos por jogador em cada Mesa. Rascunhos não ocupam vagas de personagens ativas. A finalização da ficha ainda não está disponível.</p>
      </section>
      <section className="cartao cartao-padrao">
        <div className="linha-titulo"><div><p className="rotulo">REGISTROS</p><h3>Personagens da Mesa</h3></div><button className="botao-claro" type="button" disabled={carregando} onClick={()=>{void carregar();}}>Atualizar</button></div>
        {!disponiveis ? <p className="secundario">Entre numa Mesa para visualizar fichas autorizadas.</p> :
          carregando ? <p className="secundario">Carregando fichas...</p> :
          personagens.length===0 ? <p className="secundario">Ainda não existem fichas nesta Mesa.</p>:
          <ul className="lista-personagens">{personagens.map(p=><li key={p.id}>
            <button type="button" className="abrir-personagem" onClick={()=>abrirFicha(p.id)}>
              <span className="ficha-mini-selo">{p.classe?.slice(0,1)??'?'}</span>
              <span className="ficha-mini-detalhes">
                <strong>{p.nome}</strong>
                <small>{p.classe??'Classe pendente'} · NÍVEL {p.nivel} · {nomeMesa(p.mesa_id)}</small>
                <span>{p.jogador_id===usuarioId?'SUA PERSONAGEM':'VISUALIZAÇÃO DO MESTRE'} · {p.estado_ficha==='rascunho'?'RASCUNHO':'ATIVA'}</span>
              </span><span className="seta">→</span>
            </button>
          </li>)}</ul>}
      </section>
    </div>
    {erro&&<p className="erro" role="alert">{erro}</p>}
    {mensagem&&<p className="sucesso" role="status">{mensagem}</p>}
    {ficha&&<div className="ficha-fundo" role="presentation">
      <section className="ficha" role="dialog" aria-modal="true" aria-label={'Ficha de '+ficha.nome}>
        <div className="ficha-topo">
          <button type="button" className="ficha-voltar" onClick={()=>setAbertoId(null)}>← Mesas</button>
          <div className="ficha-wordmark">AMEAÇA <span>BIOLÓGICA</span></div>
          <span className="ficha-small-status">{dona?'EDIÇÃO DO JOGADOR':'CONSULTA DO MESTRE'}</span>
        </div>
        <div className="ficha-papel" id="ficha-inicio">
          <header className="ficha-cab">
            <div className="ficha-metadados">REGISTRO DO SOBREVIVENTE <span>· {nomeMesa(ficha.mesa_id)}</span></div>
            <div className="ficha-identidade">
              <div><h2>{ficha.nome}</h2><p>{(ficha.classe??'CLASSE PENDENTE').toUpperCase()} · NÍVEL {ficha.nivel} · {ficha.origem??'ORIGEM PENDENTE'}</p></div>
              <div className="ficha-carimbo">ARQUIVO<br/>PESSOAL</div>
            </div>
            <p className="ficha-status"><i/> {ficha.estado_ficha==='rascunho'?'RASCUNHO EM CONSTRUÇÃO':'PERSONAGEM ATIVA'}
              {!dona?' · SOMENTE LEITURA':''}</p>
            <div className="ficha-recursos">
              {(['PV','SA','BI','DEF'] as Recurso[]).map(recurso=>{
                const atual=recurso==='PV'?ficha.pv_atual:recurso==='SA'?ficha.sa_atual:recurso==='BI'?ficha.bi_atual:ficha.defesa;
                const max=recurso==='PV'?ficha.pv_maximo:recurso==='SA'?ficha.sa_maximo:recurso==='BI'?ficha.bi_maximo:null;
                return <button className={'ficha-recurso '+(recursoAberto===recurso?'selecionado':'')}
                  type="button" key={recurso} onClick={()=>setRecursoAberto(recursoAberto===recurso?null:recurso)}>
                  <span aria-hidden="true">{recurso==='PV'?'♥':recurso==='SA'?'ϟ':recurso==='BI'?'☣':'⬡'}</span>
                  <strong>{atual??'—'}{max!==null&&<small>/{max??'—'}</small>}</strong>
                  <label>{recurso}</label>
                </button>;
              })}
            </div>
            {recursoAberto&&<div className="ficha-contexto">
              <div className="ficha-contexto-topo"><strong>{recursoAberto==='DEF'?'Defesa':'Ajustar '+recursoAberto}</strong>
                <button type="button" onClick={()=>setRecursoAberto(null)}>✕</button></div>
              {recursoAberto==='DEF'?
                <p>Defesa: 10 + AGI{ficha.origem==='Policial'?' + 2 da Origem Policial':''}. Equipamento, Habilidades e Condições ainda não foram aplicados neste rascunho.</p>:
                <><p>Alterações salvas no Supabase e visíveis na sessão do Mestre.</p>
                  {dona?<div className="ficha-ajustes">
                    <button type="button" disabled={salvando||salvandoHabilidade||salvandoOrigem} onClick={()=>{void ajustar(recursoAberto,-1)}}>− 1 {recursoAberto}</button>
                    <button type="button" disabled={salvando||salvandoHabilidade||salvandoOrigem} onClick={()=>{void ajustar(recursoAberto,1)}}>+ 1 {recursoAberto}</button>
                  </div>:<p>Somente o jogador proprietário pode alterar este recurso.</p>}</>}
            </div>}
            <div className="ficha-condicoes">CONDIÇÕES <span>Nenhuma condição cadastrada · recurso futuro</span></div>
          </header>
          <section className="ficha-secao" id="ficha-perfil">
            <h3><span>01</span> Características <small>AB-01</small></h3>
            <div className="ficha-fatos">
              <div><small>CLASSE</small><strong>{ficha.classe??'A definir'}</strong></div>
              <div><small>ORIGEM</small><strong>{ficha.origem??'A definir'}</strong></div>
              <div><small>NÍVEL</small><strong>{ficha.nivel}</strong></div>
              <div><small>ESTADO</small><strong>Rascunho</strong></div>
            </div>
            <details>
              <summary>Origem e benefício {ficha.origem?'· '+ficha.origem:'· pendente'}</summary>
              {ficha.origem&&<p><strong>Benefício:</strong> {ORIGENS.find(o=>o.nome===ficha.origem)?.beneficio}</p>}
              {ficha.pericia_origem_treinada&&<p>Treinamento gratuito: <strong>{ficha.pericia_origem_treinada}</strong>. {ficha.origem==='Amnésico'&&ficha.pericia_origem_extra?'Outra Perícia escolhida: '+ficha.pericia_origem_extra+'.':''}</p>}
              {dona&&ficha.estado_ficha==='rascunho'&&<div className="formulario">
                <label>Escolher Origem
                  <select value={origemEscolhida} onChange={e=>{setOrigemEscolhida(e.target.value);setPericiaTreinada('');setPericiaExtra('');setAvisoOrigem('');}}>
                    <option value="">Selecione uma Origem</option>
                    {ORIGENS.map(o=><option key={o.nome} value={o.nome}>{o.nome}</option>)}
                  </select>
                </label>
                {dadosOrigem&&<p className="ficha-dica">{dadosOrigem.beneficio}</p>}
                {dadosOrigem&&<label>Perícia Treinada gratuitamente
                  <select value={periciaTreinada} onChange={e=>{setPericiaTreinada(e.target.value);if(e.target.value===periciaExtra)setPericiaExtra('');}}>
                    <option value="">Escolha a Perícia</option>
                    {opcoesOrigem.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </label>}
                {origemEscolhida==='Amnésico'&&<label>Segunda Perícia da Origem (opção para a Classe)
                  <select value={periciaExtra} onChange={e=>setPericiaExtra(e.target.value)}>
                    <option value="">Escolha outra Perícia</option>
                    {opcoesOrigem.filter(p=>p!==periciaTreinada).map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </label>}
                {erroOrigem&&<p role="alert" className="erro">{erroOrigem}</p>}
                {avisoOrigem&&<p role="status" className="sucesso">{avisoOrigem}</p>}
                <button type="button" className="acao" disabled={salvandoOrigem||salvandoPericias||salvandoHabilidade||salvando||!dadosOrigem||!periciaTreinada||(origemEscolhida==='Amnésico'&&!periciaExtra)} onClick={()=>{void salvarOrigem();}}>
                  {salvandoOrigem?'Salvando...':'Confirmar Origem'}
                </button>
              </div>}
              <p className="ficha-dica">A Origem concede um Treinamento gratuito. Distribua os pontos da Classe na seção Perícias. Para trocar escolhas de Origem após distribuir pontos, zere a distribuição e salve primeiro. Efeitos condicionais ainda serão integrados.</p>
            </details>
            <details><summary>Habilidade Básica de Classe · {habilidadeSalva?.nome??'pendente'}</summary>
              {habilidadeSalva&&<p><strong>{habilidadeSalva.nome} · {habilidadeSalva.ramo}</strong><br/>{habilidadeSalva.efeito} <small>({habilidadeSalva.referencia})</small></p>}
              {dona&&ficha.estado_ficha==='rascunho'&&(ficha.nivel!==1?
                <p className="ficha-dica">Escolha de Habilidade disponível nesta etapa apenas no nível 1.</p>:
                <div className="formulario">
                  <label>Escolher Habilidade Básica
                    <select value={habilidadeEscolhida} disabled={salvandoHabilidade} onChange={e=>{setHabilidadeEscolhida(e.target.value);setAvisoHabilidade('');}}>
                      <option value="">Sem Habilidade escolhida</option>
                      {habilidadesDaClasse.map(h=><option key={h.id} value={h.id}>{h.nome} · {h.ramo}</option>)}
                    </select>
                  </label>
                  {previaHabilidade&&<p><strong>Prévia da escolha:</strong> {previaHabilidade.efeito}</p>}
                  <p className="ficha-dica">No nível 1, escolha uma Básica da sua Classe. É possível refazer a escolha no rascunho. Parrudo recalcula PV e BI máximos, preservando dano já sofrido; a troca é recusada se descartaria BI acumulada.</p>
                  {erroHabilidade&&<p role="alert" className="erro">{erroHabilidade}</p>}
                  {avisoHabilidade&&<p role="status" className="sucesso">{avisoHabilidade}</p>}
                  <button type="button" className="acao" disabled={salvandoHabilidade||salvandoOrigem||salvandoPericias||salvando||habilidadesDaClasse.length===0} onClick={()=>{void salvarHabilidade();}}>{salvandoHabilidade?'Salvando...':'Salvar Habilidade Básica'}</button>
                </div>)}
              <p className="ficha-dica">Custos, Vantagens, curas e manobras condicionais são referências para declarar em jogo. Nenhuma rolagem, ataque ou consumo é disparado por escolher a Habilidade. Equipamento e finalização ainda estão pendentes.</p>
            </details>
            <IdentidadeRascunho key={ficha.id} supabase={supabase} ficha={ficha} dona={dona} recarregar={carregar}/>
          </section>
          <section className="ficha-secao" id="ficha-pericias">
            <h3><span>02</span> Atributos e Perícias <small>AB-02</small></h3>
            <div className="ficha-atributos">{ATRIBUTOS.map(a=><div key={a.chave}>
              <span>{a.abreviacao}</span><strong>{ficha[a.chave]}</strong>
            </div>)}</div>
            <p className="ficha-dica">Valores salvos: Atributo + Treinamento (Não Treinada +0, Treinada +2, Mestre +3). Outros modificadores ainda não estão configurados.</p>
            <div className="ficha-pericia-grid">{PERICIAS.map(p=>{
              const grau=grauPericia(p.nome,ficha.pericia_origem_treinada,ficha.pontos_pericia_classe??{});
              return <div key={p.nome} className="ficha-pericia">
                <span>{p.nome}<small>{ABREV[p.atributo]} · {grau===2?'MESTRE':grau===1?'TREINADA':'NÃO TREINADA'}{ficha.pericia_origem_treinada===p.nome?' · ORIGEM':''}</small></span>
                <strong>+{ficha[p.atributo]+bonusTreinamento(grau)}</strong>
              </div>;
            })}</div>
            {dona&&ficha.estado_ficha==='rascunho'&&(ficha.nivel!==1?
              <p className="ficha-dica">Distribuição disponível nesta etapa apenas para criação no nível 1.</p>:
              !ficha.origem||!ficha.pericia_origem_treinada?<p className="ficha-dica">Salve a Origem e o Treinamento gratuito antes de distribuir pontos.</p>:
              <details open><summary>Distribuir Pontos de Perícia da Classe</summary>
                <div className="formulario">
                  <p>{ficha.classe}: {gastosPericias}/{limitePericias} pontos usados · {limitePericias-gastosPericias} restantes.</p>
                  <p className="ficha-dica">Cada ponto sobe um grau; Mestre é o máximo. O Treinamento da Origem é gratuito e apenas a outra opção amplia a lista da Classe. Você pode salvar uma distribuição parcial.</p>
                  {PERICIAS.filter(p=>permitidasPericia.has(p.nome)).map(p=>{
                    const gratis=p.nome===ficha.pericia_origem_treinada?1:0;
                    const atual=distribuicao[p.nome]??0;
                    return <label key={p.nome}>{p.nome}{gratis?' · 1 grau gratuito da Origem':''}
                      <select aria-label={'Pontos da Classe em '+p.nome} value={atual} disabled={salvandoPericias}
                        onChange={e=>{const n=Number(e.target.value);setDistribuicao(ant=>{const novo={...ant};if(n)novo[p.nome]=n;else delete novo[p.nome];return novo;});setAvisoPericias('');}}>
                        {[0,1,2].filter(n=>n+gratis<=2).map(n=><option key={n} value={n} disabled={gastosPericias-atual+n>limitePericias}>
                          {n} ponto(s) · {n+gratis===2?'Mestre':n+gratis===1?'Treinada':'Não Treinada'}
                        </option>)}
                      </select>
                    </label>;
                  })}
                  {erroPericias&&<p role="alert" className="erro">{erroPericias}</p>}
                  {avisoPericias&&<p role="status" className="sucesso">{avisoPericias}</p>}
                  <button type="button" className="acao" disabled={salvandoPericias||salvandoOrigem||salvandoHabilidade||gastosPericias>limitePericias} onClick={()=>{void salvarPericias();}}>{salvandoPericias?'Salvando...':'Salvar Perícias'}</button>
                  <button type="button" className="botao-claro" disabled={salvandoPericias} onClick={()=>{setDistribuicao({});setAvisoPericias('Escolhas zeradas no formulário. Clique em Salvar Perícias para confirmar.');}}>Zerar escolhas de pontos</button>
                </div>
              </details>)}
          </section>
          <section className="ficha-secao" id="ficha-combate">
            <h3><span>03</span> Combate <small>AB-03</small></h3>
            <div className="ficha-combate-bloco">
              <div className="ficha-combate-header">ARMAMENTO <small>AINDA NÃO CADASTRADO</small></div>
              <div className="ficha-combate-info"><div>ATAQUE<strong>—</strong></div><div>DANO<strong>—</strong></div><div>MUNIÇÃO<strong>—</strong></div></div>
              <p>Modos de disparo, recarga, ataque e armas corpo a corpo serão habilitados na ficha ativa. Nenhuma rolagem ou consumo de munição é simulado aqui.</p>
            </div>
            <details><summary>Condições, ferimentos e Reanimação</summary><p>Os efeitos completos serão ligados às regras oficiais nas próximas versões.</p></details>
          </section>
          <section className="ficha-secao" id="ficha-itens">
            <h3><span>04</span> Inventário <small>AB-04</small></h3>
            <EquipamentoRascunho key={ficha.id} supabase={supabase} ficha={ficha} dona={dona} recarregar={carregar}/>
          </section>
          <div className="ficha-rodape">FICHA DO JOGADOR · ALFA 0.4 · RASCUNHO SALVO NO BANCO</div>
        </div>
        <nav className="ficha-nav" aria-label="Atalhos da ficha">
          {([
            ['perfil','◇','PERFIL'],['pericias','▤','PERÍCIAS'],
            ['combate','◎','COMBATE'],['itens','▣','ITENS']
          ] as const).map(([id,icone,rotulo])=>
            <button type="button" key={id} onClick={()=>irPara(id)}
              className={secaoAtiva===id?'ativo':''}><span aria-hidden="true">{icone}</span><small>{rotulo}</small></button>
          )}
        </nav>
      </section>
    </div>}
  </section>;
}
