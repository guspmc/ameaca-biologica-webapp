import { useState } from 'react';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useAutoSaveLocal } from './useAutoSaveLocal';

const CAMPOS = [
  { id: 'genero', nome: 'Gênero', limite: 40 },
  { id: 'idade', nome: 'Idade', limite: 20 },
  { id: 'ocupacao', nome: 'Ocupação', limite: 100 },
  { id: 'afiliacao', nome: 'Afiliação / organização', limite: 120 },
  { id: 'aparencia', nome: 'Aparência', limite: 1000 },
  { id: 'personalidade', nome: 'Personalidade', limite: 1000 },
  { id: 'objetivo', nome: 'Objetivo', limite: 1000 },
  { id: 'medo', nome: 'Medo', limite: 1000 },
  { id: 'lacos', nome: 'Laços', limite: 1000 },
  { id: 'historia', nome: 'História', limite: 4000 },
] as const;

type Props = {
  nome: string;
  identidade: Record<string, string>;
  aoSalvar: (dados: { nome: string; identidade: Record<string, string> }) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  mensagemSucesso?: string;
};

export default function IdentidadeLocal({ nome: nomeInicial, identidade: identidadeInicial, aoSalvar, aoAlterarPendencia, mensagemSucesso = 'Identificação salva e confirmada pelo servidor.' }: Props) {
  const [nome, setNome] = useState(nomeInicial);
  const [dados, setDados] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAMPOS.map(campo => [campo.id, typeof identidadeInicial[campo.id] === 'string' ? identidadeInicial[campo.id] : '']))
  );
  const [sujo, setSujo] = useState(false);
  const identidade = { ...identidadeInicial, ...Object.fromEntries(CAMPOS.map(campo => [campo.id, (dados[campo.id] ?? '').trim()])) };
  const valor = { nome: nome.trim(), identidade };
  const chave = JSON.stringify({ nome, dados });
  const autosave = useAutoSaveLocal({
    valor, chave, sujo, aoSalvar,
    validar: atual => {
      if (atual.nome.length < 2 || atual.nome.length > 80) return 'O nome deve ter entre 2 e 80 caracteres.';
      const campoInvalido = CAMPOS.find(campo => (atual.identidade[campo.id] ?? '').length > campo.limite);
      return campoInvalido ? 'Revise o limite de caracteres do campo ' + campoInvalido.nome + '.' : null;
    },
    aoConfirmar: () => { setSujo(false); aoAlterarPendencia(false); },
  });
  const ocupado = autosave.estado === 'sincronizando';

  function marcarAlteracao() {
    setSujo(true);
    aoAlterarPendencia(true);
  }

  return <details className="ficha-local-identidade-detalhe">
    <summary>Identificação, aparência e história</summary>
    <p>Campos narrativos da personagem. São opcionais e não alteram Atributos ou recursos. Gênero se refere à personagem e auxilia a flexão dos textos da ficha.</p>
    <div className="ficha-local-identidade-form">
      <label>Nome da personagem
        <input value={nome} minLength={2} maxLength={80} required disabled={ocupado} onChange={evento => { setNome(evento.target.value); marcarAlteracao(); }} />
      </label>
      {CAMPOS.map(campo => <label key={campo.id}>{campo.nome}
        {campo.limite > 120
          ? <textarea rows={campo.id === 'historia' ? 6 : 3} maxLength={campo.limite} value={dados[campo.id] ?? ''} disabled={ocupado} onChange={evento => { setDados(atual => ({ ...atual, [campo.id]: evento.target.value })); marcarAlteracao(); }} />
          : <input maxLength={campo.limite} value={dados[campo.id] ?? ''} disabled={ocupado} onChange={evento => { setDados(atual => ({ ...atual, [campo.id]: evento.target.value })); marcarAlteracao(); }} />}
        <small>{(dados[campo.id] ?? '').length}/{campo.limite}</small>
      </label>)}
      <AutoSaveStatusLocal estado={autosave.estado} erro={autosave.erro} mensagemSucesso={mensagemSucesso} aoTentarNovamente={autosave.tentarNovamente} />
    </div>
  </details>;
}
