import { useEffect, useState } from 'react';
import type { AtributosIniciais } from './atributosCriacao';
import { pontosRestantesAtributos } from './atributosCriacao';
import { NOMES_PERICIAS, periciasPermitidasNaCriacao, pontosGastosPericias } from './periciasCriacao';
import { PONTOS_CLASSE } from './pericias';
import { ORIGENS } from './origens';
import { calcularDerivadosCriacao } from './derivadosCriacao';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useSalvamentoEditorLocal } from './useSalvamentoEditorLocal';

type Dados = { atributos: AtributosIniciais; periciaOrigemTreinada: string; periciaOrigemExtra: string | null; periciaTentativaErroTreinada: string | null; distribuicaoPericias: Record<string, number> };
type Props = {
  classe: string; origem: string; habilidadeBasica?: string; atributosIniciais: AtributosIniciais;
  treinadaInicial: string; extraInicial: string; extraTentativaInicial: string; temTentativaEErro: boolean; distribuicaoInicial: Record<string, number>;
  aoSalvar: (dados: Dados) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  mensagemSucesso?: string;
  autoSalvar?: boolean;
};
const chaves: { chave: keyof AtributosIniciais; sigla: string; nome: string }[] = [
  { chave: 'forca', sigla: 'FOR', nome: 'Força' }, { chave: 'agilidade', sigla: 'AGI', nome: 'Agilidade' },
  { chave: 'vigor', sigla: 'VIG', nome: 'Vigor' }, { chave: 'astucia', sigla: 'AST', nome: 'Astúcia' },
];
export default function EditorAtributosPericias(props: Props) {
  const [atributos, setAtributos] = useState(props.atributosIniciais);
  const [treinada, setTreinada] = useState(props.treinadaInicial);
  const [extra, setExtra] = useState(props.extraInicial);
  const [extraTentativa, setExtraTentativa] = useState(props.extraTentativaInicial);
  const [distribuicao, setDistribuicao] = useState(props.distribuicaoInicial);
  const [sujo, setSujo] = useState(false);
  const chaveInicial = JSON.stringify([props.classe, props.origem, props.atributosIniciais, props.treinadaInicial, props.extraInicial, props.extraTentativaInicial, props.temTentativaEErro, props.distribuicaoInicial]);
  useEffect(() => {
    if (sujo) return;
    setAtributos(props.atributosIniciais);
    setTreinada(props.treinadaInicial);
    setExtra(props.extraInicial);
    setExtraTentativa(props.extraTentativaInicial);
    setDistribuicao(props.distribuicaoInicial);
  }, [chaveInicial, sujo]);
  const payload: Dados = {
    atributos,
    periciaOrigemTreinada: treinada,
    periciaOrigemExtra: props.origem === 'Amnésico' ? extra : null,
    periciaTentativaErroTreinada: props.temTentativaEErro ? (extraTentativa || null) : null,
    distribuicaoPericias: distribuicao,
  };
  const salvamento = useSalvamentoEditorLocal({
    autoSalvar: props.autoSalvar ?? false,
    valor: payload,
    chave: JSON.stringify({ ...payload, extra }),
    sujo,
    setSujo,
    aoSalvar: props.aoSalvar,
    aoAlterarPendencia: props.aoAlterarPendencia,
    mensagemSucesso: props.mensagemSucesso ?? 'Atributos e Perícias salvos neste dispositivo.',
  });
  const ocupado = salvamento.ocupado;
  const permitidas = periciasPermitidasNaCriacao(props.classe, props.origem, treinada, extra);
  const validas = new Set(permitidas);
  const visiveis = [...new Set([...permitidas, ...Object.keys(distribuicao), ...(extraTentativa ? [extraTentativa] : [])])].sort();
  const gastos = pontosGastosPericias(distribuicao);
  const limite = PONTOS_CLASSE[props.classe] ?? 0;
  let derivadosPrevia: ReturnType<typeof calcularDerivadosCriacao> | null = null;
  try {
    if (props.classe) derivadosPrevia = calcularDerivadosCriacao({
      classe: props.classe, origem: props.origem,
      habilidadeBasica: props.habilidadeBasica ?? '', atributos,
    });
  } catch { derivadosPrevia = null; }
  function marcarAlteracao() { setSujo(true); props.aoAlterarPendencia(true); }
  function mudarAtributo(chave: keyof AtributosIniciais, delta: -1 | 1) {
    const valor = atributos[chave] + delta;
    if (valor < 0 || valor > 3 || (delta === 1 && pontosRestantesAtributos(atributos) <= 0)) return;
    if (valor === 0 && Object.entries(atributos).some(([k,v]) => k !== chave && v === 0)) return;
    setAtributos({ ...atributos, [chave]: valor });
    marcarAlteracao();
  }
  function mudarPericia(nome: string, delta: -1 | 1) {
    const valor = (distribuicao[nome] ?? 0) + delta;
    const maximo = nome === treinada || nome === extra || nome === extraTentativa ? 1 : 2;
    if (delta === 1 && (!validas.has(nome) || pontosGastosPericias(distribuicao) >= limite)) return;
    if (valor < 0 || valor > maximo) return;
    const proxima = { ...distribuicao };
    if (valor === 0) delete proxima[nome];
    else proxima[nome] = valor;
    setDistribuicao(proxima);
    marcarAlteracao();
  }
  return <div className="ficha-local-editor">
    <h3>Editar Atributos e Perícias</h3>
    <p>As alterações são salvas automaticamente após uma breve pausa. As regras e os limites da criação são os mesmos do formulário inicial.</p>
    <strong>Atributos · {pontosRestantesAtributos(atributos)} ponto(s) restante(s)</strong>
    {derivadosPrevia && <div className="ficha-local-grade" aria-live="polite">
      <div><small>PV MÁXIMOS · PRÉVIA</small><strong>{derivadosPrevia.pvMaximo}</strong></div>
      <div><small>SA MÁXIMA · PRÉVIA</small><strong>{derivadosPrevia.saMaximo}</strong></div>
      <div><small>BI MÁXIMA · PRÉVIA</small><strong>{derivadosPrevia.biMaxima}</strong></div>
    </div>}
    {!derivadosPrevia && <p className="ficha-local-legenda">Selecione uma Classe válida para visualizar a prévia de PV, SA e BI.</p>}
    <div className="criar-grid">{chaves.map(item => <div className="criar-stat" key={item.chave}><small>{item.sigla} · {item.nome}</small><div className="controle-stat"><button type="button" onClick={() => mudarAtributo(item.chave,-1)} disabled={ocupado || atributos[item.chave] === 0}>−</button><b>{atributos[item.chave]}</b><button type="button" onClick={() => mudarAtributo(item.chave,1)} disabled={ocupado || atributos[item.chave] === 3 || pontosRestantesAtributos(atributos) === 0}>+</button></div></div>)}</div>
    <label>Perícia treinada pela Origem<select value={treinada} onChange={e => {setTreinada(e.target.value);marcarAlteracao();}} disabled={ocupado}><option value="">Escolha uma Perícia</option>{(props.origem === 'Amnésico' ? NOMES_PERICIAS : (ORIGENS.find(o => o.nome === props.origem)?.pericias ?? [])).map(p=><option key={p} value={p}>{p}</option>)}</select></label>
    {props.origem === 'Amnésico' && <label>Segunda Perícia da Origem<select value={extra} onChange={e=>{setExtra(e.target.value);marcarAlteracao();}} disabled={ocupado}><option value="">Escolha outra Perícia</option>{NOMES_PERICIAS.filter(p=>p!==treinada).map(p=><option key={p} value={p}>{p}</option>)}</select></label>}
    {props.temTentativaEErro && <label>Perícia adicional — Tentativa e Erro<select value={extraTentativa} onChange={e=>{setExtraTentativa(e.target.value);marcarAlteracao();}} disabled={ocupado}><option value="">Escolha uma Perícia ainda não Treinada</option>{NOMES_PERICIAS.filter(p=>p===extraTentativa || (p!==treinada && p!==extra && (distribuicao[p]??0)===0)).map(p=><option key={p} value={p}>{p}</option>)}</select><small>Não consome Pontos de Perícia da Classe. Escolha uma Perícia que ainda não tenha Treinamento pela Origem ou pela distribuição.</small></label>}
    <strong>Distribuição de Perícias · {gastos}/{limite} pontos</strong>
    {visiveis.map(nome=>{const gasto=distribuicao[nome]??0;const grau=Math.min(2,gasto+(nome===treinada?1:0)+(nome===extra?1:0)+(nome===extraTentativa?1:0));const compativel=validas.has(nome);return <div className="linha-pericia-lab" key={nome}><span><strong>{nome}</strong><small>{!compativel?'Incompatível · revisar':grau===0?'Não Treinada':grau===1?'Treinada':'Mestre'}</small></span><div className="controle-stat"><button type="button" onClick={()=>mudarPericia(nome,-1)} disabled={ocupado||gasto===0} aria-label={gasto===0?'Sem pontos para remover em '+nome:'Reduzir grau de '+nome}>−</button><b>{gasto}</b><button type="button" onClick={()=>mudarPericia(nome,1)} disabled={ocupado||!compativel||gasto >= (nome===treinada?1:2)||gastos>=limite}>+</button></div></div>})}
    {Object.keys(distribuicao).some(nome=>!validas.has(nome)) && <p role="alert">Há Perícias salvas que não são compatíveis com as escolhas atuais. Os pontos foram preservados; ajuste as escolhas para concluir a sincronização.</p>}
    {props.autoSalvar
      ? <AutoSaveStatusLocal estado={salvamento.autosave.estado} erro={salvamento.autosave.erro} mensagemSucesso={props.mensagemSucesso ?? 'Atributos e Perícias salvos neste dispositivo.'} aoTentarNovamente={salvamento.autosave.tentarNovamente} />
      : <>
          {salvamento.erroManual && <p className="offline-erro" role="alert">{salvamento.erroManual}</p>}
          {salvamento.sucessoManual && <p className="offline-status" role="status">{salvamento.sucessoManual}</p>}
          {sujo && <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void salvamento.salvarManual()}>Salvar Atributos e Perícias</button>}
        </>}
  </div>;
}
