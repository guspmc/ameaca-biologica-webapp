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

  const versaoAtual = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get().version;
  if (versaoAtual >= 1) return;

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
}

async function autenticar(req, db) {
  const cabecalho = req.headers.authorization ?? '';
  const correspondencia = /^Bearer ([A-Za-z0-9_-]{40,100})$/.exec(cabecalho);
  if (!correspondencia) return null;
  const agora = new Date().toISOString();
  const sessao = db.prepare(`
    SELECT c.id, c.email, s.expira_em
    FROM sessoes_locais s
    JOIN contas_locais c ON c.id = s.conta_id
    WHERE s.token_hash = ? AND s.expira_em > ?
  `).get(hashToken(correspondencia[1]), agora);
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
        // Mantém um custo semelhante quando o e-mail não existe.
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

    if (metodo === 'GET' && rota === '/api/auth/me') {
      const conta = await autenticar(req, db);
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
