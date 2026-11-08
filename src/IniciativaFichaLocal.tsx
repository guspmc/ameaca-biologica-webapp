import { useState } from 'react';

type Props = { agilidade: number };

/**
 * Calculadora manual de Iniciativa.
 * O jogador informa o resultado natural obtido no d20; a ficha não rola dados
 * nem publica ou altera a ordem do Encontro.
 */
export default function IniciativaFichaLocal({ agilidade }: Props) {
  const [resultadoNatural, setResultadoNatural] = useState('');

  const natural = resultadoNatural === '' ? null : Number(resultadoNatural);
  const valido = natural !== null && Number.isInteger(natural) && natural >= 1 && natural <= 20;
  const total = valido ? natural + agilidade : null;

  return (
    <div className="ficha-local-editor iniciativa-ficha-local">
      <h4>Iniciativa</h4>
      <p>Role 1d20 e informe abaixo o resultado natural. A ficha soma AGI automaticamente; ela não realiza a rolagem nem altera a ordem do Encontro.</p>
      <label>
        Resultado natural do d20
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="20"
          step="1"
          value={resultadoNatural}
          placeholder="1 a 20"
          onChange={evento => setResultadoNatural(evento.target.value)}
          aria-label="Resultado natural do dado de Iniciativa"
        />
      </label>
      <div className="ficha-local-grade" aria-live="polite">
        <div><small>AGILIDADE</small><strong>{agilidade}</strong></div>
        <div><small>INICIATIVA TOTAL</small><strong>{total === null ? '—' : total}</strong></div>
      </div>
      {resultadoNatural !== '' && !valido && <p className="offline-erro" role="alert">Informe um resultado natural inteiro entre 1 e 20.</p>}
      {valido && <p className="ficha-local-legenda">Desempate: maior AGI; depois, maior resultado natural do d20. Persistindo o empate, os participantes empatados rolam novamente.</p>}
    </div>
  );
}
