import { useState } from 'react';
import {
  criarEstadoProgressaoInicial,
  estadoProgressaoPersistenteValido,
  atualizarContadorMissoes,
  registrarMarcoNarrativo,
  solicitarGanhoNivel,
  pedidoProgressaoPersistenteValido,
  type MetodoProgressaoPersistente,
  type EstadoProgressaoPersistente,
} from './progressaoPersistente';
import { avaliarDisponibilidadeProgressao } from './progressaoHabilidades';

type Props = {
  dados: Record<string, unknown>;
  classe: string;
  nivel: number;
  origemDados?: 'local' | 'servidor';
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

export default function ProgressaoFichaLocal({ dados, classe, nivel, origemDados = 'local', aoSalvar }: Props) {
  const [metodoInicial, setMetodoInicial] = useState<MetodoProgressaoPersistente>('marco_narrativo');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const progressao = dados.progressao;
  const nivelValido = Number.isSafeInteger(nivel) && nivel >= 1 && nivel <= 10;

  async function salvar(estado: EstadoProgressaoPersistente, incluirNivel = false) {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    setMensagem('');
    try {
      const confirmado = await aoSalvar(incluirNivel
        ? { nivel: estado.nivelAtual, progressao: estado }
        : { progressao: estado });
      if (!confirmado) throw new Error('O armazenamento não confirmou a Progressão.');
      setMensagem(origemDados === 'servidor' ? 'Progressão confirmada pelo servidor.' : 'Progressão salva neste dispositivo.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a Progressão.');
    } finally {
      setOcupado(false);
    }
  }

  if (!classe || !['Agente', 'Autodidata', 'Operador'].includes(classe)) {
    return <details className="ficha-local-editor progressao-ficha">
      <summary>Progressão de Personagem</summary>
      <p>Defina a Classe na criação da personagem para configurar a Progressão.</p>
    </details>;
  }

  if (!nivelValido) {
    return <details className="ficha-local-editor progressao-ficha">
      <summary>Progressão de Personagem</summary>
      <p className="offline-erro" role="alert">O Nível registrado é inválido. A Progressão está bloqueada para proteger o histórico.</p>
    </details>;
  }

  if (origemDados === 'servidor') {
    return <details className="ficha-local-editor progressao-ficha">
      <summary>Progressão de Personagem · Nível {nivel}</summary>
      <p>A edição da Progressão nesta etapa está disponível somente na Ficha Offline. A integração LAN exige fluxo próprio de autorização e gravação, que ainda será implementado.</p>
    </details>;
  }

  if (progressao === undefined) {
    return <details className="ficha-local-editor progressao-ficha" open>
      <summary>Progressão de Personagem</summary>
      {nivel !== 1
        ? <p className="offline-erro" role="alert">Esta personagem já está no nível {nivel}, mas não possui histórico de Progressão. Não vou criar benefícios retroativos nem presumir escolhas. O histórico precisa ser recuperado ou conferido antes de habilitar novas evoluções.</p>
        : <>
            <p>A Progressão pertence a esta Ficha. Escolha como registrar o avanço da personagem. Marco Narrativo é o método preferencial; a contagem de Missões é uma alternativa.</p>
            <label>Método de Progressão
              <select value={metodoInicial} disabled={ocupado} onChange={e => setMetodoInicial(e.target.value as MetodoProgressaoPersistente)}>
                <option value="marco_narrativo">Marco Narrativo</option>
                <option value="missoes">Missões Completadas</option>
              </select>
            </label>
            <button type="button" className="acao" disabled={ocupado} onClick={() => void salvar(criarEstadoProgressaoInicial(metodoInicial), true)}>
              Inicializar Progressão no nível 1 <span>→</span>
            </button>
          </>}
      {erro && <p className="offline-erro" role="alert">{erro}</p>}
      {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
    </details>;
  }

  if (!estadoProgressaoPersistenteValido(progressao, classe) || progressao.nivelAtual !== nivel) {
    return <details className="ficha-local-editor progressao-ficha" open>
      <summary>Progressão de Personagem</summary>
      <p className="offline-erro" role="alert">O estado da Progressão não corresponde ao Nível ou ao histórico da personagem. Nenhuma edição será permitida até a conferência dos dados.</p>
    </details>;
  }

  const estado = progressao as EstadoProgressaoPersistente;
  const pedido = dados.pedidoProgressao ?? null;
  if (pedido !== null && !pedidoProgressaoPersistenteValido(pedido, estado, classe)) {
    return <details className="ficha-local-editor progressao-ficha" open>
      <summary>Progressão de Personagem</summary>
      <p className="offline-erro" role="alert">A solicitação de avanço está inválida ou não corresponde ao requisito registrado. Nenhuma alteração será permitida até a conferência.</p>
    </details>;
  }
  const requisito = avaliarDisponibilidadeProgressao({
    nivelAtual: estado.nivelAtual,
    metodo: estado.metodo,
    missoesCompletadas: estado.missoesCompletadas,
    marcoNarrativoConcedido: estado.marcoNarrativoConcedido,
    missoesCompletadasNaUltimaMorte: estado.missoesCompletadasNaUltimaMorte,
    marcoNarrativoAposUltimaMorte: estado.marcoNarrativoAposUltimaMorte,
    descansoCompletoEmSalaDescanso: true,
  });
  const avaliacao = avaliarDisponibilidadeProgressao({
    nivelAtual: estado.nivelAtual,
    metodo: estado.metodo,
    missoesCompletadas: estado.missoesCompletadas,
    marcoNarrativoConcedido: estado.marcoNarrativoConcedido,
    missoesCompletadasNaUltimaMorte: estado.missoesCompletadasNaUltimaMorte,
    marcoNarrativoAposUltimaMorte: estado.marcoNarrativoAposUltimaMorte,
    descansoCompletoEmSalaDescanso: false,
  });

  async function solicitar() {
    if (ocupado || pedido !== null) return;
    setOcupado(true); setErro(''); setMensagem('');
    try {
      const novoPedido = solicitarGanhoNivel(estado, classe);
      if (!await aoSalvar({ pedidoProgressao: novoPedido })) {
        throw new Error('O armazenamento não confirmou a solicitação de Progressão.');
      }
      setMensagem('Solicitação salva. Conclua Descanso Completo na Sala de Descanso para liberar as escolhas do próximo Nível.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível solicitar a Progressão.');
    } finally { setOcupado(false); }
  }

  async function alterarMissoes(delta: number) {
    try {
      const atualizado = atualizarContadorMissoes(estado, classe, Math.max(0, estado.missoesCompletadas + delta));
      await salvar(atualizado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível alterar o contador de Missões.');
    }
  }

  async function concederMarco() {
    try { await salvar(registrarMarcoNarrativo(estado, classe)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível registrar o Marco Narrativo.'); }
  }

  return <details className="ficha-local-editor progressao-ficha">
    <summary>Progressão de Personagem · Nível {estado.nivelAtual}</summary>
    <p>A Progressão é registrada nesta Ficha e não depende de uma configuração da Mesa.</p>
    <div className="ficha-local-grade">
      <div><small>NÍVEL ATUAL</small><strong>{estado.nivelAtual} / 10</strong></div>
      <div><small>MÉTODO</small><strong>{estado.metodo === 'marco_narrativo' ? 'Marco Narrativo' : 'Missões'}</strong></div>
    </div>
    {estado.metodo === 'missoes'
      ? <div className="ficha-local-grade">
          <div><small>MISSÕES CONCLUÍDAS</small><strong>{estado.missoesCompletadas}</strong></div>
          <div className="progressao-controles">
            <button type="button" className="botao-claro" disabled={ocupado || pedido !== null || estado.missoesCompletadas === 0} onClick={() => void alterarMissoes(-1)}>− 1</button>
            <button type="button" className="botao-claro" disabled={ocupado || pedido !== null} onClick={() => void alterarMissoes(1)}>+ 1 concluída</button>
          </div>
        </div>
      : <div>
          <p>{estado.marcoNarrativoConcedido ? 'Marco Narrativo registrado pelo Jogador conforme comunicação do Narrador.' : 'Aguardando o Narrador comunicar um Marco Narrativo.'}</p>
          <button type="button" className="acao" disabled={ocupado || pedido !== null || estado.marcoNarrativoConcedido} onClick={() => void concederMarco()}>
            Registrar Marco Narrativo <span>→</span>
          </button>
        </div>}
    {pedido === null
      ? <>
          <p className="ficha-local-legenda">{avaliacao.motivo}</p>
          {requisito.disponivel && <button type="button" className="acao" disabled={ocupado} onClick={() => void solicitar()}>
            Solicitar subida para o Nível {requisito.proximoNivel} <span>→</span>
          </button>}
        </>
      : pedido.estado === 'aguardando_descanso'
        ? <p className="offline-status" role="status">Solicitação de Nível {pedido.nivel} registrada. Conclua Descanso Completo na Sala de Descanso. O Nível e os benefícios ainda não foram alterados.</p>
        : <p className="offline-status" role="status">Descanso Completo confirmado. As escolhas dos benefícios do Nível {pedido.nivel} serão liberadas nesta Ficha; o Nível só muda após a aplicação confirmada dessas escolhas.</p>}
    {estado.beneficiosPorNivel.length > 0 && <p>Histórico de benefícios registrado: {estado.beneficiosPorNivel.length} nível(is) com escolhas preservadas.</p>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
