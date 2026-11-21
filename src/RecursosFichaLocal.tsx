import { useEffect, useState } from 'react';
import { vulneravelPorPV } from './condicoesFicha';
import { ajustarBI, aplicarDanoPV, curarPV, definirPVTemporarios, recursosIniciais, recursosValidos, type RecursosAtuais, type RecursosPatch } from './recursosFicha';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useSalvamentoEditorLocal } from './useSalvamentoEditorLocal';

type Props = {
  dados: Record<string, unknown>;
  pvMaximo: number;
  saMaximo: number;
  biMaximo: number;
  origem?: string;
  bloquearPV?: boolean;
  aoSalvar: (patch: RecursosPatch) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  autoSalvar?: boolean;
  origemDados?: 'local' | 'servidor';
};

function patchEntre(anterior: RecursosAtuais, proximo: RecursosAtuais): RecursosPatch {
  const patch: RecursosPatch = {};
  for (const chave of ['pvAtual', 'pvTemporarios', 'saAtual', 'biAtual'] as const) {
    if (anterior[chave] !== proximo[chave]) patch[chave] = proximo[chave];
  }
  return patch;
}

export default function RecursosFichaLocal({ dados, pvMaximo, saMaximo, biMaximo, origem = '', bloquearPV = false, aoSalvar, aoAlterarPendencia, autoSalvar = false, origemDados = 'local' }: Props) {
  const recursosExternos = recursosIniciais(dados, pvMaximo, saMaximo);
  const chaveInicial = JSON.stringify(recursosExternos);
  const [recursos, setRecursos] = useState(recursosExternos);
  const [anterior, setAnterior] = useState<RecursosAtuais | null>(null);
  const [sujo, setSujo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [pendencia, setPendencia] = useState<RecursosPatch | null>(null);
  const [erroOperacao, setErroOperacao] = useState('');
  const [pvDigitado, setPvDigitado] = useState(String(recursosExternos.pvAtual));
  const [dano, setDano] = useState('1');
  const [temporarios, setTemporarios] = useState('0');

  useEffect(() => {
    if (sujo || ocupado) return;
    setRecursos(recursosExternos);
    setPvDigitado(String(recursosExternos.pvAtual));
    setAnterior(null);
  }, [chaveInicial, sujo, ocupado]);

  // O hook compartilhado mantém o contrato de estado/validação do editor.
  // Operações aplicadas usam patches mínimos e confirmação imediata abaixo,
  // evitando que um autosave do objeto inteiro reintroduza conflitos entre chaves.
  const salvamento = useSalvamentoEditorLocal({
    autoSalvar: false, valor: recursos, chave: JSON.stringify(recursos), sujo, setSujo, aoSalvar,
    aoAlterarPendencia,
    mensagemSucesso: origemDados === 'servidor' ? 'Recursos confirmados pelo servidor.' : 'Recursos salvos neste dispositivo.',
    validar: atual => recursosValidos(atual, pvMaximo, saMaximo) ? null : 'Revise os valores: PV e SA Atuais não podem exceder seus máximos.',
  });

  const valido = recursosValidos(recursos, pvMaximo, saMaximo);
  const fase = biMaximo <= 0 ? 'Indisponível até concluir a Classe' : recursos.biAtual >= biMaximo ? 'Colapso Viral' : 'Fase ' + (Math.floor(recursos.biAtual * 5 / biMaximo) + 1);

  async function confirmar(patch: RecursosPatch, valor: RecursosAtuais) {
    if (!Object.keys(patch).length || ocupado || pendencia) return;
    const base = recursos;
    setOcupado(true);
    setErroOperacao('');
    setAnterior(base);
    setRecursos(valor);
    setSujo(true);
    setPendencia(patch);
    aoAlterarPendencia(true);
    try {
      const confirmado = await aoSalvar(patch);
      if (!confirmado) throw new Error('O armazenamento não confirmou a gravação.');
      setSujo(false);
      setPendencia(null);
      aoAlterarPendencia(false);
      setPvDigitado(String(valor.pvAtual));
    } catch (problema) {
      setErroOperacao(problema instanceof Error ? problema.message : 'Não foi possível confirmar o salvamento.');
    } finally {
      setOcupado(false);
    }
  }

  function quantidade(valor: string): number {
    const n = Number(valor);
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Informe uma quantidade inteira não negativa.');
    return n;
  }

  async function tentar(operacao: () => RecursosAtuais) {
    if (ocupado || pendencia) return;
    try {
      const proximo = operacao();
      await confirmar(patchEntre(recursos, proximo), proximo);
    } catch (problema) {
      setErroOperacao(problema instanceof Error ? problema.message : 'Operação inválida.');
    }
  }

  async function aplicarPV() {
    if (ocupado || pendencia || bloquearPV) return;
    try {
      const valor = quantidade(pvDigitado);
      if (valor > pvMaximo) throw new Error('PV Atuais não podem exceder o máximo.');
      const proximo = { ...recursos, pvAtual: valor };
      await confirmar(patchEntre(recursos, proximo), proximo);
    } catch (problema) {
      setErroOperacao(problema instanceof Error ? problema.message : 'Valor de PV inválido.');
    }
  }

  async function tentarNovamente() {
    if (!pendencia || ocupado) return;
    const patch = pendencia;
    setOcupado(true);
    setErroOperacao('');
    try {
      const confirmado = await aoSalvar(patch);
      if (!confirmado) throw new Error('O armazenamento não confirmou a gravação.');
      setPendencia(null);
      setSujo(false);
      aoAlterarPendencia(false);
    } catch (problema) {
      setErroOperacao(problema instanceof Error ? problema.message : 'Não foi possível confirmar o salvamento.');
    } finally {
      setOcupado(false);
    }
  }

  async function desfazer() {
    if (!anterior || ocupado || pendencia) return;
    const base = recursos;
    await confirmar(patchEntre(base, anterior), anterior);
  }

  return <details id="ficha-local-administrar-recursos" className="ficha-local-editor recursos-ficha" aria-label="Recursos da personagem">
    <summary>Administrar recursos e Integridade Física</summary>
    <h3>Recursos e Integridade Física</h3>
    <p>Valores atuais são separados dos máximos derivados. {origemDados === 'servidor' ? 'Cada operação é enviada ao servidor e depende de confirmação.' : 'Cada operação é gravada neste dispositivo e depende de confirmação.'} Não registram descanso, rolagem, ação ou efeito automático.</p>
    <div className="ficha-local-grade">
      <div><small>PONTOS DE VIDA</small><strong>{recursos.pvAtual}/{pvMaximo}</strong><p>Temporários: {recursos.pvTemporarios}</p>
        {pvMaximo > 0 && vulneravelPorPV(recursos.pvAtual, pvMaximo) && <p className="ficha-local-aviso">Vulnerável · PV atuais iguais ou inferiores a 1/5 dos PV máximos.</p>}</div>
      <div><small>SURTO DE ADRENALINA</small><strong>{recursos.saAtual}/{saMaximo}</strong><p>Gasto de SA é sempre uma escolha expressa.</p></div>
      <div><small>BIO-INFECÇÃO</small><strong>{recursos.biAtual}/{biMaximo}</strong><p>{fase}</p></div>
    </div>
    {!valido && <p className="offline-erro" role="alert">Há valores acima dos máximos atuais. Eles foram preservados; ajuste-os antes de continuar.</p>}
    <h4>Ajustes diretos</h4>
    <div className="recursos-controles">
      <label>PV Atuais<input type="number" min="0" max={pvMaximo} step="1" value={pvDigitado} disabled={ocupado || !!pendencia || bloquearPV} onChange={e => setPvDigitado(e.target.value)}/></label>
      <button type="button" disabled={ocupado || !!pendencia || bloquearPV || !/^[0-9]+$/.test(pvDigitado) || Number(pvDigitado) > pvMaximo || Number(pvDigitado) === recursos.pvAtual} onClick={() => void aplicarPV()}>Aplicar</button>
    </div>
    <h4>PV Atuais e Temporários</h4>
    <div className="recursos-controles">
      <button type="button" disabled={ocupado || !!pendencia || bloquearPV || recursos.pvAtual >= pvMaximo || recursos.pvAtual === 0} onClick={() => void tentar(() => curarPV(recursos, 1, pvMaximo))}>+1 PV</button>
      <button type="button" disabled={ocupado || !!pendencia || bloquearPV || (recursos.pvAtual === 0 && recursos.pvTemporarios === 0)} onClick={() => void tentar(() => aplicarDanoPV(recursos, 1, pvMaximo, saMaximo))}>-1 PV (dano)</button>
      <label>Aplicar dano<input type="number" min="0" step="1" value={dano} disabled={ocupado || !!pendencia || bloquearPV} onChange={e => setDano(e.target.value)}/></label>
      <button type="button" disabled={ocupado || !!pendencia || bloquearPV} onClick={() => void tentar(() => aplicarDanoPV(recursos, quantidade(dano), pvMaximo, saMaximo))}>Aplicar</button>
      <label>Novos PV Temporários<input type="number" min="0" step="1" value={temporarios} disabled={ocupado || !!pendencia || bloquearPV} onChange={e => setTemporarios(e.target.value)}/></label>
      <button type="button" disabled={ocupado || !!pendencia || bloquearPV} onClick={() => void tentar(() => definirPVTemporarios(recursos, quantidade(temporarios), pvMaximo, saMaximo))}>Definir</button>
    </div>
    <p className="ficha-local-legenda">Dano consome PV Temporários antes dos PV Atuais. Cura afeta apenas PV Atuais. Novos PV Temporários conservam o maior valor, sem soma. Durante Reanimação por 0 PV, a edição direta de PV fica bloqueada; registre toda cura no painel de Reanimação para acumular até o terceiro sucesso.</p>
    <h4>Surto de Adrenalina</h4>
    <p className="ficha-local-legenda">O saldo de SA é ajustado pelos controles rápidos no topo da ficha; cada +1 ou -1 é salvo imediatamente. A ficha não controla turnos nem a janela de Esforço.</p>
    <h4>Bio-Infecção</h4>
    <div className="recursos-controles">
      <button type="button" disabled={ocupado || !!pendencia || biMaximo <= 0 || recursos.biAtual === 0} onClick={() => void tentar(() => ajustarBI(recursos, -1, pvMaximo, saMaximo))}>-1 BI</button>
      <button type="button" disabled={ocupado || !!pendencia || biMaximo <= 0} onClick={() => void tentar(() => ajustarBI(recursos, 1, pvMaximo, saMaximo, origem))}>+1 BI</button>
    </div>
    <p className="ficha-local-legenda">BI começa em 0, não aumenta sozinha e só diminui por fonte expressa. Alcançar ou ultrapassar BI Máxima sinaliza Colapso Viral; esta tela não inicia Reanimação ou transformação.</p>
    {erroOperacao && <p className="offline-erro" role="alert">{erroOperacao}</p>}
    {pendencia && <div className="offline-erro" role="alert"><p>A alteração permanece pendente e ainda não foi confirmada no armazenamento.</p><button type="button" disabled={ocupado} onClick={() => void tentarNovamente()}>Tentar salvar novamente</button></div>}
    {autoSalvar
      ? <AutoSaveStatusLocal estado={salvamento.autosave.estado} erro={salvamento.autosave.erro || erroOperacao} mensagemSucesso={origemDados === 'servidor' ? 'Recursos confirmados pelo servidor.' : 'Recursos salvos neste dispositivo.'} aoTentarNovamente={salvamento.autosave.tentarNovamente} />
      : salvamento.erroManual && <p className="offline-erro" role="alert">{salvamento.erroManual}</p>}
    <button type="button" className="botao-claro" disabled={ocupado || !!pendencia || !anterior} onClick={() => void desfazer()}>Desfazer último ajuste</button>
  </details>;
}
