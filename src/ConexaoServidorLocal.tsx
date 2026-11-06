import { useEffect, useRef, useState, type FormEvent } from 'react';
import { criarClienteServidorLocal, ErroServidorLocal, type MesaLocal, type ResumoPersonagemLocal, type SaudeServidorLocal, type SessaoLocal, type PersonagemRascunhoLocal, type ParticipanteMesaLocal } from './servidorLocal';
import FichaLocal from './FichaLocal';
import PainelMestreLocal from './PainelMestreLocal';
import ArquivosJogadorLocal from './ArquivosJogadorLocal';
import QRCodeLocal from './QRCodeLocal';
import { calcularAtrasoReconexao } from './reconexaoLocal';
import { criarFilaSerializada } from './filaSerializada';
import { fichaContinuaSendoAlvo, sessaoContinuaSendoAtual } from './fichaContinuaSendoAlvo';

const CHAVE_ENDERECO = 'ameaca-biologica:servidor-local:endereco:v1';
const CHAVE_CONTEXTO_FICHA = 'ameaca-biologica:servidor-local:contexto-ficha:v1';
const CHAVE_POSICAO_PAGINA = 'ameaca-biologica:servidor-local:posicao:v1';

function enderecoInicial(): string {
  if (import.meta.env.MODE === 'lan') return window.location.origin;
  try { return localStorage.getItem(CHAVE_ENDERECO) ?? 'http://127.0.0.1:4175'; }
  catch { return 'http://127.0.0.1:4175'; }
}

export default function ConexaoServidorLocal() {
  const [endereco, setEndereco] = useState(enderecoInicial);
  const [saude, setSaude] = useState<SaudeServidorLocal | null>(null);
  const [restaurandoSessao, setRestaurandoSessao] = useState(import.meta.env.MODE === 'lan');
  const [carregandoDadosIniciais, setCarregandoDadosIniciais] = useState(false);
  const [sessao, setSessao] = useState<SessaoLocal | null>(null);
  // Distingue sessões sucessivas, inclusive novo login da mesma conta e mesma ficha.
  const geracaoSessao = useRef(0);
  const [mesas, setMesas] = useState<MesaLocal[]>([]);
  const [personagens, setPersonagens] = useState<Record<string, ResumoPersonagemLocal[]>>({});
  const [nomesPersonagens, setNomesPersonagens] = useState<Record<string, string>>({});
  const [nomeMesa, setNomeMesa] = useState('');
  const [codigoConvite, setCodigoConvite] = useState(() => new URLSearchParams(window.location.search).get('convite') ?? '');
  const [convitesGerados, setConvitesGerados] = useState<Record<string, string>>({});
  const [solicitacoes, setSolicitacoes] = useState<Record<string, { id: string; status: 'pendente'; createdAt: string; accountId: string }[]>>({});
  const [participantes, setParticipantes] = useState<Record<string, ParticipanteMesaLocal[]>>({});
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [fichaAberta, setFichaAberta] = useState<{ mesa: MesaLocal; personagem: PersonagemRascunhoLocal } | null>(null);
  const [salvandoFicha, setSalvandoFicha] = useState(false);
  const filaSalvamentoFicha = useRef(criarFilaSerializada());
  const restaurandoFicha = useRef(false);
  const [restauracaoFichaConcluida, setRestauracaoFichaConcluida] = useState(false);
  const dadosIniciaisCarregados = useRef(false);
  const restauracaoScrollConcluida = useRef(false);
  const fichaAbertaRef = useRef(fichaAberta);
  fichaAbertaRef.current = fichaAberta;
  const quantidadeSalvamentosPendentes = useRef(0);
  const socketEventos = useRef<WebSocket | null>(null);
  const mesasInscritas = useRef(new Set<string>());
  const [canalTempoReal, setCanalTempoReal] = useState(false);

  // No modo LAN, o cookie HttpOnly permite restaurar a sessão após recarga
  // ou reabertura do navegador sem expor o token ao armazenamento JavaScript.
  useEffect(() => {
    if (import.meta.env.MODE !== 'lan') {
      setRestaurandoSessao(false);
      return;
    }
    let ativo = true;
    setRestaurandoSessao(true);
    const cliente = criarClienteServidorLocal({ baseUrl: window.location.origin });
    void (async () => {
      try {
        const disponibilidade = await cliente.verificarSaude();
        if (!ativo) return;
        setSaude(disponibilidade);
        try {
          const resposta = await cliente.minhaConta();
          if (!ativo) return;
          if (Date.parse(resposta.expiresAt) <= Date.now()) {
            setAviso('A sessão anterior expirou. Entre novamente para continuar.');
            return;
          }
          dadosIniciaisCarregados.current = false;
          setRestauracaoFichaConcluida(false);
          restauracaoScrollConcluida.current = false;
          setCarregandoDadosIniciais(true);
          restaurandoFicha.current = false;
          geracaoSessao.current += 1;
          quantidadeSalvamentosPendentes.current = 0;
          setSalvandoFicha(false);
          setSessao({ account: resposta.account, token: '', expiresAt: resposta.expiresAt });
          setAviso('Sessão restaurada. Carregando suas Mesas e permissões...');
        } catch (problema) {
          if (!ativo) return;
          if (!(problema instanceof ErroServidorLocal && problema.status === 401)) {
            setErro(problema instanceof Error ? problema.message : 'Não foi possível restaurar a sessão local.');
          }
        }
      } catch (problema) {
        if (ativo) setErro(problema instanceof Error ? problema.message : 'Não foi possível verificar o servidor local.');
      } finally {
        if (ativo) setRestaurandoSessao(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  function encerrarSessao(mensagem: string) {
    restaurandoFicha.current = false;
    geracaoSessao.current += 1;
    quantidadeSalvamentosPendentes.current = 0;
    setSalvandoFicha(false);
    // Dados da ficha não permanecem visíveis após perda/encerramento de sessão.
    fichaAbertaRef.current = null;
    setFichaAberta(null);
    setSessao(null);
    dadosIniciaisCarregados.current = false;
    setCarregandoDadosIniciais(false);
    setMesas([]);
    setPersonagens({});
    setNomesPersonagens({});
    setConvitesGerados({});
    setSolicitacoes({});
    setParticipantes({});
    setAviso(mensagem);
  }

  async function sincronizarDadosRecebidos() {
    if (!sessao) return;
    const geracaoSolicitada = geracaoSessao.current;
    const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
    try {
      const primeiraCarga = !dadosIniciaisCarregados.current;
      if (primeiraCarga) setCarregandoDadosIniciais(true);
      const resposta = await cliente.listarMesas();
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      const novosPedidos: typeof solicitacoes = {};
      const novosPersonagens: typeof personagens = {};
      const novosParticipantes: typeof participantes = {};
      const resultados = await Promise.allSettled(resposta.mesas.map(async mesa => {
        if (mesa.role === 'mestre') {
          const [dados, equipe] = await Promise.all([cliente.listarSolicitacoes(mesa.id), cliente.listarParticipantes(mesa.id)]);
          novosPedidos[mesa.id] = dados.requests;
          novosParticipantes[mesa.id] = equipe.participants;
        } else {
          const dados = await cliente.listarPersonagens(mesa.id);
          novosPersonagens[mesa.id] = dados.personagens;
        }
      }));
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      const falhaAutenticacao = resultados.some(resultado =>
        resultado.status === 'rejected' &&
        resultado.reason instanceof ErroServidorLocal &&
        resultado.reason.status === 401
      );
      if (falhaAutenticacao) {
        setCarregandoDadosIniciais(false);
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
        return;
      }
      const outrasFalhas = resultados.filter(resultado => resultado.status === 'rejected');
      const fichaAtual = fichaAbertaRef.current;
      const mesaAindaAutorizaJogador = Boolean(fichaAtual && resposta.mesas.some(mesa =>
        mesa.id === fichaAtual.mesa.id && mesa.role === 'jogador'
      ));
      const listaAtualizada = fichaAtual ? novosPersonagens[fichaAtual.mesa.id] : undefined;
      const fichaExcluidaEmOutraSessao = Boolean(
        fichaAtual && mesaAindaAutorizaJogador && Array.isArray(listaAtualizada) &&
        !listaAtualizada.some(personagem => personagem.id === fichaAtual.personagem.id)
      );
      const acessoFichaRevogado = Boolean(fichaAtual && !mesaAindaAutorizaJogador);
      if (acessoFichaRevogado || fichaExcluidaEmOutraSessao) {
        // Uma ficha não permanece aberta após remoção da Mesa ou exclusão
        // confirmada do rascunho em outra sessão/dispositivo.
        fichaAbertaRef.current = null;
        setFichaAberta(null);
        try { localStorage.removeItem(CHAVE_CONTEXTO_FICHA); }
        catch { /* A autorização do servidor continua prevalecendo sem armazenamento local. */ }
      }
      setMesas(resposta.mesas);
      setSolicitacoes(novosPedidos);
      setPersonagens(novosPersonagens);
      setParticipantes(novosParticipantes);
      dadosIniciaisCarregados.current = true;
      setCarregandoDadosIniciais(false);
      if (outrasFalhas.length > 0) {
        setErro('A lista de Mesas foi carregada, mas algumas informações administrativas ou fichas não puderam ser atualizadas.');
      } else if (acessoFichaRevogado) {
        setAviso('Seu acesso à Mesa foi revogado. A ficha aberta foi fechada e o contexto salvo foi removido.');
      } else if (fichaExcluidaEmOutraSessao) {
        setAviso('O rascunho foi excluído em outra sessão. A ficha aberta foi fechada e o contexto salvo foi removido.');
      } else {
        setAviso('Dados atualizados e confirmados nas consultas ao servidor.');
      }
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setCarregandoDadosIniciais(false);
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else {
        setErro(problema instanceof Error ? problema.message : 'Não foi possível atualizar os dados recebidos.');
      }
    }
  }

  // Após login ou restauração de sessão, a tela precisa consultar novamente as Mesas.
  // Sem isso, a interface permanecia vazia após recarga mesmo com os registros no SQLite.
  useEffect(() => {
    if (sessao) void sincronizarDadosRecebidos();
  }, [sessao]);

  useEffect(() => {
    if (!sessao) {
      socketEventos.current?.close();
      socketEventos.current = null;
      setCanalTempoReal(false);
      return;
    }
    let ativo = true;
    let temporizador: number | undefined;
    let socket: WebSocket | null = null;
    let tentativasReconexao = 0;
    let conectando = false;

    const agendarReconexao = () => {
      if (!ativo || temporizador !== undefined) return;
      const atraso = calcularAtrasoReconexao(tentativasReconexao);
      tentativasReconexao += 1;
      temporizador = window.setTimeout(() => {
        temporizador = undefined;
        void conectar();
      }, atraso);
    };

    const conectar = async () => {
      if (!ativo || conectando) return;
      conectando = true;
      try {
        const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
        const { ticket } = await cliente.emitirTicketWebSocket();
        if (!ativo) return;
        const destino = new URL('/ws', endereco.trim());
        destino.protocol = destino.protocol === 'https:' ? 'wss:' : 'ws:';
        if (window.location.protocol === 'https:' && destino.protocol === 'ws:') {
          setAviso('O navegador bloqueia WebSocket inseguro a partir desta página HTTPS. Para testar a Mesa em LAN, abra o modo LAN local na rede confiável.');
          return;
        }
        destino.searchParams.set('ticket', ticket);
        const novoSocket = new WebSocket(destino.toString());
        socket = novoSocket;
        socketEventos.current = novoSocket;
        novoSocket.onopen = () => {
          if (ativo) {
            tentativasReconexao = 0;
            mesasInscritas.current.clear();
            setCanalTempoReal(true);
          }
        };
        novoSocket.onmessage = evento => {
          if (!ativo || typeof evento.data !== 'string') return;
          try {
            const mensagem = JSON.parse(evento.data);
            if (mensagem?.type === 'mesa.changed' || mensagem?.type === 'account.changed') {
              void sincronizarDadosRecebidos();
            }
          } catch { /* Mensagens inválidas não alteram o estado da interface. */ }
        };
        novoSocket.onclose = evento => {
          const eraSocketAtual = socketEventos.current === novoSocket;
          if (eraSocketAtual) {
            socketEventos.current = null;
            mesasInscritas.current.clear();
            if (ativo) setCanalTempoReal(false);
          }
          if (!ativo || !eraSocketAtual) return;
          if (evento.code === 4001) {
            encerrarSessao('A sessão local foi encerrada ou expirou no servidor. Entre novamente.');
            return;
          }
          agendarReconexao();
        };
        novoSocket.onerror = () => novoSocket.close();
      } catch (problema) {
        if (problema instanceof ErroServidorLocal && problema.status === 401) {
          encerrarSessao('A sessão local foi encerrada ou expirou no servidor. Entre novamente.');
          return;
        }
        agendarReconexao();
      } finally {
        conectando = false;
      }
    };

    const aoRetornarAoPrimeiroPlano = () => {
      if (document.visibilityState !== 'visible') return;
      void sincronizarDadosRecebidos();
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close(4000, 'Retomada da aba');
        return;
      }
      if (socket === null || socket.readyState === WebSocket.CLOSED) {
        if (temporizador !== undefined) {
          window.clearTimeout(temporizador);
          temporizador = undefined;
        }
        void conectar();
      }
    };

    document.addEventListener('visibilitychange', aoRetornarAoPrimeiroPlano);
    void conectar();
    return () => {
      ativo = false;
      document.removeEventListener('visibilitychange', aoRetornarAoPrimeiroPlano);
      if (temporizador !== undefined) window.clearTimeout(temporizador);
      socket?.close();
      if (socketEventos.current === socket) socketEventos.current = null;
      mesasInscritas.current.clear();
      setCanalTempoReal(false);
    };
  }, [sessao, endereco]);

  useEffect(() => {
    const socket = socketEventos.current;
    if (!canalTempoReal || !socket || socket.readyState !== WebSocket.OPEN) return;
    const desejadas = new Set(mesas.map(mesa => mesa.id));
    for (const mesaId of mesasInscritas.current) {
      if (!desejadas.has(mesaId)) {
        socket.send(JSON.stringify({ type: 'unsubscribe', mesaId }));
        mesasInscritas.current.delete(mesaId);
      }
    }
    for (const mesaId of desejadas) {
      if (!mesasInscritas.current.has(mesaId)) {
        socket.send(JSON.stringify({ type: 'subscribe', mesaId }));
        mesasInscritas.current.add(mesaId);
      }
    }
  }, [mesas, canalTempoReal]);

  const haAlteracoesNaoConfirmadas = salvandoFicha;
  useEffect(() => {
    if (!fichaAberta || !haAlteracoesNaoConfirmadas) return;
    const avisarAntesDeSair = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', avisarAntesDeSair);
    return () => window.removeEventListener('beforeunload', avisarAntesDeSair);
  }, [fichaAberta, haAlteracoesNaoConfirmadas]);

  useEffect(() => {
    const salvarPosicao = () => {
      try { sessionStorage.setItem(CHAVE_POSICAO_PAGINA, String(window.scrollY)); }
      catch { /* A restauração da posição é uma conveniência, não bloqueia a navegação. */ }
    };
    window.addEventListener('beforeunload', salvarPosicao);
    return () => window.removeEventListener('beforeunload', salvarPosicao);
  }, []);

  useEffect(() => {
    if (!sessao || !dadosIniciaisCarregados.current || !restauracaoFichaConcluida || restauracaoScrollConcluida.current) return;
    restauracaoScrollConcluida.current = true;
    let posicao = 0;
    try { posicao = Number(sessionStorage.getItem(CHAVE_POSICAO_PAGINA)); }
    catch { posicao = 0; }
    if (!Number.isFinite(posicao) || posicao <= 0) return;
    const quadro = window.requestAnimationFrame(() => window.scrollTo(0, posicao));
    return () => window.cancelAnimationFrame(quadro);
  }, [sessao, mesas, personagens, solicitacoes, participantes, carregandoDadosIniciais, restauracaoFichaConcluida]);

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
    setErro(''); setAviso(''); setSaude(null); encerrarSessao(''); setConsultando(true);
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
    setErro(''); setAviso('');
    if ((modoCadastro || modoRecuperacao) && senha !== senhaConfirmacao) {
      setErro('A confirmação não corresponde à senha digitada.');
      return;
    }
    setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim() });
      if (modoRecuperacao) {
        await cliente.redefinirSenha(usuario.trim(), senha);
        setSenha('');
        setSenhaConfirmacao('');
        setModoRecuperacao(false);
        setModoCadastro(false);
        setAviso('Senha alterada. Todas as sessões anteriores foram encerradas. Entre com a nova senha.');
      } else if (modoCadastro) {
        await cliente.cadastrar(usuario.trim(), senha);
        setSenha('');
        setSenhaConfirmacao('');
        setModoCadastro(false);
        setAviso('Conta criada. Agora entre com seu nome de usuário e senha.');
      } else {
        const novaSessao = await cliente.entrar(usuario.trim(), senha);
        const autenticado = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: novaSessao.token });
        const confirmacao = await autenticado.minhaConta();
        if (confirmacao.account.id !== novaSessao.account.id) {
          throw new Error('O servidor não confirmou a identidade da sessão recém-criada.');
        }
        if (Date.parse(novaSessao.expiresAt) <= Date.now()) {
          throw new Error('O servidor retornou uma sessão já expirada. Tente entrar novamente.');
        }
        dadosIniciaisCarregados.current = false;
        setRestauracaoFichaConcluida(false);
        restauracaoScrollConcluida.current = false;
        setCarregandoDadosIniciais(true);
        restaurandoFicha.current = false;
        geracaoSessao.current += 1;
        quantidadeSalvamentosPendentes.current = 0;
        setSalvandoFicha(false);
        setSessao(novaSessao);
        setSenha('');
        setSenhaConfirmacao('');
        setAviso('Sessão confirmada pelo servidor e mantida por cookie HttpOnly neste navegador.');
      }
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível concluir a autenticação.');
    } finally { setConsultando(false); }
  }

  async function sair() {
    if (!sessao) return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).sair();
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      try { localStorage.removeItem(CHAVE_CONTEXTO_FICHA); } catch { /* O contexto local pode permanecer se o armazenamento estiver indisponível. */ }
      encerrarSessao('Sessão encerrada no servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão já estava ausente ou expirada no servidor.');
      } else {
        setErro(problema instanceof Error ? problema.message : 'Não foi possível confirmar o encerramento da sessão.');
      }
    } finally { setConsultando(false); }
  }

  async function atualizarMesas() {
    if (!sessao) return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).listarMesas();
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setMesas(resposta.mesas);
      setAviso('Lista de Mesas atualizada pelo servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível atualizar as Mesas.');
    } finally { setConsultando(false); }
  }

  async function criarNovaMesa(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!sessao) return;
    const geracaoSolicitada = geracaoSessao.current;
    const nome = nomeMesa.trim();
    if (!nome) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      let resposta;
      try {
        resposta = await cliente.criarMesa(nome);
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      } catch (problema) {
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
        if (problema instanceof ErroServidorLocal && problema.status === 401) {
          encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
        } else setErro(problema instanceof Error ? problema.message : 'Não foi possível criar a Mesa.');
        return;
      }
      setNomeMesa('');
      try {
        const lista = await cliente.listarMesas();
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
        setMesas(lista.mesas);
        setAviso('Mesa “' + resposta.mesa.name + '” criada e confirmada pelo servidor. Seu papel nesta Mesa é Mestre.');
      } catch (problema) {
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
        if (problema instanceof ErroServidorLocal && problema.status === 401) {
          encerrarSessao('Mesa criada e confirmada pelo servidor, mas a sessão expirou antes da atualização da lista. Entre novamente para consultar o estado atual.');
        } else {
          setAviso('Mesa “' + resposta.mesa.name + '” criada e confirmada pelo servidor, mas não foi possível atualizar a lista. Use “Atualizar lista” para consultar o estado atual.');
        }
      }
    } finally { setConsultando(false); }
  }


  async function excluirRascunho(mesa: MesaLocal, personagem: ResumoPersonagemLocal) {
    if (!sessao || mesa.role !== 'jogador') return;
    const geracaoSolicitada = geracaoSessao.current;
    const confirmado = window.confirm('Excluir definitivamente o rascunho “' + personagem.name + '”? Esta ação não pode ser desfeita.');
    if (!confirmado) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resultado = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).excluirPersonagem(personagem.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (!resultado.deleted || resultado.id !== personagem.id) throw new Error('O servidor não confirmou a exclusão do rascunho solicitado.');
      setPersonagens(atual => ({ ...atual, [mesa.id]: (atual[mesa.id] ?? []).filter(item => item.id !== personagem.id) }));
      if (fichaAbertaRef.current?.personagem.id === personagem.id) { fichaAbertaRef.current = null; setFichaAberta(null); }
      setAviso('Rascunho excluído e confirmado pelo servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível excluir o rascunho.');
    } finally { setConsultando(false); }
  }
  async function carregarPersonagens(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'jogador') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).listarPersonagens(mesa.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setPersonagens(atual => ({ ...atual, [mesa.id]: resposta.personagens }));
      setAviso('Rascunhos consultados e confirmados pelo servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível consultar os personagens.');
    } finally { setConsultando(false); }
  }

  async function criarPersonagem(mesa: MesaLocal, evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!sessao || mesa.role !== 'jogador') return;
    const geracaoSolicitada = geracaoSessao.current;
    const nome = (nomesPersonagens[mesa.id] ?? '').trim();
    if (!nome) return;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      const resposta = await cliente.criarPersonagem(mesa.id, nome, {});
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setNomesPersonagens(atual => ({ ...atual, [mesa.id]: '' }));
      const lista = await cliente.listarPersonagens(mesa.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setPersonagens(atual => ({ ...atual, [mesa.id]: lista.personagens }));
      setAviso('Rascunho “' + resposta.personagem.name + '” criado e confirmado pelo servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível criar o rascunho.');
    } finally { setConsultando(false); }
  }

  async function abrirFicha(mesa: MesaLocal, personagem: ResumoPersonagemLocal) {
    if (!sessao || mesa.role !== 'jogador') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).consultarPersonagem(personagem.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (resposta.personagem.mesaId !== mesa.id) throw new Error('O servidor retornou um personagem vinculado a outra Mesa.');
      setFichaAberta({ mesa, personagem: resposta.personagem });
      try {
        localStorage.setItem(CHAVE_CONTEXTO_FICHA, JSON.stringify({
          accountId: sessao.account.id,
          mesaId: mesa.id,
          personagemId: resposta.personagem.id,
        }));
      } catch { /* A ficha continua funcional mesmo sem persistência do contexto de navegação. */ }
      setAviso('Ficha consultada e confirmada pelo servidor. As alterações continuam em estado de rascunho.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível abrir a ficha.');
    } finally { setConsultando(false); }
  }

  useEffect(() => {
    if (!sessao || !dadosIniciaisCarregados.current || fichaAberta ||
        restaurandoFicha.current || restauracaoFichaConcluida) return;
    let contexto: { accountId?: string; mesaId?: string; personagemId?: string } | null = null;
    try {
      const salvo = localStorage.getItem(CHAVE_CONTEXTO_FICHA);
      contexto = salvo ? JSON.parse(salvo) : null;
    } catch { contexto = null; }
    if (!contexto || contexto.accountId !== sessao.account.id ||
        !/^[a-f0-9]{32}$/.test(contexto.mesaId ?? '') ||
        !/^[a-f0-9]{32}$/.test(contexto.personagemId ?? '')) {
      setRestauracaoFichaConcluida(true);
      return;
    }
    const mesa = mesas.find(item => item.id === contexto?.mesaId && item.role === 'jogador');
    if (!mesa) {
      setRestauracaoFichaConcluida(true);
      return;
    }
    const personagem = personagens[mesa.id]?.find(item => item.id === contexto?.personagemId);
    const geracaoSolicitada = geracaoSessao.current;
    restaurandoFicha.current = true;
    void (async () => {
      try {
        // A carga inicial pode ter falhado apenas para esta Mesa. Antes de
        // desistir da restauração, consulta novamente a lista no servidor.
        let personagemRestaurado = personagem;
        if (!personagemRestaurado) {
          const lista = await criarClienteServidorLocal({
            baseUrl: endereco.trim(),
            token: sessao.token,
          }).listarPersonagens(mesa.id);
          if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
          setPersonagens(atual => ({ ...atual, [mesa.id]: lista.personagens }));
          personagemRestaurado = lista.personagens.find(item => item.id === contexto?.personagemId);
        }
        if (personagemRestaurado) {
          await abrirFicha(mesa, personagemRestaurado);
        } else {
          setErro('A sessão e a Mesa foram restauradas, mas o personagem salvo no contexto não foi encontrado. Atualize a lista de personagens para conferir.');
        }
      } catch (problema) {
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
        if (problema instanceof ErroServidorLocal && problema.status === 401) {
          encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
        } else {
          setErro(problema instanceof Error ? problema.message : 'Não foi possível restaurar a ficha salva.');
        }
      } finally {
        if (sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) {
          restaurandoFicha.current = false;
          setRestauracaoFichaConcluida(true);
        }
      }
    })();
  }, [sessao, mesas, personagens, fichaAberta, carregandoDadosIniciais, restauracaoFichaConcluida]);

  function salvarDadosFicha(delta: Record<string, unknown>, nome?: string): Promise<boolean> {
    const fichaSolicitada = fichaAbertaRef.current;
    if (!sessao || !fichaSolicitada || fichaSolicitada.mesa.role !== 'jogador') return Promise.resolve(false);
    const personagemIdSolicitado = fichaSolicitada.personagem.id;
    const mesaIdSolicitada = fichaSolicitada.mesa.id;
    const geracaoSolicitada = geracaoSessao.current;
    quantidadeSalvamentosPendentes.current += 1;
    setSalvandoFicha(true);
    return filaSalvamentoFicha.current.enfileirar(async () => {
      try {
        const fichaAtual = fichaAbertaRef.current;
        // Uma operação enfileirada nunca pode migrar para outra ficha/Mesa.
        if (!sessao || !sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada) || !fichaAtual || fichaAtual.mesa.role !== 'jogador' ||
            fichaAtual.personagem.id !== personagemIdSolicitado || fichaAtual.mesa.id !== mesaIdSolicitada) return false;
        setErro(''); setAviso('');
        // A base e a revisão são lidas somente quando esta operação chega à vez.
        // Assim, patches de seções diferentes preservam as confirmações anteriores.
        const dadosAtualizados = { ...fichaAtual.personagem.data, ...delta };
        const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).atualizarPersonagem(
          fichaAtual.personagem.id,
          nome?.trim() || fichaAtual.personagem.name,
          dadosAtualizados,
          fichaAtual.personagem.revision
        );
        // A sessão pode terminar enquanto o HTTP está em andamento. Nesse caso,
        // a resposta tardia não pode recolocar dados privados na interface.
        const fichaAindaAberta = fichaAbertaRef.current;
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada) || !fichaContinuaSendoAlvo(fichaAindaAberta, {
          personagemId: personagemIdSolicitado,
          mesaId: mesaIdSolicitada,
        })) return false;
        if (resposta.personagem.id !== fichaAindaAberta.personagem.id || resposta.personagem.mesaId !== fichaAindaAberta.mesa.id) {
          throw new Error('A confirmação do servidor não corresponde à ficha aberta. Reabra a ficha para consultar o estado atual.');
        }
        const confirmada = { ...fichaAindaAberta, personagem: resposta.personagem };
        fichaAbertaRef.current = confirmada;
        setFichaAberta(confirmada);
        setAviso('Alterações recebidas e confirmadas pelo servidor. O personagem continua como rascunho não ativo.');
        return true;
      } catch (problema) {
        // Uma resposta da sessão anterior não pode encerrar ou alterar a sessão recém-aberta.
        if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return false;
        if (problema instanceof ErroServidorLocal && problema.status === 401) {
          encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
        } else if (problema instanceof ErroServidorLocal && problema.diagnostico) {
          const detalhe = problema.diagnostico.mensagem
            ? ` Detalhe técnico: ${problema.diagnostico.nome} — ${problema.diagnostico.mensagem}`
            : ` Detalhe técnico: ${problema.diagnostico.nome}.`;
          setErro(problema.message + detalhe);
        } else {
          setErro(problema instanceof Error ? problema.message : 'Não foi possível confirmar o salvamento no servidor.');
        }
        return false;
      } finally {
        // A contagem pertence à geração que iniciou o salvamento. Uma resposta
        // antiga não pode alterar o indicador de uma sessão que entrou depois.
        if (sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) {
          quantidadeSalvamentosPendentes.current = Math.max(0, quantidadeSalvamentosPendentes.current - 1);
          setSalvandoFicha(quantidadeSalvamentosPendentes.current > 0);
        }
      }
    });
  }

  function editarSecaoFicha(secao: 'caracteristicas' | 'pericias' | 'inventario') {
    const ids = { caracteristicas: 'ficha-local-caracteristicas', pericias: 'ficha-local-pericias', inventario: 'ficha-local-inventario' };
    document.getElementById(ids[secao])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function gerarConvite(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'mestre') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      const resposta = await cliente.criarConvite(mesa.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setConvitesGerados(atual => ({ ...atual, [mesa.id]: resposta.invitation.code }));
      setAviso('Convite gerado. Copie e compartilhe o código; ele identifica a Mesa, mas não concede acesso automaticamente.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível gerar o convite.');
    } finally { setConsultando(false); }
  }

  async function revogarConvite(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'mestre') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).revogarConvite(mesa.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setConvitesGerados(atual => { const novo = { ...atual }; delete novo[mesa.id]; return novo; });
      setAviso(resposta.revoked
        ? 'Convite ativo revogado. Códigos anteriores não permitem novas solicitações; participantes atuais permanecem na Mesa.'
        : 'Não havia convite ativo para revogar.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível revogar o convite.');
    } finally { setConsultando(false); }
  }

  async function copiarConvite(codigo: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Área de transferência indisponível neste contexto.');
      await navigator.clipboard.writeText(codigo);
      setAviso('Código copiado.'); setErro('');
    } catch {
      setAviso(''); setErro('Não foi possível copiar automaticamente. Selecione o código exibido e copie manualmente.');
    }
  }
  async function carregarSolicitacoes(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'mestre') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).listarSolicitacoes(mesa.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setSolicitacoes(atual => ({ ...atual, [mesa.id]: resposta.requests }));
      setAviso('Solicitações pendentes consultadas no servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível consultar as solicitações.');
    } finally { setConsultando(false); }
  }

  async function decidirSolicitacao(mesa: MesaLocal, id: string, decisao: 'aprovar' | 'recusar') {
    if (!sessao || mesa.role !== 'mestre') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token });
      await cliente.analisarSolicitacao(mesa.id, id, decisao);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      const confirmacao = decisao === 'aprovar'
        ? 'Participante aprovado e vínculo confirmado pelo servidor.'
        : 'Solicitação recusada pelo servidor.';
      setAviso(confirmacao);
      const [lista, pedidos] = await Promise.allSettled([cliente.listarMesas(), cliente.listarSolicitacoes(mesa.id)]);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (lista.status === 'fulfilled') setMesas(lista.value.mesas);
      if (pedidos.status === 'fulfilled') setSolicitacoes(atual => ({ ...atual, [mesa.id]: pedidos.value.requests }));
      const falhas = [lista, pedidos].filter(resultado => resultado.status === 'rejected');
      if (falhas.length) {
        const expirou = falhas.some(resultado => resultado.status === 'rejected' && resultado.reason instanceof ErroServidorLocal && resultado.reason.status === 401);
        if (expirou) {
          encerrarSessao(confirmacao + ' Porém, a sessão expirou antes da atualização da tela. Entre novamente para consultar o estado atual.');
        } else {
          setAviso(confirmacao + ' A decisão foi confirmada, mas a atualização da tela falhou; consulte novamente para conferir o estado atual.');
        }
      }
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível analisar a solicitação.');
    } finally { setConsultando(false); }
  }

  async function carregarParticipantes(mesa: MesaLocal) {
    if (!sessao || mesa.role !== 'mestre') return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).listarParticipantes(mesa.id);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setParticipantes(atual => ({ ...atual, [mesa.id]: resposta.participants }));
      setAviso('Participantes consultados e confirmados pelo servidor.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível consultar os participantes.');
    } finally { setConsultando(false); }
  }

  async function removerParticipante(mesa: MesaLocal, accountId: string) {
    if (!sessao || mesa.role !== 'mestre') return;
    const participante = participantes[mesa.id]?.find(item => item.accountId === accountId && item.role === 'jogador');
    if (!participante) return;
    const confirmado = window.confirm('Remover este jogador da Mesa "' + mesa.name + '"? O acesso será revogado e os rascunhos dele nesta Mesa serão excluídos. A ação não pode ser desfeita.');
    if (!confirmado) return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resultado = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).removerParticipante(mesa.id, accountId);
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (!resultado.removed || resultado.accountId !== accountId) throw new Error('O servidor não confirmou a remoção do participante solicitado.');
      setParticipantes(atual => ({ ...atual, [mesa.id]: (atual[mesa.id] ?? []).filter(item => item.accountId !== accountId) }));
      setSolicitacoes(atual => ({ ...atual, [mesa.id]: (atual[mesa.id] ?? []).filter(item => item.accountId !== accountId) }));
      setAviso('Participante removido e acesso revogado pelo servidor. Os rascunhos vinculados foram excluídos.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      else setErro(problema instanceof Error ? problema.message : 'Não foi possível remover o participante.');
    } finally { setConsultando(false); }
  }

  async function ingressarPorConvite(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!sessao || !codigoConvite.trim()) return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).solicitarIngresso(codigoConvite.trim());
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      setCodigoConvite('');
      const urlAtual = new URL(window.location.href);
      urlAtual.searchParams.delete('convite');
      window.history.replaceState({}, '', urlAtual.toString());
      setAviso('Solicitação enviada. O acesso à Mesa só será liberado após aprovação do Mestre.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('A sessão expirou ou foi encerrada no servidor. Entre novamente.');
      } else setErro(problema instanceof Error ? problema.message : 'Não foi possível solicitar ingresso.');
    } finally { setConsultando(false); }
  }

  async function consultarSessao() {
    if (!sessao) return;
    const geracaoSolicitada = geracaoSessao.current;
    setErro(''); setAviso(''); setConsultando(true);
    try {
      const resposta = await criarClienteServidorLocal({ baseUrl: endereco.trim(), token: sessao.token }).minhaConta();
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (resposta.account.id !== sessao.account.id) throw new Error('A conta confirmada não corresponde à sessão atual.');
      setAviso('Sessão válida. O servidor confirmou a conta ' + resposta.account.username + '.');
    } catch (problema) {
      if (!sessaoContinuaSendoAtual(geracaoSessao.current, geracaoSolicitada)) return;
      if (problema instanceof ErroServidorLocal && problema.status === 401) {
        encerrarSessao('O servidor informou que a sessão expirou ou foi encerrada. Entre novamente.');
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
        <h2>{sessao ? 'Servidor conectado' : 'Endereço do servidor'}</h2>
        {restaurandoSessao && <p className="servidor-local-feedback" role="status">Restaurando sua sessão e consultando suas Mesas. Aguarde um instante...</p>}
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
            <div><dt>Endereço para outros dispositivos na LAN</dt><dd>
              {saude.lanAddresses.length
                ? <div className="servidor-local-enderecos-lan">{saude.lanAddresses.map(ip => {
                    const url = new URL(window.location.pathname, 'http://' + ip + ':4174');
                    url.searchParams.set('servidor', 'local');
                    const endereco = url.toString();
                    return <div className="servidor-local-endereco-lan" key={ip}>
                      <a href={endereco}>{endereco}</a>
                      <QRCodeLocal value={endereco} label={'Acesso LAN · ' + ip} />
                    </div>;
                  })}</div>
                : 'Nenhum endereço IPv4 privado foi identificado nesta máquina.'}
            </dd></div>
          </dl>
          <p className="servidor-local-aviso">{saude.warning}</p>
        </div>}
      </section>

      {saude && !restaurandoSessao && <section className="cartao cartao-padrao servidor-local-cartao servidor-local-auth">
        <p className="rotulo">ETAPA 02 · CONTA LOCAL</p>
        {sessao ? <>
          <h2>Sessão autenticada</h2>
          <p className="secundario">Conta confirmada: <strong>{sessao.account.username}</strong></p>
          <p className="servidor-local-expira">Expira em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(sessao.expiresAt))}. A sessão é restaurada automaticamente neste navegador enquanto permanecer válida.</p>
          <div className="servidor-local-botoes">
            <button className="botao-claro" type="button" disabled={consultando} onClick={() => void consultarSessao()}>Validar sessão</button>
            <button className="acao" type="button" disabled={consultando} onClick={() => void sair()}>{consultando ? 'Aguarde...' : 'Encerrar sessão'}</button>
          </div>
          <div className="servidor-local-mesas">
            <div className="servidor-local-mesas-topo">
              <div><p className="rotulo">ETAPA 03 · SUAS MESAS</p><h3>Mesas vinculadas à conta</h3></div>
              <button className="botao-claro" type="button" disabled={consultando} onClick={() => void atualizarMesas()}>Atualizar lista</button>
            </div>
            {carregandoDadosIniciais ? <p className="servidor-local-vazio" role="status">Carregando suas Mesas, participantes e permissões...</p> : mesas.length ? <ul className="servidor-local-lista-mesas">
              {mesas.map(mesa => <li key={mesa.id}>
                <div><strong>{mesa.name}</strong><small>Criada em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(mesa.createdAt))}</small></div>
                <span className={mesa.role === 'mestre' ? 'papel-mestre' : 'papel-jogador'}>{mesa.role === 'mestre' ? 'MESTRE' : 'JOGADOR'}</span>
              </li>)}
            </ul> : <p className="servidor-local-vazio">Nenhuma Mesa vinculada a esta conta ainda.</p>}
            {mesas.filter(mesa => mesa.role === 'jogador').map(mesa => <section className="servidor-local-controle-mesa" key={mesa.id}>
              <h4>Personagens · {mesa.name}</h4>
              <p className="secundario">Os personagens começam como rascunhos e ficam vinculados a esta Mesa e à sua conta. A criação ainda não ativa o personagem nem abre a ficha completa.</p>
              <form className="formulario servidor-local-form-mesa" onSubmit={evento => void criarPersonagem(mesa, evento)}>
                <label>Nome do personagem
                  <input value={nomesPersonagens[mesa.id] ?? ''} onChange={evento => setNomesPersonagens(atual => ({ ...atual, [mesa.id]: evento.target.value }))} maxLength={80} required placeholder="Ex.: Claire Redfield" />
                </label>
                <button className="acao" type="submit" disabled={consultando || !(nomesPersonagens[mesa.id] ?? '').trim()}>Criar rascunho <span>→</span></button>
              </form>
              <div className="servidor-local-botoes">
                <button className="botao-claro" type="button" disabled={consultando} onClick={() => void carregarPersonagens(mesa)}>Consultar rascunhos</button>
              </div>
              {personagens[mesa.id] ? personagens[mesa.id].length ? <ul className="servidor-local-lista-mesas">{personagens[mesa.id].map(personagem => <li key={personagem.id}>
                <div><strong>{personagem.name}</strong><small>Rascunho · atualizado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(personagem.updatedAt))}</small></div>
                <div className="servidor-local-botoes"><span className="papel-jogador">RASCUNHO</span><button className="botao-claro" type="button" disabled={consultando || salvandoFicha} onClick={() => void abrirFicha(mesa, personagem)}>Abrir ficha</button><button className="botao-claro" type="button" disabled={consultando || salvandoFicha} onClick={() => void excluirRascunho(mesa, personagem)}>Excluir</button></div>
              </li>)}</ul> : <p className="servidor-local-vazio">Nenhum rascunho nesta Mesa.</p> : <p className="servidor-local-vazio">Consulte os rascunhos para carregar a lista do servidor.</p>}
            </section>)}
            {mesas.filter(mesa => mesa.role === 'jogador').map(mesa => <ArquivosJogadorLocal key={mesa.id} mesaId={mesa.id} mesaNome={mesa.name} />)}
            {mesas.filter(mesa => mesa.role === 'mestre').map(mesa => <PainelMestreLocal
              key={mesa.id}
              mesa={mesa}
              enderecosLan={saude?.lanAddresses ?? []}
              convite={convitesGerados[mesa.id]}
              solicitacoes={solicitacoes[mesa.id]}
              participantes={participantes[mesa.id]}
              consultando={consultando}
              aoGerarConvite={item => void gerarConvite(item)}
              aoRevogarConvite={item => void revogarConvite(item)}
              aoCarregarSolicitacoes={item => void carregarSolicitacoes(item)}
              aoCopiarConvite={codigo => void copiarConvite(codigo)}
              aoDecidirSolicitacao={(item, pedidoId, decisao) => void decidirSolicitacao(item, pedidoId, decisao)}
              aoCarregarParticipantes={item => void carregarParticipantes(item)}
              aoRemoverParticipante={(item, accountId) => void removerParticipante(item, accountId)}
            />)}
            <form className="formulario servidor-local-form-mesa" onSubmit={ingressarPorConvite}>
              <label>Código de convite recebido<input value={codigoConvite} maxLength={100} autoCapitalize="characters" spellCheck={false} onChange={evento => {
                const valor = evento.target.value.trim();
                const legado = /^[A-Za-z0-9_-]{40,100}$/.test(valor);
                setCodigoConvite(legado ? valor : valor.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 8));
              }} autoComplete="off" /></label>
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
          <h2>{modoRecuperacao ? 'Redefinir senha' : modoCadastro ? 'Criar conta local' : 'Entrar no servidor'}</h2>
          <p className="secundario">{modoRecuperacao ? 'Informe seu nome de usuário e escolha uma nova senha.' : modoCadastro ? 'Cadastre uma conta local. A senha deve ter de 4 a 128 caracteres.' : 'Use seu nome de usuário e a senha cadastrados neste servidor local. Contas antigas continuam aceitando o identificador anterior como usuário.'}</p>
          <form className="formulario" onSubmit={autenticar}>
            <label>Usuário(a)
              <input type="text" required maxLength={80} autoComplete="username" value={usuario} onChange={evento => setUsuario(evento.target.value)} />
            </label>
            <label>{modoRecuperacao ? 'Nova senha' : 'Senha'}
              <div className="servidor-local-campo-senha">
                <input type={mostrarSenha ? 'text' : 'password'} required minLength={modoCadastro || modoRecuperacao ? 4 : 1} maxLength={128} autoComplete={modoCadastro || modoRecuperacao ? 'new-password' : 'current-password'} value={senha} onChange={evento => setSenha(evento.target.value)} />
                <button type="button" aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha} onClick={() => setMostrarSenha(valor => !valor)}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </label>
            {(modoCadastro || modoRecuperacao) && <label>Confirmar senha
              <div className="servidor-local-campo-senha">
                <input type={mostrarConfirmacao ? 'text' : 'password'} required minLength={4} maxLength={128} autoComplete="new-password" value={senhaConfirmacao} onChange={evento => setSenhaConfirmacao(evento.target.value)} />
                <button type="button" aria-label={mostrarConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'} aria-pressed={mostrarConfirmacao} onClick={() => setMostrarConfirmacao(valor => !valor)}>{mostrarConfirmacao ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </label>}
            <button className="acao" type="submit" disabled={consultando || !usuario.trim() || !senha || ((modoCadastro || modoRecuperacao) && !senhaConfirmacao)}>
              {consultando ? 'Aguarde...' : modoRecuperacao ? 'Alterar senha' : modoCadastro ? 'Criar conta' : 'Entrar'} <span>→</span>
            </button>
          </form>
          {!modoRecuperacao && !modoCadastro && <button className="servidor-local-alternar" type="button" disabled={consultando} onClick={() => { setModoRecuperacao(true); setModoCadastro(false); setSenha(''); setSenhaConfirmacao(''); setMostrarSenha(false); setMostrarConfirmacao(false); setErro(''); setAviso(''); }}>
            Esqueceu a senha?
          </button>}
          {!modoRecuperacao && <button className="servidor-local-alternar" type="button" disabled={consultando} onClick={() => { setModoCadastro(!modoCadastro); setModoRecuperacao(false); setErro(''); setAviso(''); setSenha(''); setSenhaConfirmacao(''); setMostrarSenha(false); setMostrarConfirmacao(false); }}>
            {modoCadastro ? 'Já tenho uma conta — voltar ao login' : 'Ainda não tenho conta — cadastrar'}
          </button>}
          {modoRecuperacao && <button className="servidor-local-alternar" type="button" disabled={consultando} onClick={() => { setModoRecuperacao(false); setSenha(''); setSenhaConfirmacao(''); setErro(''); setAviso(''); }}>
            Voltar ao login
          </button>}
        </>}
      </section>}

      {fichaAberta && <FichaLocal
              autoSalvar
        nome={fichaAberta.personagem.name}
        mesa={fichaAberta.mesa.name}
        contextoId={fichaAberta.mesa.id + ':' + fichaAberta.personagem.id}
        dados={fichaAberta.personagem.data}
        aoFechar={() => {
          if (salvandoFicha) return;
          try { localStorage.removeItem(CHAVE_CONTEXTO_FICHA); } catch { /* O fechamento não depende do armazenamento local. */ }
          setFichaAberta(null);
        }}
        aoEditar={editarSecaoFicha}
        aoSalvarCaracteristicas={dados => salvarDadosFicha(dados)}
        aoSalvarIdentidade={dados => salvarDadosFicha({ identidade: dados.identidade }, dados.nome)}
        aoSalvarAtributosPericias={dados => salvarDadosFicha(dados)}
        aoSalvarInventario={dados => salvarDadosFicha({ equipamentoInicial: dados.equipamentoInicial, comprasIniciais: dados.comprasIniciais, revisaoCompras: dados.revisaoCompras })}
        aoSalvarFuncionamento={configuracao => salvarDadosFicha({ configuracaoFuncionamento: configuracao })}
        aoSalvarRecursos={recursos => salvarDadosFicha(recursos)}
        origemDados="servidor"
      />}
      {salvandoFicha && <p className="servidor-local-feedback" role="status">Confirmando salvamento da ficha no servidor…</p>}
      {erro && <p className="erro servidor-local-feedback" role="alert">{erro}</p>}
      {aviso && <p className="sucesso servidor-local-feedback" role="status">{aviso}</p>}
      <section className="nota-etapa servidor-local-limites">
        <strong>AVISO IMPORTANTE DE SEGURANÇA</strong>
        <p>Este protótipo usa HTTP sem proteção de transporte. Utilize apenas dados fictícios e uma rede privada confiável. Não use senhas reais, nem dados de campanha.</p>
        <p>A sessão é mantida por cookie HttpOnly neste navegador e restaurada automaticamente após recarga ou reabertura, enquanto válida (até sete dias). Use “Encerrar sessão” para revogá-la explicitamente. O tráfego pela LAN continua sem criptografia (HTTP).</p>
        <p>Este protótipo permite criar Mesas, gerar, renovar e revogar convites, solicitar ingresso e aprovar ou recusar participantes. Diretório público e bloqueio de participantes ainda não estão disponíveis.</p>
      </section>
      <p className="servidor-local-voltar"><a href={import.meta.env.BASE_URL}>Voltar ao ambiente online</a> · <a href={import.meta.env.BASE_URL + '?laboratorio=local'}>Abrir laboratório fictício</a></p>
      <footer>AMEAÇA BIOLÓGICA RPG · SERVIDOR LOCAL EXPERIMENTAL</footer>
    </main>
  </div>;
}
