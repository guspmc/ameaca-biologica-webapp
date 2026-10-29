import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { networkInterfaces } from 'node:os';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const PAGINA = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const AVISO = 'Protótipo técnico sem autenticação. Não use dados reais de campanha, senhas ou segredos.';
const LIMITE_MENSAGEM = 280;
const INTERVALO_HEARTBEAT_MS = 25_000;

function respostaJson(res, status, dados) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  res.end(JSON.stringify(dados));
}

async function lerJson(req, limiteBytes = 4096) {
  let texto = '';
  for await (const parte of req) {
    texto += parte.toString('utf8');
    if (Buffer.byteLength(texto, 'utf8') > limiteBytes) {
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

function enderecosIPv4() {
  const encontrados = [];
  for (const lista of Object.values(networkInterfaces())) {
    for (const item of lista ?? []) {
      if (item.family === 'IPv4' && !item.internal) encontrados.push(item.address);
    }
  }
  return [...new Set(encontrados)];
}

/**
 * Cria uma instância isolada do protótipo LAN.
 * Este servidor só guarda mensagens demonstrativas; ainda não contém contas,
 * fichas, Mesas reais nem autenticação.
 */
export function createLocalServer({
  host = '127.0.0.1',
  port = 4175,
  dataDir = resolve(process.cwd(), '.ameaca-local'),
  heartbeatIntervalMs = INTERVALO_HEARTBEAT_MS,
} = {}) {
  if (!Number.isInteger(heartbeatIntervalMs) || heartbeatIntervalMs < 10) {
    throw new Error('heartbeatIntervalMs deve ser um inteiro igual ou superior a 10 ms.');
  }

  mkdirSync(dataDir, { recursive: true });
  const caminhoBanco = resolve(dataDir, 'servidor-prototipo.sqlite');
  const db = new DatabaseSync(caminhoBanco);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS eventos_prototipo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mensagem TEXT NOT NULL CHECK (length(mensagem) BETWEEN 1 AND 280),
      criado_em TEXT NOT NULL
    );
  `);

  const listarEventos = db.prepare(
    'SELECT id, mensagem AS message, criado_em AS createdAt FROM eventos_prototipo ORDER BY id DESC LIMIT 50'
  );
  const buscarEvento = db.prepare(
    'SELECT id, mensagem AS message, criado_em AS createdAt FROM eventos_prototipo WHERE id = ?'
  );
  const inserirEvento = db.prepare(
    'INSERT INTO eventos_prototipo (mensagem, criado_em) VALUES (?, ?)'
  );

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024,
    perMessageDeflate: false,
  });

  function transmitir(dados) {
    const serializado = JSON.stringify(dados);
    for (const cliente of wss.clients) {
      if (cliente.readyState === WebSocket.OPEN) cliente.send(serializado);
    }
  }

  const httpServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const metodo = req.method ?? 'GET';

      if (metodo === 'GET' && url.pathname === '/') {
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer',
          'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws:; base-uri 'none'; frame-ancestors 'none'",
        });
        res.end(PAGINA);
        return;
      }

      if (metodo === 'GET' && url.pathname === '/api/health') {
        respostaJson(res, 200, {
          ok: true,
          service: 'ameaca-biologica-local-prototype',
          version: '0.1.0-prototipo',
          storage: 'SQLite',
          realtime: 'WebSocket',
          internetRequired: false,
          authentication: 'not-implemented',
          warning: AVISO,
        });
        return;
      }

      if (metodo === 'GET' && url.pathname === '/api/events') {
        const eventos = listarEventos.all().reverse();
        respostaJson(res, 200, { events: eventos });
        return;
      }

      if (metodo === 'POST' && url.pathname === '/api/events') {
        const tipo = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
        if (tipo !== 'application/json') {
          respostaJson(res, 415, { error: 'Envie o conteúdo como application/json.' });
          return;
        }

        const corpo = await lerJson(req);
        const mensagem = typeof corpo.message === 'string' ? corpo.message.trim() : '';
        if (!mensagem || mensagem.length > LIMITE_MENSAGEM) {
          respostaJson(res, 422, { error: 'A mensagem deve ter entre 1 e 280 caracteres.' });
          return;
        }

        const criadoEm = new Date().toISOString();
        const insercao = inserirEvento.run(mensagem, criadoEm);
        const evento = buscarEvento.get(Number(insercao.lastInsertRowid));
        transmitir({ type: 'event.created', event: evento });
        respostaJson(res, 201, { event: evento });
        return;
      }

      if (metodo === 'GET' && url.pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }

      respostaJson(res, 404, { error: 'Rota não encontrada.' });
    } catch (erro) {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      const status = Number.isInteger(erro?.status) ? erro.status : 500;
      respostaJson(res, status, {
        error: status === 500 ? 'Erro interno no protótipo local.' : erro.message,
      });
    }
  });

  httpServer.on('upgrade', (req, socket, head) => {
    let url;
    try {
      url = new URL(req.url ?? '/', 'http://localhost');
    } catch {
      socket.destroy();
      return;
    }

    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    // Navegadores devem conectar ao mesmo host que serviu a página.
    const origem = req.headers.origin;
    if (origem) {
      try {
        if (new URL(origem).host !== req.headers.host) {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }
      } catch {
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(req, socket, head, cliente => {
      wss.emit('connection', cliente, req);
    });
  });

  wss.on('connection', cliente => {
    console.info('[WebSocket] Cliente conectado. Clientes ativos: ' + wss.clients.size + '.');
    cliente.on('close', (codigo, motivo) => {
      const descricao = motivo.toString('utf8').trim() || '(sem motivo informado)';
      console.info('[WebSocket] Cliente desconectado. Código: ' + codigo + '; motivo: ' + descricao + '; clientes restantes: ' + wss.clients.size + '.');
    });
    cliente.on('error', erro => {
      console.warn('[WebSocket] Erro no cliente: ' + erro.message);
    });
    cliente.isAlive = true;
    cliente.on('pong', () => {
      cliente.isAlive = true;
    });
    cliente.send(JSON.stringify({
      type: 'ready',
      message: 'Canal local de tempo real conectado.',
    }));
    cliente.on('message', dados => {
      try {
        const mensagem = JSON.parse(dados.toString('utf8'));
        if (mensagem?.type === 'ping') {
          cliente.send(JSON.stringify({ type: 'pong', at: new Date().toISOString() }));
        }
      } catch {
        // Mensagens inválidas são ignoradas; o cliente não pode executar comandos.
      }
    });
  });

  // Não encerra o servidor por inatividade. O heartbeat apenas detecta conexões
  // WebSocket que deixaram de responder; o navegador poderá reconectar depois.
  const heartbeatTimer = setInterval(() => {
    for (const cliente of wss.clients) {
      if (cliente.isAlive === false) {
        console.warn('[WebSocket] Cliente sem resposta ao heartbeat; encerrando a conexão para permitir reconexão.');
        cliente.terminate();
        continue;
      }
      if (cliente.readyState === WebSocket.OPEN) {
        cliente.isAlive = false;
        cliente.ping();
      }
    }
  }, heartbeatIntervalMs);
  heartbeatTimer.unref();

  let iniciado = false;

  return {
    httpServer,
    wss,
    db,
    caminhoBanco,
    get address() {
      return httpServer.address();
    },
    async listen() {
      if (iniciado) return httpServer.address();
      await new Promise((resolveListen, rejectListen) => {
        const aoErro = erro => {
          httpServer.off('listening', aoOuvir);
          rejectListen(erro);
        };
        const aoOuvir = () => {
          httpServer.off('error', aoErro);
          resolveListen();
        };
        httpServer.once('error', aoErro);
        httpServer.once('listening', aoOuvir);
        httpServer.listen(port, host);
      });
      iniciado = true;
      return httpServer.address();
    },
    async close() {
      clearInterval(heartbeatTimer);
      for (const cliente of wss.clients) cliente.terminate();
      await new Promise(resolveClose => wss.close(() => resolveClose()));
      await new Promise((resolveClose, rejectClose) => {
        if (!httpServer.listening) {
          resolveClose();
          return;
        }
        httpServer.close(erro => erro ? rejectClose(erro) : resolveClose());
      });
      db.close();
      iniciado = false;
    },
  };
}

async function iniciarPeloTerminal() {
  const args = process.argv.slice(2);
  const hostIndex = args.indexOf('--host');
  const portIndex = args.indexOf('--port');
  const host = hostIndex >= 0 ? args[hostIndex + 1] : (process.env.AMEA_HOST ?? '127.0.0.1');
  const portTexto = portIndex >= 0 ? args[portIndex + 1] : (process.env.AMEA_PORT ?? '4175');
  const port = Number(portTexto);
  if (!host || !Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('Use --host 127.0.0.1|0.0.0.0 e --port com um número entre 0 e 65535.');
  }

  const app = createLocalServer({ host, port });
  await app.listen();
  const endereco = app.address;
  const portaReal = typeof endereco === 'object' && endereco ? endereco.port : port;
  console.log('\nAmeaça Biológica — servidor LAN (protótipo)');
  console.log(`Página de teste: http://localhost:${portaReal}/`);
  console.log(`Saúde:          http://localhost:${portaReal}/api/health`);
  console.log(`Banco SQLite:   ${app.caminhoBanco}`);
  console.log('Internet exigida: não\n');
  console.warn(`ATENÇÃO: ${AVISO}`);

  if (host === '0.0.0.0' || host === '::') {
    for (const enderecoLan of enderecosIPv4()) {
      console.log(`Acesso pela LAN: http://${enderecoLan}:${portaReal}/`);
    }
    console.warn('O servidor está visível na rede local. Use somente uma rede confiável durante este protótipo.\n');
  }

  const encerrar = async () => {
    console.log('\nEncerrando servidor local...');
    await app.close();
    process.exit(0);
  };
  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  iniciarPeloTerminal().catch(erro => {
    console.error('Não foi possível iniciar o servidor local:', erro.message);
    process.exitCode = 1;
  });
}
