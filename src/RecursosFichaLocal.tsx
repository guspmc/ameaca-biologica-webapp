import { useState } from 'react';
import { ajustarBI, ajustarSA, aplicarDanoPV, curarPV, definirPVTemporarios, recursosIniciais, recursosValidos, type RecursosAtuais } from './recursosFicha';

type Props = {
  dados: Record<string, unknown>;
  pvMaximo: number;
  saMaximo: number;
  biMaximo: number;
  aoSalvar: (patch: RecursosAtuais) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
};

export default function RecursosFichaLocal({ dados, pvMaximo, saMaximo, biMaximo, aoSalvar, aoAlterarPendencia }: Props) {
  const [recursos, setRecursos] = useState(() => recursosIniciais(dados, pvMaximo, saMaximo));
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [dano, setDano] = useState('1');
  const [temporarios, setTemporarios] = useState('0');
  const valido = recursosValidos(recursos, pvMaximo, saMaximo);
  const fase = biMaximo <= 0 ? 'Indisponível até concluir a Classe' : recursos.biAtual >= biMaximo ? 'Colapso Viral' : 'Fase ' + (Math.floor(recursos.biAtual * 5 / biMaximo) + 1);

  function atualizar(proximo: RecursosAtuais) {
    setRecursos(proximo);
    aoAlterarPendencia(true);
    setMensagem('');
    setErro('');
  }
  function quantidade(valor: string): number {
    const n = Number(valor);
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Informe uma quantidade inteira não negativa.');
    return n;
  }
  function tentar(operacao: () => RecursosAtuais) {
    try { atualizar(operacao()); } catch (e) { setErro(e instanceof Error ? e.message : 'Operação inválida.'); }
  }
  async function salvar() {
    if (ocupado) return;
    if (!valido) { setErro('Revise os valores: PV e SA Atuais não podem exceder seus máximos.'); return; }
    setOcupado(true); setErro(''); setMensagem('');
    try {
      if (!await aoSalvar(recursos)) throw new Error('O armazenamento não confirmou a gravação.');
      aoAlterarPendencia(false);
      setMensagem('Recursos salvos e confirmados.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar os recursos.'); }
    finally { setOcupado(false); }
  }

  return <section className="ficha-local-editor recursos-ficha" aria-label="Recursos da personagem">
    <h3>Recursos e Integridade Física</h3>
    <p>Valores atuais são separados dos máximos derivados. Ajustes aqui não registram descanso, rolagem, ação ou efeito automático.</p>
    <div className="ficha-local-grade">
      <div><small>PONTOS DE VIDA</small><strong>{recursos.pvAtual}/{pvMaximo}</strong><p>Temporários: {recursos.pvTemporarios}</p></div>
      <div><small>SURTO DE ADRENALINA</small><strong>{recursos.saAtual}/{saMaximo}</strong><p>Gasto de SA é sempre uma escolha expressa.</p></div>
      <div><small>BIO-INFECÇÃO</small><strong>{recursos.biAtual}/{biMaximo}</strong><p>{fase}</p></div>
    </div>
    {!valido && <p className="offline-erro" role="alert">Há valores acima dos máximos atuais. Eles foram preservados; ajuste-os antes de salvar.</p>}
    <h4>PV Atuais e Temporários</h4>
    <div className="recursos-controles">
      <button type="button" disabled={ocupado || recursos.pvAtual >= pvMaximo} onClick={() => tentar(() => curarPV(recursos, 1, pvMaximo))}>+1 PV</button>
      <button type="button" disabled={ocupado || (recursos.pvAtual === 0 && recursos.pvTemporarios === 0)} onClick={() => tentar(() => aplicarDanoPV(recursos, 1, pvMaximo, saMaximo))}>-1 PV (dano)</button>
      <label>Aplicar dano<input type="number" min="0" step="1" value={dano} disabled={ocupado} onChange={e => setDano(e.target.value)}/></label>
      <button type="button" disabled={ocupado} onClick={() => tentar(() => aplicarDanoPV(recursos, quantidade(dano), pvMaximo, saMaximo))}>Aplicar</button>
      <label>Novos PV Temporários<input type="number" min="0" step="1" value={temporarios} disabled={ocupado} onChange={e => setTemporarios(e.target.value)}/></label>
      <button type="button" disabled={ocupado} onClick={() => tentar(() => definirPVTemporarios(recursos, quantidade(temporarios), pvMaximo, saMaximo))}>Definir</button>
    </div>
    <p className="ficha-local-legenda">Dano consome PV Temporários antes dos PV Atuais. Cura afeta apenas PV Atuais. Novos PV Temporários conservam o maior valor, sem soma.</p>
    <h4>Surto de Adrenalina</h4>
    <div className="recursos-controles">
      <button type="button" disabled={ocupado || recursos.saAtual === 0} onClick={() => tentar(() => ajustarSA(recursos, -1, pvMaximo, saMaximo))}>-1 SA</button>
      <button type="button" disabled={ocupado || recursos.saAtual >= saMaximo} onClick={() => tentar(() => ajustarSA(recursos, 1, pvMaximo, saMaximo))}>+1 SA</button>
    </div>
    <p className="ficha-local-legenda">A ficha registra a quantidade; não compra ações nem controla automaticamente a janela de Esforço.</p>
    <h4>Bio-Infecção</h4>
    <div className="recursos-controles">
      <button type="button" disabled={ocupado || biMaximo <= 0 || recursos.biAtual === 0} onClick={() => tentar(() => ajustarBI(recursos, -1, pvMaximo, saMaximo))}>-1 BI</button>
      <button type="button" disabled={ocupado || biMaximo <= 0} onClick={() => tentar(() => ajustarBI(recursos, 1, pvMaximo, saMaximo))}>+1 BI</button>
    </div>
    <p className="ficha-local-legenda">BI começa em 0, não aumenta sozinha e só diminui por fonte expressa. Alcançar ou ultrapassar BI Máxima sinaliza Colapso Viral; esta tela não inicia Reanimação ou transformação.</p>
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
    <button type="button" className="acao" disabled={ocupado || !valido} onClick={() => void salvar()}>{ocupado ? 'Salvando…' : 'Salvar recursos'} <span>→</span></button>
  </section>;
}
