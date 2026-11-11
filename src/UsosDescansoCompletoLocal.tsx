import { useState } from 'react';
import {
  listarFontesUsosDescansoCompleto,
  registrarUsoDescansoCompleto,
  usosDescansoCompletoValido,
  type ChaveUsoDescansoCompleto,
} from './usosDescansoCompleto';

type Props = {
  dados: Record<string, unknown>;
  origem: string;
  habilidades: string[];
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

export default function UsosDescansoCompletoLocal({ dados, origem, habilidades, aoSalvar }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const fontes = listarFontesUsosDescansoCompleto(origem, habilidades);
  if (fontes.length === 0) return null;

  const usos = dados.usosDescansoCompleto ?? {};
  const registroValido = usosDescansoCompletoValido(usos);
  async function marcar(chave: ChaveUsoDescansoCompleto) {
    if (ocupado || !registroValido) return;
    setOcupado(true);
    setErro('');
    setMensagem('');
    try {
      const atualizado = registrarUsoDescansoCompleto(usos, chave, fontes);
      if (!await aoSalvar({ usosDescansoCompleto: atualizado })) {
        throw new Error('O armazenamento não confirmou o registro do uso.');
      }
      setMensagem('Uso registrado após confirmação do armazenamento.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar o uso.');
    } finally {
      setOcupado(false);
    }
  }

  return <details className="ficha-local-editor usos-descanso-completo">
    <summary>Benefícios limitados a Descanso Completo</summary>
    {!registroValido && <p className="offline-erro" role="alert">O registro de usos está inválido. Nenhum uso pode ser alterado até a revisão dos dados.</p>}
    {fontes.map(fonte => {
      const usado = (usos as Record<string, unknown>)[fonte.chave] === true;
      return <div className="ficha-local-bloco-beneficio" key={fonte.chave}>
        <strong>{fonte.nome}</strong>
        <p>{fonte.descricao}</p>
        <small>{fonte.tipo} · {usado ? 'Uso já registrado' : 'Uso disponível'}</small>
        {fonte.chave === 'origem:mercenario'
          ? <p className="ficha-local-legenda">O uso é registrado junto com a Reação no Painel de Combate, para preservar o custo e o limite de Descanso Completo na mesma gravação.</p>
          : <button type="button" className="acao" disabled={ocupado || !registroValido || usado}
              onClick={() => void marcar(fonte.chave)}>
              {usado ? 'Uso registrado' : 'Marcar uso como realizado'}
            </button>}
      </div>;
    })}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
