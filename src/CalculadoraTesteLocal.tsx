import { useEffect, useMemo, useState } from 'react';
import { ATRIBUTO_PERICIA, bonusTentativaErro, valorBasePericia } from './pericias';
import { bonusCondicionalOrigemTeste } from './efeitosOrigens';
import { calcularTesteManual, calcularRolagemAtaqueManual, type VantagemTeste } from './testes';
import { condicoesQueImpoemDesvantagem, restricoesDeAtaquePorCondicoes } from './condicoesCalculadora';
import { CATALOGO_CONDICOES, type CondicaoId } from './condicoesFicha';
import { sortearDados, validarResultadosFisicos } from './rolagemDados';
import type { ModoDados } from './funcionamentoFicha';
import type { AtributosIniciais } from './atributosCriacao';
import { listarPerfisArma, consultarPerfilArma, bonusAtaqueOperario, calcularDanoArma, possuiFormulaDanoConvencional, consultarPerfilAtaqueUniversal } from './catalogoArmas';
import { listarPerfisArmasFogo, consultarPerfilArmaFogo } from './catalogoArmasFogo';
import { consultarFormulaDanoEspecial, type VarianteDanoEspecial } from './variantesDanoArmas';
import { consultarProcedimentoGM79, type CartuchoGM79, type ModoGM79 } from './procedimentosGM79';
import { consultarModosDisparoArmaFogo } from './procedimentosDisparoArmas';
import { consultarProcedimentoArmaEspecial } from './procedimentosArmasEspeciais';
import { aumentarCategoriaDano, categoriasAtaqueUniversal } from './progressaoDano';

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
  escopo?: 'testes' | 'ataques';
  armaOperario?: string;
  aoFalharCriticoAtaque?: () => Promise<boolean>;
  penalidadeMorteNivel1?: boolean;
  bonusAtaqueBI?: number;
  desvantagemBI?: boolean;
  condicoesAtivas?: CondicaoId[];
  habilidadesAtivas?: string[];
  academicoDisponivel?: boolean;
  criminosoDisponivel?: boolean;
};

export default function CalculadoraTesteLocal({ atributos, treinada, distribuicao, periciaOrigemExtra = '', periciaTentativaErroTreinada = '', temTentativaEErro = false, modoDados, origem = '', saDisponivel = 0, aoFalharCriticoAtaque, penalidadeMorteNivel1 = false, bonusAtaqueBI = 0, desvantagemBI = false, condicoesAtivas = [], habilidadesAtivas = [], escopo = 'testes', armaOperario = '', academicoDisponivel = false, criminosoDisponivel = false }: Props) {
  const [tipo, setTipo] = useState<'pericia' | 'atributo' | 'ataque-corpo' | 'ataque-distancia'>(escopo === 'ataques' ? 'ataque-corpo' : 'pericia');
  const [pericia, setPericia] = useState('Percepção');
  const [armaId, setArmaId] = useState(() => escopo === 'ataques' && origem === 'Operário' ? listarPerfisArma().find(perfil => perfil.nome === armaOperario)?.id ?? '' : '');
  const [resultadoDadosDano, setResultadoDadosDano] = useState('');
  const [resultadoDadosAdicionais, setResultadoDadosAdicionais] = useState('');
  const [criticoDano, setCriticoDano] = useState(false);
  const [varianteDanoEspecial, setVarianteDanoEspecial] = useState<VarianteDanoEspecial>('normal');
  const [cartuchoGM79, setCartuchoGM79] = useState<CartuchoGM79>('acido');
  const [modoGM79, setModoGM79] = useState<ModoGM79>('direto');
  const [modoBearCommander, setModoBearCommander] = useState<'rifle' | 'lancador'>('rifle');
  const [modoDisparoAutomatico, setModoDisparoAutomatico] = useState<'normal' | 'cadenciado' | 'rajada'>('normal');
  const [coronhaMatildaConfirmada, setCoronhaMatildaConfirmada] = useState(false);
  const [atributo, setAtributo] = useState<keyof AtributosIniciais>('astucia');
  const [dt, setDt] = useState('12');
  const [impossivel, setImpossivel] = useState(false);
  const [modificador, setModificador] = useState('0');
  const [vantagem, setVantagem] = useState<VantagemTeste>('normal');
  const [dado1, setDado1] = useState('');
  const [dado2, setDado2] = useState('');
  const [gastoSAConfirmado, setGastoSAConfirmado] = useState(false);
  const [usarSaberEAPoder, setUsarSaberEAPoder] = useState(false);
  const [finalidadeCriminoso, setFinalidadeCriminoso] = useState<'outra' | 'procurar_itens_recursos'>('outra');
  const [usarBeneficioCriminoso, setUsarBeneficioCriminoso] = useState(false);
  const [finalidade, setFinalidade] = useState<'procurar_pista' | 'outra'>('outra');
  const [metodo, setMetodo] = useState<'fisico' | 'virtual'>(modoDados === 'virtuais' ? 'virtual' : 'fisico');
  const [dadosConfirmados, setDadosConfirmados] = useState<{ dado1: number; dado2?: number } | null>(null);
  const [erroRolagem, setErroRolagem] = useState('');
  const [mensagemCondicao, setMensagemCondicao] = useState('');

  useEffect(() => {
    setMetodo(modoDados === 'virtuais' ? 'virtual' : 'fisico');
    setDadosConfirmados(null);
    setErroRolagem('');
  }, [modoDados]);

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
  const modificadorAtaqueBI = tipo === 'ataque-corpo' || tipo === 'ataque-distancia' ? bonusAtaqueBI : 0;
  const restricoesAtaque = escopo === 'ataques' ? restricoesDeAtaquePorCondicoes(condicoesAtivas) : [];
  const desvantagensCondicao = condicoesQueImpoemDesvantagem(condicoesAtivas, {
    escopo,
    tipoTeste: testeDePericia ? 'pericia' : 'atributo',
    pericia: periciaEfetiva,
    atributo: atributoAssociado ?? atributo,
    tipoAtaque: tipo === 'ataque-corpo' ? 'corpo-a-corpo' : tipo === 'ataque-distancia' ? 'distancia' : undefined,
  });
  const perfilCorpo = tipo === 'ataque-corpo' && armaId ? (armaId.startsWith('universal:') ? consultarPerfilAtaqueUniversal(armaId.slice('universal:'.length) as 'arma-improvisada' | 'ataque-desarmado') : consultarPerfilArma(armaId)) : null;
  const perfilFogo = tipo === 'ataque-distancia' && armaId ? consultarPerfilArmaFogo(armaId) : null;
  const perfilSelecionado = perfilCorpo ?? perfilFogo;
  const armaOperarioEscolhida = origem === 'Operário' && perfilCorpo?.nome === armaOperario;
  const bonusOperario = tipo === 'ataque-corpo' ? bonusAtaqueOperario(armaOperarioEscolhida) : 0;
  const valorTeste = valorBase + bonusOrigem + bonusTentativa + modificadorAtaqueBI + bonusOperario + (penalidadeMorteNivel1 ? -2 : 0);
  const desvantagemDesarmado = perfilCorpo?.id === 'universal-ataque-desarmado';
  const codeVeronicaAtiva = escopo === 'testes' && tipo === 'pericia' && habilidadesAtivas.includes('code-veronica');
  const parrudoAtivo = escopo === 'testes' && tipo === 'pericia' && periciaEfetiva === 'Fortitude' && habilidadesAtivas.includes('parrudo');
  const curiosaAtiva = escopo === 'testes' && tipo === 'pericia' && habilidadesAtivas.includes('curiosa');
  const academicoAplicavel = escopo === 'testes' && academicoDisponivel && origem === 'Acadêmico'
    && (tipo === 'atributo' ? atributo === 'astucia' : tipo === 'pericia' && atributoAssociado === 'astucia');
  const criminosoAplicavel = escopo === 'testes' && criminosoDisponivel && origem === 'Criminoso'
    && tipo === 'pericia' && periciaEfetiva === 'Investigação' && finalidadeCriminoso === 'procurar_itens_recursos';
  const curiosaContextual = curiosaAtiva && ['Percepção', 'Investigação'].includes(periciaEfetiva);
  const quantoMaisMelhorAtiva = escopo === 'ataques' && habilidadesAtivas.includes('quanto-mais-melhor');
  const armeiroAtivo = escopo === 'ataques' && habilidadesAtivas.includes('armeiro');
  const armeiraAutodidataAtiva = escopo === 'ataques' && habilidadesAtivas.includes('armeira-autodidata');
  const cascaGrossaAtiva = escopo === 'ataques' && habilidadesAtivas.includes('casca-grossa');
  const armamentoEspecialAtivo = escopo === 'ataques' && habilidadesAtivas.includes('armamento-especial');
  const controleDeFogoAtivo = escopo === 'ataques' && habilidadesAtivas.includes('controle-de-fogo');
  const anatomiaDeCombateAtiva = escopo === 'ataques' && habilidadesAtivas.includes('anatomia-de-combate');
  const golpeSujoAtivo = escopo === 'ataques' && tipo === 'ataque-corpo' && habilidadesAtivas.includes('golpe-sujo');
  const ambidestriaAtiva = escopo === 'ataques' && tipo === 'ataque-distancia' && habilidadesAtivas.includes('ambidestria');
  const existeVantagem = vantagem === 'vantagem' || codeVeronicaAtiva || parrudoAtivo
    || (academicoAplicavel && usarSaberEAPoder) || (criminosoAplicavel && usarBeneficioCriminoso);
  const existeDesvantagem = vantagem === 'desvantagem' || desvantagemBI || desvantagensCondicao.length > 0 || desvantagemDesarmado;
  const vantagemEfetiva: VantagemTeste = existeVantagem && existeDesvantagem ? 'normal'
    : existeVantagem ? 'vantagem'
    : existeDesvantagem ? 'desvantagem' : 'normal';
  useEffect(() => { setUsarSaberEAPoder(false); setUsarBeneficioCriminoso(false); }, [tipo, periciaEfetiva, atributo, finalidadeCriminoso]);
  useEffect(() => {
    setDadosConfirmados(null);
    setDado1('');
    setDado2('');
    setErroRolagem('');
  }, [vantagemEfetiva]);
  const formula = tipo === 'ataque-corpo' ? 'Ataque Corpo a Corpo: 1d20 + Luta.'
    : tipo === 'ataque-distancia' ? 'Ataque à distância: 1d20 + Pontaria.'
    : tipo === 'pericia' ? 'Perícia já inclui o Atributo.' : 'Teste puro de Atributo.';
  const calculado = useMemo(() => {
    if (escopo === 'ataques') {
      try { return { resultado: calcularRolagemAtaqueManual({ valorBase: valorTeste, modificador: Number(modificador || 0), dado1: dadosConfirmados?.dado1 ?? null, dado2: dadosConfirmados?.dado2 ?? null, vantagem: vantagemEfetiva }), erro: '' }; }
      catch (problema) { return { resultado: null, erro: problema instanceof Error ? problema.message : 'Valores inválidos.' }; }
    }
    if (impossivel) return { resultado: calcularTesteManual({ valorBase: valorTeste, modificador: Number(modificador || 0), dt: null }), erro: '' };
    if (!dt.trim()) return { resultado: null, erro: '' };
    try {
      return {
        resultado: calcularTesteManual({
          valorBase: valorTeste,
          modificador: Number(modificador || 0),
          dt: Number(dt),
          dado1: dadosConfirmados?.dado1 ?? null,
          dado2: dadosConfirmados?.dado2 ?? null,
          vantagem: vantagemEfetiva,
          naturalDe2a9Como10: codeVeronicaAtiva,
        }),
        erro: '',
      };
    } catch (problema) {
      return { resultado: null, erro: problema instanceof Error ? problema.message : 'Valores inválidos.' };
    }
  }, [escopo, impossivel, valorTeste, modificador, dt, dadosConfirmados, vantagemEfetiva, codeVeronicaAtiva, parrudoAtivo]);

  function mudarTipo(valor: 'pericia' | 'atributo' | 'ataque-corpo' | 'ataque-distancia') {
    setTipo(valor);
    setDadosConfirmados(null);
    setErroRolagem('');
    setResultadoDadosDano('');
    setResultadoDadosAdicionais('');
    setCriticoDano(false);
    if (valor === 'ataque-corpo') {
      setPericia('Luta');
      setArmaId(origem === 'Operário' ? listarPerfisArma().find(perfil => perfil.nome === armaOperario)?.id ?? '' : '');
    }
    if (valor === 'ataque-distancia') { setPericia('Pontaria'); setArmaId(''); }
    setDado1('');
    setDado2('');
    setDadosConfirmados(null);
    setErroRolagem('');
    setGastoSAConfirmado(false);
  }

  const perfisDisponiveis = useMemo(() => tipo === 'ataque-corpo'
    ? listarPerfisArma().filter(perfil => perfil.categoria === 'corpo-a-corpo')
    : tipo === 'ataque-distancia' ? listarPerfisArmasFogo() : [], [tipo]);
  const criticoTexto = perfilFogo?.critico ?? null;
  const limiteCritico = perfilCorpo?.criticoNatural ?? (criticoTexto ? (/19\s*[–-]\s*20/.test(criticoTexto) ? 19 : 20) : null);
  const multiplicadorCritico = perfilCorpo?.multiplicadorCritico ?? (criticoTexto ? Number(criticoTexto.match(/x\s*(\d+)/i)?.[1] ?? 1) : null);
  const resultadoAtaqueCritico = escopo === 'ataques' && calculado.resultado?.dadoEscolhido === 20;
  const bearLauncherSelecionado = perfilFogo?.id === 'bear-commander' && modoBearCommander === 'lancador';
  const procedimentoGM79 = (perfilFogo?.id === 'gm-79' || bearLauncherSelecionado) ? consultarProcedimentoGM79(cartuchoGM79, modoGM79) : null;
  const ataqueEmAreaGM79 = procedimentoGM79?.danoEmArea ?? false;
  const modosArmaFogo = perfilFogo ? consultarModosDisparoArmaFogo(perfilFogo, coronhaMatildaConfirmada) : null;
  const modoDisparoEfetivo = modoDisparoAutomatico === 'normal' && modosArmaFogo && !modosArmaFogo.disparoUnico
    ? (modosArmaFogo.cadenciado ? 'cadenciado' : modosArmaFogo.rajada ? 'rajada' : 'normal')
    : modoDisparoAutomatico;
  const rajadaSelecionada = !bearLauncherSelecionado && modoDisparoEfetivo === 'rajada' && (modosArmaFogo?.rajada ?? false);
  const cadenciadoSelecionado = modoDisparoEfetivo === 'cadenciado' && (modosArmaFogo?.cadenciado ?? false);
  const disparoUnicoIndisponivel = Boolean(modosArmaFogo && !modosArmaFogo.disparoUnico && !rajadaSelecionada && !cadenciadoSelecionado);
  const ataqueEmArea = ataqueEmAreaGM79 || rajadaSelecionada;
  const procedimentoPerfuracao = modosArmaFogo?.perfuracao ?? null;
  const procedimentoArmaEspecial = perfilFogo ? consultarProcedimentoArmaEspecial(perfilFogo.id) : null;
  useEffect(() => { if (ataqueEmArea) { setCriticoDano(false); setDadosConfirmados(null); setDado1(''); setDado2(''); setErroRolagem(''); } }, [ataqueEmArea]);
  const formulaDanoEspecial = perfilFogo ? consultarFormulaDanoEspecial(perfilFogo.id, varianteDanoEspecial) : null;
  const formulaDanoBase = bearLauncherSelecionado ? '4d6' : formulaDanoEspecial ?? (perfilSelecionado?.dano && possuiFormulaDanoConvencional(perfilSelecionado.dano) ? perfilSelecionado.dano : null);
  const categoriasDanoUniversal = escopo === 'ataques' && perfilCorpo
    ? categoriasAtaqueUniversal(origem, cascaGrossaAtiva, perfilCorpo.id)
    : 0;
  const formulaDanoConvencional = formulaDanoBase && categoriasDanoUniversal > 0
    ? aumentarCategoriaDano(formulaDanoBase, categoriasDanoUniversal)
    : formulaDanoBase;
  const multiplicadorCriticoDano = bearLauncherSelecionado ? 4 : multiplicadorCritico;
  const atributoDano = tipo === 'ataque-corpo' ? atributos.forca : atributos.agilidade;
  const calculoDano = useMemo(() => {
    if (!formulaDanoConvencional || !resultadoDadosDano.trim() || !perfilSelecionado || multiplicadorCriticoDano === null) return null;
    const valor = Number(resultadoDadosDano);
    const adicionais = resultadoDadosAdicionais.trim() === '' ? 0 : Number(resultadoDadosAdicionais);
    if (!Number.isInteger(valor) || valor < 0) return { erro: 'Informe a soma inteira e não negativa dos Dados de Dano.' };
    if (!Number.isInteger(adicionais) || adicionais < 0) return { erro: 'Informe a soma inteira e não negativa dos Dados adicionais, ou deixe o campo vazio.' };
    try {
      const perfilCalculo = perfilCorpo ?? {
        id: perfilFogo!.id, nome: perfilFogo!.nome, categoria: 'arma-fogo' as const,
        dano: bearLauncherSelecionado ? '4d6' : perfilFogo!.dano!, multiplicadorCritico: multiplicadorCriticoDano, criticoNatural: limiteCritico === 19 ? 19 as const : 20 as const,
        atributoDano: 'agilidade' as const, propriedades: perfilFogo!.propriedades, referencia: perfilFogo!.referencia,
      };
      return { resultado: calcularDanoArma({ dadosRolados: valor, valorAtributo: atributoDano, critico: criticoDano && !ataqueEmArea, perfil: perfilCalculo, armaOperarioEscolhida, dadosAdicionais: adicionais }) };
    } catch (problema) { return { erro: problema instanceof Error ? problema.message : 'Não foi possível calcular o Dano.' }; }
  }, [formulaDanoConvencional, resultadoDadosDano, resultadoDadosAdicionais, perfilSelecionado, multiplicadorCriticoDano, perfilCorpo, perfilFogo, limiteCritico, atributoDano, criticoDano, armaOperarioEscolhida, ataqueEmArea, bearLauncherSelecionado]);

  function registrarRolagem() {
    try {
      const quantidadeDados = vantagemEfetiva === 'normal' ? 1 : 2;
      const resultados = metodo === 'virtual'
        ? sortearDados(quantidadeDados, 20)
        : validarResultadosFisicos([dado1, ...(quantidadeDados === 2 ? [dado2] : [])].join(' '), quantidadeDados, 20);
      setDadosConfirmados({ dado1: resultados[0], dado2: resultados[1] });
      setErroRolagem('');
      setMensagemCondicao('');
      const ehAtaque = tipo === 'ataque-corpo' || tipo === 'ataque-distancia';
      const resultado = ehAtaque
        ? calcularRolagemAtaqueManual({ valorBase: valorTeste, modificador: Number(modificador || 0), dado1: resultados[0], dado2: resultados[1] ?? null, vantagem: vantagemEfetiva })
        : calcularTesteManual({ valorBase: valorTeste, modificador: Number(modificador || 0), dt: Number(dt), dado1: resultados[0], dado2: resultados[1] ?? null, vantagem: vantagemEfetiva, naturalDe2a9Como10: codeVeronicaAtiva });
      const ataqueFoiCritico = ehAtaque && resultado.dadoEscolhido === 20;
      if (ehAtaque) setCriticoDano(ataqueFoiCritico);
      if (ehAtaque && resultado.estado === 'falha-critica' && aoFalharCriticoAtaque) {
        void aoFalharCriticoAtaque().then(salvo => setMensagemCondicao(salvo ? 'Falha Crítica: Exposto ativado automaticamente e salvo na Ficha.' : 'Falha Crítica: não foi possível confirmar o salvamento de Exposto. Confira as Condições da Ficha.'));
      }
    } catch (problema) {
      setDadosConfirmados(null);
      setErroRolagem(problema instanceof Error ? problema.message : 'Não foi possível registrar o Teste.');
    }
  }

  return <details className="ficha-local-editor calculadora-teste">
    <summary>{escopo === 'ataques' ? 'Conferir Ataque' : 'Conferir Teste'}</summary>
    {penalidadeMorteNivel1 && <p className="ficha-local-aviso" role="status">Penalidade por Morte no Nível 1: −2 aplicada a este Teste de Atributo, Perícia ou Ataque até recuperar o Nível 2.</p>}
    {desvantagemBI && <p className="ficha-local-aviso" role="status">5ª Fase da BI: Desvantagem aplicada a este Teste. Uma Vantagem e uma Desvantagem se anulam normalmente.</p>}
    {desvantagensCondicao.length > 0 && <p className="ficha-local-aviso" role="status">Desvantagem por Condição ativa: {desvantagensCondicao.map(id => CATALOGO_CONDICOES[id].nome).join(', ')}. Uma Vantagem e uma Desvantagem se anulam normalmente; fontes iguais não acrescentam dados adicionais.</p>}
    {modificadorAtaqueBI !== 0 && <p className="ficha-local-legenda">Bônus de Ataque pela Bio-Infecção: +{modificadorAtaqueBI}.</p>}
    <p>{modoDados === 'fisicos' ? 'Modo Físicos: informe o resultado obtido nos dados.' : modoDados === 'virtuais' ? 'Modo Virtuais: o aplicativo gera os dados somente quando você solicitar.' : 'Modo Mistos: escolha o método para este Teste.'} Cada rolagem exige comando explícito. O resultado é apenas informativo e não altera dados da personagem.</p>
    {modoDados === 'mistos' && <label>Método desta rolagem
      <select value={metodo} onChange={evento => { setMetodo(evento.target.value as 'fisico' | 'virtual'); setDadosConfirmados(null); setErroRolagem(''); }}>
        <option value="fisico">Dados físicos</option>
        <option value="virtual">Dados virtuais</option>
      </select>
    </label>}
    {(tipo === 'ataque-corpo' || tipo === 'ataque-distancia') && !ataqueEmArea && <p>20 natural: Acerto Crítico automático e fecha as Reações defensivas normais. 1 natural: Falha Crítica; Exposto é ativado automaticamente somente no modo Automático. A Ficha apresenta a rolagem e o total, sem comparar com a Defesa ou decidir acerto/erro. {limiteCritico === 19 ? 'Este perfil tem margem 19–20: em 19 natural, confira na mesa se o total alcança a Defesa antes de aplicar o Crítico.' : ''} O cálculo de Dano permanece manual.</p>}

    <label>{escopo === 'ataques' ? 'Tipo de Ataque' : 'Tipo de Teste'}
      <select value={tipo} onChange={evento => mudarTipo(evento.target.value as 'pericia' | 'atributo' | 'ataque-corpo' | 'ataque-distancia')}>
        {escopo === 'testes' && <><option value="pericia">Teste de Perícia</option><option value="atributo">Teste puro de Atributo</option></>}
        {escopo === 'ataques' && <><option value="ataque-corpo">Ataque Corpo a Corpo · Luta</option><option value="ataque-distancia">Ataque à distância · Pontaria</option></>}
      </select>
    </label>
    {escopo === 'ataques' && restricoesAtaque.length > 0 && <div className="ficha-local-aviso" role="status"><strong>Condições que restringem Ataques</strong>{restricoesAtaque.map(item => <p key={item.condicao}>{item.motivo}</p>)}<small>Este aviso não bloqueia a rolagem nem altera a narrativa; confira se a Condição ainda está ativa e se existe uma exceção aplicável.</small></div>}
    {quantoMaisMelhorAtiva && <p className="ficha-local-aviso" role="status">QUANTO MAIS MELHOR: se você estiver na Área de Ameaça de 3 ou mais inimigos, recebe Vantagem nos Ataques. Confirme a circunstância com a Mesa e selecione Vantagem manualmente; a Ficha não conta inimigos nem presume posicionamento.</p>}
    {armeiroAtivo && <p className="ficha-local-legenda">ARMEIRO: ao atacar com arma modificada, some +1 ao Teste de Ataque por Peça Extra instalada nela. Confira a arma efetivamente empunhada e informe o bônus no modificador manual; a seleção do perfil não confirma peças instaladas.</p>}
    {armeiraAutodidataAtiva && <p className="ficha-local-legenda">ARMEIRA AUTODIDATA: Armas de Fogo modificadas causam +1d4 de Dano por Peça Extra instalada. Confira a arma e informe os dados adicionais manualmente; não se aplica a armas Corpo a Corpo. O perfil não confirma peças instaladas.</p>}
    {origem === 'Lutador' && <p className="ficha-local-legenda">LUTADOR: Ataque Desarmado e Arma Improvisada sobem automaticamente uma categoria de Dado. O bônus acumula com Casca-Grossa no Ataque Desarmado; não afeta Coronhada.</p>}
    {cascaGrossaAtiva && <p className="ficha-local-aviso" role="status">CASCA-GROSSA: a calculadora eleva automaticamente uma categoria no Ataque Desarmado selecionado. Em Coronhada, aplique a categoria manualmente após confirmar coronha resistente e autorizada. Uma vez por turno, após Ataque bem-sucedido, também permite Cabeçada ou Pisão com Desvantagem; a Ficha não registra esses usos.</p>}
    {armamentoEspecialAtivo && <p className="ficha-local-legenda">ARMAMENTO ESPECIAL: concede Proficiência com Magnums e Armas Especiais. Reduz em uma categoria os custos de Recarga, Bombear/Manejar e Coice, nunca abaixo de Interação Gratuita com Objeto. A calculadora não aplica custos de ação automaticamente.</p>}
    {controleDeFogoAtivo && <p className="ficha-local-legenda">CONTROLE DE FOGO: ao usar Rajada, pode substituir o Cone por até 6 espaços conectados entre si e dentro do alcance permitido; cada espaço precisa de linha de efeito. Confirme a geometria e a linha de efeito na Mesa. Consumo, Dano e DT permanecem os da Rajada.</p>}
    {anatomiaDeCombateAtiva && <p className="ficha-local-aviso" role="status">ANATOMIA DE COMBATE: como Ação Bônus, faça Medicina DT 15. Em sucesso, descubra se o alvo está Vulnerável e receba Vantagem no próximo Ataque contra ele, utilizável até o fim do seu próximo turno. Registre o resultado e selecione Vantagem manualmente; a Ficha não acompanha o alvo nem a duração do benefício.</p>}
    {ambidestriaAtiva && <p className="ficha-local-aviso" role="status">AMBIDESTRIA: se estiver empunhando uma Pistola 9 mm em cada mão, ao usar a Ação Atacar com uma delas, pode realizar um Ataque adicional com a outra como Ação Bônus, uma vez por turno. Esse Ataque adiciona AGI ao Dano normalmente. Sacar as duas simultaneamente usa uma única Interação Gratuita com Objeto. Confirme que as duas pistolas estão efetivamente empunhadas e que o uso no turno ainda está disponível; a Ficha não controla armas nas mãos nem limita o uso por turno.</p>}
    {golpeSujoAtivo && <p className="ficha-local-aviso" role="status">GOLPE SUJO: após causar Dano Corpo a Corpo, você pode gastar Movimento para tentar Derrubar pela Manobra normal. Pisão contra alvo Caído acrescenta 1 Dado ao Ataque Desarmado; contra alvo Menor que você, concede Vantagem e o trata como Caído para esse ataque. Se estiver Vulnerável e puder sofrer Finalização, o Pisão causa Morte Instantânea sem SA. Cabeçada é Ataque Desarmado; em acerto, o alvo faz Fortitude DT 10 + FOR e, em falha, fica Atordoado até o fim do próximo turno dele. Confirme requisitos e efeitos com a Mesa; esta calculadora não executa as Manobras nem aplica Condições.</p>}
    {(tipo === 'ataque-corpo' || tipo === 'ataque-distancia') && <div className="ficha-local-editor">
      <label>Perfil de arma para consulta (opcional)
        <select value={armaId} onChange={evento => { setArmaId(evento.target.value); setResultadoDadosDano(''); setResultadoDadosAdicionais(''); setCriticoDano(false); setVarianteDanoEspecial('normal'); setCartuchoGM79('acido'); setModoGM79('direto'); setModoBearCommander('rifle'); setModoDisparoAutomatico('normal'); setCoronhaMatildaConfirmada(false); }}>
          <option value="">Sem perfil selecionado</option>
          {perfisDisponiveis.map(perfil => <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>)}
          {tipo === 'ataque-corpo' && <><option value="universal:arma-improvisada">Arma Improvisada</option><option value="universal:ataque-desarmado">Ataque Desarmado</option></>}
        </select>
      </label>
      <small>A seleção consulta um perfil de arma ou ataque universal; não confirma posse, equipamento, munição ou proficiência e não altera o Inventário.</small>
      {desvantagemDesarmado && <p className="ficha-local-aviso" role="status">Ataque Desarmado: Desvantagem padrão aplicada. Uma Vantagem válida pode anulá-la, conforme a regra.</p>}
      {perfilSelecionado && <div className="ficha-local-grade">
        <div><small>PERFIL</small><strong>{perfilSelecionado.nome}</strong><p>{perfilSelecionado.categoria === 'corpo-a-corpo' ? 'Corpo a Corpo' : ('categoria' in perfilSelecionado ? perfilSelecionado.categoria : 'Arma de Fogo')}</p></div>
        <div><small>DANO / CRÍTICO</small><strong>{bearLauncherSelecionado ? '4d6' : perfilSelecionado.dano ?? 'Regra específica'}</strong><p>{bearLauncherSelecionado ? 'Crítico 20 ×4' : perfilCorpo ? `Crítico ${perfilCorpo.criticoNatural === 19 ? '19–20' : '20'} ×${perfilCorpo.multiplicadorCritico}` : `Crítico ${perfilFogo?.critico ?? 'conforme regra específica'}`}</p></div>
        <div><small>ALCANCE / RECARGA</small><strong>{perfilFogo?.alcance ?? perfilCorpo?.alcance ?? '—'}</strong><p>{perfilFogo?.recarga ?? perfilCorpo?.recarga ?? '—'}</p></div>
        {(perfilSelecionado.propriedades.length > 0 || ('regrasEspeciais' in perfilSelecionado && (perfilSelecionado.regrasEspeciais?.length ?? 0) > 0)) && <div><small>PROPRIEDADES</small><p>{perfilSelecionado.propriedades.join(' · ')}</p>{'regrasEspeciais' in perfilSelecionado && perfilSelecionado.regrasEspeciais?.map((regra, i) => <p key={i}>{regra}</p>)}</div>}
        <small>{perfilSelecionado.referencia}</small>
      </div>}
      {armaOperarioEscolhida && <p className="ficha-local-legenda">Origem Operário: +1 no Teste de Ataque com a arma escolhida na criação.</p>}
      {perfilFogo && modosArmaFogo && !bearLauncherSelecionado && (perfilFogo.id === 'matilda' || modosArmaFogo.cadenciado || modosArmaFogo.rajada || !modosArmaFogo.disparoUnico) && <div className="ficha-local-editor">
        {perfilFogo.id === 'matilda' && <label className="ficha-local-opcao"><input type="checkbox" checked={coronhaMatildaConfirmada} onChange={evento => { setCoronhaMatildaConfirmada(evento.target.checked); setModoDisparoAutomatico('normal'); setResultadoDadosDano(''); setResultadoDadosAdicionais(''); setCriticoDano(false); }} /> Confirmar Coronha específica da Matilda instalada</label>}
        <label>Modo de disparo
          <select value={modoDisparoEfetivo} onChange={evento => { setModoDisparoAutomatico(evento.target.value as 'normal' | 'cadenciado' | 'rajada'); setResultadoDadosDano(''); setResultadoDadosAdicionais(''); setCriticoDano(false); setDadosConfirmados(null); setDado1(''); setDado2(''); }}>
            {modosArmaFogo.disparoUnico && <option value="normal">Disparo normal</option>}
            {modosArmaFogo.cadenciado && <option value="cadenciado">Disparo Cadenciado · {modosArmaFogo.cartuchosCadenciado} cartuchos · +2 dados</option>}
            {modosArmaFogo.rajada && <option value="rajada">Rajada · Ação Completa · 10 cartuchos</option>}
          </select>
        </label>
        {cadenciadoSelecionado && <p className="ficha-local-legenda">Disparo Cadenciado usa Ataque normal e acrescenta +2 Dados de Dano do mesmo tipo da arma. Role esses dois dados extras e informe a soma no campo de Dados adicionais. Consumo: {modosArmaFogo?.cartuchosCadenciado} cartuchos.</p>}
        {rajadaSelecionada && <p className="ficha-local-legenda">Cone de 4,5 m: 1 espaço na primeira fileira, 2 na segunda e 3 na terceira. Pode operar no alcance Curto mesmo quando o alcance mínimo normal é Médio.</p>}
      </div>}
      {procedimentoPerfuracao && <div className="ficha-local-aviso" role="status"><strong>Perfuração</strong><p>{procedimentoPerfuracao}</p><small>A calculadora não controla a Linha, os alvos subsequentes, a cobertura ou a redução acumulada dos dados; faça cada Teste de Ataque e ajuste o Dano manualmente.</small></div>}
      {perfilFogo?.id === 'bear-commander' && <div className="ficha-local-editor">
        <label>Bear Commander — sistema de disparo
          <select value={modoBearCommander} onChange={evento => { setModoBearCommander(evento.target.value as 'rifle' | 'lancador'); setCartuchoGM79('acido'); setModoGM79('direto'); setResultadoDadosDano(''); setResultadoDadosAdicionais(''); setCriticoDano(false); setDadosConfirmados(null); setDado1(''); setDado2(''); }}>
            <option value="rifle">Rifle · 1d10 · munição própria</option>
            <option value="lancador">Lança-granadas integrado · 4d6 · Cartucho GM 79</option>
          </select>
        </label>
        {bearLauncherSelecionado && <p className="ficha-local-legenda">O lançador tem capacidade separada de 1 Cartucho GM 79, alcance Médio e reserva independente dos cartuchos do rifle. Recarga por Ação Bônus.</p>}
      </div>}
      {(perfilFogo?.id === 'gm-79' || bearLauncherSelecionado) && <div className="ficha-local-editor">
        <label>Cartucho GM 79
          <select value={cartuchoGM79} onChange={evento => { setCartuchoGM79(evento.target.value as CartuchoGM79); setResultadoDadosDano(''); setCriticoDano(false); }}>
            <option value="acido">Ácido</option><option value="explosivo">Explosivo</option><option value="incendiario">Incendiário</option>
          </select>
        </label>
        {cartuchoGM79 !== 'explosivo' && <label>Modo de disparo
          <select value={modoGM79} onChange={evento => { setModoGM79(evento.target.value as ModoGM79); setResultadoDadosDano(''); setCriticoDano(false); }}>
            <option value="direto">Ataque direto contra Defesa</option><option value="area">Disparo contra ponto do cenário · Área</option>
          </select>
        </label>}
        <div className="ficha-local-aviso" role="status"><strong>{procedimentoGM79?.titulo}</strong><p>{procedimentoGM79?.descricao}</p></div>
        <small>{bearLauncherSelecionado ? 'O lançador comporta 1 cartucho e recarrega por Ação Bônus. A reserva é separada da munição do rifle. A calculadora não consome cartuchos nem resolve os Testes dos alvos.' : 'Todo disparo deixa a GM 79 vazia; recarga por Movimento. A calculadora não consome cartuchos nem resolve os Testes dos alvos.'}</small>
      </div>}
      {perfilFogo?.id === 'spark-shot' && <label>Modo da Spark Shot
        <select value={varianteDanoEspecial === 'carregado' ? 'carregado' : 'normal'} onChange={evento => { setVarianteDanoEspecial(evento.target.value as VarianteDanoEspecial); setResultadoDadosDano(''); setResultadoDadosAdicionais(''); }}>
          <option value="normal">Disparo normal · 1 Carga · 1d4</option>
          <option value="carregado">Disparo Carregado · Ação Completa · 3 Cargas · 4d4</option>
        </select>
      </label>}
      {perfilFogo?.id === 'lanca-chamas-quimico' && <label>Dano da Chama Contínua
        <select value={varianteDanoEspecial.startsWith('chama-') ? varianteDanoEspecial : 'chama-3'} onChange={evento => { setVarianteDanoEspecial(evento.target.value as VarianteDanoEspecial); setResultadoDadosDano(''); setResultadoDadosAdicionais(''); }}>
          <option value="chama-3">Início / reinício · 3d6</option>
          <option value="chama-4">1 turno consecutivo · 4d6</option>
          <option value="chama-5">2 turnos consecutivos · 5d6</option>
          <option value="chama-6">3 ou mais turnos consecutivos · 6d6 (máximo)</option>
        </select>
        <small>Selecione conforme o histórico real do combate. Mover ou falhar no Teste encerra a acumulação; o próximo Ataque volta a 3d6.</small>
      </label>}
      {perfilSelecionado && formulaDanoConvencional && multiplicadorCritico !== null && <div className="ficha-local-editor">
        <strong>Calculadora manual de Dano</strong>
        <small>Role os dados fisicamente ou informe a soma que você já obteve. Esta etapa não rola dados nem altera PV.</small>
        <label>Soma dos Dados de Dano ({formulaDanoConvencional})
          <input type="number" min="0" step="1" value={resultadoDadosDano} onChange={evento => setResultadoDadosDano(evento.target.value)} placeholder="Resultado somado dos dados" />
        </label>
        <label>Soma de Dados adicionais já rolados (opcional)
          <input type="number" min="0" step="1" value={resultadoDadosAdicionais} onChange={evento => setResultadoDadosAdicionais(evento.target.value)} placeholder="Ex.: +1d4 de Peça ou Habilidade" />
        </label>
        <small>Use este campo somente depois de rolar dados adicionais previstos por uma Peça, Habilidade ou modo de disparo válido, incluindo os +2 dados do Disparo Cadenciado. Na Motosserra, informe aqui a soma dos dados extras gerados por cada resultado 6, incluindo os encadeamentos. A calculadora não presume que você possui Peças ou Habilidades.</small>
        <p>Atributo aplicado: {tipo === 'ataque-corpo' ? 'FOR' : 'AGI'} (+{atributoDano}).</p>
        {armaOperarioEscolhida && <p>Operário: o Dano recebe FOR adicional; esse bônus não é multiplicado no Crítico.</p>}
        {!ataqueEmArea && <label className="ficha-local-opcao"><input type="checkbox" checked={criticoDano} onChange={evento => setCriticoDano(evento.target.checked)} /> Aplicar Acerto Crítico (×{multiplicadorCriticoDano})</label>}
        {ataqueEmArea && <small>Disparo em Área: sem Acerto Crítico. Na Rajada, aplique metade do Dano em sucesso no Reflexos DT 12 e Dano integral em falha; nos cartuchos GM 79, siga o procedimento do cartucho.</small>}
        {calculoDano && ('erro' in calculoDano ? <p className="offline-erro" role="alert">{calculoDano.erro}</p> : <div className="offline-status ficha-local-resultado" role="status"><p>Dados: {calculoDano.resultado.dados} × {calculoDano.resultado.multiplicador} · {tipo === 'ataque-corpo' ? 'FOR' : 'AGI'}: {calculoDano.resultado.atributoMultiplicado}{calculoDano.resultado.bonusOperarioNaoMultiplicado ? ` + ${calculoDano.resultado.bonusOperarioNaoMultiplicado} FOR não multiplicado` : ''}</p><strong>Dano calculado: {calculoDano.resultado.total}</strong></div>)}
      </div>}
      {perfilFogo?.id === 'spark-shot' && <div className="ficha-local-aviso" role="status"><strong>Efeito elétrico — Spark Shot</strong><p>{procedimentoArmaEspecial?.descricao}</p><small>O efeito exige resolução manual: não consome Cargas, não rola Fortitude e não aplica Condições. Confirme também o alcance e quem está a até 1,5 m do alvo.</small></div>}
      {perfilFogo?.id === 'rpg-7' && procedimentoArmaEspecial && <div className="ficha-local-aviso" role="status"><strong>{procedimentoArmaEspecial.titulo}</strong><p>{procedimentoArmaEspecial.descricao}</p><small>A calculadora não identifica o tipo de criatura, não escolhe avanço de fase/efeito de ficha e não altera estado do alvo. Após o disparo, registre manualmente a arma vazia e a recarga por Movimento.</small></div>}
      {perfilFogo?.id === 'lanca-chamas-quimico' && <p className="ficha-local-legenda">A escolha da fórmula não consome Combustível nem registra turnos ou Movimento; confira esses estados na mesa.</p>}
      {perfilSelecionado && !formulaDanoConvencional && <p className="ficha-local-aviso">Este perfil usa fórmula ou condição especial de Dano. A calculadora não aplica uma aproximação automática; consulte a regra específica do perfil.</p>}
    </div>}
    {tipo === 'pericia'
      ? <label>Perícia
          <select value={pericia} onChange={evento => { setPericia(evento.target.value); setDado1(''); setDado2(''); setDadosConfirmados(null); setErroRolagem(''); setGastoSAConfirmado(false); }}>
            {PERICIAS.map(nome => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </label>
      : tipo === 'ataque-corpo' || tipo === 'ataque-distancia'
        ? <p><strong>Perícia de Ataque: {periciaEfetiva} (+{valorBase})</strong> · O valor já inclui o Atributo associado e o Treinamento.</p>
        : <label>Atributo
          <select value={atributo} onChange={evento => { setAtributo(evento.target.value as keyof AtributosIniciais); setDado1(''); setDado2(''); setDadosConfirmados(null); setErroRolagem(''); setGastoSAConfirmado(false); }}>
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
    {escopo === 'testes' && <label>DT
      <input type="number" min="1" step="1" value={dt} disabled={impossivel} onChange={evento => setDt(evento.target.value)} placeholder="Ex.: 15" />
    </label>}
    {escopo === 'testes' && <label className="ficha-local-opcao">
      <input type="checkbox" checked={impossivel} onChange={evento => { setImpossivel(evento.target.checked); setDado1(''); setDado2(''); setDadosConfirmados(null); setErroRolagem(''); }} />
      Impossível — sem Teste
    </label>}
    {origem === 'Criminoso' && escopo === 'testes' && tipo === 'pericia' && periciaEfetiva === 'Investigação' && criminosoDisponivel && <div className="ficha-local-editor">
      <label>Finalidade da Investigação
        <select value={finalidadeCriminoso} onChange={evento => { setFinalidadeCriminoso(evento.target.value as 'outra' | 'procurar_itens_recursos'); setUsarBeneficioCriminoso(false); setDado1(''); setDado2(''); setDadosConfirmados(null); }}>
          <option value="outra">Outra finalidade</option>
          <option value="procurar_itens_recursos">Procurar itens ou recursos</option>
        </select>
      </label>
      {finalidadeCriminoso === 'procurar_itens_recursos' && <label className="ficha-local-opcao"><input type="checkbox" checked={usarBeneficioCriminoso} onChange={evento => { setUsarBeneficioCriminoso(evento.target.checked); setDado1(''); setDado2(''); setDadosConfirmados(null); }} /> Usar benefício do Criminoso neste Teste · Vantagem</label>}
      {finalidadeCriminoso === 'procurar_itens_recursos' && <small>Criminoso: uma vez por Descanso Completo, Vantagem em Investigação ao procurar itens ou recursos. Se usar, marque o consumo no painel Benefícios limitados a Descanso Completo. Vantagem não acumula com outra fonte.</small>}
    </div>}
    {academicoAplicavel && <div className="ficha-local-editor">
      <label className="ficha-local-opcao"><input type="checkbox" checked={usarSaberEAPoder} onChange={evento => { setUsarSaberEAPoder(evento.target.checked); setDado1(''); setDado2(''); setDadosConfirmados(null); setErroRolagem(''); }} /> Usar Saber é Poder neste Teste · Vantagem</label>
      <small>Acadêmico: uma vez por Descanso Completo, em um Teste puro de AST ou de Perícia associada a AST. Se usar o benefício, marque o uso como realizado no painel Benefícios limitados a Descanso Completo. Vantagem não acumula com outra fonte.</small>
    </div>}
    {curiosaAtiva && <p className="ficha-local-aviso" role="status">CURIOSA: quando houver tempo para observar/investigar sem Pressão Imediata, concede Vantagem em Percepção e Investigação, mesmo sem Treinamento. Não se aplica em combate, perseguições, fugas ou quando o Narrador determinar que não há tempo para análise cuidadosa. Se a situação cumprir os requisitos, selecione Vantagem manualmente. Uma vez por Descanso Completo, também permite Teste de AST DT 12 para pedir direção ou pista curta dedutível.</p>}
    {curiosaContextual && <p className="ficha-local-legenda">Esta Perícia é abrangida por Curiosa; confirme com a Mesa se há tempo e ausência de Pressão Imediata antes de aplicar Vantagem.</p>}
    {parrudoAtivo && <p className="ficha-local-aviso" role="status">PARRUDO: Vantagem automática em Testes de Fortitude.</p>}
    {codeVeronicaAtiva && <p className="ficha-local-aviso" role="status">CODE VERONICA: Vantagem automática em Testes de Perícia; resultados naturais de 2 a 9 contam como 10. Um 1 natural continua sendo Falha Crítica. Fontes de Desvantagem cancelam a Vantagem normalmente.</p>}
    <label>Condição da rolagem
      <select value={vantagem} disabled={impossivel} onChange={evento => { setVantagem(evento.target.value as VantagemTeste); setDado1(''); setDado2(''); setDadosConfirmados(null); setErroRolagem(''); }}>
        <option value="normal">Normal · 1d20</option>
        <option value="vantagem">Vantagem · 2d20, usar o melhor</option>
        <option value="desvantagem">Desvantagem · 2d20, usar o pior</option>
      </select>
    </label>
    {!impossivel && metodo === 'fisico' && <div className="ficha-local-grade">
      <label>Resultado físico do d20
        <input type="number" min="1" max="20" step="1" value={dado1} onChange={evento => { setDado1(evento.target.value); setDadosConfirmados(null); }} placeholder="1–20" />
      </label>
      {vantagemEfetiva !== 'normal' && <label>Segundo d20
        <input type="number" min="1" max="20" step="1" value={dado2} onChange={evento => { setDado2(evento.target.value); setDadosConfirmados(null); }} placeholder="1–20" />
      </label>}
    </div>}
    {!impossivel && !ataqueEmArea && !disparoUnicoIndisponivel && <button type="button" className="botao-claro" onClick={registrarRolagem}>{metodo === 'virtual' ? (escopo === 'ataques' ? 'Rolar Ataque' : 'Rolar Teste') : (escopo === 'ataques' ? 'Confirmar dados do Ataque' : 'Confirmar dados físicos')}</button>}
    {ataqueEmArea && <p className="ficha-local-aviso" role="status">{rajadaSelecionada ? 'Rajada: não existe Teste de Ataque. Todos os alvos no cone de 4,5 m, inclusive aliados, fazem Reflexos DT 12; sucesso sofre metade do Dano da arma e falha sofre Dano integral. Ação Completa e 10 cartuchos.' : 'Disparo em Área: não existe Teste de Ataque. Use os Testes de Reflexos e a resolução de Dano descritos acima, fora desta rolagem de Ataque.'}</p>}{disparoUnicoIndisponivel && <p className="ficha-local-aviso" role="status">Este perfil não permite Disparo Único. Selecione um modo compatível antes de rolar.</p>}
    {erroRolagem && <p className="offline-erro" role="alert">{erroRolagem}</p>}
    {mensagemCondicao && <p role="status">{mensagemCondicao}</p>}
    {calculado.erro && <p className="offline-erro" role="alert">{calculado.erro}</p>}
    {calculado.resultado && <div className="offline-status ficha-local-resultado" role="status">
      <strong>{calculado.resultado.estado === 'impossivel' ? 'Sem Teste'
        : calculado.resultado.estado === 'incompleto' ? 'Aguardando dados'
        : calculado.resultado.estado === 'critico-sucesso' ? (escopo === 'ataques' ? 'Acerto Crítico · 20 natural' : 'Sucesso automático · 20 natural')
        : calculado.resultado.estado === 'falha-critica' ? 'Falha Crítica · 1 natural'
        : calculado.resultado.estado === 'rolagem-ataque' ? 'Rolagem de Ataque'
        : calculado.resultado.estado === 'sucesso' ? 'Sucesso'
        : 'Falha'}</strong>
      <p>{calculado.resultado.detalhe}</p>
      {resultadoAtaqueCritico && <p><strong>Acerto Crítico</strong>{multiplicadorCritico ? ` · multiplicador ×${multiplicadorCritico}` : ' · consulte a regra específica do perfil'}</p>}
      {bonusOperario > 0 && <p>Bônus da Origem Operário: +{bonusOperario} no Ataque.</p>}
      {calculado.resultado.total !== null && <p>Dado escolhido: {calculado.resultado.dadoEscolhido} · Valor base: {valorTeste} · Modificador: {Number(modificador || 0)} · Total: {calculado.resultado.total} · {escopo === 'ataques' ? 'Compare com a Defesa do alvo na mesa.' : `DT: ${calculado.resultado.dt}`}</p>}
    </div>}
  </details>;
}
