import { useState } from 'react';
import {
  adicionarDecisaoMesa,
  gerarIdDecisaoMesa,
  listaDecisoesMesaValida,
  TIPOS_DECISAO_MESA,
  type TipoDecisaoMesa,
} from './registroDecisoesMesa';

type Props = {
  dados: Record<string, unknown>;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
  origemDados?: 'local' | 'servidor';
};

function dataHoraLocal(valor = new Date()): string {
  const ajuste = valor.getTime() - valor.getTimezoneOffset() * 60000;
  return new Date(ajuste).toISOString().slice(0, 16);
}

export default function RegistroDecisoesMesaLocal({ dados, aoSalvar, origemDados = 'local' }: Props) {
  const registros = dados.registrosMesa ?? [];
  const valido = listaDecisoesMesaValida(registros);
  const itens = valido ? registros : [];
  const [tipo, setTipo] = useState<TipoDecisaoMesa>('outro');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [ocorridoEm, setOcorridoEm] = useState(dataHoraLocal);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function registrar() {
    if (!valido || salvando || !descricao.trim() || !responsavel.trim() || !ocorridoEm) return;
    if (!window.confirm('Confirmar o registro desta decisão da Mesa? A Ficha armazenará o relato, sem executar efeitos no personagem.')) return;
    setSalvando(true); setMensagem('');
    try {
      const ocorrido = new Date(ocorridoEm);
      if (Number.isNaN(ocorrido.getTime())) throw new Error('Informe uma data e hora válidas.');
      const atualizados = adicionarDecisaoMesa(itens, {
        id: gerarIdDecisaoMesa(),
        tipo,
        descricao: descricao.trim(),
        responsavel: responsavel.trim(),
        ocorridoEm: ocorrido.toISOString(),
        registradoEm: new Date().toISOString(),
      });
      if (!await aoSalvar({ registrosMesa: atualizados })) {
        throw new Error('O armazenamento não confirmou o registro da decisão.');
      }
      setDescricao('');
      setMensagem(origemDados === 'servidor' ? 'Decisão registrada e confirmada pelo servidor.' : 'Decisão registrada neste dispositivo.');
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : 'Não foi possível registrar a decisão.');
    } finally { setSalvando(false); }
  }

  return <details className="ficha-local-editor registro-decisoes-mesa">
    <summary>Registro de decisões da Mesa <span>{itens.length} / 30</span></summary>
    <p>Registre aqui decisões e acontecimentos definidos pelo Mestre/Jogador responsável. Este histórico não altera PV, BI, Condições, Reanimação ou qualquer outro estado da ficha. O responsável é informado manualmente e não representa uma identificação autenticada da conta.</p>
    {!valido && <p className="offline-erro" role="alert">O histórico de decisões está inválido. Os dados originais foram preservados e a edição foi bloqueada para evitar sobrescrita. Faça um backup e revise o registro.</p>}
    <h4>Novo registro</h4>
    <div className="ficha-local-editor">
      <label>Tipo de acontecimento
        <select value={tipo} disabled={!valido || salvando || itens.length >= 30} onChange={evento => setTipo(evento.target.value as TipoDecisaoMesa)}>
          {Object.entries(TIPOS_DECISAO_MESA).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
        </select>
      </label>
      <label>Descrição da decisão ou do resultado
        <textarea value={descricao} maxLength={500} rows={4} disabled={!valido || salvando || itens.length >= 30} onChange={evento => setDescricao(evento.target.value)} placeholder="Descreva o que a Mesa decidiu ou o que aconteceu." />
      </label>
      <label>Responsável pela decisão
        <input value={responsavel} maxLength={80} disabled={!valido || salvando || itens.length >= 30} onChange={evento => setResponsavel(evento.target.value)} placeholder="Nome ou apelido informado pela Mesa" />
      </label>
      <label>Quando aconteceu
        <input type="datetime-local" value={ocorridoEm} disabled={!valido || salvando || itens.length >= 30} onChange={evento => setOcorridoEm(evento.target.value)} />
      </label>
      <button type="button" disabled={!valido || salvando || itens.length >= 30 || !descricao.trim() || !responsavel.trim() || !ocorridoEm} onClick={() => void registrar()}>{salvando ? 'Salvando…' : 'Registrar decisão'}</button>
    </div>
    {itens.length > 0 && <>
      <h4>Histórico</h4>
      <ol>{[...itens].reverse().map(item => <li key={item.id}>
        <strong>{TIPOS_DECISAO_MESA[item.tipo]}</strong> · {new Date(item.ocorridoEm).toLocaleString('pt-BR')}
        <p>{item.descricao}</p>
        <small>Responsável informado: {item.responsavel} · Carimbo do dispositivo: {new Date(item.registradoEm).toLocaleString('pt-BR')}</small>
      </li>)}</ol>
      <p className="ficha-local-legenda">Os registros não são editados nem apagados nesta versão. Para corrigir uma informação, acrescente uma Retificação que identifique o registro anterior e descreva a correção.</p>
    </>}
    {itens.length >= 30 && <p className="ficha-local-aviso">Limite de 30 registros atingido. Exporte um backup antes de qualquer ampliação do histórico.</p>}
    {mensagem && <p role="status">{mensagem}</p>}
  </details>;
}
