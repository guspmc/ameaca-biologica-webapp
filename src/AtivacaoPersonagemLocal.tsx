import { useEffect, useRef, useState } from 'react';
import type { ResultadoConferenciaCriacaoLocal } from './servidorLocal';

type Props = {
  revision: number;
  bloqueado?: boolean;
  aoConferir: () => Promise<ResultadoConferenciaCriacaoLocal>;
  aoAtivar: (revision: number, operationId: string) => Promise<boolean>;
};

function novoIdentificadorOperacao(): string {
  const fonte = globalThis.crypto;
  if (!fonte?.getRandomValues) throw new Error('Não foi possível gerar um identificador seguro para a ativação.');
  const bytes = new Uint8Array(16);
  fonte.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, valor => valor.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function AtivacaoPersonagemLocal({ revision, bloqueado = false, aoConferir, aoAtivar }: Props) {
  const [conferencia, setConferencia] = useState<ResultadoConferenciaCriacaoLocal | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const operacaoId = useRef<string | null>(null);

  useEffect(() => {
    setConferencia(null);
    setConfirmado(false);
    setErro('');
    setConcluido(false);
    operacaoId.current = null;
  }, [revision]);

  async function conferir() {
    if (ocupado || bloqueado || concluido) return;
    setOcupado(true);
    setErro('');
    setConferencia(null);
    setConfirmado(false);
    operacaoId.current = null;
    try {
      const resultado = await aoConferir();
      if (resultado.revision !== revision) {
        setErro('A ficha mudou no servidor desde a última atualização. Feche e reabra a ficha para conferir a versão atual.');
        return;
      }
      setConferencia(resultado);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível conferir a criação no servidor.');
    } finally {
      setOcupado(false);
    }
  }

  async function ativar() {
    if (!conferencia || !confirmado || ocupado || bloqueado || concluido) return;
    if (!conferencia.valido || conferencia.pendencias.length || !conferencia.inventario || conferencia.ativas >= 10) return;
    setOcupado(true);
    setErro('');
    try {
      operacaoId.current ??= novoIdentificadorOperacao();
      const confirmadoPeloServidor = await aoAtivar(conferencia.revision, operacaoId.current);
      if (confirmadoPeloServidor) setConcluido(true);
      else setErro('A ativação ainda não foi confirmada. O mesmo pedido será preservado para uma nova tentativa.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível confirmar a ativação. O pedido será preservado para nova tentativa.');
    } finally {
      setOcupado(false);
    }
  }

  const apta = !!conferencia
    && conferencia.valido
    && conferencia.pendencias.length === 0
    && !!conferencia.inventario
    && conferencia.ativas < 10
    && conferencia.revision === revision;

  return <details className="ficha-local-editor">
    <summary>Conferência final e ativação</summary>
    <p>A conferência é refeita pelo servidor. A ativação só ocorre após sua confirmação explícita; os recursos atuais não são restaurados. O inventário inicial é preparado uma única vez.</p>
    {bloqueado && <p className="ficha-local-legenda">Conclua os salvamentos pendentes antes de conferir ou ativar.</p>}
    {!concluido && <button type="button" className="botao-claro" disabled={ocupado || bloqueado} onClick={() => void conferir()}>
      {ocupado ? 'Conferindo…' : 'Conferir criação no servidor'}
    </button>}
    {conferencia && <>
      <div className="ficha-local-grade">
        <div><small>ITENS CONFERIDOS</small><strong>{conferencia.conferencia.length - conferencia.pendencias.length}/{conferencia.conferencia.length}</strong><p>Validação dos dados salvos no servidor.</p></div>
        <div><small>VAGAS ATIVAS NA MESA</small><strong>{conferencia.ativas}/10</strong><p>A contagem será refeita dentro da transação de ativação.</p></div>
        {conferencia.inventario && <div><small>INVENTÁRIO INICIAL</small><strong>{conferencia.inventario.ocupados}/{conferencia.inventario.capacidade} Espaços</strong><p>{conferencia.inventario.itens.length} instâncias preparadas, sem restaurar PV, SA ou BI.</p></div>}
      </div>
      {conferencia.pendencias.length > 0 && <ul aria-label="Pendências da criação">
        {conferencia.pendencias.map((item, indice) => <li key={item.nome + indice}><strong>{item.nome}</strong><p>{item.detalhe}</p></li>)}
      </ul>}
      {conferencia.ativas >= 10 && <p role="status">A Mesa já possui dez personagens ativas. O rascunho foi preservado.</p>}
      {apta && !concluido && <label>
        <input type="checkbox" checked={confirmado} disabled={ocupado || bloqueado} onChange={evento => setConfirmado(evento.target.checked)} />
        Conferi os dados e quero ativar esta personagem.
      </label>}
      {apta && !concluido && <button type="button" className="acao" disabled={!confirmado || ocupado || bloqueado} onClick={() => void ativar()}>
        {ocupado ? 'Aguardando confirmação…' : 'Ativar personagem'}
      </button>}
    </>}
    {concluido && <p role="status">Ativação confirmada pelo servidor. A personagem agora está ativa na Mesa.</p>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
  </details>;
}
