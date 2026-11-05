import { useState } from 'react';
import { concluirDescansoCompleto, concluirDescansoParcial, dadoVidaClasse, localPermiteDescanso, type LocalDescanso } from './descansoFicha';
import { recursosIniciais, type RecursosAtuais } from './recursosFicha';
import type { ModoDados } from './funcionamentoFicha';

type Props = {
  dados: Record<string, unknown>;
  classe: string;
  pvMaximo: number;
  saMaximo: number;
  modoDados: ModoDados;
  aoSalvar: (patch: RecursosAtuais) => Promise<boolean>;
};

export default function DescansoFichaLocal({ dados, classe, pvMaximo, saMaximo, modoDados, aoSalvar }: Props) {
  const [local, setLocal] = useState<LocalDescanso | ''>('');
  const [resultado, setResultado] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const dadoVida = (() => { try { return dadoVidaClasse(classe); } catch { return null; } })();
  const face = Number(resultado);
  const resultadoValido = resultado.trim() !== '' && Number.isSafeInteger(face) && face >= 1 && face <= (dadoVida ?? 0);
  const parcialDisponivel = modoDados !== 'virtuais' && dadoVida !== null && resultadoValido && localPermiteDescanso('parcial', local);
  const completoDisponivel = localPermiteDescanso('completo', local);
  async function concluir(tipo: 'parcial' | 'completo') {
    if (ocupado) return;
    try {
      const atuais = recursosIniciais(dados, pvMaximo, saMaximo);
      const patch = tipo === 'completo'
        ? concluirDescansoCompleto(atuais, pvMaximo, saMaximo)
        : concluirDescansoParcial(atuais, Number(resultado), dadoVida!, pvMaximo, saMaximo);
      setOcupado(true); setErro(''); setMensagem('');
      if (!await aoSalvar(patch)) throw new Error('O armazenamento não confirmou a conclusão do Descanso.');
      setMensagem(tipo === 'completo'
        ? 'Descanso Completo confirmado: PV e SA restaurados; PV Temporários encerrados. BI preservada.'
        : 'Descanso Parcial confirmado: resultado físico aplicado aos PV Atuais. SA e BI preservadas.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir o Descanso.');
    } finally { setOcupado(false); }
  }

  return <details className="ficha-local-editor descanso-ficha">
    <summary>Descanso Parcial e Completo</summary>
    <p>Informe o local ficcional e conclua a modalidade escolhida. Não há cronômetro real nem validação de localização pelo aplicativo.</p>
    <label>Local do Descanso
      <select value={local} disabled={ocupado} onChange={e => { setLocal(e.target.value as LocalDescanso | ''); setMensagem(''); setErro(''); }}>
        <option value="">Selecione o local</option>
        <option value="sala_descanso">Sala de Descanso</option>
        <option value="sala_segura">Sala Segura</option>
      </select>
    </label>
    <h4>Descanso Parcial · 30 minutos</h4>
    <p>Sala de Descanso ou Sala Segura. Recupera PV pelo Dado de Vida da Classe; não recupera SA nem encerra Condições.</p>
    {modoDados === 'virtuais' ? <p>O método de dados está em Virtual, mas a rolagem virtual ainda não está implementada. Nenhum resultado será presumido.</p> : <label>Resultado físico informado · 1d{dadoVida ?? '—'}
      <input type="number" min="1" max={dadoVida ?? 1} step="1" value={resultado} disabled={ocupado || !dadoVida} onChange={e => setResultado(e.target.value)}/>
    </label>}
    <button type="button" className="acao" disabled={ocupado || !parcialDisponivel} onClick={() => void concluir('parcial')}>Concluir Descanso Parcial <span>→</span></button>
    <h4>Descanso Completo · 1 hora</h4>
    <p>Somente Sala de Descanso. Restaura PV e SA aos máximos e encerra PV Temporários. Não reduz BI nem remove automaticamente Intoxicação ou outras consequências. Neste incremento, o aplicativo ainda não atualiza usos de Habilidades, Condições ou progressões temporais.</p>
    <button type="button" className="acao" disabled={ocupado || !completoDisponivel} onClick={() => void concluir('completo')}>Concluir Descanso Completo <span>→</span></button>
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
