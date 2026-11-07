import { useEffect, useState } from 'react';
import {
  CATALOGO_CONDICOES, adicionarInstanciaCondicao, condicoesComEfeitoUnico,
  listaCondicoesValida, removerInstanciaCondicao, vulneravelPorPV,
  type CondicaoId, type InstanciaCondicao,
} from './condicoesFicha';

type Props = {
  dados: Record<string, unknown>;
  pvAtual: number;
  pvMaximo: number;
  origemDados?: 'local' | 'servidor';
  bloqueado?: boolean;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

const OPCOES = (Object.entries(CATALOGO_CONDICOES) as [CondicaoId, typeof CATALOGO_CONDICOES[CondicaoId]][])
  .filter(([, regra]) => regra.duracao !== 'estado-derivado' && regra.duracao !== 'estado-transformacao');

function idNovo() {
  return globalThis.crypto?.randomUUID?.() ?? 'condicao-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

export default function CondicoesFichaLocal({ dados, pvAtual, pvMaximo, origemDados = 'local', bloqueado = false, aoSalvar }: Props) {
  const inicial = listaCondicoesValida(dados.condicoes) ? dados.condicoes : [];
  const [itens, setItens] = useState<InstanciaCondicao[]>(inicial);
  const [condicao, setCondicao] = useState<CondicaoId>('exposto');
  const [fonte, setFonte] = useState('');
  const [duracao, setDuracao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const chaveDados = JSON.stringify(dados.condicoes ?? []);
  useEffect(() => {
    if (!ocupado) setItens(inicial);
  }, [chaveDados, ocupado]);

  const vulneravel = vulneravelPorPV(pvAtual, pvMaximo);
  const tiposAtivos = condicoesComEfeitoUnico(itens);

  async function salvar(proximos: InstanciaCondicao[]) {
    if (ocupado || bloqueado) return;
    setOcupado(true); setErro(''); setMensagem('');
    try {
      if (!await aoSalvar({ condicoes: proximos })) throw new Error('O armazenamento não confirmou as Condições.');
      setItens(proximos);
      setMensagem(origemDados === 'servidor' ? 'Condições confirmadas pelo servidor.' : 'Condições salvas neste dispositivo.');
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar as Condições.');
      return false;
    } finally { setOcupado(false); }
  }

  async function adicionar() {
    if (!fonte.trim()) { setErro('Informe a fonte da Condição.'); return; }
    const regra = CATALOGO_CONDICOES[condicao];
    const item: InstanciaCondicao = {
      id: idNovo(), condicao, fonte: fonte.trim(),
      duracao: duracao.trim() || regra.remocao,
      observacao: observacao.trim(),
    };
    try {
      const proximos = adicionarInstanciaCondicao(itens, item);
      if (await salvar(proximos)) { setFonte(''); setDuracao(''); setObservacao(''); }
    } catch (e) { setErro(e instanceof Error ? e.message : 'Registro de Condição inválido.'); }
  }

  async function remover(id: string) {
    try { await salvar(removerInstanciaCondicao(itens, id)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível remover a Condição.'); }
  }

  return <details className="ficha-local-editor condicoes-ficha">
    <summary>Condições e efeitos</summary>
    <p>Registro operacional. O WebApp não aplica efeitos, não reduz durações automaticamente e não presume encerramento: siga a fonte e as regras da Mesa.</p>
    <div className="ficha-local-grade">
      <div><small>VULNERÁVEL</small><strong>{vulneravel ? 'Sim' : 'Não'}</strong><p>Derivada automaticamente de PV Atuais ≤ 1/5 dos PV Máximos; não é cadastrada manualmente.</p></div>
    </div>
    {itens.length === 0 ? <p>Nenhuma Condição registrada.</p> : <ul>
      {itens.map(item => {
        const regra = CATALOGO_CONDICOES[item.condicao];
        return <li key={item.id}>
          <strong>{regra.nome}</strong> · Fonte: {item.fonte}
          <p>{regra.efeito}</p>
          <p>Duração/remoção: {item.duracao}</p>
          {item.observacao && <p>Observação: {item.observacao}</p>}
          <button type="button" className="botao-claro" disabled={ocupado || bloqueado} onClick={() => void remover(item.id)}>Remover registro</button>
        </li>;
      })}
    </ul>}
    {tiposAtivos.length > 0 && <p>Condições ativas distintas: {tiposAtivos.map(id => CATALOGO_CONDICOES[id].nome).join(' · ')}. Fontes múltiplas da mesma Condição mantêm duração própria, sem acumular o efeito.</p>}
    <h4>Registrar Condição</h4>
    <label>Condição
      <select value={condicao} disabled={ocupado || bloqueado} onChange={e => setCondicao(e.target.value as CondicaoId)}>
        {OPCOES.map(([id, regra]) => <option key={id} value={id}>{regra.nome}</option>)}
      </select>
    </label>
    <p>{CATALOGO_CONDICOES[condicao].efeito}</p>
    <label>Fonte (obrigatória)
      <input value={fonte} maxLength={160} disabled={ocupado || bloqueado} onChange={e => setFonte(e.target.value)} placeholder="Ex.: ataque, habilidade, criatura, ambiente…" />
    </label>
    <label>Duração ou critério de remoção
      <input value={duracao} maxLength={160} disabled={ocupado || bloqueado} onChange={e => setDuracao(e.target.value)} placeholder={CATALOGO_CONDICOES[condicao].remocao} />
    </label>
    <label>Observação
      <textarea value={observacao} maxLength={500} disabled={ocupado || bloqueado} onChange={e => setObservacao(e.target.value)} />
    </label>
    <button type="button" disabled={ocupado || bloqueado || !fonte.trim()} onClick={() => void adicionar()}>{ocupado ? 'Salvando…' : 'Registrar Condição'}</button>
    {bloqueado && <p role="status">Conclua as edições pendentes da ficha antes de alterar Condições.</p>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
