import { useState } from 'react';
import { ajustarBI, ajustarSA, aplicarDanoPV, curarPV, definirPVTemporarios, recursosIniciais, recursosValidos, type RecursosAtuais } from './recursosFicha';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useSalvamentoEditorLocal } from './useSalvamentoEditorLocal';

type Props = {
  dados: Record<string, unknown>;
  pvMaximo: number;
  saMaximo: number;
  biMaximo: number;
  bloquearPV?: boolean;
  aoSalvar: (patch: RecursosAtuais) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  autoSalvar?: boolean;
  origemDados?: 'local' | 'servidor';
};

export default function RecursosFichaLocal({ dados, pvMaximo, saMaximo, biMaximo, bloquearPV = false, aoSalvar, aoAlterarPendencia, autoSalvar = false, origemDados = 'local' }: Props) {
  const [recursos, setRecursos] = useState(() => recursosIniciais(dados, pvMaximo, saMaximo));
  const [anterior, setAnterior] = useState<RecursosAtuais | null>(null);
  const [sujo, setSujo] = useState(false);
  const [erroOperacao, setErroOperacao] = useState('');
  const [dano, setDano] = useState('1');
  const [temporarios, setTemporarios] = useState('0');
  const valido = recursosValidos(recursos, pvMaximo, saMaximo);
  const fase = biMaximo <= 0 ? 'Indisponível até concluir a Classe' : recursos.biAtual >= biMaximo ? 'Colapso Viral' : 'Fase ' + (Math.floor(recursos.biAtual * 5 / biMaximo) + 1);
  const salvamento = useSalvamentoEditorLocal({
    autoSalvar, valor: recursos, chave: JSON.stringify(recursos), sujo, setSujo, aoSalvar, aoAlterarPendencia,
    mensagemSucesso: 'Recursos salvos neste dispositivo.',
    validar: atual => recursosValidos(atual, pvMaximo, saMaximo)
      ? null
      : 'Revise os valores: PV e SA Atuais não podem exceder seus máximos.',
  });
  const ocupado = salvamento.ocupado;

  function atualizar(proximo: RecursosAtuais) {
    setAnterior(recursos);
    setRecursos(proximo);
    setSujo(true);
    aoAlterarPendencia(true);
    setErroOperacao('');
  }
  function quantidade(valor: string): number {
    const n = Number(valor);
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Informe uma quantidade inteira não negativa.');
    return n;
  }
  function tentar(operacao: () => RecursosAtuais) {
    try { atualizar(operacao()); } catch (e) { setErroOperacao(e instanceof Error ? e.message : 'Operação inválida.'); }
  }

  return <details className="ficha-local-editor recursos-ficha" aria-label="Recursos da personagem">
    <summary>Administrar recursos e Integridade Física</summary>
    <h3>Recursos e Integridade Física</h3>
    <p>Valores atuais são separados dos máximos derivados. {origemDados === 'servidor' ? 'Ajustes são enviados ao servidor após a confirmação.' : 'Ajustes são gravados neste dispositivo após a confirmação.'} Não registram descanso, rolagem, ação ou efeito automático.</p>
    <div className="ficha-local-grade">
      <div><small>PONTOS DE VIDA</small><strong>{recursos.pvAtual}/{pvMaximo}</strong><p>Temporários: {recursos.pvTemporarios}</p></div>
      <div><small>SURTO DE ADRENALINA</small><strong>{recursos.saAtual}/{saMaximo}</strong><p>Gasto de SA é sempre uma escolha expressa.</p></div>
      <div><small>BIO-INFECÇÃO</small><strong>{recursos.biAtual}/{biMaximo}</strong><p>{fase}</p></div>
    </div>
    {!valido && <p className="offline-erro" role="alert">Há valores acima dos máximos atuais. Eles foram preservados; ajuste-os antes da sincronização.</p>}
    <h4>Ajustes diretos</h4>
    <div className="recursos-controles">
      <label>PV Atuais<input type="number" min="0" step="1" value={recursos.pvAtual} disabled={ocupado || bloquearPV} onChange={e => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n >= 0) atualizar({ ...recursos, pvAtual: n }); }}/></label>
      <label>SA Atual<input type="number" min="0" step="1" value={recursos.saAtual} disabled={ocupado} onChange={e => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n >= 0) atualizar({ ...recursos, saAtual: n }); }}/></label>
      <label>BI Atual<input type="number" min="0" step="1" value={recursos.biAtual} disabled={ocupado} onChange={e => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n >= 0) atualizar({ ...recursos, biAtual: n }); }}/></label>
    </div>
    <h4>PV Atuais e Temporários</h4>
    <div className="recursos-controles">
      <button type="button" disabled={ocupado || bloquearPV || recursos.pvAtual >= pvMaximo || recursos.pvAtual === 0} onClick={() => tentar(() => curarPV(recursos, 1, pvMaximo))}>+1 PV</button>
      <button type="button" disabled={ocupado || (recursos.pvAtual === 0 && recursos.pvTemporarios === 0)} onClick={() => tentar(() => aplicarDanoPV(recursos, 1, pvMaximo, saMaximo))}>-1 PV (dano)</button>
      <label>Aplicar dano<input type="number" min="0" step="1" value={dano} disabled={ocupado} onChange={e => setDano(e.target.value)}/></label>
      <button type="button" disabled={ocupado} onClick={() => tentar(() => aplicarDanoPV(recursos, quantidade(dano), pvMaximo, saMaximo))}>Aplicar</button>
      <label>Novos PV Temporários<input type="number" min="0" step="1" value={temporarios} disabled={ocupado} onChange={e => setTemporarios(e.target.value)}/></label>
      <button type="button" disabled={ocupado} onClick={() => tentar(() => definirPVTemporarios(recursos, quantidade(temporarios), pvMaximo, saMaximo))}>Definir</button>
    </div>
    <p className="ficha-local-legenda">Dano consome PV Temporários antes dos PV Atuais. Cura afeta apenas PV Atuais. Novos PV Temporários conservam o maior valor, sem soma. Durante Reanimação por 0 PV, a edição direta de PV fica bloqueada; registre toda cura no painel de Reanimação para acumular até o terceiro sucesso.</p>
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
    {erroOperacao && <p className="offline-erro" role="alert">{erroOperacao}</p>}
    {autoSalvar
      ? <AutoSaveStatusLocal estado={salvamento.autosave.estado} erro={salvamento.autosave.erro} mensagemSucesso="Recursos salvos neste dispositivo." aoTentarNovamente={salvamento.autosave.tentarNovamente} />
      : <>
          {salvamento.erroManual && <p className="offline-erro" role="alert">{salvamento.erroManual}</p>}
          {salvamento.sucessoManual && <p className="offline-status" role="status">{salvamento.sucessoManual}</p>}
          {sujo && <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void salvamento.salvarManual()}>Salvar recursos</button>}
        </>}
    <button type="button" className="botao-claro" disabled={ocupado || !anterior} onClick={() => { if (anterior) { setRecursos(anterior); setAnterior(null); setSujo(true); aoAlterarPendencia(true); setErroOperacao(''); } }}>Desfazer último ajuste</button>
  </details>;
}
