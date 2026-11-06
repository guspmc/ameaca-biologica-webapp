import { randomBytes } from 'node:crypto';
import { autenticarContaLocal } from './auth-local.mjs';
import { validarCriacaoNoServidor } from '../src/validarCriacaoServidor.ts';

function responder(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  res.end(JSON.stringify(body));
}

async function lerCorpo(req) {
  let texto = '';
  for await (const parte of req) {
    texto += parte.toString('utf8');
    if (Buffer.byteLength(texto, 'utf8') > 32 * 1024) {
      const erro = new Error('O rascunho excede o limite de 32 KB.');
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

function nomeValido(valor) {
  return typeof valor === 'string' && valor.trim().length >= 1 && valor.trim().length <= 80;
}

function ehObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function obterPersonagem(db, id, contaId) {
  return db.prepare(`
    SELECT p.id, p.mesa_id AS mesaId, p.nome AS name,
           p.dados_json AS dataJson, p.criada_em AS createdAt,
           p.atualizada_em AS updatedAt, p.revisao AS revision
    FROM personagens_locais p
    WHERE p.id = ? AND p.conta_id = ?
  `).get(id, contaId);
}

function serializar(registro) {
  if (!registro) return null;
  return {
    id: registro.id,
    mesaId: registro.mesaId,
    name: registro.name,
    status: 'rascunho',
    data: JSON.parse(registro.dataJson),
    createdAt: registro.createdAt,
    updatedAt: registro.updatedAt,
    revision: registro.revision,
  };
}


export async function tratarRotaPersonagensLocal(req, res, url, db, notificarConta = () => {}) {
  const rota = url.pathname;
  if (!rota.startsWith('/api/mesas/') && !rota.startsWith('/api/personagens/')) return false;

  const lista = /^\/api\/mesas\/([a-f0-9]{32})\/personagens$/.exec(rota);
  const conferencia = /^\/api\/personagens\/([a-f0-9]{32})\/conferencia$/.exec(rota);
  const item = /^\/api\/personagens\/([a-f0-9]{32})$/.exec(rota);
  if (!lista && !item && !conferencia) return false;

  const conta = await autenticarContaLocal(req, db);
  if (!conta) {
    responder(res, 401, { error: 'Sessão ausente ou expirada.' });
    return true;
  }

  try {
    const metodo = req.method ?? 'GET';

    if (lista) {
      const mesaId = lista[1];
      const participante = db.prepare(
        "SELECT papel FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?"
      ).get(mesaId, conta.id);
      if (!participante || participante.papel !== 'jogador') {
        responder(res, 404, { error: 'Mesa não encontrada.' });
        return true;
      }

      if (metodo === 'GET') {
        const personagens = db.prepare(`
          SELECT id, mesa_id AS mesaId, nome AS name,
                 criada_em AS createdAt, atualizada_em AS updatedAt
          FROM personagens_locais
          WHERE mesa_id = ? AND conta_id = ?
          ORDER BY atualizada_em DESC, id
        `).all(mesaId, conta.id).map(p => ({ ...p, status: 'rascunho' }));
        responder(res, 200, { personagens });
        return true;
      }

      if (metodo === 'POST') {
        const corpo = await lerCorpo(req);
        if (!nomeValido(corpo.name) || !ehObjeto(corpo.data)) {
          responder(res, 422, { error: 'Informe um nome de até 80 caracteres e os dados do rascunho como objeto JSON.' });
          return true;
        }
        const quantidadeRascunhos = db.prepare(
          'SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ? AND conta_id = ?'
        ).get(mesaId, conta.id).total;
        if (quantidadeRascunhos >= 3) {
          responder(res, 409, { error: 'Você já possui o limite de três rascunhos nesta Mesa.' });
          return true;
        }
        const id = randomBytes(16).toString('hex');
        const agora = new Date().toISOString();
        db.prepare(`
          INSERT INTO personagens_locais
            (id, mesa_id, conta_id, nome, dados_json, criada_em, atualizada_em)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, mesaId, conta.id, corpo.name.trim(), JSON.stringify(corpo.data), agora, agora);
        const personagem = obterPersonagem(db, id, conta.id);
        notificarConta(conta.id);
        responder(res, 201, { personagem: serializar(personagem) });
        return true;
      }
    }

    if (item || conferencia) {
      const id = (item ?? conferencia)[1];
      const existente = obterPersonagem(db, id, conta.id);
      if (!existente) {
        responder(res, 404, { error: 'Personagem não encontrado.' });
        return true;
      }
      // A autoria do rascunho não substitui a autorização atual na Mesa.
      // Revalidar o vínculo em cada leitura/gravação impede acesso residual
      // caso um registro de rascunho permaneça após saída ou remoção.
      const participanteAtual = db.prepare(
        "SELECT papel FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?"
      ).get(existente.mesaId, conta.id);
      if (!participanteAtual || participanteAtual.papel !== 'jogador') {
        responder(res, 404, { error: 'Personagem não encontrado.' });
        return true;
      }
      if (conferencia) {
        if (metodo !== 'GET') {
          responder(res, 405, { error: 'A conferência aceita somente GET.' });
          return true;
        }
        const resultado = validarCriacaoNoServidor(existente.name, JSON.parse(existente.dataJson));
        responder(res, 200, { ...resultado, revision: existente.revision });
        return true;
      }
      if (metodo === 'GET') {
        responder(res, 200, { personagem: serializar(existente) });
        return true;
      }
      if (metodo === 'DELETE') {
        const resultado = db.prepare('DELETE FROM personagens_locais WHERE id = ? AND conta_id = ?').run(id, conta.id);
        if (Number(resultado.changes) !== 1) {
          responder(res, 404, { error: 'Rascunho não encontrado.' });
          return true;
        }
        notificarConta(conta.id);
        responder(res, 200, { deleted: true, id });
        return true;
      }
      if (metodo === 'PUT') {
        const corpo = await lerCorpo(req);
        if (!nomeValido(corpo.name) || !ehObjeto(corpo.data) ||
            !Number.isSafeInteger(corpo.expectedRevision) || corpo.expectedRevision < 1) {
          responder(res, 422, { error: 'Informe nome, dados JSON e a revisão atual do rascunho.' });
          return true;
        }
        const agora = new Date().toISOString();
        const resultado = db.prepare(`
          UPDATE personagens_locais
          SET nome = ?, dados_json = ?, atualizada_em = ?, revisao = revisao + 1
          WHERE id = ? AND conta_id = ? AND revisao = ?
        `).run(corpo.name.trim(), JSON.stringify(corpo.data), agora, id, conta.id, corpo.expectedRevision);
        if (Number(resultado.changes) !== 1) {
          responder(res, 409, { error: 'Esta ficha foi alterada em outro dispositivo. Reabra o rascunho para consultar a versão atual antes de salvar novamente.' });
          return true;
        }
        notificarConta(conta.id);
        responder(res, 200, { personagem: serializar(obterPersonagem(db, id, conta.id)) });
        return true;
      }
    }

    responder(res, 405, { error: 'Método não permitido para esta rota.' });
    return true;
  } catch (erro) {
    const status = Number.isInteger(erro?.status) ? erro.status : 500;
    responder(res, status, { error: status === 500 ? 'Erro interno ao acessar o rascunho.' : erro.message });
    return true;
  }
}
