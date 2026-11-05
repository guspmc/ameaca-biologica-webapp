import { useMemo, useState } from 'react';
import { ATRIBUTO_PERICIA, valorBasePericia } from './pericias';
import { calcularTesteManual, type VantagemTeste } from './testes';
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
};

export default function CalculadoraTesteLocal({ atributos, treinada, distribuicao }: Props) {
  const [tipo, setTipo] = useState<'pericia' | 'atributo'>('pericia');
  const [pericia, setPericia] = useState('Percepção');
  const [atributo, setAtributo] = useState<keyof AtributosIniciais>('astucia');
  const [dt, setDt] = useState('12');
  const [impossivel, setImpossivel] = useState(false);
  const [modificador, setModificador] = useState('0');
  const [vantagem, setVantagem] = useState<VantagemTeste>('normal');
  const [dado1, setDado1] = useState('');
  const [dado2, setDado2] = useState('');

  const valorBase = tipo === 'pericia'
    ? valorBasePericia(pericia, atributos, treinada || null, distribuicao)
    : atributos[atributo];
  const formula = tipo === 'pericia' ? 'Perícia já inclui o Atributo.' : 'Teste puro de Atributo.';
  const calculado = useMemo(() => {
    if (impossivel) return { resultado: calcularTesteManual({ valorBase, modificador: Number(modificador || 0), dt: null }), erro: '' };
    if (!dt.trim()) return { resultado: null, erro: '' };
    try {
      return {
        resultado: calcularTesteManual({
          valorBase,
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
  }, [impossivel, valorBase, modificador, dt, dado1, dado2, vantagem]);

  function mudarTipo(valor: 'pericia' | 'atributo') {
    setTipo(valor);
    setDado1('');
    setDado2('');
  }

  return <details className="ficha-local-editor calculadora-teste">
    <summary>Conferir Teste manual</summary>
    <p>Calculadora de dados físicos: informe a face obtida. Ela não rola dados, não registra uma rolagem e não altera a ficha.</p>
    <p>Se o Teste de Pontaria ou Luta for um Ataque, 20 natural também acerta automaticamente, fecha as Reações defensivas normais e causa Crítico. Arma, Dano e efeitos específicos ainda precisam ser resolvidos no módulo de Combate.</p>
    <label>Tipo de Teste
      <select value={tipo} onChange={evento => mudarTipo(evento.target.value as 'pericia' | 'atributo')}>
        <option value="pericia">Teste de Perícia</option>
        <option value="atributo">Teste puro de Atributo</option>
      </select>
    </label>
    {tipo === 'pericia'
      ? <label>Perícia
          <select value={pericia} onChange={evento => { setPericia(evento.target.value); setDado1(''); setDado2(''); }}>
            {PERICIAS.map(nome => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </label>
      : <label>Atributo
          <select value={atributo} onChange={evento => { setAtributo(evento.target.value as keyof AtributosIniciais); setDado1(''); setDado2(''); }}>
            {ATRIBUTOS.map(item => <option key={item.chave} value={item.chave}>{item.nome}</option>)}
          </select>
        </label>}
    <p><strong>Valor base: +{valorBase}</strong> · {formula}</p>
    <label>Modificador circunstancial
      <input type="number" step="1" value={modificador} onChange={evento => setModificador(evento.target.value)} />
    </label>
    <label>DT
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
      {calculado.resultado.total !== null && <p>Dado escolhido: {calculado.resultado.dadoEscolhido} · Valor base: {valorBase} · Modificador: {Number(modificador || 0)} · Total: {calculado.resultado.total} · DT: {calculado.resultado.dt}</p>}
    </div>}
  </details>;
}
