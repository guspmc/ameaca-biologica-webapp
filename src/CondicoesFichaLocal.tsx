import { useState } from 'react';
import { CATALOGO_CONDICOES, condicoesAtivas, condicoesComEfeitoUnico, encerrarInstanciaCondicao, listaCondicoesValida, adicionarInstanciaCondicao, vulneravelPorPV, type CondicaoId } from './condicoesFicha';

type Props = {
  dados: Record<string, unknown>;
  pvAtual: number;
  pvMaximo: number;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
  origemDados?: 'local' | 'servidor';
};

function novoIdCondicao(): string {
  const aleatorio = () => Math.floor(Math.random() * 16).toString(16);
  return globalThis.crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, caractere => {
      const valor = Number.parseInt(aleatorio(), 16);
      return (caractere === 'x' ? valor : (valor & 0x3) | 0x8).toString(16);
    });
}

const ICONE_CONDICAO: Record<CondicaoId, string> = {
  agarrado:'🫳', amedrontado:'😨', atordoado:'💫', caido:'⬇️', cego:'🙈', 'colapso-viral':'🧬',
  corrosao:'☣️', desacordado:'💤', desorientado:'🌀', enfraquecido:'🪫', exposto:'⚠️',
  imobilizado:'⛓️', incapacitado:'🚫', intoxicado:'☠️', queimadura:'🔥', surdo:'🔇',
  surpreendido:'❗', vulneravel:'🩸', 'infectado-especial':'🧟', 'cabeca-carmesim':'🧟‍♂️',
};

export default function CondicoesFichaLocal({ dados, pvAtual, pvMaximo, aoSalvar, origemDados = 'local' }: Props) {
  const itens = listaCondicoesValida(dados.condicoes) ? dados.condicoes : [];
  const ativas = condicoesAtivas(itens);
  const vulneravel = pvMaximo > 0 ? vulneravelPorPV(pvAtual, pvMaximo) : null;
  const tiposAtivos = condicoesComEfeitoUnico(itens);
  const [condicao, setCondicao] = useState<CondicaoId>('agarrado');
  const [fonte, setFonte] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function ativar() {
    if (!fonte.trim() || salvando) return;
    if (!window.confirm('Confirmar o registro de ' + CATALOGO_CONDICOES[condicao].nome + ' como Condição ativa?')) return;
    setSalvando(true); setMensagem('');
    try {
      const atualizadas = adicionarInstanciaCondicao(itens, {
        id: novoIdCondicao(), condicao, fonte: fonte.trim(),
        observacao: observacao.trim(), estado: 'ativa', encerradaEm: null,
      });
      if (await aoSalvar({ condicoes: atualizadas })) {
        setFonte(''); setObservacao('');
        setMensagem('Condição registrada e salva.');
      } else setMensagem('Não foi possível confirmar o salvamento da Condição.');
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : 'Não foi possível registrar a Condição.');
    } finally { setSalvando(false); }
  }

  async function encerrar(id: string, nome: string) {
    if (salvando || !window.confirm('Confirmar o encerramento de ' + nome + '? O registro permanecerá no histórico.')) return;
    setSalvando(true); setMensagem('');
    try {
      const atualizadas = encerrarInstanciaCondicao(itens, id);
      if (await aoSalvar({ condicoes: atualizadas })) setMensagem('Condição encerrada e histórico preservado.');
      else setMensagem('Não foi possível confirmar o salvamento do encerramento.');
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : 'Não foi possível encerrar a Condição.');
    } finally { setSalvando(false); }
  }

  return <details className="ficha-local-editor condicoes-ficha">
    <summary>Condições e efeitos {ativas.length > 0 && <span aria-label={ativas.length + ' condições ativas'}>{ativas.map(item => ICONE_CONDICAO[item.condicao]).join(' ')}</span>}</summary>
    <p>Registre uma Condição quando a regra, a fonte ou a situação narrativa se aplicar. Ativar e encerrar exigem confirmação. O histórico é preservado; não há expiração genérica por descanso. {origemDados === 'servidor' ? 'Na LAN, o Mestre acompanha a duração em rodadas separadamente na aba Combate; esse contador não altera a Ficha automaticamente.' : 'Offline, não há contador de rodadas nem Painel do Mestre: encerre a Condição manualmente quando ela terminar.'} Os registros Offline e LAN são independentes, sem sincronização entre os modos.</p>
    <div className="ficha-local-grade">
      <div><small>VULNERÁVEL</small><strong>{vulneravel === null ? 'Não calculável' : vulneravel ? 'Sim' : 'Não'}</strong><p>Derivada dos PV Atuais iguais ou inferiores a 1/5 dos PV Máximos; não é cadastrada manualmente.</p></div>
    </div>
    <h4>Condições ativas</h4>
    {ativas.length === 0 ? <p>Nenhuma Condição ativa.</p> : <ul>
      {ativas.map(item => {
        const regra = CATALOGO_CONDICOES[item.condicao];
        return <li key={item.id}>
          <strong>{ICONE_CONDICAO[item.condicao]} {regra.nome}</strong> · Fonte: {item.fonte}
          <p>{regra.efeito}</p>
          {item.observacao && <p>Observação: {item.observacao}</p>}
          <small>{origemDados === 'servidor' ? 'A duração em rodadas é acompanhada separadamente pelo Mestre na aba Combate.' : 'Sem contador de rodadas: encerre manualmente quando a Condição terminar.'}</small>
          <p><button type="button" className="botao-claro" disabled={salvando} onClick={() => void encerrar(item.id, regra.nome)}>Encerrar Condição</button></p>
        </li>;
      })}
    </ul>}
    <h4>Registrar Condição</h4>
    <div className="ficha-local-editor">
      <label>Condição
        <select value={condicao} onChange={evento => setCondicao(evento.target.value as CondicaoId)}>
          {Object.entries(CATALOGO_CONDICOES).filter(([id]) => id !== 'vulneravel').map(([id, regra]) => <option key={id} value={id}>{regra.nome}</option>)}
        </select>
      </label>
      <label>Fonte ou causa
        <input value={fonte} maxLength={160} onChange={evento => setFonte(evento.target.value)} placeholder="Ex.: ataque, toxina, efeito..." />
      </label>
      <label>Observação (opcional)
        <input value={observacao} maxLength={500} onChange={evento => setObservacao(evento.target.value)} />
      </label>
      <button type="button" disabled={salvando || !fonte.trim()} onClick={() => void ativar()}>{salvando ? 'Salvando…' : 'Ativar Condição'}</button>
    </div>
    {itens.some(item => !ativas.some(ativa => ativa.id === item.id)) && <>
      <h4>Histórico</h4>
      <ul>{itens.filter(item => !ativas.some(ativa => ativa.id === item.id)).map(item => <li key={item.id}>
        <strong>{ICONE_CONDICAO[item.condicao]} {CATALOGO_CONDICOES[item.condicao].nome}</strong> · Encerrada em {item.encerradaEm ? new Date(item.encerradaEm).toLocaleString('pt-BR') : 'data não registrada'}
        <p>Fonte: {item.fonte}</p>
      </li>)}</ul>
    </>}
    {tiposAtivos.length > 0 && <p>Condições ativas distintas: {tiposAtivos.map(id => CATALOGO_CONDICOES[id].nome).join(' · ')}. Fontes múltiplas da mesma Condição mantêm duração própria, sem acumular o efeito.</p>}
    {mensagem && <p role="status">{mensagem}</p>}
  </details>;
}
