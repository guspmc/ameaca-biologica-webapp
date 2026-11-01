import { useState } from 'react';
import type { AtributosIniciais } from './atributosCriacao';
import { atributosIniciaisValidos, pontosRestantesAtributos } from './atributosCriacao';
import { NOMES_PERICIAS, periciasPermitidasNaCriacao, distribuicaoPericiasValida, pontosGastosPericias } from './periciasCriacao';
import { PONTOS_CLASSE } from './pericias';
import { ORIGENS } from './origens';

type Props = {
  classe: string; origem: string; atributosIniciais: AtributosIniciais;
  treinadaInicial: string; extraInicial: string; distribuicaoInicial: Record<string, number>;
  aoSalvar: (dados: { atributos: AtributosIniciais; periciaOrigemTreinada: string; periciaOrigemExtra: string | null; distribuicaoPericias: Record<string, number> }) => Promise<boolean>;
};
const chaves: { chave: keyof AtributosIniciais; sigla: string; nome: string }[] = [
  { chave: 'forca', sigla: 'FOR', nome: 'Força' }, { chave: 'agilidade', sigla: 'AGI', nome: 'Agilidade' },
  { chave: 'vigor', sigla: 'VIG', nome: 'Vigor' }, { chave: 'astucia', sigla: 'AST', nome: 'Astúcia' },
];
export default function EditorAtributosPericias(props: Props) {
  const [atributos, setAtributos] = useState(props.atributosIniciais);
  const [treinada, setTreinada] = useState(props.treinadaInicial);
  const [extra, setExtra] = useState(props.extraInicial);
  const [distribuicao, setDistribuicao] = useState(props.distribuicaoInicial);
  const [mensagem, setMensagem] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const permitidas = periciasPermitidasNaCriacao(props.classe, props.origem, treinada, extra);
  const gastos = pontosGastosPericias(distribuicao);
  const limite = PONTOS_CLASSE[props.classe] ?? 0;
  function mudarAtributo(chave: keyof AtributosIniciais, delta: -1 | 1) {
    setAtributos(atual => {
      const valor = atual[chave] + delta;
      if (valor < 0 || valor > 3 || (delta === 1 && pontosRestantesAtributos(atual) <= 0)) return atual;
      if (valor === 0 && Object.entries(atual).some(([k,v]) => k !== chave && v === 0)) return atual;
      return { ...atual, [chave]: valor };
    });
  }
  function mudarPericia(nome: string, delta: -1 | 1) {
    setDistribuicao(atual => {
      const valor = (atual[nome] ?? 0) + delta;
      const maximo = nome === treinada ? 1 : 2;
      if (valor < 0 || valor > maximo || (delta === 1 && pontosGastosPericias(atual) >= limite)) return atual;
      return { ...atual, [nome]: valor };
    });
  }
  async function salvar() {
    if (!atributosIniciaisValidos(atributos)) { setMensagem('A distribuição dos Atributos não é válida.'); return; }
    if (!distribuicaoPericiasValida(props.classe, props.origem, treinada, distribuicao, extra)) { setMensagem('Confira o Treinamento da Origem e os pontos de Perícia.'); return; }
    setOcupado(true); setMensagem('');
    try {
      const ok = await props.aoSalvar({ atributos, periciaOrigemTreinada: treinada, periciaOrigemExtra: props.origem === 'Amnésico' ? extra : null, distribuicaoPericias: distribuicao });
      setMensagem(ok ? 'Alterações gravadas no rascunho local.' : 'Não foi possível gravar. Confira o aviso do laboratório.');
    } finally { setOcupado(false); }
  }
  return <div className="ficha-local-editor">
    <h3>Editar Atributos e Perícias</h3>
    <p>As alterações ficam nesta ficha até você salvar. As regras e os limites da criação são os mesmos do formulário inicial.</p>
    <strong>Atributos · {pontosRestantesAtributos(atributos)} ponto(s) restante(s)</strong>
    <div className="criar-grid">{chaves.map(item => <div className="criar-stat" key={item.chave}><small>{item.sigla} · {item.nome}</small><div className="controle-stat"><button type="button" onClick={() => mudarAtributo(item.chave,-1)} disabled={ocupado || atributos[item.chave] === 0}>−</button><b>{atributos[item.chave]}</b><button type="button" onClick={() => mudarAtributo(item.chave,1)} disabled={ocupado || atributos[item.chave] === 3 || pontosRestantesAtributos(atributos) === 0}>+</button></div></div>)}</div>
    <label>Perícia treinada pela Origem<select value={treinada} onChange={e => {setTreinada(e.target.value);setDistribuicao({});}} disabled={ocupado}><option value="">Escolha uma Perícia</option>{(props.origem === 'Amnésico' ? NOMES_PERICIAS : (ORIGENS.find(o => o.nome === props.origem)?.pericias ?? [])).map(p=><option key={p} value={p}>{p}</option>)}</select></label>
    {props.origem === 'Amnésico' && <label>Segunda Perícia da Origem<select value={extra} onChange={e=>{setExtra(e.target.value);setDistribuicao({});}} disabled={ocupado}><option value="">Escolha outra Perícia</option>{NOMES_PERICIAS.filter(p=>p!==treinada).map(p=><option key={p} value={p}>{p}</option>)}</select></label>}
    <strong>Distribuição de Perícias · {gastos}/{limite} pontos</strong>
    {permitidas.map(nome=>{const gasto=distribuicao[nome]??0;const grau=gasto+(nome===treinada?1:0);return <div className="linha-pericia-lab" key={nome}><span><strong>{nome}</strong><small>{grau===0?'Não Treinada':grau===1?'Treinada':'Mestre'}</small></span><div className="controle-stat"><button type="button" onClick={()=>mudarPericia(nome,-1)} disabled={ocupado||gasto===0}>−</button><b>{gasto}</b><button type="button" onClick={()=>mudarPericia(nome,1)} disabled={ocupado||gasto >= (nome===treinada?1:2)||gastos>=limite}>+</button></div></div>})}
    {mensagem && <p role="status">{mensagem}</p>}
    <button type="button" className="acao" onClick={salvar} disabled={ocupado}>Salvar alterações <span>→</span></button>
  </div>;
}
