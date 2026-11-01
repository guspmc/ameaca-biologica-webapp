import { useEffect, useState, type FormEvent } from 'react';
import { criarClienteServidorLocal, ErroServidorLocal, type MesaLocal, type SaudeServidorLocal, type SessaoLocal } from './servidorLocal';

const CHAVE_ENDERECO = 'ameaca-biologica:servidor-local:endereco:v1';

function enderecoInicial(): string {
  try { return localStorage.getItem(CHAVE_ENDERECO) ?? 'http://127.0.0.1:4175'; }
  catch { return 'http://127.0.0.1:4175'; }
}

export default function ConexaoServidorLocal() {
  const [endereco, setEndereco] = useState(enderecoInicial);
  const [saude, setSaude] = useState<SaudeServidorLocal | null>(null);
  const [sessao, setSessao] = useState<SessaoLocal | null>(null);
  const [mesas, setMesas] = useState<MesaLocal[]>([]);
  const [nomeMesa, setNomeMesa] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');
  const [convitesGerados, setConvitesGerados] = useState<Record<string, string>>({});
  const [solicitacoes, setSolicitacoes] = useState<Record<string, { id: string; status: 'pendente'; createdAt: string; accountId: string; email: string }[]>>({});
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [modoCadastro, setModoCadastro] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [consultando, setConsultando] = useState(false);

  function encerrarSessao(mensagem: string) {
    setSessao(null);
    setMesas([]);
    setAviso(mensagem);
  }

  useEffect(() => {
    if (!sessao) return;
    const verificarExpiracao = () => {
      if (Date.parse(sessao.expiresAt) <= Date.now()) {
        encerrarSessao('Sua sessão local expirou. Entre novamente para continuar.');
      }
    };
    verificarExpiracao();
    const intervalo = window.setInterval(verificarExpiracao, 15000);
    return () => window.clearInterval(intervalo);
  }, [sessao]);

  async function verificar() {
    setErro(''); setAviso(''); setSaude(null); setSessao(null); setMesas([]); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim() });
      const resultado = await cliente.verificarSaude();
      if (!resultado.ok) throw new Error('O serviço respondeu, mas não confirmou estado saudável.');
      try { localStorage.setItem(CHAVE_ENDERECO, endereco.trim().replace(/\/$/, '')); }
      catch { /* O endereço continua válido durante esta visita. */ }
      setSaude(resultado);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível verificar o servidor.');
    } finally { setConsultando(false); }
  }

  async function autenticar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!saude) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim() });
      if (modoCadastro) {
        await cliente.cadastrar(email.trim(), senha);
        setSenha('');
        setModoCadastro(false);
        setAviso('Conta criada. Agora entre com o e-mail e a senha cadastrados.');
      } else {
        const novaSessao = await cliente.entrar(email.trim(), senha);
        const autenticado = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: novaSessao.token });
        const confirmacao = await autenticado.minhaConta();
        if (confirmacao.account.id !== novaSessao.account.id) {
          throw new Error('O servidor não confirmou a identidade da sessão recém-criada.');
        }
        if (Date.parse(novaSessao.expiresAt) <= Date.now()) {
          throw new Error('O servidor retornou uma sessão já expirada. Tente entrar novamente.');
        }
        setSessao(novaSessao);
        setSenha('');
        setAviso('Sessão confirmada pelo servidor. O token ficará somente na memória desta página.');
      }
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível concluir a autenticação.');
    } finally { setConsultando(false); }
  }

  async function sair() {
    if (!sessao) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).sair();
      setSessao(null);
      setAviso('Sessão encerrada no servidor.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        setSessao(null);
        setAviso('A sessão já estava ausente ou expirada no servidor.');
      } else {
        setErro(problema instanceof Error ? problema.message : 'Não foi possível confirmar o encerramento da sessão.');
      }
    } finally { setConsultando(false); }
  }

  async function atualizarMesas() {
    if (!sessao) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).listarMesas();
      setMesas(resposta.mesas);
      setAviso('Lista de Mesas atualizada pelo servidor.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível atualizar as Mesas.');
    } finally { setConsultando(false); }
  }

  async function criarNovaMesa(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!sessao) return;
    const nome = nomeMesa.trim();
    if (!nome) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      const resposta = await cliente.criarMesa(nome);
      const lista = await cliente.listarMesas();
      setMesas(lista.mesas);
      setNomeMesa('');
      setAviso('Mesa “' + resposta.mesa.name + '” criada e confirmada pelo servidor. Seu papel nesta Mesa é Mestre.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível criar a Mesa.');
    } finally { setConsultando(false); }
  }


  async function gerarConvite(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'mestre') return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      const resposta = await cliente.criarConvite(mesa.id);
      setConvitesGerados(atual => ({ ...atual, [mesa.id]: resposta.invitation.code }));
      setAviso('Convite gerado. Copie e compartilhe o código; ele identifica a Mesa, mas não concede acesso automaticamente.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível gerar o convite.');
    } finally { setConsultando(false); }
  }

  async function carregarSolicitacoes(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'mestre') return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).listarSolicitacoes(mesa.id);
      setSolicitacoes(atual => ({ ...atual, [mesa.id]: resposta.requests }));
      setAviso('Solicitações pendentes consultadas no servidor.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível consultar as solicitações.');
    } finally { setConsultando(false); }
  }

  async function decidirSolicitacao(mesa: MesaLocal, id: string, decisao: 'aprovar' | 'recusar') {
    if (!sessao || mesa.role !== 'mestre') return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      await cliente.analisarSolicitacao(mesa.id, id, decisao);
      const [lista, pedidos] = await Promise.all([cliente.listarMesas(), cliente.listarSolicitacoes(mesa.id)]);
      setMesas(lista.mesas);
      setSolicitacoes(atual => ({ ...atual, [mesa.id]: pedidos.requests }));
      setAviso(decisao === 'aprovar' ? 'Participante aprovado e vínculo confirmado pelo servidor.' : 'Solicitação recusada pelo servidor.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível analisar a solicitação.');
    } finally { setConsultando(false); }
  }

  async function ingressarPorConvite(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!sessao || !codigoConvite.trim()) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).solicitarIngresso(codigoConvite.trim());
      setCodigoConvite('');
      setAviso('Solicitação enviada. O acesso à Mesa só será liberado após aprovação do Mestre.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível solicitar ingresso.');
    } finally { setConsultando(false); }
  }

  async function consultarSessao() {
    if (!sessao) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).minhaConta();
      if (resposta.account.id !== sessao.account.id) throw new Error('A conta confirmada não corresponde à sessão atual.');
      setAviso('Sessão válida. O servidor confirmou a conta ' + resposta.account.email + '.');
    } catch (problema) {
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        setSessao(null);
        setAviso('O servidor informou que a sessão expirou ou foi encerrada. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Falha ao consultar a sessão.');
    } finally { setConsultando(false); }
  }

  return <div className="aplicativo">
    <header className="topo"><div className="topo-interno">
      <span className="marca" aria-hidden="true">AB</span>
      <div className="nome-marca"><strong>AMEAÇA BIOLÓGICA</strong><small>RPG DE HORROR E SOBREVIVÊNCIA</small></div>
      <span className="tag">SERVIDOR LOCAL</span>
    </div></header>
    <main className="central servidor-local-pagina">
      <div className="cabecalho-central">
        <div><span className="sobretitulo"><i/> AMBIENTE EXPERIMENTAL</span>
          <h1>Conexão local</h1>
          <p>Diagnóstico e autenticação no servidor experimental da rede local.</p>
        </div>
      </div>
      <section className="cartao cartao-padrao servidor-local-cartao">
        <p className="rotulo">ETAPA 01 · CONECTIVIDADE</p>
        <h2>Endereço do servidor</h2>
        <p className="secundario">Informe o endereço HTTP/HTTPS da máquina que está executando o servidor local. Em outro dispositivo da mesma rede, use o IP da máquina servidora e a porta configurada.</p>
        <form className="formulario" onSubmit={evento => { evento.preventDefault(); void verificar(); }}>
          <label>URL do servidor
            <input type="url" required disabled={Boolean(sessao) || consultando} value={endereco} onChange={evento => { setEndereco(evento.target.value); setSaude(null); }} placeholder="http://127.0.0.1:4175" />
          </label>
          <button className="acao" type="submit" disabled={consultando || Boolean(sessao) || !endereco.trim()}>
            {consultando ? 'Verificando...' : 'Verificar conexão'} <span>→</span>
          </button>
        </form>
        {saude && <div className="servidor-local-resultado" role="status">
          <p className="sucesso"><strong>Servidor respondeu e confirmou disponibilidade.</strong></p>
          <dl>
            <div><dt>Serviço</dt><dd>{saude.service}</dd></div>
            <div><dt>Versão</dt><dd>{saude.version}</dd></div>
            <div><dt>Armazenamento</dt><dd>{saude.storage}</dd></div>
            <div><dt>Tempo real</dt><dd>{saude.realtime}</dd></div>
            <div><dt>Internet necessária</dt><dd>{saude.internetRequired ? 'Sim' : 'Não'}</dd></div>
            <div><dt>Autenticação</dt><dd>{saude.authentication}</dd></div>
          </dl>
          <p className="servidor-local-aviso">{saude.warning}</p>
        </div>}
      </section>

      {saude && <section className="cartao cartao-padrao servidor-local-cartao servidor-local-auth">
        <p className="rotulo">ETAPA 02 · CONTA LOCAL</p>
        {sessao ? <>
          <h2>Sessão autenticada</h2>
          <p className="secundario">Conta confirmada: <strong>{sessao.account.email}</strong></p>
          <p className="servidor-local-expira">Expira em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(sessao.expiresAt))}. O token não é salvo no navegador e será perdido ao recarregar ou fechar esta página.</p>
          <div className="servidor-local-botoes">
            <button className="botao-claro" type="button" disabled={consultando} onClick={() => void consultarSessao()}>Validar sessão</button>
            <button className="acao" type="button" disabled={consultando} onClick={() => void sair()}>{consultando ? 'Aguarde...' : 'Encerrar sessão'}</button>
          </div>
          <div className="servidor-local-mesas">
            <div className="servidor-local-mesas-topo">
              <div><p className="rotulo">ETAPA 03 · SUAS MESAS</p><h3>Mesas vinculadas à conta</h3></div>
              <button className="botao-claro" type="button" disabled={consultando} onClick={() => void atualizarMesas()}>Atualizar lista</button>
            </div>
            {mesas.length ? <ul className="servidor-local-lista-mesas">
              {mesas.map(mesa => <li key={mesa.id}>
                <div><strong>{mesa.name}</strong><small>Criada em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(mesa.createdAt))}</small></div>
                <span className={mesa.role === 'mestre' ? 'papel-mestre' : 'papel-jogador'}>{mesa.role === 'mestre' ? 'MESTRE' : 'JOGADOR'}</span>
              </li>)}
            </ul> : <p className="servidor-local-vazio">Nenhuma Mesa vinculada a esta conta ainda.</p>}
            {mesas.filter(mesa => mesa.role === 'mestre').map(mesa => <section className="servidor-local-controle-mesa" key={mesa.id}>
              <h4>Administração · {mesa.name}</h4>
              <div className="servidor-local-botoes">
                <button className="botao-claro" type="button" disabled={consultando} onClick={() => void gerarConvite(mesa)}>Gerar convite</button>
                <button className="botao-claro" type="button" disabled={consultando} onClick={() => void carregarSolicitacoes(mesa)}>Ver solicitações</button>
              </div>
              {convitesGerados[mesa.id] && <div className="servidor-local-codigo"><label>Código de convite<input readOnly value={convitesGerados[mesa.id]} /></label><button className="botao-claro" type="button" onClick={() => { void navigator.clipboard.writeText(convitesGerados[mesa.id]); setAviso('Código copiado.'); }}>Copiar código</button></div>}
              {(solicitacoes[mesa.id] ?? []).length ? <ul className="servidor-local-lista-mesas">{solicitacoes[mesa.id].map(pedido => <li key={pedido.id}><div><strong>{pedido.email}</strong><small>Solicitação pendente</small></div><div className="servidor-local-botoes"><button className="botao-claro" type="button" disabled={consultando} onClick={() => void decidirSolicitacao(mesa, pedido.id, 'aprovar')}>Aprovar</button><button className="botao-claro" type="button" disabled={consultando} onClick={() => void decidirSolicitacao(mesa, pedido.id, 'recusar')}>Recusar</button></div></li>)}</ul> : solicitacoes[mesa.id] ? <p className="servidor-local-vazio">Nenhuma solicitação pendente.</p> : null}
            </section>)}
            <form className="formulario servidor-local-form-mesa" onSubmit={ingressarPorConvite}>
              <label>Código de convite recebido<input value={codigoConvite} onChange={evento => setCodigoConvite(evento.target.value)} autoComplete="off" /></label>
              <button className="acao" type="submit" disabled={consultando || !codigoConvite.trim()}>Solicitar ingresso <span>→</span></button>
            </form>
            <form className="formulario servidor-local-form-mesa" onSubmit={criarNovaMesa}>
              <label>Nome da nova Mesa
                <input value={nomeMesa} onChange={evento => setNomeMesa(evento.target.value)} maxLength={80} required placeholder="Ex.: Operação Raccoon City" />
              </label>
              <button className="acao" type="submit" disabled={consultando || !nomeMesa.trim()}>Criar Mesa <span>→</span></button>
            </form>
            <p className="servidor-local-explica-mesa">Ao criar uma Mesa, sua conta recebe o papel de Mestre. Convites identificam a Mesa, mas cada ingresso depende de aprovação.</p>
          </div>
        </> : <>
          <h2>{modoCadastro ? 'Criar conta local' : 'Entrar no servidor'}</h2>
          <p className="secundario">{modoCadastro ? 'Cadastre uma conta experimental neste servidor. A senha deve ter de 12 a 128 caracteres.' : 'Use a conta cadastrada neste servidor local.'}</p>
          <form className="formulario" onSubmit={autenticar}>
            <label>E-mail
              <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={evento => setEmail(evento.target.value)} />
            </label>
            <label>Senha
              <input type="password" required minLength={modoCadastro ? 12 : 1} maxLength={128} autoComplete={modoCadastro ? 'new-password' : 'current-password'} value={senha} onChange={evento => setSenha(evento.target.value)} />
            </label>
            <button className="acao" type="submit" disabled={consultando || !email.trim() || !senha}>
              {consultando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'} <span>→</span>
            </button>
          </form>
          <button className="servidor-local-alternar" type="button" disabled={consultando} onClick={() => { setModoCadastro(!modoCadastro); setErro(''); setAviso(''); setSenha(''); }}>
            {modoCadastro ? 'Já tenho uma conta — voltar ao login' : 'Ainda não tenho conta — cadastrar'}
          </button>
        </>}
      </section>}

      {erro && <p className="erro servidor-local-feedback" role="alert">{erro}</p>}
      {aviso && <p className="sucesso servidor-local-feedback" role="status">{aviso}</p>}
      <section className="nota-etapa servidor-local-limites">
        <strong>AVISO IMPORTANTE DE SEGURANÇA</strong>
        <p>Este protótipo usa HTTP sem proteção de transporte. Utilize apenas dados fictícios e uma rede privada confiável. Não use senhas reais, nem dados de campanha.</p>
        <p>O token de sessão fica apenas na memória desta página: recarregar ou fechar a aba encerra o acesso no navegador, mas não revoga automaticamente o token no servidor. A sessão expira no servidor em até sete dias; use “Encerrar sessão” para revogá-la explicitamente.</p>
        <p>Cadastro e login ainda não liberam criação ou ingresso em Mesas nesta etapa.</p>
      </section>
      <p className="servidor-local-voltar"><a href={import.meta.env.BASE_URL}>Voltar ao ambiente online</a> · <a href={import.meta.env.BASE_URL + '?laboratorio=local'}>Abrir laboratório fictício</a></p>
      <footer>AMEAÇA BIOLÓGICA RPG · SERVIDOR LOCAL EXPERIMENTAL</footer>
    </main>
  </div>;
}
