import { useState, type FormEvent } from 'react';

const CAMPOS = [
  { id: 'idade', nome: 'Idade', limite: 40 },
  { id: 'genero', nome: 'Gênero da personagem', limite: 40 },
  { id: 'ocupacao', nome: 'Ocupação', limite: 120 },
  { id: 'apelido', nome: 'Apelido', limite: 120 },
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
};

export default function IdentidadeLocal({ nome: nomeInicial, identidade: identidadeInicial, aoSalvar, aoAlterarPendencia }: Props) {
  const [nome, setNome] = useState(nomeInicial);
  const [dados, setDados] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAMPOS.map(campo => [campo.id, typeof identidadeInicial[campo.id] === 'string' ? identidadeInicial[campo.id] : '']))
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 2 || nomeLimpo.length > 80) {
      setMensagem('O nome deve ter entre 2 e 80 caracteres.');
      return;
    }
    const campoInvalido = CAMPOS.find(campo => (dados[campo.id] ?? '').length > campo.limite);
    if (campoInvalido) {
      setMensagem('Revise o limite de caracteres do campo ' + campoInvalido.nome + '.');
      return;
    }
    setSalvando(true);
    setMensagem('');
    try {
      const identidade = { ...identidadeInicial, ...Object.fromEntries(CAMPOS.map(campo => [campo.id, (dados[campo.id] ?? '').trim()])) };
      const ok = await aoSalvar({ nome: nomeLimpo, identidade });
      if (ok) aoAlterarPendencia(false);
      setMensagem(ok ? 'Identificação salva neste dispositivo.' : 'Não foi possível confirmar o salvamento. Tente novamente.');
    } catch {
      setMensagem('Ocorreu uma falha ao salvar. Nenhuma confirmação foi recebida.');
    } finally {
      setSalvando(false);
    }
  }

  return <details className="ficha-local-identidade-detalhe">
    <summary>Identificação, aparência e história</summary>
    <p>Campos narrativos da personagem. São opcionais e não alteram Atributos ou recursos. Gênero se refere à personagem e auxilia a flexão dos textos da ficha.</p>
    <form className="ficha-local-identidade-form" onSubmit={salvar}>
      <label>Nome da personagem
        <input value={nome} minLength={2} maxLength={80} required disabled={salvando} onChange={evento => { setNome(evento.target.value); aoAlterarPendencia(true); setMensagem(''); }} />
      </label>
      {CAMPOS.map(campo => <label key={campo.id}>{campo.nome}
        {campo.limite > 120
          ? <textarea rows={campo.id === 'historia' ? 6 : 3} maxLength={campo.limite} value={dados[campo.id] ?? ''} disabled={salvando} onChange={evento => { setDados(atual => ({ ...atual, [campo.id]: evento.target.value })); aoAlterarPendencia(true); setMensagem(''); }} />
          : <input maxLength={campo.limite} value={dados[campo.id] ?? ''} disabled={salvando} onChange={evento => { setDados(atual => ({ ...atual, [campo.id]: evento.target.value })); aoAlterarPendencia(true); setMensagem(''); }} />}
        <small>{(dados[campo.id] ?? '').length}/{campo.limite}</small>
      </label>)}
      {mensagem && <p role="status">{mensagem}</p>}
      <button type="submit" className="acao" disabled={salvando || nome.trim().length < 2}>{salvando ? 'Salvando…' : 'Salvar identificação'} <span>→</span></button>
    </form>
  </details>;
}
