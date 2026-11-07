import type { EstadoAutoSaveLocal } from './useAutoSaveLocal';

type Props = {
  estado: EstadoAutoSaveLocal;
  erro: string;
  mensagemSucesso?: string;
  aoTentarNovamente: () => void;
};

export default function AutoSaveStatusLocal({ estado, erro, mensagemSucesso, aoTentarNovamente }: Props) {
  if (estado === 'ocioso') return null;
  if (estado === 'pendente') return <p className="offline-status" role="status" aria-live="polite">Alteração pendente. Salvamento automático em instantes…</p>;
  if (estado === 'sincronizando') return <p className="offline-status" role="status" aria-live="polite">Sincronizando com o servidor…</p>;
  if (estado === 'salvo') return <p className="offline-status" role="status" aria-live="polite">{mensagemSucesso ?? 'Alteração salva neste dispositivo.'}</p>;
  if (estado === 'invalido') return <p className="offline-erro" role="alert">{erro}</p>;
  return <div>
    <p className="offline-erro" role="alert">{erro || 'O servidor não confirmou o salvamento.'}</p>
    <button type="button" className="botao-claro" onClick={aoTentarNovamente}>Tentar novamente</button>
  </div>;
}
