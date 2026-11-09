import { useEffect, useState } from 'react';
import { concluirDescansoCompleto, concluirDescansoParcial, dadoVidaClasse, localPermiteDescanso, type LocalDescanso } from './descansoFicha';
import { recursosIniciais } from './recursosFicha';
import { renovarUsosDescansoCompleto } from './usosDescansoCompleto';
import type { ModoDados } from './funcionamentoFicha';

type Props = {
  dados: Record<string, unknown>;
  classe: string;
  pvMaximo: number;
  saMaximo: number;
  nivel: number;
  modoDados: ModoDados;
  bloqueado: boolean;
  origemDados?: 'local' | 'servidor';
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
  aoPrepararPatchCompleto?: () => Record<string, unknown>;
};

export default function DescansoFichaLocal({ dados, classe, pvMaximo, saMaximo, nivel, modoDados, bloqueado, origemDados = 'local', aoSalvar, aoPrepararPatchCompleto }: Props) {
  const [local, setLocal] = useState<LocalDescanso | ''>('');
  const [resultados, setResultados] = useState<string[]>(() => Array.from({ length: Number.isInteger(nivel) && nivel >= 1 && nivel <= 10 ? nivel : 1 }, () => ''));
  const nivelValido = Number.isInteger(nivel) && nivel >= 1 && nivel <= 10;
  useEffect(() => { if (nivelValido) setResultados(Array.from({ length: nivel }, () => '')); }, [nivel]);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const dadoVida = (() => { try { return dadoVidaClasse(classe); } catch { return null; } })();
  const resultadosValidos = nivelValido && resultados.length === nivel && resultados.every(resultado => {
    const face = Number(resultado);
    return resultado.trim() !== '' && Number.isSafeInteger(face) && face >= 1 && face <= (dadoVida ?? 0);
  });
  const parcialDisponivel = !bloqueado && modoDados !== 'virtuais' && nivelValido && dadoVida !== null && resultadosValidos && localPermiteDescanso('parcial', local);
  const completoDisponivel = !bloqueado && dadoVida !== null && localPermiteDescanso('completo', local);
  async function concluir(tipo: 'parcial' | 'completo') {
    if (ocupado) return;
    try {
      const atuais = recursosIniciais(dados, pvMaximo, saMaximo);
      const patch: Record<string, unknown> = tipo === 'completo'
        ? { ...concluirDescansoCompleto(atuais, pvMaximo, saMaximo), usosDescansoCompleto: renovarUsosDescansoCompleto(), ...(aoPrepararPatchCompleto?.() ?? {}) }
        : concluirDescansoParcial(atuais, resultados.map(Number), dadoVida!, pvMaximo, saMaximo, nivel);
      setOcupado(true); setErro(''); setMensagem('');
      if (!await aoSalvar(patch)) throw new Error('O armazenamento não confirmou a conclusão do Descanso.');
      setMensagem((origemDados === 'servidor' ? 'Servidor confirmou. ' : 'Salvo neste dispositivo. ') + (tipo === 'completo'
        ? 'Descanso Completo: PV e SA restaurados; PV Temporários encerrados; usos limitados renovados. BI preservada.'
        : 'Descanso Parcial: resultado físico aplicado aos PV Atuais. SA e BI preservadas.'));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir o Descanso.');
    } finally { setOcupado(false); }
  }

  return <details className="ficha-local-editor descanso-ficha">
    <summary>Descanso Parcial e Completo</summary>
    <p>Informe o local ficcional e conclua a modalidade escolhida. Não há cronômetro real nem validação de localização pelo aplicativo.</p>
    {bloqueado && <p role="status">Salve ou descarte as alterações pendentes da ficha antes de concluir um Descanso.</p>}
    <label>Local do Descanso
      <select value={local} disabled={ocupado} onChange={e => { setLocal(e.target.value as LocalDescanso | ''); setMensagem(''); setErro(''); }}>
        <option value="">Selecione o local</option>
        <option value="sala_descanso">Sala de Descanso</option>
        <option value="sala_segura">Sala Segura</option>
      </select>
    </label>
    <h4>Descanso Parcial · 30 minutos</h4>
    <p>Sala de Descanso ou Sala Segura. Role um Dado de Vida por Nível; Autodidata usa d8, Agente d10 e Operador d12. Não recupera SA nem pausa Condições.</p>
    {!nivelValido && <p className="offline-erro" role="alert">Nível inválido; não é possível calcular o Descanso Parcial.</p>}
    {modoDados === 'virtuais' ? <p>O método de dados está em Virtual, mas a rolagem virtual ainda não está implementada. Nenhum resultado será presumido.</p> : <div className="ficha-local-grade">
      {resultados.map((resultado, indice) => <label key={indice}>Dado de Vida {indice + 1} · 1d{dadoVida ?? '—'}
        <input type="number" min="1" max={dadoVida ?? 1} step="1" value={resultado} disabled={ocupado || !dadoVida || !nivelValido} onChange={e => setResultados(atuais => atuais.map((valor, i) => i === indice ? e.target.value : valor))}/>
      </label>)}
    </div>}
    <button type="button" className="acao" disabled={ocupado || !parcialDisponivel} onClick={() => void concluir('parcial')}>Concluir Descanso Parcial <span>→</span></button>
    <h4>Descanso Completo · 1 hora</h4>
    <p>Somente Sala de Descanso. Restaura PV e SA aos máximos e encerra PV Temporários. Não reduz BI nem remove automaticamente Intoxicação ou outras consequências. Usos de Habilidades e benefícios limitados a 1/Descanso Completo são renovados após a confirmação do salvamento. Condições e progressões temporais continuam sem atualização automática.</p>
    <button type="button" className="acao" disabled={ocupado || !completoDisponivel} onClick={() => void concluir('completo')}>Concluir Descanso Completo <span>→</span></button>
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
