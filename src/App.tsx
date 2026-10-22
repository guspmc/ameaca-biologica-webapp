import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import Convites, { CONVITE_LOCAL } from './Convites';

type Conexao = { url: string; chave: string };
type Mesa = { id: string; nome: string; mestre_id: string; criada_em: string };
type Modo = 'entrar' | 'cadastrar';
const CHAVE_LOCAL = 'ameaca-biologica:conexao-v1';
const URL_INICIAL = 'https://pftuhqioutvwnmvlbtrt.supabase.co';

function chavePublica(chave: string): boolean {
  if (chave.startsWith('sb_publishable_')) return true;
  if (!chave.startsWith('eyJ')) return false;
  try {
    const trecho = chave.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const conteudo = JSON.parse(atob(trecho)) as { role?: string };
    return conteudo.role === 'anon';
  } catch { return false; }
}

function urlPermitida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname));
  } catch { return false; }
}

function carregarConexao(): Conexao | null {
  try {
    const guardada = localStorage.getItem(CHAVE_LOCAL);
    if (guardada) {
      const dados = JSON.parse(guardada) as Conexao;
      if (urlPermitida(dados.url) && chavePublica(dados.chave)) return dados;
    }
  } catch { /* Navegador sem armazenamento local */ }
  const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || URL_INICIAL;
  return chave && chavePublica(chave) && urlPermitida(url) ? { url, chave } : null;
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
      <span className="sobretitulo"><i /> PORTAL DE ACESSO · ALFA 0.2</span>
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
      <span className="sobretitulo"><i /> ACESSO CONTROLADO · ALFA 0.2</span>
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

  const atualizar = useCallback(async () => {
    setCarregando(true);
    const {data,error} = await supabase.from('mesas')
      .select('id, nome, mestre_id, criada_em')
      .order('criada_em',{ascending:false});
    if (error) setErro('Erro ao carregar Mesas: ' + error.message);
    else {setMesas((data ?? []) as Mesa[]); setErro('');}
    setCarregando(false);
  },[supabase]);

  useEffect(()=>{void atualizar();},[atualizar]);

  async function criar(evento:FormEvent<HTMLFormElement>) {
    evento.preventDefault();
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
      <div><span className="sobretitulo"><i/> CENTRO DE OPERAÇÕES</span><h1>Minhas Mesas</h1><p>Gerencie campanhas em um espaço compartilhado e protegido.</p></div>
      <div className="conta"><small>USUÁRIO CONECTADO</small><strong>{sessao.user.email??'Conta autenticada'}</strong><button className="link-botao" type="button" onClick={()=>{void supabase.auth.signOut()}}>Sair da conta</button></div>
    </div>
    <div className="grade">
      <section className="cartao cartao-padrao">
        <p className="rotulo">NOVA OPERAÇÃO</p><h2>Criar Mesa</h2>
        <p className="secundario">Dê um nome à sua campanha. Seu usuário será registrado como Mestre automaticamente.</p>
        <form className="formulario" onSubmit={criar}>
          <label>Nome da Mesa <input type="text" minLength={2} maxLength={80} required value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Incidente no Laboratório" /></label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          {aviso && <p className="sucesso" role="status">{aviso}</p>}
          <button className="acao" type="submit" disabled={criando}>{criando?'Criando...':'+ Criar Mesa'}</button>
        </form>
        <div className="nota-etapa"><strong>PRÓXIMAS ETAPAS</strong><p>Convites, personagens, sincronização e a integração dos painéis congelados estão em desenvolvimento.</p></div>
      </section>
      <section className="cartao cartao-padrao">
        <div className="linha-titulo"><div><p className="rotulo">ARQUIVO DE CAMPANHAS</p><h2>Mesas cadastradas</h2></div><button className="botao-claro" type="button" disabled={carregando} onClick={()=>{void atualizar()}}>Atualizar</button></div>
        {carregando?<p className="vazio">Carregando Mesas...</p>:mesas.length===0?
          <div className="vazio"><div className="simbolo-vazio">+</div><h3>Nenhuma Mesa ainda</h3><p>Crie a primeira campanha para inaugurar o laboratório.</p></div>:
          <ul className="lista-mesas">{mesas.map(mesa=><li key={mesa.id}>
            <button type="button" className="linha-mesa" onClick={()=>setEscolhida(mesa)}>
              <span className="sigla">AB</span>
              <span className="detalhes-mesa"><strong>{mesa.nome}</strong><small>{mesa.mestre_id===sessao.user.id?'VOCÊ É O MESTRE':'PARTICIPANTE'} · {nomeData(mesa.criada_em)}</small></span><span className="seta">→</span>
            </button>
          </li>)}</ul>}
      </section>
    </div>
    <Convites supabase={supabase} usuarioId={sessao.user.id} mesas={mesas} aoAtualizarMesas={atualizar}/>
    {escolhida && <div className="modal-fundo" onClick={()=>setEscolhida(null)}>
      <div className="cartao modal" role="dialog" aria-modal="true" aria-labelledby="mesa-escolhida" onClick={evento=>evento.stopPropagation()}>
        <p className="rotulo">MESA ONLINE</p><h2 id="mesa-escolhida">{escolhida.nome}</h2>
        <p className="secundario">Esta Mesa já está registrada no banco online, protegida pelas políticas de acesso.</p>
        <p className="dica">Convites de jogadores e acesso aos painéis estarão disponíveis nas próximas etapas. Nenhum protótipo congelado foi alterado.</p>
        <button className="acao" type="button" onClick={()=>setEscolhida(null)}>Voltar às Mesas</button>
      </div>
    </div>}
    <footer>AMEAÇA BIOLÓGICA RPG · TESTE ALFA 0.2 · GRATUITO</footer>
  </main>;
}

export default function App(){
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
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_evento,nova)=>{
      if(ativo){setSessao(nova);setVerificando(false);}
    });
    void supabase.auth.getSession().then(({data})=>{
      if(ativo){setSessao(data.session);setVerificando(false);}
    }).catch(()=>{if(ativo)setVerificando(false)});
    return ()=>{ativo=false;subscription.unsubscribe();};
  },[supabase]);

  return <div className="aplicativo">
    {cabecalho(sessao?'MESA ONLINE':'ACESSO CONTROLADO')}
    {!conexao?<Configurar pronto={setConexao}/>:
      verificando?<main className="central"><p className="secundario">Verificando acesso...</p></main>:
      sessao && supabase?<Lobby supabase={supabase} sessao={sessao}/>:
      supabase?<Autenticacao supabase={supabase}/>:null}
  </div>;
}
