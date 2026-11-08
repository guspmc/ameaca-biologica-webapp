import { useMemo, useState } from 'react';
import { ATRIBUTO_PERICIA, bonusTentativaErro, valorBasePericia } from './pericias';
import { bonusCondicionalOrigemTeste } from './efeitosOrigens';
import { calcularTesteManual, type VantagemTeste } from './testes';
import type { ModoDados } from './funcionamentoFicha';
import type { AtributosIniciais } from './atributosCriacao';

const PERICIAS = Object.keys(ATRIBUTO_PERICIA);
const ATRIBUTOS: { chave: keyof AtributosIniciais; nome: string }[] = [
  { chave: 'forca', nome: 'Força' },
  { chave: 'agilidade', nome: 'Agilidade' },
  { chave: 'vigor', nome: 'Vigor' },
  { chave: 'astucia', nome: 'Astúcia' },
];

type Props = {
  atributos: AtributosIniciais;
  treinada: string;
  distribuicao: Record<string, number>;
  periciaOrigemExtra?: string;
  periciaTentativaErroTreinada?: string;
  temTentativaEErro?: boolean;
  modoDados: ModoDados;
  origem?: string;
  saDisponivel?: number;
};

export default function CalculadoraTesteLocal({ atributos, treinada, distribuicao, periciaOrigemExtra = '', periciaTentativaErroTreinada = '', temTentativaEErro = false, modoDados, origem = '', saDisponivel = 0 }: Props) {
  const [tipo, setTipo] = useState<'pericia' | 'atributo' | 'ataque-corpo' | 'ataque-distancia'>('pericia');
  const [pericia, setPericia] = useState('Percepção');
  const [atributo, setAtributo] = useState<keyof AtributosIniciais>('astucia');
  const [dt, setDt] = useState('12');
  const [impossivel, setImpossivel] = useState(false);
  const [modificador, setModificador] = useState('0');
  const [vantagem, setVantagem] = useState<VantagemTeste>('normal');
  const [dado1, setDado1] = useState('');
  const [dado2, setDado2] = useState('');
  const [gastoSAConfirmado, setGastoSAConfirmado] = useState(false);
  const [finalidade, setFinalidade] = useState<'procurar_pista' | 'outra'>('outra');

  const periciaEfetiva = tipo === 'ataque-corpo' ? 'Luta' : tipo === 'ataque-distancia' ? 'Pontaria' : pericia;
  const testeDePericia = tipo !== 'atributo';
  const valorBase = testeDePericia
    ? valorBasePericia(periciaEfetiva, atributos, treinada || null, distribuicao, periciaOrigemExtra || null, periciaTentativaErroTreinada || null)
    : atributos[atributo];
  const atributoAssociado = testeDePericia ? ATRIBUTO_PERICIA[periciaEfetiva] : atributo;
  const bonusOrigem = bonusCondicionalOrigemTeste(origem, {
    tipo: testeDePericia ? 'pericia' : 'atributo', pericia: periciaEfetiva, atributo: atributoAssociado ?? atributo, finalidade,
    saDisponivel, gastoSAConfirmado,
  });
  const bonusTentativa = temTentativaEErro && testeDePericia ? bonusTentativaErro(periciaEfetiva, treinada || null, distribuicao, periciaOrigemExtra || null, periciaTentativaErroTreinada || null) : 0;
  const valorTeste = valorBase + bonusOrigem + bonusTentativa;
  const formula = tipo === 'ataque-corpo' ? 'Ataque Corpo a Corpo: 1d20 + Luta contra a Defesa do alvo.'
    : tipo === 'ataque-distancia' ? 'Ataque à distância: 1d20 + Pontaria contra a Defesa do alvo.'
    : tipo === 'pericia' ? 'Perícia já inclui o Atributo.' : 'Teste puro de Atributo.';
  const calculado = useMemo(() => {
    if (impossivel) return { resultado: calcularTesteManual({ valorBase: valorTeste, modificador: Number(modificador || 0), dt: null }), erro: '' };
    if (!dt.trim()) return { resultado: null, erro: '' };
    try {
      return {
        resultado: calcularTesteManual({
          valorBase: valorTeste,
          modificador: Number(modificador || 0),
          dt: Number(dt),
          dado1: dado1.trim() ? Number(dado1) : null,
          dado2: dado2.trim() ? Number(dado2) : null,
          vantagem,
        }),
        erro: '',
      };
    } catch (problema) {
      return { resultado: null, erro: problema instanceof Error ? problema.message : 'Valores inválidos.' };
    }
  }, [impossivel, valorTeste, modificador, dt, dado1, dado2, vantagem]);

  function mudarTipo(valor: 'pericia' | 'atributo' | 'ataque-corpo' | 'ataque-distancia') {
    setTipo(valor);
    if (valor === 'ataque-corpo') setPericia('Luta');
    if (valor === 'ataque-distancia') setPericia('Pontaria');
    setDado1('');
    setDado2('');
    setGastoSAConfirmado(false);
  }

  if (modoDados === 'virtuais') return <details className="ficha-local-editor calculadora-teste">
    <summary>Conferir Teste</summary>
    <p>O método de dados desta ficha está em Virtual. A rolagem virtual ainda não foi implementada; a calculadora física fica indisponível para respeitar sua preferência.</p>
  </details>;

  return <details className="ficha-local-editor calculadora-teste">
    <summary>Conferir Teste manual</summary>
    <p>{modoDados === 'fisicos' ? 'Modo Físicos: informe a face obtida.' : 'Modo Mistos: neste incremento, somente a entrada física manual está disponível; a rolagem virtual ainda não foi implementada.'} A calculadora não rola dados, não registra uma rolagem e não altera a ficha.</p>
    {(tipo === 'ataque-corpo' || tipo === 'ataque-distancia') && <p>20 natural: acerto automático e Crítico, multiplicado pelo fator da arma; fecha as Reações defensivas normais. 1 natural: Falha Crítica e aplica Exposto, salvo regra específica. O cálculo de Dano depende da arma equipada e permanece manual.</p>}

    <label>Tipo de Teste
      <select value={tipo} onChange={evento => mudarTipo(evento.target.value as 'pericia' | 'atributo' | 'ataque-corpo' | 'ataque-distancia')}>
        <option value="pericia">Teste de Perícia</option>
        <option value="ataque-corpo">Ataque Corpo a Corpo · Luta</option>
        <option value="ataque-distancia">Ataque à distância · Pontaria</option>
        <option value="atributo">Teste puro de Atributo</option>
      </select>
    </label>
    {tipo === 'pericia'
      ? <label>Perícia
          <select value={pericia} onChange={evento => { setPericia(evento.target.value); setDado1(''); setDado2(''); setGastoSAConfirmado(false); }}>
            {PERICIAS.map(nome => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </label>
      : tipo === 'ataque-corpo' || tipo === 'ataque-distancia'
        ? <p><strong>Perícia de Ataque: {periciaEfetiva} (+{valorBase})</strong> · O valor já inclui o Atributo associado e o Treinamento.</p>
        : <label>Atributo
          <select value={atributo} onChange={evento => { setAtributo(evento.target.value as keyof AtributosIniciais); setDado1(''); setDado2(''); setGastoSAConfirmado(false); }}>
            {ATRIBUTOS.map(item => <option key={item.chave} value={item.chave}>{item.nome}</option>)}
          </select>
        </label>}
    <p><strong>Valor base: +{valorBase}</strong> · {formula}</p>
    {(origem === 'Atleta' || origem === 'Investigador') && testeDePericia && (origem !== 'Investigador' || periciaEfetiva === 'Investigação') && <div className="ficha-local-editor">
      {origem === 'Investigador' && <label>Finalidade do Teste
        <select value={finalidade} onChange={evento => { setFinalidade(evento.target.value as 'procurar_pista' | 'outra'); setGastoSAConfirmado(false); }}>
          <option value="outra">Outra finalidade</option>
          <option value="procurar_pista">Procurar uma pista</option>
        </select>
      </label>}
      <label className="ficha-local-opcao">
        <input type="checkbox" checked={gastoSAConfirmado} disabled={(origem === 'Atleta' && ((atributoAssociado !== 'forca' && atributoAssociado !== 'agilidade') || periciaEfetiva === 'Luta' || periciaEfetiva === 'Pontaria')) || (origem === 'Investigador' && (periciaEfetiva !== 'Investigação' || finalidade !== 'procurar_pista'))} onChange={evento => setGastoSAConfirmado(evento.target.checked)} />
        Confirmo que já descontei 1 SA no painel de Recursos para este Teste
      </label>
      <small>{origem === 'Atleta' ? 'Atleta: +5 em Perícias baseadas em FOR ou AGI, exceto Luta e Pontaria.' : 'Investigador: +5 em Investigação ao procurar uma pista.'} O saldo exibido é posterior ao gasto; confirme somente se realmente descontou 1 SA.</small>
    </div>}
    <p><strong>Modificador da Origem: {bonusOrigem >= 0 ? '+' : ''}{bonusOrigem}</strong>{bonusOrigem ? ' · aplicado somente a este Teste' : ''}</p>
    {temTentativaEErro && testeDePericia && <p><strong>Tentativa e Erro: +{bonusTentativa}</strong>{bonusTentativa ? ' · somente por esta Perícia estar Não Treinada' : ' · sem bônus: a Perícia está Treinada'}</p>}
    {temTentativaEErro && testeDePericia && <small>Você pode realizar Testes com Perícias não Treinadas, inclusive aplicações normalmente restritas a Treinamento, salvo requisito adicional expresso.</small>}
    <label>Modificador circunstancial
      <input type="number" step="1" value={modificador} onChange={evento => setModificador(evento.target.value)} />
    </label>
    <label>{tipo === 'ataque-corpo' || tipo === 'ataque-distancia' ? 'Defesa do alvo' : 'DT'}
      <input type="number" min="1" step="1" value={dt} disabled={impossivel} onChange={evento => setDt(evento.target.value)} placeholder="Ex.: 15" />
    </label>
    <label className="ficha-local-opcao">
      <input type="checkbox" checked={impossivel} onChange={evento => { setImpossivel(evento.target.checked); setDado1(''); setDado2(''); }} />
      Impossível — sem Teste
    </label>
    <label>Condição da rolagem
      <select value={vantagem} disabled={impossivel} onChange={evento => { setVantagem(evento.target.value as VantagemTeste); setDado1(''); setDado2(''); }}>
        <option value="normal">Normal · 1d20</option>
        <option value="vantagem">Vantagem · 2d20, usar o melhor</option>
        <option value="desvantagem">Desvantagem · 2d20, usar o pior</option>
      </select>
    </label>
    {!impossivel && <div className="ficha-local-grade">
      <label>Resultado físico do d20
        <input type="number" min="1" max="20" step="1" value={dado1} onChange={evento => setDado1(evento.target.value)} placeholder="1–20" />
      </label>
      {vantagem !== 'normal' && <label>Segundo d20
        <input type="number" min="1" max="20" step="1" value={dado2} onChange={evento => setDado2(evento.target.value)} placeholder="1–20" />
      </label>}
    </div>}
    {calculado.erro && <p className="offline-erro" role="alert">{calculado.erro}</p>}
    {calculado.resultado && <div className="offline-status ficha-local-resultado" role="status">
      <strong>{calculado.resultado.estado === 'impossivel' ? 'Sem Teste'
        : calculado.resultado.estado === 'incompleto' ? 'Aguardando dados'
        : calculado.resultado.estado === 'critico-sucesso' ? 'Sucesso automático · 20 natural'
        : calculado.resultado.estado === 'falha-critica' ? 'Falha Crítica · 1 natural'
        : calculado.resultado.estado === 'sucesso' ? 'Sucesso'
        : 'Falha'}</strong>
      <p>{calculado.resultado.detalhe}</p>
      {calculado.resultado.total !== null && <p>Dado escolhido: {calculado.resultado.dadoEscolhido} · Valor base: {valorTeste} · Modificador: {Number(modificador || 0)} · Total: {calculado.resultado.total} · DT: {calculado.resultado.dt}</p>}
    </div>}
  </details>;
}
