import { useEffect, useState } from 'react';
import { lerNotaPessoal, salvarNotaPessoal } from './notasPessoais';

type Props = {
  usuarioId: string;
  mesaId: string;
  personagemId: string;
};

export default function AnotacoesPessoais({ usuarioId, mesaId, personagemId }: Props) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('Carregando nota local…');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setTexto('');
    setErro('');
    try {
      const nota = lerNotaPessoal(window.localStorage, usuarioId, mesaId, personagemId);
      setTexto(nota);
      setEstado(nota ? 'Nota local carregada' : 'Nenhuma nota salva nesta ficha');
    } catch {
      setEstado('');
      setErro('O navegador não permitiu ler a nota deste dispositivo.');
    }
  }, [usuarioId, mesaId, personagemId]);

  function alterar(textoNovo: string) {
    setTexto(textoNovo);
    try {
      salvarNotaPessoal(window.localStorage, usuarioId, mesaId, personagemId, textoNovo);
      setEstado(textoNovo.length ? 'Salva neste dispositivo' : 'Nota removida deste dispositivo');
      setErro('');
    } catch {
      setEstado('');
      setErro('Não foi possível salvar localmente. Confira o espaço disponível e as permissões do navegador.');
    }
  }

  return (
    <section className="ficha-secao notas-pessoais" aria-labelledby="titulo-notas-pessoais">
      <h3 id="titulo-notas-pessoais"><span>✎</span> Anotações pessoais <small>SÓ NESTE DISPOSITIVO</small></h3>
      <p className="ficha-dica">
        Esta nota pertence a esta conta e a esta personagem. Ela fica neste navegador, não é enviada ao servidor
        e não aparece para o Mestre nem para outras contas. Limpar os dados do navegador pode apagá-la.
      </p>
      <label className="notas-pessoais-campo">
        Nota privada
        <textarea
          value={texto}
          onChange={evento => alterar(evento.target.value)}
          rows={5}
          spellCheck
          placeholder="Lembretes pessoais, ideias e anotações para esta personagem…"
          aria-describedby="estado-notas-pessoais"
        />
      </label>
      {erro ? <p className="erro" id="estado-notas-pessoais" role="alert">{erro}</p> : <p className="ficha-dica" id="estado-notas-pessoais" role="status">{estado}</p>}
    </section>
  );
}
