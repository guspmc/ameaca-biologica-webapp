import { randomBytes } from 'node:crypto';
import { autenticarContaLocal } from './auth-local.mjs';
import { validarCriacaoNoServidor } from '../src/validarCriacaoServidor.ts';
import { estadoEconomiaAcoesValido } from '../src/economiaAcoes.ts';
import { estadoTurnoCombateValido, estadoTurnoCombateCompostoLegadoReconhecido } from '../src/estadoTurnoCombate.ts';
import { estadoProgressaoPersistenteValido } from '../src/progressaoPersistente.ts';

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
           p.dados_json AS dataJson, p.estado_ficha AS estadoFicha,
           p.inventario_json AS inventarioJson, p.criada_em AS createdAt,
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
    status: registro.estadoFicha === 'completa' ? 'completa' : 'rascunho',
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
  const ativacao = /^\/api\/personagens\/([a-f0-9]{32})\/ativar$/.exec(rota);
  const item = /^\/api\/personagens\/([a-f0-9]{32})$/.exec(rota);
  if (!lista && !item && !conferencia && !ativacao) return false;

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
                 estado_ficha AS estadoFicha, criada_em AS createdAt, atualizada_em AS updatedAt
          FROM personagens_locais
          WHERE mesa_id = ? AND conta_id = ?
          ORDER BY atualizada_em DESC, id
        `).all(mesaId, conta.id).map(p => ({
          id: p.id, mesaId: p.mesaId, name: p.name,
          status: p.estadoFicha === 'completa' ? 'completa' : 'rascunho',
          createdAt: p.createdAt, updatedAt: p.updatedAt,
        }));
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
          "SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ? AND conta_id = ? AND estado_ficha = 'rascunho'"
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

    if (item || conferencia || ativacao) {
      const id = (item ?? conferencia ?? ativacao)[1];
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
        if (existente.estadoFicha !== 'rascunho') {
          responder(res, 409, { error: 'Esta personagem já está ativa.' });
          return true;
        }
        const resultado = validarCriacaoNoServidor(existente.name, JSON.parse(existente.dataJson));
        const ativas = db.prepare("SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ? AND estado_ficha = 'completa'").get(existente.mesaId).total;
        responder(res, 200, { ...resultado, revision: existente.revision, ativas });
        return true;
      }
      if (ativacao) {
        if (metodo !== 'POST') {
          responder(res, 405, { error: 'A ativação aceita somente POST.' });
          return true;
        }
        const corpo = await lerCorpo(req);
        const uuidValido = typeof corpo.operationId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(corpo.operationId);
        if (!uuidValido || !Number.isSafeInteger(corpo.expectedRevision) || corpo.expectedRevision < 1) {
          responder(res, 422, { error: 'Informe um identificador de operação válido e a revisão atual da ficha.' });
          return true;
        }
        db.exec('BEGIN IMMEDIATE');
        try {
          const atual = obterPersonagem(db, id, conta.id);
          if (!atual) { db.exec('ROLLBACK'); responder(res, 404, { error: 'Personagem não encontrado.' }); return true; }
          const vinculo = db.prepare("SELECT papel FROM participantes_mesa WHERE mesa_id = ? AND conta_id = ?").get(atual.mesaId, conta.id);
          if (!vinculo || vinculo.papel !== 'jogador') { db.exec('ROLLBACK'); responder(res, 404, { error: 'Personagem não encontrado.' }); return true; }
          const reciboExistente = db.prepare(`
            SELECT personagem_id AS personagemId, operacao_id AS operacaoId,
                   revisao_ficha AS revisaoFicha, revisao_criacao AS revisaoCriacao,
                   quantidade_instancias AS quantidadeInstancias
            FROM ativacoes_personagem_locais WHERE personagem_id = ?
          `).get(id);
          if (reciboExistente) {
            if (reciboExistente.operacaoId !== corpo.operationId || atual.estadoFicha !== 'completa') {
              db.exec('ROLLBACK'); responder(res, 409, { error: 'Esta personagem já possui uma ativação confirmada.' }); return true;
            }
            db.exec('COMMIT');
            responder(res, 200, { personagem: serializar(atual), recibo: { ...reciboExistente, estado: 'completa' } });
            return true;
          }
          if (atual.estadoFicha !== 'rascunho') { db.exec('ROLLBACK'); responder(res, 409, { error: 'A personagem não está mais em estado de rascunho.' }); return true; }
          if (atual.revision !== corpo.expectedRevision) { db.exec('ROLLBACK'); responder(res, 409, { error: 'A ficha mudou desde a conferência. Consulte novamente antes de ativar.' }); return true; }
          const operacaoUsada = db.prepare('SELECT personagem_id FROM ativacoes_personagem_locais WHERE operacao_id = ?').get(corpo.operationId);
          if (operacaoUsada) { db.exec('ROLLBACK'); responder(res, 409, { error: 'Este identificador de operação já foi utilizado.' }); return true; }
          const validacao = validarCriacaoNoServidor(atual.name, JSON.parse(atual.dataJson));
          if (!validacao.valido || !validacao.inventario || !Array.isArray(validacao.inventario.itens)) {
            db.exec('ROLLBACK'); responder(res, 422, { error: 'A criação ainda possui pendências.', pendencias: validacao.pendencias }); return true;
          }
          const quantidadeAtivas = db.prepare("SELECT COUNT(*) AS total FROM personagens_locais WHERE mesa_id = ? AND estado_ficha = 'completa'").get(atual.mesaId).total;
          if (quantidadeAtivas >= 10) { db.exec('ROLLBACK'); responder(res, 409, { error: 'A Mesa já possui dez personagens ativas.' }); return true; }
          const agora = new Date().toISOString();
          const revisaoCriacao = atual.revision + 1;
          const atualizacaoInventario = db.prepare(`
            UPDATE personagens_locais
            SET inventario_json = ?, atualizada_em = ?, revisao = revisao + 1
            WHERE id = ? AND conta_id = ? AND revisao = ? AND estado_ficha = 'rascunho'
          `).run(JSON.stringify(validacao.inventario), agora, id, conta.id, corpo.expectedRevision);
          if (Number(atualizacaoInventario.changes) !== 1) { db.exec('ROLLBACK'); responder(res, 409, { error: 'A ficha mudou durante a ativação. Consulte novamente.' }); return true; }
          db.prepare(`
            INSERT INTO ativacoes_personagem_locais
              (personagem_id, operacao_id, revisao_ficha, revisao_criacao, quantidade_instancias, criada_em)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(id, corpo.operationId, corpo.expectedRevision, revisaoCriacao, validacao.inventario.itens.length, agora);
          const conclusao = db.prepare("UPDATE personagens_locais SET estado_ficha = 'completa' WHERE id = ? AND conta_id = ? AND revisao = ? AND estado_ficha = 'rascunho'").run(id, conta.id, revisaoCriacao);
          if (Number(conclusao.changes) !== 1) throw new Error('Não foi possível concluir a ativação da personagem.');
          db.exec('COMMIT');
          const personagem = obterPersonagem(db, id, conta.id);
          const recibo = { personagemId: id, operacaoId: corpo.operationId, revisaoFicha: corpo.expectedRevision, estado: 'completa', quantidadeInstancias: validacao.inventario.itens.length, revisaoCriacao };
          notificarConta(conta.id);
          responder(res, 200, { personagem: serializar(personagem), recibo });
        } catch (erro) {
          try { db.exec('ROLLBACK'); } catch { /* A transação pode já ter sido concluída. */ }
          throw erro;
        }
        return true;
      }
      if (metodo === 'GET') {
        responder(res, 200, { personagem: serializar(existente) });
        return true;
      }
      if (metodo === 'DELETE') {
        if (existente.estadoFicha !== 'rascunho') {
          responder(res, 409, { error: 'Fichas ativas não podem ser excluídas como rascunhos.' });
          return true;
        }
        const resultado = db.prepare("DELETE FROM personagens_locais WHERE id = ? AND conta_id = ? AND estado_ficha = 'rascunho'").run(id, conta.id);
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
        const dadosAtuaisProgressao = JSON.parse(existente.dataJson);
        const progressaoAtual = dadosAtuaisProgressao.progressao;
        const progressaoNova = corpo.data.progressao;
        const possuiProgressaoAtual = Object.prototype.hasOwnProperty.call(dadosAtuaisProgressao, 'progressao');
        const possuiProgressaoNova = Object.prototype.hasOwnProperty.call(corpo.data, 'progressao');
        if (possuiProgressaoAtual || possuiProgressaoNova) {
          if (!possuiProgressaoAtual || !possuiProgressaoNova) {
            responder(res, 403, { error: 'A criação ou remoção do estado de Progressão exige o fluxo próprio da Mesa.' });
            return true;
          }
          if (typeof corpo.data.classe !== 'string' || !Number.isSafeInteger(corpo.data.nivel)
            || !progressaoNova || progressaoNova.nivelAtual !== corpo.data.nivel
            || !estadoProgressaoPersistenteValido(progressaoNova, corpo.data.classe)) {
            responder(res, 422, { error: 'O estado persistente de Progressão é inválido ou está dessincronizado do Nível da personagem.' });
            return true;
          }
          const camposProgressaoProtegidos = Object.keys(progressaoAtual).filter(campo => campo !== 'missoesCompletadas');
          const progressaoAlterada = camposProgressaoProtegidos.some(campo =>
            JSON.stringify(progressaoAtual[campo] ?? null) !== JSON.stringify(progressaoNova[campo] ?? null)
          );
          if (progressaoAlterada) {
            responder(res, 403, { error: 'Somente o contador de Missões pode ser editado diretamente pelo Jogador; benefícios, Nível, método, Marcos e registros de Morte exigem os fluxos próprios.' });
            return true;
          }
        }
        if (Object.prototype.hasOwnProperty.call(corpo.data, 'estadoTurnoCombate')) {
          const turno = corpo.data.estadoTurnoCombate;
          if (!(estadoTurnoCombateValido(turno) || estadoTurnoCombateCompostoLegadoReconhecido(turno))
            || !Number.isSafeInteger(corpo.data.saAtual)
            || turno.economia.saAtual !== corpo.data.saAtual) {
            responder(res, 422, { error: 'O estado integrado do turno de combate é inválido ou está dessincronizado do saldo de SA.' });
            return true;
          }
        }
        if (Object.prototype.hasOwnProperty.call(corpo.data, 'economiaAcoes')) {
          const economia = corpo.data.economiaAcoes;
          if (!estadoEconomiaAcoesValido(economia)
            || !Number.isSafeInteger(corpo.data.saAtual)
            || economia.saAtual !== corpo.data.saAtual) {
            responder(res, 422, { error: 'A Economia de Ações é inválida ou está dessincronizada do saldo de SA.' });
            return true;
          }
        }
        if (existente.estadoFicha === 'completa') {
          const dadosAtuais = JSON.parse(existente.dataJson);
          const camposProtegidos = [
            'classe', 'origem', 'armaOperario', 'atributos',
            'periciaOrigemTreinada', 'periciaOrigemExtra', 'periciaTentativaErroTreinada',
            'distribuicaoPericias', 'habilidadeBasica', 'habilidadesAdquiridas',
            'planejamentoCriacao', 'nivel', 'equipamentoInicial', 'comprasIniciais', 'revisaoCompras',
          ];
          const alterados = camposProtegidos.filter(campo =>
            JSON.stringify(dadosAtuais[campo] ?? null) !== JSON.stringify(corpo.data[campo] ?? null)
          );
          if (alterados.length) {
            responder(res, 409, { error: 'Dados de criação e equipamento inicial não podem ser alterados diretamente após a ativação. Use os fluxos próprios de progressão e Inventário quando estiverem disponíveis.' });
            return true;
          }
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
