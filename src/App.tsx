import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import LaboratorioLocal from './LaboratorioLocal';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import Convites, { CONVITE_LOCAL } from './Convites';
import Participantes from './Participantes';
import FichasJogador from './FichasJogador';
import { chavePublica, urlPermitida, escolherConexao, URL_PRODUCAO, type Conexao } from './conexao';
import { limparCacheUsuario, lerMesasOffline, removerSnapshotsDeMesasNaoAutorizadas, salvarMesasOffline } from './offlineCache';

type Mesa = { id: string; nome: string; mestre_id: string; criada_em: string };
type Modo = 'entrar' | 'cadastrar';
const CHAVE_LOCAL = 'ameaca-biologica:conexao-v1';
const URL_INICIAL = URL_PRODUCAO;
const AMBIENTE_TESTE = import.meta.env.VITE_AMBIENTE === 'teste';
const DIAGNOSTICO_AUTH = import.meta.env.DEV || import.meta.env.VITE_DIAGNOSTICO_AUTH === 'true';

function registrarDiagnosticoAuth(evento: string, detalhes: Record<string, unknown> = {}) {
  if (!DIAGNOSTICO_AUTH) return;
  console.info('[AB auth-diagnostico]', {
    evento,
    horario: new Date().toISOString(),
    online: typeof navigator === 'undefined' ? null : navigator.onLine,
    ...detalhes,
  });
}

function metadadosErroAuth(erro: unknown) {
  if (!erro || typeof erro !== 'object') return { erroPresente: Boolean(erro) };
  const detalhe = erro as { name?: unknown; status?: unknown; code?: unknown };
  return {
    erroPresente: true,
    erroTipo: typeof detalhe.name === 'string' ? detalhe.name.slice(0, 80) : 'Error',
    erroStatus: typeof detalhe.status === 'number' ? detalhe.status : null,
    erroCodigo: typeof detalhe.code === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(detalhe.code)
      ? detalhe.code
      : null,
  };
}

function carregarConexao(): Conexao | null {
  let guardada: string | null = null;
  try {
    if (!AMBIENTE_TESTE) guardada = localStorage.getItem(CHAVE_LOCAL);
  } catch { /* Navegador sem armazenamento local */ }
  return escolherConexao({ teste: AMBIENTE_TESTE, guardada,
    url: import.meta.env.VITE_SUPABASE_URL,
    chave: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY });
}

function cabecalho(identificacao: string) {
  return <header className="topo">
    <div className="topo-interno">
      <span className="marca" aria-hidden="true">AB</span>
      <div className="nome-marca"><strong>AMEAÇA BIOLÓGICA</strong><small>RPG DE HORROR E SOBREVIVÊNCIA</small></div>
      <span className="tag">{identificacao}</span>
    </div>
  </header>;
}

function Configurar({ pronto }: { pronto: (dados: Conexao) => void }) {
  const [url, setUrl] = useState(URL_INICIAL);
  const [chave, setChave] = useState('');
  const [erro, setErro] = useState('');

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = { url: url.trim().replace(/\/$/, ''), chave: chave.trim() };
    if (!urlPermitida(dados.url)) { setErro('Use uma URL HTTPS válida para o Supabase.'); return; }
    if (!chavePublica(dados.chave)) {
      setErro('Informe apenas a Publishable key (sb_publishable_...) ou a chave anon pública. Nunca uma secret key.');
      return;
    }
    try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(dados)); } catch {
      setErro('Este navegador não permitiu salvar a conexão.');
      return;
    }
    pronto(dados);
  }

  return <main className="entrada">
    <section className="apresentacao">
      <span className="sobretitulo"><i /> PORTAL DE ACESSO · ALFA 0.4</span>
      <h1>O incidente<br/><em>começa aqui.</em></h1>
      <p>A primeira central de Mesas do RPG Ameaça Biológica. Gratuita, acessível e independente de servidores proprietários.</p>
      <span className="nota-lateral">Um protocolo de cada vez. ☣</span>
    </section>
    <section className="cartao painel-entrada">
      <p className="rotulo">ETAPA 01 · CONFIGURAÇÃO</p>
      <h2>Conectar ao banco</h2>
      <p className="secundario">A primeira conexão é feita neste navegador. Depois vamos distribuí-la automaticamente pelo site, usando apenas dados públicos.</p>
      <form className="formulario" onSubmit={salvar}>
        <label>URL do projeto <input type="url" required value={url} onChange={e => setUrl(e.target.value)} /></label>
        <label>Chave pública (Publishable key)
          <input type="text" required spellCheck={false} autoComplete="off" value={chave} onChange={e => setChave(e.target.value)} placeholder="sb_publishable_..." />
        </label>
        <p className="dica">Encontrada em Supabase → Settings → API Keys. Não coloque aqui senha do banco, token pessoal nem chave secreta.</p>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="acao" type="submit">Salvar conexão <span>→</span></button>
      </form>
    </section>
  </main>;
}

function Autenticacao({ supabase }: { supabase: SupabaseClient }) {
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(''); setAviso('');
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos seis caracteres.'); return; }
    setOcupado(true);
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password: senha,
          options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL }
        });
        if (error) throw error;
        if (!data.session) setAviso('Cadastro solicitado. Verifique o e-mail de confirmação antes de entrar.');
      }
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível autenticar.');
    } finally { setOcupado(false); }
  }

  return <main className="entrada">
    <section className="apresentacao">
      <span className="sobretitulo"><i /> ACESSO CONTROLADO · ALFA 0.4</span>
      <h1>Sobreviver é<br/><em>um trabalho em equipe.</em></h1>
      <p>Entre no sistema, crie uma Mesa e prepare a sua próxima história de horror.</p>
      <div className="modulos"><span>01 / MESAS ONLINE</span><span>02 / ACESSO INDIVIDUAL</span><span>03 / DADOS PROTEGIDOS</span></div>
    </section>
    <section className="cartao painel-entrada">
      <p className="rotulo">IDENTIFICAÇÃO</p>
      <h2>{modo === 'entrar' ? 'Entrar no sistema' : 'Criar conta'}</h2>
      <div className="abas" role="group" aria-label="Tipo de autenticação">
        <button type="button" className={modo==='entrar'?'ativa':''} onClick={()=>{setModo('entrar');setErro('');setAviso('');}}>Entrar</button>
        <button type="button" className={modo==='cadastrar'?'ativa':''} onClick={()=>{setModo('cadastrar');setErro('');setAviso('');}}>Cadastrar</button>
      </div>
      <form className="formulario" onSubmit={enviar}>
        <label>E-mail <input type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Senha <input type="password" required minLength={6} autoComplete={modo==='entrar'?'current-password':'new-password'} placeholder="Mínimo de 6 caracteres" value={senha} onChange={e=>setSenha(e.target.value)} /></label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        {aviso && <p className="sucesso" role="status">{aviso}</p>}
        <button className="acao" type="submit" disabled={ocupado}>{ocupado?'Processando...':modo==='entrar'?'Entrar':'Solicitar cadastro'} <span>→</span></button>
      </form>
      <p className="aviso">No ambiente de testes, o Supabase limita o envio de e-mails. O cadastro público será liberado depois da configuração de e-mail.</p>
    </section>
  </main>;
}

function nomeData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {day:'2-digit', month:'short', year:'numeric'}).format(new Date(data));
}

function Lobby({ supabase, sessao }: { supabase: SupabaseClient; sessao: Session }) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [escolhida, setEscolhida] = useState<Mesa | null>(null);
  const [sinalAtualizacao, setSinalAtualizacao] = useState(0);
  const [estadoRealtime, setEstadoRealtime] = useState<'conectando'|'ao-vivo'|'alternativo'>('conectando');
  const [somenteLeituraOffline, setSomenteLeituraOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [mesasCacheAtualizadoEm, setMesasCacheAtualizadoEm] = useState<string | null>(null);

  const atualizar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cache = await lerMesasOffline(sessao.user.id).catch(() => null);
      if (cache) {
        setMesas(cache.dados); setMesasCacheAtualizadoEm(cache.atualizadoEm); setErro('');
      } else {
        setMesas([]); setErro('Sem conexão e sem uma cópia local das Mesas desta conta.');
      }
      setSomenteLeituraOffline(true);
      if (!silencioso) setCarregando(false);
      return;
    }
    try {
      const {data,error} = await supabase.from('mesas')
        .select('id, nome, mestre_id, criada_em')
        .order('criada_em',{ascending:false});
      if (error) {
        const cache = await lerMesasOffline(sessao.user.id).catch(() => null);
        if (cache) {
          setMesas(cache.dados); setMesasCacheAtualizadoEm(cache.atualizadoEm);
          setErro('Conexão com o servidor indisponível. Exibindo a cópia local, que pode estar desatualizada.');
        } else {
          setMesas([]); setErro('Erro ao carregar Mesas: ' + error.message);
        }
        setSomenteLeituraOffline(true);
      } else {
        const autorizadas = (data ?? []) as Mesa[];
        setMesas(autorizadas); setErro(''); setSomenteLeituraOffline(false);
        const atualizadoEm = await salvarMesasOffline(sessao.user.id, autorizadas).catch(() => null);
        setMesasCacheAtualizadoEm(atualizadoEm);
        await removerSnapshotsDeMesasNaoAutorizadas(sessao.user.id, autorizadas.map(mesa => mesa.id)).catch(() => undefined);
      }
    } catch {
      const cache = await lerMesasOffline(sessao.user.id).catch(() => null);
      if (cache) {
        setMesas(cache.dados); setMesasCacheAtualizadoEm(cache.atualizadoEm);
        setErro('Não foi possível confirmar o acesso online. Exibindo cópia local desatualizada.');
      } else {
        setMesas([]); setErro('Sem resposta do servidor e sem cópia local disponível.');
      }
      setSomenteLeituraOffline(true);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  },[supabase,sessao.user.id]);

  useEffect(()=>{void atualizar();},[atualizar]);
  useEffect(() => {
    const aoFicarOnline = () => { void atualizar(true).finally(() => setSinalAtualizacao(valor => valor + 1)); };
    const aoFicarOffline = () => { setSomenteLeituraOffline(true); void atualizar(true); };
    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);
    return () => {
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  }, [atualizar]);

  // Postgres Changes + RLS: cada conta recebe apenas eventos
  // relativos a linhas que pode consultar. Polling e apenas
  // contingencia quando a rede suspende a conexao do navegador.
  useEffect(() => {
    const notificar = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) { setSomenteLeituraOffline(true); return; }
      void atualizar(true);
      setSinalAtualizacao(valor => valor + 1);
    };
    const canal = supabase.channel('ab-mesas-' + sessao.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, notificar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesa_participantes' }, notificar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitacoes_entrada' }, () => {
        setSinalAtualizacao(valor => valor + 1);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personagens' }, () => {
        setSinalAtualizacao(valor => valor + 1);
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setEstadoRealtime('ao-vivo');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          setEstadoRealtime('alternativo');
        else setEstadoRealtime('conectando');
      });
    const contingencia = window.setInterval(notificar, 30000);
    return () => {
      window.clearInterval(contingencia);
      void supabase.removeChannel(canal);
    };
  }, [supabase, sessao.user.id, atualizar]);

  async function criar(evento:FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (somenteLeituraOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setErro('Criação de Mesas indisponível offline. Nenhuma alteração compartilhada foi enviada.');
      return;
    }
    const valor = nome.trim();
    if (valor.length<2 || valor.length>80) {setErro('Use de 2 a 80 caracteres no nome da Mesa.');return;}
    setCriando(true);setErro('');setAviso('');
    const {error} = await supabase.from('mesas').insert({nome:valor,mestre_id:sessao.user.id});
    if (error) setErro('Falha ao criar Mesa: '+error.message);
    else {setNome('');setAviso('Mesa criada! Em seguida vamos adicionar convites de jogadores.');await atualizar();}
    setCriando(false);
  }

  return <main className="central">
    <div className="cabecalho-central">
      <div><span className="sobretitulo"><i/> CENTRO DE OPERAÇÕES</span><h1>Minhas Mesas</h1><p>Gerencie campanhas em um espaço compartilhado e protegido.</p>
        <span className={'indicador-sync '+(estadoRealtime==='ao-vivo'?'sync-ativo':'')}>
          <i aria-hidden="true" /> {estadoRealtime==='ao-vivo' ? 'Atualizações ao vivo' :
          estadoRealtime==='conectando' ? 'Conectando sincronização...' : 'Atualização automática de contingência'}
        </span></div>
      <div className="conta"><small>USUÁRIO CONECTADO</small><strong>{sessao.user.email??'Conta autenticada'}</strong><button className="link-botao" type="button" onClick={async()=>{
        if(typeof indexedDB!=='undefined'){
          try{await limparCacheUsuario(sessao.user.id);}
          catch{setErro('Não foi possível limpar o cache local. A sessão foi mantida para proteger os dados desta conta. Feche outras abas e tente sair novamente.');return;}
        }
        const {error:erroSaida}=await supabase.auth.signOut();
        if(erroSaida)setErro('Falha ao encerrar a sessão: '+erroSaida.message);
      }}>Sair da conta</button></div>
    </div>
    {somenteLeituraOffline&&<div className="offline-banner" role="status">
      <strong>Modo offline · consulta somente</strong>
      <p>{mesasCacheAtualizadoEm?'Última cópia confirmada: '+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(mesasCacheAtualizadoEm))+'.':'Não há cópia local confirmada das Mesas.'} Dados locais podem estar desatualizados. Criação de Mesas, convites e outras alterações compartilhadas ficam bloqueados.</p>
    </div>}
    <div className="grade">
      <section className="cartao cartao-padrao">
        <p className="rotulo">NOVA OPERAÇÃO</p><h2>Criar Mesa</h2>
        <p className="secundario">Dê um nome à sua campanha. Seu usuário será registrado como Mestre automaticamente.</p>
        <form className="formulario" onSubmit={criar}>
          <label>Nome da Mesa <input type="text" minLength={2} maxLength={80} required disabled={somenteLeituraOffline} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Incidente no Laboratório" /></label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          {aviso && <p className="sucesso" role="status">{aviso}</p>}
          <button className="acao" type="submit" disabled={somenteLeituraOffline||criando}>{criando?'Criando...':'+ Criar Mesa'}</button>
        </form>
        <div className="nota-etapa"><strong>PRÓXIMAS ETAPAS</strong><p>Convites, participantes, Origens, Perícias, Habilidades Básicas e kits iniciais da criação estão disponíveis. Compras, uso de equipamento, combate e finalização serão integrados nas próximas etapas.</p></div>
      </section>
      <section className="cartao cartao-padrao">
        <div className="linha-titulo"><div><p className="rotulo">ARQUIVO DE CAMPANHAS</p><h2>Mesas cadastradas</h2></div><button className="botao-claro" type="button" disabled={carregando} onClick={()=>{void atualizar()}}>Atualizar</button></div>
        {carregando?<p className="vazio">Carregando Mesas...</p>:somenteLeituraOffline&&mesas.length===0?
          <div className="vazio"><h3>Sem cópia local das Mesas</h3><p>Reconecte-se para confirmar as Mesas desta conta. Nenhum dado foi inventado.</p></div>:mesas.length===0?
          <div className="vazio"><div className="simbolo-vazio">+</div><h3>Nenhuma Mesa ainda</h3><p>Crie a primeira campanha para inaugurar o laboratório.</p></div>:
          <ul className="lista-mesas">{mesas.map(mesa=><li key={mesa.id}>
            <button type="button" className="linha-mesa" onClick={()=>setEscolhida(mesa)}>
              <span className="sigla">AB</span>
              <span className="detalhes-mesa"><strong>{mesa.nome}</strong><small>{mesa.mestre_id===sessao.user.id?'VOCÊ É O MESTRE':'PARTICIPANTE'} · {nomeData(mesa.criada_em)}</small></span><span className="seta">→</span>
            </button>
          </li>)}</ul>}
      </section>
    </div>
    <FichasJogador supabase={supabase} usuarioId={sessao.user.id} mesas={mesas}
      sinalAtualizacao={sinalAtualizacao} somenteLeituraOffline={somenteLeituraOffline}/>
    {!somenteLeituraOffline&&<Participantes permitirDisponibilidade={import.meta.env.MODE==='teste'} supabase={supabase} usuarioId={sessao.user.id} mesas={mesas}
      sinalAtualizacao={sinalAtualizacao} aoAtualizarMesas={() => atualizar(true)}/>}
    {!somenteLeituraOffline&&<Convites supabase={supabase} usuarioId={sessao.user.id} mesas={mesas}
      sinalAtualizacao={sinalAtualizacao} aoAtualizarMesas={() => atualizar(true)}/>} 
    {escolhida && <div className="modal-fundo" onClick={()=>setEscolhida(null)}>
      <div className="cartao modal" role="dialog" aria-modal="true" aria-labelledby="mesa-escolhida" onClick={evento=>evento.stopPropagation()}>
        <p className="rotulo">MESA ONLINE</p><h2 id="mesa-escolhida">{escolhida.nome}</h2>
        <p className="secundario">Esta Mesa já está registrada no banco online, protegida pelas políticas de acesso.</p>
        <p className="dica">A Ficha do Jogador aparece na seção de personagens abaixo. O Painel do Mestre e os módulos avançados ainda serão integrados, sem modificar os protótipos congelados.</p>
        <button className="acao" type="button" onClick={()=>setEscolhida(null)}>Voltar às Mesas</button>
      </div>
    </div>}
    <footer>AMEAÇA BIOLÓGICA RPG · TESTE ALFA 0.4 · GRATUITO</footer>
  </main>;
}

function AplicacaoOnline(){
  useEffect(() => {
    const fragmento = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const codigo = fragmento.get('convite')?.trim();
    if (codigo && /^AB-[A-Fa-f0-9]{24}$/.test(codigo)) {
      try { localStorage.setItem(CONVITE_LOCAL, codigo.toUpperCase()); } catch { /* Armazenamento indisponivel */ }
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, []);
  const [conexao, setConexao] = useState<Conexao|null>(carregarConexao);
  const [sessao, setSessao] = useState<Session|null>(null);
  const [verificando, setVerificando] = useState(true);
  const supabase = useMemo(()=>conexao?createClient(conexao.url,conexao.chave):null,[conexao]);

  useEffect(()=>{
    if (!supabase) {setVerificando(false);setSessao(null);return;}
    let ativo=true;
    setVerificando(true);
    const {data:{subscription}}=supabase.auth.onAuthStateChange((evento,nova)=>{
      registrarDiagnosticoAuth('evento-auth', {
        eventoAuth: evento,
        sessaoPresente: Boolean(nova),
      });
      if(ativo){setSessao(nova);setVerificando(false);}
    });
    const aoMudarArmazenamento = (evento: StorageEvent) => {
      const chaveAuth = evento.key !== null && /^sb-.+-auth-token$/.test(evento.key);
      const limpezaTotal = evento.key === null;
      if (chaveAuth || limpezaTotal) {
        registrarDiagnosticoAuth('armazenamento-alterado', {
          chaveAuth,
          limpezaTotal,
          valorAnteriorPresente: evento.oldValue !== null,
          valorNovoPresente: evento.newValue !== null,
        });
      }
    };
    const aoFicarOnline = () => registrarDiagnosticoAuth('rede-online');
    const aoFicarOffline = () => registrarDiagnosticoAuth('rede-offline');
    window.addEventListener('storage', aoMudarArmazenamento);
    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);
    registrarDiagnosticoAuth('getSession-iniciado');
    void supabase.auth.getSession().then(({data,error})=>{
      registrarDiagnosticoAuth('getSession-concluido', {
        sessaoPresente: Boolean(data.session),
        ...metadadosErroAuth(error),
      });
      if(ativo){setSessao(data.session);setVerificando(false);}
    }).catch((erro: unknown)=>{
      registrarDiagnosticoAuth('getSession-rejeitado', metadadosErroAuth(erro));
      if(ativo)setVerificando(false);
    });
    return ()=>{
      ativo=false;
      subscription.unsubscribe();
      window.removeEventListener('storage', aoMudarArmazenamento);
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  },[supabase]);

  return <div className="aplicativo">
    {AMBIENTE_TESTE&&<p className="ambiente-teste" role="status">AMBIENTE DE TESTE · Dados separados da campanha. Use apenas personagens e Mesas fictícias.</p>}
    {cabecalho(sessao?'MESA ONLINE':'ACESSO CONTROLADO')}
    {!conexao?(AMBIENTE_TESTE?<main className="central"><p role="alert">Conexão de teste indisponível. Configure o projeto de teste antes de continuar.</p></main>:<Configurar pronto={setConexao}/>):
      verificando?<main className="central"><p className="secundario">Verificando acesso...</p></main>:
      sessao && supabase?<Lobby supabase={supabase} sessao={sessao}/>:
      supabase?<Autenticacao supabase={supabase}/>:null}
  </div>;
}


export default function App() {
  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get('laboratorio') === 'local') return <LaboratorioLocal />;
  return <AplicacaoOnline />;
}
