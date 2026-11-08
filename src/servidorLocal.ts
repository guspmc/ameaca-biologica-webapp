export type ContaLocal = {
  id: string;
  username: string;
};

export type SessaoLocal = {
  account: ContaLocal;
  token: string;
  expiresAt: string;
};

export type MesaLocal = {
  id: string;
  name: string;
  role: 'mestre' | 'jogador';
  creationMethod: 'padrao' | 'regra_da_casa';
  maxLevel: number;
  createdAt: string;
};

export type SaudeServidorLocal = {
  ok: boolean;
  service: string;
  version: string;
  storage: string;
  realtime: string;
  internetRequired: boolean;
  authentication: string;
  lanAddresses: string[];
  warning: string;
};


export type ConviteMesaLocal = {
  id: string;
  code: string;
  createdAt: string;
};

export type ParticipanteMesaLocal = {
  accountId: string;
  role: 'mestre' | 'jogador';
  joinedAt: string;
};

export type SolicitacaoMesaLocal = {
  id: string;
  status: 'pendente';
  createdAt: string;
  accountId: string;
};
export type TicketWebSocketLocal = {
  ticket: string;
  expiresAt: string;
  singleUse: true;
};

export type PersonagemRascunhoLocal = {
  id: string;
  mesaId: string;
  name: string;
  status: 'rascunho' | 'completa';
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  revision: number;
};

export type ResumoPersonagemLocal = {
  id: string;
  mesaId: string;
  name: string;
  status: 'rascunho' | 'completa';
  createdAt: string;
  updatedAt: string;
};

export type ResultadoConferenciaCriacaoLocal = {
  valido: boolean;
  pendencias: { nome: string; estado: 'conferido' | 'pendente' | 'revisar'; detalhe: string; secao: string }[];
  conferencia: { nome: string; estado: 'conferido' | 'pendente' | 'revisar'; detalhe: string; secao: string }[];
  inventario?: { capacidade: number; ocupados: number; itens: unknown[] };
  revision: number;
  ativas: number;
};

export type ResultadoAtivacaoPersonagemLocal = {
  personagem: PersonagemRascunhoLocal;
  recibo: { personagemId: string; operacaoId: string; estado: 'completa'; quantidadeInstancias: number; revisaoCriacao: number };
};

export type DiagnosticoTransporteLocal = {
  nome: string;
  mensagem: string;
};

export class ErroServidorLocal extends Error {
  readonly status: number;
  readonly diagnostico?: DiagnosticoTransporteLocal;

  constructor(message: string, status: number, diagnostico?: DiagnosticoTransporteLocal) {
    super(message);
    this.name = 'ErroServidorLocal';
    this.status = status;
    this.diagnostico = diagnostico;
  }
}

type OpcoesCliente = {
  baseUrl: string;
  token?: string;
  fetcher?: typeof fetch;
};

function normalizarBaseUrl(valor: string): string {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    throw new Error('Informe o endereço completo do servidor local.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash) {
    throw new Error('O endereço do servidor local deve usar HTTP ou HTTPS e não pode conter credenciais, consulta ou fragmento.');
  }
  return url.toString().replace(/\/$/, '');
}

type EspacoEnderecoLocal = 'local' | 'loopback';

function identificarEspacoEnderecoAlvo(baseUrl: string): EspacoEnderecoLocal | undefined {
  let hostname = new URL(baseUrl).hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) hostname = hostname.slice(1, -1);
  if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);

  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1') {
    return 'loopback';
  }

  const octetos = hostname.split('.');
  if (octetos.length === 4 && octetos.every(parte => parte.length > 0 && parte.length <= 3 && [...parte].every(digito => digito >= '0' && digito <= '9') && Number(parte) <= 255)) {
    const [a, b] = octetos.map(Number);
    if (a === 127) return 'loopback';
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return 'local';
    }
  }

  const primeiroHexteto = Number.parseInt(hostname.split(':')[0], 16);
  if (hostname.startsWith('fc') || hostname.startsWith('fd') ||
      (Number.isInteger(primeiroHexteto) && primeiroHexteto >= 0xfe80 && primeiroHexteto <= 0xfebf) ||
      hostname.endsWith('.local')) {
    return 'local';
  }

  return undefined;
}

export function criarClienteServidorLocal({ baseUrl, token, fetcher = fetch }: OpcoesCliente) {
  const base = normalizarBaseUrl(baseUrl);

  async function requisicao<T>(caminho: string, opcoes: {
    metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    corpo?: unknown;
    autenticada?: boolean;
  } = {}): Promise<T> {
    const headers = new Headers({ accept: 'application/json' });
    if (opcoes.corpo !== undefined) headers.set('content-type', 'application/json');
    if (opcoes.autenticada && token) headers.set('authorization', `Bearer ${token}`);

    let resposta: Response;
    try {
      const espacoEndereco = identificarEspacoEnderecoAlvo(base);
      const configuracao: RequestInit & { targetAddressSpace?: EspacoEnderecoLocal } = {
        method: opcoes.metodo ?? 'GET',
        headers,
        body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
        cache: 'no-store',
        credentials: 'include',
        ...(espacoEndereco ? { targetAddressSpace: espacoEndereco } : {}),
      };
      resposta = await fetcher(base + caminho, configuracao);
    } catch (problema) {
      // Preserva a causa original do fetch para diagnóstico, sem expor token ou cabeçalhos.
      const diagnostico = problema instanceof Error
        ? { nome: problema.name.slice(0, 80), mensagem: problema.message.slice(0, 240) }
        : { nome: 'Erro desconhecido', mensagem: 'O navegador não forneceu detalhes adicionais.' };
      throw new ErroServidorLocal(
        'Não foi possível alcançar o servidor local. Confira o endereço e a conexão de rede.',
        0,
        diagnostico,
      );
    }

    const dados = await resposta.json().catch(() => null) as Record<string, unknown> | null;
    if (!resposta.ok) {
      const mensagem = typeof dados?.error === 'string'
        ? dados.error
        : 'O servidor local respondeu com um erro inesperado.';
      throw new ErroServidorLocal(mensagem, resposta.status);
    }
    if (dados === null) throw new ErroServidorLocal('O servidor local retornou uma resposta inválida.', resposta.status);
    return dados as T;
  }

  return {
    verificarSaude(): Promise<SaudeServidorLocal> {
      return requisicao('/api/health');
    },

    cadastrar(username: string, password: string): Promise<{ account: ContaLocal }> {
      return requisicao('/api/auth/register', {
        metodo: 'POST',
        corpo: { username, password },
      });
    },

    entrar(username: string, password: string): Promise<SessaoLocal> {
      return requisicao('/api/auth/login', {
        metodo: 'POST',
        corpo: { username, password },
      });
    },

    redefinirSenha(username: string, password: string): Promise<{ ok: boolean }> {
      return requisicao('/api/auth/reset-password', {
        metodo: 'POST',
        corpo: { username, password },
      });
    },

    minhaConta(): Promise<{ account: ContaLocal; expiresAt: string }> {
      return requisicao('/api/auth/me', { autenticada: true });
    },

    sair(): Promise<{ ok: boolean }> {
      return requisicao('/api/auth/logout', {
        metodo: 'POST',
        corpo: {},
        autenticada: true,
      });
    },

    listarMesas(): Promise<{ mesas: MesaLocal[] }> {
      return requisicao('/api/mesas', { autenticada: true });
    },

    criarMesa(name: string, creationMethod: MesaLocal['creationMethod'] = 'padrao'): Promise<{ mesa: MesaLocal }> {
      return requisicao('/api/mesas', {
        metodo: 'POST',
        corpo: { name, creationMethod },
        autenticada: true,
      });
    },

    atualizarNivelMesa(id: string, maxLevel: number): Promise<{ mesa: MesaLocal }> {
      if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Identificador de Mesa inválido.');
      return requisicao('/api/mesas/' + id, { metodo: 'PATCH', corpo: { maxLevel }, autenticada: true });
    },

    consultarMesa(id: string): Promise<{ mesa: MesaLocal }> {
      if (!/^[a-f0-9]{32}$/.test(id)) {
        throw new Error('Identificador de Mesa inválido.');
      }
      return requisicao(`/api/mesas/${id}`, { autenticada: true });
    },


    listarParticipantes(mesaId: string): Promise<{ participants: ParticipanteMesaLocal[] }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId)) throw new Error('Identificador de Mesa inválido.');
      return requisicao(`/api/mesas/${mesaId}/participantes`, { autenticada: true });
    },

    removerParticipante(mesaId: string, accountId: string): Promise<{ removed: true; accountId: string }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId) || !/^[a-f0-9]{32}$/.test(accountId)) {
        throw new Error('Identificador inválido.');
      }
      return requisicao(`/api/mesas/${mesaId}/participantes/${accountId}`, { metodo: 'DELETE', autenticada: true });
    },

    criarConvite(mesaId: string): Promise<{ invitation: ConviteMesaLocal }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId)) throw new Error('Identificador de Mesa inválido.');
      return requisicao(`/api/mesas/${mesaId}/convites`, { metodo: 'POST', corpo: {}, autenticada: true });
    },

    revogarConvite(mesaId: string): Promise<{ revoked: boolean }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId)) throw new Error('Identificador de Mesa inválido.');
      return requisicao(`/api/mesas/${mesaId}/convites/ativo`, { metodo: 'DELETE', autenticada: true });
    },

    solicitarIngresso(code: string): Promise<{ request: { id: string; status: 'pendente'; createdAt: string } }> {
      return requisicao('/api/convites/solicitar', { metodo: 'POST', corpo: { code }, autenticada: true });
    },

    listarSolicitacoes(mesaId: string): Promise<{ requests: SolicitacaoMesaLocal[] }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId)) throw new Error('Identificador de Mesa inválido.');
      return requisicao(`/api/mesas/${mesaId}/solicitacoes`, { autenticada: true });
    },

    analisarSolicitacao(mesaId: string, solicitacaoId: string, decisao: 'aprovar' | 'recusar'): Promise<{ request: { id: string; status: 'aprovada' | 'recusada' } }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId) || !/^[a-f0-9]{32}$/.test(solicitacaoId)) throw new Error('Identificador inválido.');
      return requisicao(`/api/mesas/${mesaId}/solicitacoes/${solicitacaoId}/${decisao}`, { metodo: 'POST', corpo: {}, autenticada: true });
    },

    listarPersonagens(mesaId: string): Promise<{ personagens: ResumoPersonagemLocal[] }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId)) throw new Error('Identificador de Mesa inválido.');
      return requisicao(`/api/mesas/${mesaId}/personagens`, { autenticada: true });
    },

    criarPersonagem(mesaId: string, name: string, data: Record<string, unknown>): Promise<{ personagem: PersonagemRascunhoLocal }> {
      if (!/^[a-f0-9]{32}$/.test(mesaId)) throw new Error('Identificador de Mesa inválido.');
      return requisicao(`/api/mesas/${mesaId}/personagens`, {
        metodo: 'POST', corpo: { name, data }, autenticada: true,
      });
    },

    consultarPersonagem(id: string): Promise<{ personagem: PersonagemRascunhoLocal }> {
      if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Identificador de personagem inválido.');
      return requisicao(`/api/personagens/${id}`, { autenticada: true });
    },

    conferirCriacaoPersonagem(id: string): Promise<ResultadoConferenciaCriacaoLocal> {
      if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Identificador de personagem inválido.');
      return requisicao(`/api/personagens/${id}/conferencia`, { autenticada: true });
    },

    ativarPersonagem(id: string, expectedRevision: number, operationId: string): Promise<ResultadoAtivacaoPersonagemLocal> {
      if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Identificador de personagem inválido.');
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error('Revisão da ficha inválida.');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId)) throw new Error('Identificador de operação inválido.');
      return requisicao(`/api/personagens/${id}/ativar`, {
        metodo: 'POST', corpo: { expectedRevision, operationId }, autenticada: true,
      });
    },

    excluirPersonagem(id: string): Promise<{ deleted: true; id: string }> {
      if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Identificador de personagem inválido.');
      return requisicao(`/api/personagens/${id}`, { metodo: 'DELETE', autenticada: true });
    },

    atualizarPersonagem(id: string, name: string, data: Record<string, unknown>, expectedRevision: number): Promise<{ personagem: PersonagemRascunhoLocal }> {
      if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Identificador de personagem inválido.');
      return requisicao(`/api/personagens/${id}`, {
        metodo: 'PUT', corpo: { name, data, expectedRevision }, autenticada: true,
      });
    },

    emitirTicketWebSocket(): Promise<TicketWebSocketLocal> {
      return requisicao('/api/auth/ws-ticket', {
        metodo: 'POST',
        corpo: {},
        autenticada: true,
      });
    },
  };
}
