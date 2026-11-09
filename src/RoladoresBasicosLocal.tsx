import { useEffect, useState } from 'react';
import type { FacesDado } from './rolagemDados';
import { sortearDados, validarResultadosFisicos } from './rolagemDados';
import type { ModoDados, VisibilidadeRolagem } from './funcionamentoFicha';

type Props = {
  modo: 'automatico' | 'misto' | 'manual';
  modoDados: ModoDados;
  visibilidade: VisibilidadeRolagem;
  agilidade: number;
};

const DADOS: FacesDado[] = [4, 6, 8, 10, 12, 20, 100];

export default function RoladoresBasicosLocal({ modo, modoDados, visibilidade, agilidade }: Props) {
  const [metodo, setMetodo] = useState<'fisico' | 'virtual'>(modoDados === 'virtuais' ? 'virtual' : 'fisico');
  const [faceFisicaIniciativa, setFaceFisicaIniciativa] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [faces, setFaces] = useState<FacesDado>(20);
  const [resultadosFisicos, setResultadosFisicos] = useState('');
  const [resultadoIniciativa, setResultadoIniciativa] = useState('');
  const [resultadoLivre, setResultadoLivre] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setMetodo(modoDados === 'virtuais' ? 'virtual' : 'fisico');
  }, [modoDados]);

  if (modo !== 'automatico') return null;

  function rolarIniciativa() {
    try {
      const dado = metodo === 'virtual'
        ? sortearDados(1, 20)[0]
        : validarResultadosFisicos(faceFisicaIniciativa, 1, 20)[0];
      setResultadoIniciativa(`D20: ${dado} · AGI: +${agilidade} · Total: ${dado + agilidade}`);
      setErro('');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível registrar a rolagem.');
    }
  }

  function rolarLivre() {
    try {
      const totalDados = Number(quantidade);
      if (!Number.isSafeInteger(totalDados) || totalDados < 1) throw new Error('Informe uma quantidade inteira positiva.');
      const dados = metodo === 'virtual'
        ? sortearDados(totalDados, faces)
        : validarResultadosFisicos(resultadosFisicos, totalDados, faces);
      setResultadoLivre(`${dados.join(' + ')} = ${dados.reduce((soma, valor) => soma + valor, 0)}`);
      setErro('');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível registrar a rolagem.');
    }
  }

  return <section className="ficha-local-editor roladores-ficha" aria-label="Roladores integrados">
    <h3>Roladores integrados</h3>
    <p>Disponíveis somente no modo Automático. Cada rolagem exige uma ação explícita; nenhum resultado altera os dados da personagem.</p>
    {modoDados === 'mistos' && <label>Método desta rolagem
      <select value={metodo} onChange={evento => setMetodo(evento.target.value as 'fisico' | 'virtual')}>
        <option value="fisico">Dados físicos</option>
        <option value="virtual">Dados virtuais</option>
      </select>
    </label>}
    {modoDados !== 'mistos' && <p>Método: {modoDados === 'fisicos' ? 'Dados físicos' : 'Dados virtuais'}.</p>}

    <div className="ficha-local-rolador">
      <h4>Iniciativa</h4>
      <p>1d20 + AGI ({agilidade}). Resultado pontual; não organiza turnos ou Encontros.</p>
      {metodo === 'fisico' && <label>Resultado físico do d20
        <input type="number" min="1" max="20" step="1" value={faceFisicaIniciativa} onChange={evento => setFaceFisicaIniciativa(evento.target.value)} />
      </label>}
      <button type="button" className="botao-claro" onClick={rolarIniciativa}>{metodo === 'virtual' ? 'Rolar Iniciativa' : 'Registrar resultado físico'}</button>
      {resultadoIniciativa && <p role="status">{resultadoIniciativa}</p>}
    </div>

    <div className="ficha-local-rolador">
      <h4>Rolador livre</h4>
      <div className="ficha-local-grade">
        <label>Quantidade
          <input type="number" min="1" step="1" value={quantidade} onChange={evento => setQuantidade(evento.target.value)} />
        </label>
        <label>Tipo de dado
          <select value={faces} onChange={evento => setFaces(Number(evento.target.value) as FacesDado)}>
            {DADOS.map(lados => <option key={lados} value={lados}>d{lados}</option>)}
          </select>
        </label>
      </div>
      {metodo === 'fisico' && <label>Resultados físicos (separados por espaço ou vírgula)
        <input type="text" value={resultadosFisicos} onChange={evento => setResultadosFisicos(evento.target.value)} placeholder="Ex.: 4, 2, 6" />
      </label>}
      <button type="button" className="botao-claro" onClick={rolarLivre}>{metodo === 'virtual' ? 'Rolar dados' : 'Registrar resultados físicos'}</button>
      {resultadoLivre && <p role="status">{resultadoLivre}</p>}
    </div>
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    <small>Visibilidade configurada: {visibilidade === 'privada' ? 'Privada' : 'Pública'}. Na Ficha Offline, os resultados permanecem neste dispositivo e não são transmitidos nem registrados em histórico compartilhado.</small>
  </section>;
}
