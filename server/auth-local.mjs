import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_MAX = 254;
const SENHA_MIN = 12;
const SENHA_MAX = 128;
const JANELA_LIMITE_MS = 10 * 60 * 1000;
const MAX_TENTATIVAS_LOGIN = 5;
const MAX_TENTATIVAS_CADASTRO = 5;
const LIMITADORES_POR_BANCO = new WeakMap();

function verificarLimite(db, chave, maximo, agora = Date.now()) {
  let limitadores = LIMITADORES_POR_BANCO.get(db);
  if (!limitadores) {
    limitadores = new Map();
    LIMITADORES_POR_BANCO.set(db, limitadores);
  }

  for (const [id, registro] of limitadores) {
    if (registro.expiraEm <= agora) limitadores.delete(id);
  }
  if (!limitadores.has(chave) && limitadores.size >= 1000) {
    const primeiraChave = limitadores.keys().next().value;
    if (primeiraChave !== undefined) limitadores.delete(primeiraChave);
  }

  const registro = limitadores.get(chave);
  if (!registro || registro.expiraEm <= agora) {
    limitadores.set(chave, { quantidade: 1, expiraEm: agora + JANELA_LIMITE_MS });
    return { permitido: true, restanteMs: JANELA_LIMITE_MS };
  }
  if (registro.quantidade >= maximo) {
    return { permitido: false, restanteMs: Math.max(1000, registro.expiraEm - agora) };
  }
  registro.quantidade += 1;
  return { permitido: true, restanteMs: Math.max(1000, registro.expiraEm - agora) };
}

function limitarRota(req, res, db, rota, maximo) {
  const ip = req.socket?.remoteAddress || 'ip-desconhecido';
  const limite = verificarLimite(db, rota + ':' + ip, maximo);
  if (limite.permitido) return false;
  res.setHeader('retry-after', String(Math.ceil(limite.restanteMs / 1000)));
  json(res, 429, { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
  return true;
}

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  res.end(JSON.stringify(body));
}

async function corpoJson(req) {
  let texto = '';
  for await (const parte of req) {
    texto += parte.toString('utf8');
    if (Buffer.byteLength(texto, 'utf8') > 4096) {
      const erro = new Error('O corpo da requisição excede o limite permitido.');
      erro.status = 413;
      throw erro;
    }
  }
  try {
    return JSON.parse(texto || '{}');
  } catch {
    const erro = new Error('O corpo da requisição não contém JSON válido.');
    erro.status = 400;
    throw erro;
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function emailNormalizado(valor) {
  if (typeof valor !== 'string') return '';
  return valor.trim().toLowerCase();
}

export function prepararAutenticacaoLocal(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  let versaoAtual = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get().version;

  if (versaoAtual < 1) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS contas_locais (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          senha_salt TEXT NOT NULL,
          senha_hash TEXT NOT NULL,
          criada_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessoes_locais (
          token_hash TEXT PRIMARY KEY,
          conta_id TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE CASCADE,
          criada_em TEXT NOT NULL,
          expira_em TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sessoes_locais_conta ON sessoes_locais(conta_id);
      `);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(1, new Date().toISOString());
      db.exec('COMMIT');
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
    versaoAtual = 1;
  }

  if (versaoAtual < 2) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS mesas (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 80),
          criada_por TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE RESTRICT,
          criada_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS participantes_mesa (
          mesa_id TEXT NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
          conta_id TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE CASCADE,
          papel TEXT NOT NULL CHECK (papel IN ('mestre', 'jogador')),
          entrou_em TEXT NOT NULL,
          PRIMARY KEY (mesa_id, conta_id)
        );
        CREATE INDEX IF NOT EXISTS idx_participantes_mesa_conta ON participantes_mesa(conta_id);
      `);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(2, new Date().toISOString());
      db.exec('COMMIT');
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
  }

  if (versaoAtual < 3) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS tickets_websocket_locais (
          token_hash TEXT PRIMARY KEY,
          conta_id TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE CASCADE,
          criada_em TEXT NOT NULL,
          expira_em TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tickets_websocket_expira
          ON tickets_websocket_locais(expira_em);
      `);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(3, new Date().toISOString());
      db.exec('COMMIT');
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
  }

  if (versaoAtual < 4) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`
        ALTER TABLE tickets_websocket_locais ADD COLUMN session_token_hash TEXT;
        DELETE FROM tickets_websocket_locais;
      `);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(4, new Date().toISOString());
      db.exec('COMMIT');
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
  }
  if (versaoAtual < 5) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS convites_mesa_locais (
          id TEXT PRIMARY KEY,
          mesa_id TEXT NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          criado_por TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE RESTRICT,
          criada_em TEXT NOT NULL,
          revogada_em TEXT
        );
        CREATE TABLE IF NOT EXISTS solicitacoes_mesa_locais (
          id TEXT PRIMARY KEY,
          mesa_id TEXT NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
          conta_id TEXT NOT NULL REFERENCES contas_locais(id) ON DELETE CASCADE,
          convite_id TEXT NOT NULL REFERENCES convites_mesa_locais(id) ON DELETE RESTRICT,
          status TEXT NOT NULL CHECK (status IN ('pendente', 'aprovada', 'recusada')),
          criada_em TEXT NOT NULL,
          analisada_em TEXT,
          analisada_por TEXT REFERENCES contas_locais(id) ON DELETE RESTRICT,
          UNIQUE (mesa_id, conta_id)
        );
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_mesa_status ON solicitacoes_mesa_locais(mesa_id, status, criada_em);
      `);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(5, new Date().toISOString());
      db.exec('COMMIT');
    } catch (erro) { db.exec('ROLLBACK'); throw erro; }
  }
}

export function consumirTicketWebSocketLocal(db, ticket) {
  if (typeof ticket !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(ticket)) return null;
  const agora = new Date().toISOString();
  const ticketHash = hashToken(ticket);
  db.exec('BEGIN IMMEDIATE');
  try {
    const registro = db.prepare(`
      SELECT c.id, c.email
      FROM tickets_websocket_locais t
      JOIN contas_locais c ON c.id = t.conta_id
      JOIN sessoes_locais s
        ON s.token_hash = t.session_token_hash
       AND s.conta_id = t.conta_id
       AND s.expira_em > ?
      WHERE t.token_hash = ? AND t.expira_em > ?
    `).get(agora, ticketHash, agora);
    db.prepare('DELETE FROM tickets_websocket_locais WHERE token_hash = ?').run(ticketHash);
    db.exec('COMMIT');
    return registro ? { id: registro.id, email: registro.email } : null;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}

function obterTokenSessao(req) {
  const cabecalho = req.headers.authorization ?? '';
  const correspondencia = /^Bearer ([A-Za-z0-9_-]{40,100})$/.exec(cabecalho);
  return correspondencia?.[1] ?? null;
}

export async function autenticarContaLocal(req, db) {
  const token = obterTokenSessao(req);
  if (!token) return null;
  const agora = new Date().toISOString();
  const sessao = db.prepare(`
    SELECT c.id, c.email
    FROM sessoes_locais s
    JOIN contas_locais c ON c.id = s.conta_id
    WHERE s.token_hash = ? AND s.expira_em > ?
  `).get(hashToken(token), agora);
  return sessao ? { id: sessao.id, email: sessao.email } : null;
}

export async function tratarRotaAutenticacao(req, res, url, db) {
  const metodo = req.method ?? 'GET';
  const rota = url.pathname;
  if (!rota.startsWith('/api/auth/')) return false;

  try {
    if (metodo === 'POST' && rota === '/api/auth/register') {
      if (limitarRota(req, res, db, rota, MAX_TENTATIVAS_CADASTRO)) return true;
      const corpo = await corpoJson(req);
      const email = emailNormalizado(corpo.email);
      const senha = typeof corpo.password === 'string' ? corpo.password : '';
      if (!email || email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        json(res, 422, { error: 'Informe um e-mail válido.' });
        return true;
      }
      if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) {
        json(res, 422, { error: 'A senha deve ter entre 12 e 128 caracteres.' });
        return true;
      }

      const salt = randomBytes(16);
      const senhaHash = await scrypt(senha, salt, 64);
      const id = randomBytes(16).toString('hex');
      try {
        db.prepare('INSERT INTO contas_locais (id, email, senha_salt, senha_hash, criada_em) VALUES (?, ?, ?, ?, ?)')
          .run(id, email, salt.toString('hex'), Buffer.from(senhaHash).toString('hex'), new Date().toISOString());
      } catch (erro) {
        if (String(erro?.code ?? '').includes('CONSTRAINT') || /UNIQUE constraint failed/i.test(String(erro?.message ?? ''))) {
          json(res, 409, { error: 'Não foi possível criar a conta com esses dados.' });
          return true;
        }
        throw erro;
      }
      json(res, 201, { account: { id, email } });
      return true;
    }

    if (metodo === 'POST' && rota === '/api/auth/login') {
      if (limitarRota(req, res, db, rota, MAX_TENTATIVAS_LOGIN)) return true;
      const corpo = await corpoJson(req);
      const email = emailNormalizado(corpo.email);
      const senha = typeof corpo.password === 'string' ? corpo.password : '';
      const conta = db.prepare('SELECT id, email, senha_salt, senha_hash FROM contas_locais WHERE email = ? COLLATE NOCASE').get(email);
      let valida = false;
      if (conta && senha.length <= SENHA_MAX) {
        const derivada = Buffer.from(await scrypt(senha, Buffer.from(conta.senha_salt, 'hex'), 64));
        const armazenada = Buffer.from(conta.senha_hash, 'hex');
        valida = derivada.length === armazenada.length && timingSafeEqual(derivada, armazenada);
      } else {
        await scrypt('senha-inexistente', Buffer.alloc(16), 64);
      }
      if (!valida) {
        json(res, 401, { error: 'E-mail ou senha inválidos.' });
        return true;
      }
      const token = randomBytes(32).toString('base64url');
      const agora = new Date();
      const expira = new Date(agora.getTime() + DURACAO_SESSAO_MS);
      db.prepare('INSERT INTO sessoes_locais (token_hash, conta_id, criada_em, expira_em) VALUES (?, ?, ?, ?)')
        .run(hashToken(token), conta.id, agora.toISOString(), expira.toISOString());
      json(res, 200, { account: { id: conta.id, email: conta.email }, token, expiresAt: expira.toISOString() });
      return true;
    }

    if (metodo === 'POST' && rota === '/api/auth/ws-ticket') {
      const conta = await autenticarContaLocal(req, db);
      if (!conta) {
        json(res, 401, { error: 'Sessão ausente ou expirada.' });
        return true;
      }
      const tokenSessao = obterTokenSessao(req);
      if (!tokenSessao) {
        json(res, 401, { error: 'Sessão ausente ou expirada.' });
        return true;
      }
      const ticket = randomBytes(32).toString('base64url');
      const agora = new Date();
      const expira = new Date(agora.getTime() + 30_000);
      db.prepare('DELETE FROM tickets_websocket_locais WHERE expira_em <= ?').run(agora.toISOString());
      db.prepare('INSERT INTO tickets_websocket_locais (token_hash, conta_id, criada_em, expira_em, session_token_hash) VALUES (?, ?, ?, ?, ?)')
        .run(hashToken(ticket), conta.id, agora.toISOString(), expira.toISOString(), hashToken(tokenSessao));
      json(res, 201, { ticket, expiresAt: expira.toISOString(), singleUse: true });
      return true;
    }

    if (metodo === 'GET' && rota === '/api/auth/me') {
      const conta = await autenticarContaLocal(req, db);
      if (!conta) {
        json(res, 401, { error: 'Sessão ausente ou expirada.' });
        return true;
      }
      json(res, 200, { account: conta });
      return true;
    }

    if (metodo === 'POST' && rota === '/api/auth/logout') {
      const cabecalho = req.headers.authorization ?? '';
      const correspondencia = /^Bearer ([A-Za-z0-9_-]{40,100})$/.exec(cabecalho);
      if (correspondencia) db.prepare('DELETE FROM sessoes_locais WHERE token_hash = ?').run(hashToken(correspondencia[1]));
      json(res, 200, { ok: true });
      return true;
    }

    json(res, 404, { error: 'Rota de autenticação não encontrada.' });
    return true;
  } catch (erro) {
    if (res.headersSent) {
      res.destroy();
      return true;
    }
    const status = Number.isInteger(erro?.status) ? erro.status : 500;
    json(res, status, { error: status === 500 ? 'Erro interno na autenticação local.' : erro.message });
    return true;
  }
}


export async function tratarRotaMesas(req, res, url, db) {
  const metodo = req.method ?? 'GET';
  const rota = url.pathname;
  if (rota !== '/api/mesas' && !rota.startsWith('/api/mesas/') && rota !== '/api/convites/solicitar') return false;

  const conta = await autenticarContaLocal(req, db);
  if (!conta) {
    json(res, 401, { error: 'Sessão ausente ou expirada.' });
    return true;
  }

  try {
    if (metodo === 'GET' && rota === '/api/mesas') {
      const mesas = db.prepare(`
        SELECT m.id, m.nome AS name, p.papel AS role, m.criada_em AS createdAt
        FROM participantes_mesa p
        JOIN mesas m ON m.id = p.mesa_id
        WHERE p.conta_id = ?
        ORDER BY m.criada_em DESC, m.id
      `).all(conta.id);
      json(res, 200, { mesas });
      return true;
    }

    if (metodo === 'POST' && rota === '/api/mesas') {
      const corpo = await corpoJson(req);
      const nome = typeof corpo.name === 'string' ? corpo.name.trim() : '';
      if (nome.length < 1 || nome.length > 80) {
        json(res, 422, { error: 'O nome da Mesa deve ter entre 1 e 80 caracteres.' });
        return true;
      }

      const id = randomBytes(16).toString('hex');
      const agora = new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO mesas (id, nome, criada_por, criada_em) VALUES (?, ?, ?, ?)')
          .run(id, nome, conta.id, agora);
        db.prepare('INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, ?, ?)')
          .run(id, conta.id, 'mestre', agora);
        db.exec('COMMIT');
      } catch (erro) {
        db.exec('ROLLBACK');
        throw erro;
      }
      json(res, 201, { mesa: { id, name: nome, role: 'mestre', createdAt: agora } });
      return true;
    }

    const detalhe = /^\/api\/mesas\/([a-f0-9]{32})$/.exec(rota);
    if (metodo === 'GET' && detalhe) {
      const mesa = db.prepare(`
        SELECT m.id, m.nome AS name, p.papel AS role, m.criada_em AS createdAt
        FROM mesas m
        JOIN participantes_mesa p ON p.mesa_id = m.id
        WHERE m.id = ? AND p.conta_id = ?
      `).get(detalhe[1], conta.id);
      if (!mesa) {
        json(res, 404, { error: 'Mesa não encontrada.' });
        return true;
      }
      json(res, 200, { mesa });
      return true;
    }

    const criarConvite = /^\/api\/mesas\/([a-f0-9]{32})\/convites$/.exec(rota);
    if (metodo === 'POST' && criarConvite) {
      const mesaId = criarConvite[1];
      const mestre = db.prepare("SELECT 1 FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ? AND papel = 'mestre'").get(mesaId, conta.id);
      if (!mestre) { json(res, 404, { error: 'Mesa não encontrada.' }); return true; }
      const codigo = randomBytes(32).toString('base64url');
      const conviteId = randomBytes(16).toString('hex');
      const agora = new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('UPDATE convites_mesa_locais SET revogada_em = ? WHERE mesa_id = ? AND revogada_em IS NULL').run(agora, mesaId);
        db.prepare('INSERT INTO convites_mesa_locais (id, mesa_id, token_hash, criado_por, criada_em) VALUES (?, ?, ?, ?, ?)').run(conviteId, mesaId, hashToken(codigo), conta.id, agora);
        db.exec('COMMIT');
      } catch (erro) { db.exec('ROLLBACK'); throw erro; }
      json(res, 201, { invitation: { id: conviteId, code: codigo, createdAt: agora } });
      return true;
    }

    const revogarConvite = /^\/api\/mesas\/([a-f0-9]{32})\/convites\/ativo$/.exec(rota);
    if (metodo === 'DELETE' && revogarConvite) {
      const mesaId = revogarConvite[1];
      db.exec('BEGIN IMMEDIATE');
      try {
        const mestre = db.prepare("SELECT 1 FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ? AND papel = 'mestre'").get(mesaId, conta.id);
        if (!mestre) { db.exec('ROLLBACK'); json(res, 404, { error: 'Mesa não encontrada.' }); return true; }
        const agora = new Date().toISOString();
        const resultado = db.prepare('UPDATE convites_mesa_locais SET revogada_em = ? WHERE mesa_id = ? AND revogada_em IS NULL').run(agora, mesaId);
        db.exec('COMMIT');
        json(res, 200, { revoked: resultado.changes > 0 });
        return true;
      } catch (erro) { db.exec('ROLLBACK'); throw erro; }
    }

    if (metodo === 'POST' && rota === '/api/convites/solicitar') {
      const corpo = await corpoJson(req);
      const codigo = typeof corpo.code === 'string' ? corpo.code.trim() : '';
      if (!/^[A-Za-z0-9_-]{40,100}$/.test(codigo)) { json(res, 404, { error: 'Convite inválido ou indisponível.' }); return true; }
      const convite = db.prepare('SELECT id, mesa_id FROM convites_mesa_locais WHERE token_hash = ? AND revogada_em IS NULL').get(hashToken(codigo));
      if (!convite) { json(res, 404, { error: 'Convite inválido ou indisponível.' }); return true; }
      const membro = db.prepare('SELECT 1 FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?').get(convite.mesa_id, conta.id);
      if (membro) { json(res, 409, { error: 'Sua conta já participa desta Mesa.' }); return true; }
      const existente = db.prepare('SELECT status FROM solicitacoes_mesa_locais WHERE mesa_id = ? AND conta_id = ?').get(convite.mesa_id, conta.id);
      if (existente) { json(res, 409, { error: existente.status === 'pendente' ? 'Sua solicitação já está pendente.' : 'Esta solicitação já foi analisada.' }); return true; }
      const id = randomBytes(16).toString('hex');
      const agora = new Date().toISOString();
      db.prepare("INSERT INTO solicitacoes_mesa_locais (id, mesa_id, conta_id, convite_id, status, criada_em) VALUES (?, ?, ?, ?, 'pendente', ?)").run(id, convite.mesa_id, conta.id, convite.id, agora);
      json(res, 202, { request: { id, status: 'pendente', createdAt: agora } });
      return true;
    }

    const solicitacoes = /^\/api\/mesas\/([a-f0-9]{32})\/solicitacoes$/.exec(rota);
    if (metodo === 'GET' && solicitacoes) {
      const mesaId = solicitacoes[1];
      const mestre = db.prepare("SELECT 1 FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ? AND papel = 'mestre'").get(mesaId, conta.id);
      if (!mestre) { json(res, 404, { error: 'Mesa não encontrada.' }); return true; }
      const pendentes = db.prepare("SELECT s.id, s.status, s.criada_em AS createdAt, c.id AS accountId, c.email FROM solicitacoes_mesa_locais s JOIN contas_locais c ON c.id = s.conta_id WHERE s.mesa_id = ? AND s.status = 'pendente' ORDER BY s.criada_em, s.id").all(mesaId);
      json(res, 200, { requests: pendentes });
      return true;
    }

    const analisar = /^\/api\/mesas\/([a-f0-9]{32})\/solicitacoes\/([a-f0-9]{32})\/(aprovar|recusar)$/.exec(rota);
    if (metodo === 'POST' && analisar) {
      const [, mesaId, solicitacaoId, acao] = analisar;
      db.exec('BEGIN IMMEDIATE');
      try {
        const mestre = db.prepare("SELECT 1 FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ? AND papel = 'mestre'").get(mesaId, conta.id);
        if (!mestre) { db.exec('ROLLBACK'); json(res, 404, { error: 'Mesa não encontrada.' }); return true; }
        const pedido = db.prepare("SELECT id, conta_id FROM solicitacoes_mesa_locais WHERE id = ? AND mesa_id = ? AND status = 'pendente'").get(solicitacaoId, mesaId);
        if (!pedido) { db.exec('ROLLBACK'); json(res, 404, { error: 'Solicitação pendente não encontrada.' }); return true; }
        const agora = new Date().toISOString();
        if (acao === 'aprovar') {
          const jaMembro = db.prepare('SELECT 1 FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?').get(mesaId, pedido.conta_id);
          if (!jaMembro) {
            const total = db.prepare("SELECT COUNT(*) AS total FROM participantes_mesa WHERE mesa_id = ? AND papel = 'jogador'").get(mesaId).total;
            if (total >= 10) { db.exec('ROLLBACK'); json(res, 409, { error: 'Esta Mesa já atingiu o limite de 10 jogadores.' }); return true; }
            db.prepare("INSERT INTO participantes_mesa (mesa_id, conta_id, papel, entrou_em) VALUES (?, ?, 'jogador', ?)").run(mesaId, pedido.conta_id, agora);
          }
        }
        db.prepare('UPDATE solicitacoes_mesa_locais SET status = ?, analisada_em = ?, analisada_por = ? WHERE id = ?').run(acao === 'aprovar' ? 'aprovada' : 'recusada', agora, conta.id, solicitacaoId);
        db.exec('COMMIT');
        json(res, 200, { request: { id: solicitacaoId, status: acao === 'aprovar' ? 'aprovada' : 'recusada' } });
        return true;
      } catch (erro) { db.exec('ROLLBACK'); throw erro; }
    }

    json(res, 404, { error: 'Rota de Mesa não encontrada.' });
    return true;
  } catch (erro) {
    if (res.headersSent) {
      res.destroy();
      return true;
    }
    const status = Number.isInteger(erro?.status) ? erro.status : 500;
    json(res, status, { error: status === 500 ? 'Erro interno nas Mesas locais.' : erro.message });
    return true;
  }
}
