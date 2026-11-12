import { useEffect, useRef, useState } from 'react';
import { sortearDados } from './rolagemDados';
import {
  acumularCuraDuranteReanimacao,
  concederAjudaMedicina,
  encerrarColapsoPorReducaoBI,
  iniciarReanimacao,
  iniciarTurnoReanimacao,
  reanimacaoValida,
  resolverTesteReanimacao,
  type Reanimacao,
} from './reanimacaoFicha';
import type { RecursosAtuais } from './recursosFicha';
import type { ModoDados, ModoFuncionamento } from './funcionamentoFicha';

type Props = {
  dados: Record<string, unknown>;
  recursos: RecursosAtuais;
  origem: string;
  pvMaximo: number;
  biMaximo: number;
  modoDados: ModoDados;
  modo: ModoFuncionamento;
  bloqueado: boolean;
  origemDados?: 'local' | 'servidor';
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
  transformacaoAtiva?: 'infectado-especial' | 'cabeca-carmesim' | 'conflito' | null;
};

export default function ReanimacaoFichaLocal({ dados, recursos, origem, pvMaximo, biMaximo, modoDados, modo, bloqueado, origemDados = 'local', aoSalvar, transformacaoAtiva = null }: Props) {
  const registroReanimacaoPresente = dados.reanimacao !== null && dados.reanimacao !== undefined;
  const registroReanimacaoValido = !registroReanimacaoPresente || reanimacaoValida(dados.reanimacao);
  const registroReanimacaoInvalido = !registroReanimacaoValido;
  const inicial = registroReanimacaoPresente && registroReanimacaoValido ? dados.reanimacao as Reanimacao : null;
  const [reanimacao, setReanimacao] = useState<Reanimacao | null>(inicial);
  useEffect(() => { setReanimacao(inicial); }, [inicial]);
  const [metodo, setMetodo] = useState<'fisico' | 'virtual'>(modo === 'automatico' && modoDados === 'virtuais' ? 'virtual' : 'fisico');
  useEffect(() => { setMetodo(modo === 'automatico' && modoDados === 'virtuais' ? 'virtual' : 'fisico'); }, [modo, modoDados]);
  const [primeiroDado, setPrimeiroDado] = useState('');
  const [segundoDado, setSegundoDado] = useState('');
  const [cura, setCura] = useState('1');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const colapsoAutoTentado = useRef(false);
  const pvZeroAutoTentado = useRef(false);

  const reanimacaoAnteriorConcluida = reanimacao?.estado === 'concluida';
  const transformacaoBloqueiaReanimacao = transformacaoAtiva !== null && recursos.pvAtual <= 0;
  const reanimacaoEmConflito = transformacaoBloqueiaReanimacao && reanimacao !== null && reanimacao.estado !== 'concluida';
  const podeIniciarPV = !registroReanimacaoInvalido && !transformacaoBloqueiaReanimacao && recursos.pvAtual === 0 && (reanimacao === null || reanimacaoAnteriorConcluida);
  const podeIniciarColapso = !registroReanimacaoInvalido && !transformacaoBloqueiaReanimacao && biMaximo > 0 && recursos.biAtual >= biMaximo && (reanimacao === null || reanimacaoAnteriorConcluida);
  const vantagem = !!reanimacao && (reanimacao.vantagemProximoTeste || (reanimacao.causa === 'colapso_bi' && origem === 'Cobaia'));
  const primeiro = Number(primeiroDado);
  const segundo = Number(segundoDado);
  const dadoValido = (n: number) => Number.isSafeInteger(n) && n >= 1 && n <= 20;
  const rolagemVirtualAtiva = modo === 'automatico' && metodo === 'virtual';
  const resultadoValido = rolagemVirtualAtiva || (primeiroDado.trim() !== '' && dadoValido(primeiro)
    && (vantagem ? segundoDado.trim() !== '' && dadoValido(segundo) : segundoDado.trim() === ''));
  const estadoAtivo = reanimacao?.estado === 'em_andamento' && !transformacaoBloqueiaReanimacao;
  const estadoPV0 = reanimacao?.causa === 'pv_zero' && ['aguardando_proximo_turno', 'em_andamento'].includes(reanimacao.estado) && !transformacaoBloqueiaReanimacao;

  async function persistir(proxima: Reanimacao, recursosPatch: Partial<RecursosAtuais> = {}) {
    if (ocupado || bloqueado || registroReanimacaoInvalido) return;
    setOcupado(true); setErro(''); setMensagem('');
    try {
      if (!await aoSalvar({ ...recursos, ...recursosPatch, reanimacao: proxima })) {
        throw new Error('O armazenamento não confirmou a alteração da Reanimação.');
      }
      setReanimacao(proxima);
      setPrimeiroDado(''); setSegundoDado('');
      setMensagem(origemDados === 'servidor' ? 'Estado de Reanimação confirmado pelo servidor.' : 'Estado de Reanimação salvo neste dispositivo.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a Reanimação.');
      throw e;
    } finally { setOcupado(false); }
  }

  async function iniciar(causa: 'pv_zero' | 'colapso_bi') {
    try { await persistir(iniciarReanimacao(causa)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível iniciar a Reanimação.'); }
  }

  useEffect(() => {
    if (biMaximo > 0 && recursos.biAtual < biMaximo) colapsoAutoTentado.current = false;
    if (!podeIniciarColapso || bloqueado || ocupado || colapsoAutoTentado.current) return;
    colapsoAutoTentado.current = true;
    void iniciar('colapso_bi');
  }, [recursos.biAtual, biMaximo, podeIniciarColapso, bloqueado, ocupado]);
  useEffect(() => {
    if (recursos.pvAtual > 0) pvZeroAutoTentado.current = false;
    if (biMaximo > 0 && recursos.biAtual >= biMaximo) return;
    if (!podeIniciarPV || bloqueado || ocupado || pvZeroAutoTentado.current) return;
    pvZeroAutoTentado.current = true;
    void iniciar('pv_zero');
  }, [recursos.pvAtual, recursos.biAtual, biMaximo, podeIniciarPV, bloqueado, ocupado]);

  async function registrarTeste() {
    if (!reanimacao || !estadoAtivo || !resultadoValido) return;
    try {
      const resultados = rolagemVirtualAtiva
        ? (vantagem ? sortearDados(2, 20) as [number, number] : sortearDados(1, 20)[0])
        : vantagem ? [primeiro, segundo] as [number, number] : primeiro;
      const resultado = resolverTesteReanimacao(reanimacao, resultados, pvMaximo, origem === 'Cobaia');
      const recursosPatch = resultado.pvAoDespertar === null ? {} : { pvAtual: resultado.pvAoDespertar };
      await persistir(resultado.reanimacao, recursosPatch);
      const avisos: string[] = [];
      if (resultado.falhaCritica) avisos.push('1 natural: Falha Crítica no Teste de Reanimação. Como não é um Ataque, não ativa Exposto automaticamente.');
      if (resultado.morteParaRegistroDoMestre) avisos.push('Três falhas: morte sinalizada para registro do Mestre. Nenhuma consequência adicional foi executada.');
      else if (resultado.transformacaoPendente) avisos.push('Três falhas: retorno como Zumbi Especial pendente para o próximo turno.');
      else if (resultado.pvAoDespertar !== null) avisos.push(`Três sucessos: personagem desperta com ${resultado.pvAoDespertar} PV.`);
      else if (resultado.reanimacao.estado === 'desacordada_ate_reducao_bi') avisos.push('Três sucessos: permanece Desacordada até a BI ficar abaixo do máximo.');
      const faces = Array.isArray(resultados) ? resultados.join(' e ') : String(resultados);
      const resultadoExibido = rolagemVirtualAtiva ? `Rolagem virtual: ${faces}.` : `Dados físicos registrados: ${faces}.`;
      setMensagem([resultadoExibido, ...avisos].join(' '));
    } catch (e) { setErro(e instanceof Error ? e.message : 'Resultado de Reanimação inválido.'); }
  }

  async function registrarCura() {
    if (!reanimacao || reanimacao.causa !== 'pv_zero') return;
    const quantidade = Number(cura);
    try {
      if (!Number.isSafeInteger(quantidade) || quantidade < 0) throw new Error('Informe uma quantidade inteira não negativa.');
      await persistir(acumularCuraDuranteReanimacao(reanimacao, quantidade));
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível acumular a cura.'); }
  }

  async function registrarMedicina(sucesso: boolean, falhaCritica = false) {
    if (!reanimacao) return;
    try {
      await persistir(concederAjudaMedicina(reanimacao, sucesso));
      if (falhaCritica) setMensagem('1 natural no Teste de Medicina: Falha Crítica. Por ser um Teste comum de Perícia, não ativa Exposto automaticamente; essa ativação automática é restrita a Falha Crítica em Ataque.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível registrar o Teste de Medicina.'); }
  }

  async function iniciarProximoTurno() {
    if (!reanimacao) return;
    try { await persistir(iniciarTurnoReanimacao(reanimacao)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível avançar a Reanimação.'); }
  }

  async function encerrarColapso() {
    if (!reanimacao) return;
    try { await persistir(encerrarColapsoPorReducaoBI(reanimacao, recursos.biAtual, biMaximo)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível encerrar o Colapso.'); }
  }

  if (!reanimacao && !podeIniciarPV && !podeIniciarColapso && !transformacaoBloqueiaReanimacao && !registroReanimacaoInvalido) return null;

  return <details className="ficha-local-editor reanimacao-ficha" open={!!reanimacao}>
    <summary>Reanimação e estados críticos</summary>
    <p>Ao atingir a BI Máxima, o Colapso Viral e a Reanimação específica são iniciados automaticamente; a Ficha não avança turnos nem decide a narrativa de morte ou transformação.</p>
    {transformacaoBloqueiaReanimacao && <p className="ficha-local-aviso" role="alert">{transformacaoAtiva === 'infectado-especial' ? 'Infectado Especial a 0 PV: o cânone determina 1 hora inerte antes da transformação em Cabeça Carmesim, salvo impedimento específico. A Reanimação comum por 0 PV não será iniciada; controle o período e a transformação com a Mesa.' : transformacaoAtiva === 'cabeca-carmesim' ? 'Cabeça Carmesim a 0 PV antes da reversão: o cânone determina a morte da personagem. A Ficha não inicia Reanimação nem registra a morte automaticamente; confirme e registre com a Mesa.' : 'Há mais de uma transformação ativa com 0 PV. A Ficha bloqueou a Reanimação automática porque não pode determinar qual desfecho narrativo prevalece; resolva com a Mesa.'} Se a BI também estiver na faixa de Colapso, a prioridade entre os dois estados não é automatizada.</p>}
    {reanimacaoEmConflito && <p className="offline-erro" role="alert">Existe um registro anterior de Reanimação incompatível com a transformação ativa. Os dados foram preservados, mas seus controles estão bloqueados para evitar aplicar o fluxo errado. Revise o histórico com a Mesa; não apague o registro automaticamente.</p>}
    {modo === 'automatico' && modoDados === 'mistos' && <label>Método deste Teste<select value={metodo} onChange={e => { setMetodo(e.target.value as 'fisico' | 'virtual'); setPrimeiroDado(''); setSegundoDado(''); }}><option value="fisico">Dados físicos</option><option value="virtual">Dados virtuais</option></select></label>}
    {modo === 'automatico' && modoDados !== 'mistos' && <p>Método: {modoDados === 'fisicos' ? 'Dados físicos' : 'Dados virtuais'}.</p>}
    {modo !== 'automatico' && <p>Modo {modo === 'misto' ? 'Misto' : 'Manual'}: roladores integrados ocultos. Informe abaixo o resultado obtido fora da Ficha.</p>}
    {bloqueado && <p role="status">Salve ou descarte outras alterações pendentes da ficha antes de alterar a Reanimação.</p>}
    {registroReanimacaoInvalido && <p className="offline-erro" role="alert">O registro de Reanimação está inválido. Os dados originais foram preservados; nenhuma Reanimação será iniciada ou alterada automaticamente. Faça backup e revise o registro antes de continuar.</p>}
    {!reanimacao && <>
      {podeIniciarPV && <button type="button" className="acao" disabled={ocupado || bloqueado} onClick={() => void iniciar('pv_zero')}>Tentar registrar estado de 0 PV <span>→</span></button>}
      {podeIniciarColapso && <button type="button" className="acao" disabled={ocupado || bloqueado} onClick={() => void iniciar('colapso_bi')}>Tentar iniciar Reanimação por Colapso Viral <span>→</span></button>}

    </>}
    {reanimacao && <>
      <h4>{reanimacao.causa === 'pv_zero' ? 'Reanimação por 0 PV' : 'Reanimação por Colapso Viral'}</h4>
      <p>Estado: <strong>{({
        aguardando_proximo_turno: 'Aguardando o próximo turno',
        em_andamento: 'Testes em andamento',
        desacordada_ate_reducao_bi: 'Desacordada até BI abaixo do máximo',
        morte_a_registrar: 'Morte sinalizada para registro do Mestre',
        transformacao_no_proximo_turno: 'Retorno como Zumbi Especial pendente para o próximo turno',
        concluida: 'Concluída',
      } as Record<string, string>)[reanimacao.estado]}</strong></p>
      <p>Sucessos: {reanimacao.sucessos}/3 · Falhas: {reanimacao.falhas}/3 · Tentativas: {reanimacao.tentativas}/5</p>
      {reanimacao.causa === 'pv_zero' && <p>Cura acumulada: {reanimacao.curaAcumulada} PV. A cura não desperta a personagem antes do terceiro sucesso.</p>}
      {reanimacao.estado === 'aguardando_proximo_turno' && !transformacaoBloqueiaReanimacao && <button type="button" className="acao" disabled={ocupado || bloqueado} onClick={() => void iniciarProximoTurno()}>Iniciar Testes no próximo turno <span>→</span></button>}
      {estadoPV0 && <>
        <h4>Primeiros Socorros · Medicina DT 15</h4>
        <p>O ajudante realiza o Teste de Medicina DT 15 na própria Ficha, considerando seu Atributo, Treinamento e modificadores. Registre aqui apenas o resultado final. Sucesso concede Vantagem ao próximo Teste de Reanimação.</p>
        <div className="recursos-controles">
          <button type="button" disabled={ocupado || bloqueado} onClick={() => void registrarMedicina(true)}>Registrar sucesso</button>
          <button type="button" disabled={ocupado || bloqueado} onClick={() => void registrarMedicina(false)}>Registrar falha</button>
          <button type="button" disabled={ocupado || bloqueado} onClick={() => void registrarMedicina(false, true)}>Registrar falha crítica (1 natural)</button>
        </div>
        <label>Cura recebida enquanto estava em 0 PV
          <input type="number" min="0" step="1" value={cura} disabled={ocupado || bloqueado} onChange={e => setCura(e.target.value)}/>
        </label>
        <button type="button" className="botao-claro" disabled={ocupado || bloqueado} onClick={() => void registrarCura()}>Acumular cura sem despertar</button>
      </>}
      {estadoAtivo && <>
          <h4>Teste de Reanimação · 1d20 contra DT 12</h4>
          {vantagem && <p>Vantagem ativa: {rolagemVirtualAtiva ? 'a Ficha rolará dois d20 e usará o melhor.' : 'informe dois resultados físicos de d20; será considerado o melhor.'}</p>}
          {!rolagemVirtualAtiva ? <div className="recursos-controles">
            <label>Resultado do d20<input type="number" min="1" max="20" step="1" value={primeiroDado} disabled={ocupado || bloqueado} onChange={e => setPrimeiroDado(e.target.value)}/></label>
            {vantagem && <label>Segundo d20<input type="number" min="1" max="20" step="1" value={segundoDado} disabled={ocupado || bloqueado} onChange={e => setSegundoDado(e.target.value)}/></label>}
          </div> : <p>{vantagem ? 'A Ficha rolará virtualmente dois d20 e usará o melhor.' : 'A Ficha rolará virtualmente um d20.'}</p>}
          <button type="button" className="acao" disabled={ocupado || bloqueado || !resultadoValido} onClick={() => void registrarTeste()}>{rolagemVirtualAtiva ? 'Rolar e registrar Teste' : 'Registrar resultado do Teste'} <span>→</span></button>
        </>}
      {reanimacao.estado === 'desacordada_ate_reducao_bi' && !transformacaoBloqueiaReanimacao && <button type="button" className="acao" disabled={ocupado || bloqueado || recursos.biAtual >= biMaximo} onClick={() => void encerrarColapso()}>Confirmar BI abaixo do máximo e encerrar <span>→</span></button>}
      {reanimacao.estado === 'morte_a_registrar' && <p>A regra sinaliza morte após três falhas. O registro e as consequências de campanha permanecem sob responsabilidade do Mestre.</p>}
      {reanimacao.estado === 'transformacao_no_proximo_turno' && <p>A regra determina o retorno como Zumbi Especial no próximo turno. A ficha não altera o controle da personagem nem aplica a transformação automaticamente.</p>}
    </>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
