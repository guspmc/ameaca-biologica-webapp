import { useState } from 'react';
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
import type { ModoDados } from './funcionamentoFicha';

type Props = {
  dados: Record<string, unknown>;
  recursos: RecursosAtuais;
  origem: string;
  pvMaximo: number;
  biMaximo: number;
  modoDados: ModoDados;
  bloqueado: boolean;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

export default function ReanimacaoFichaLocal({ dados, recursos, origem, pvMaximo, biMaximo, modoDados, bloqueado, aoSalvar }: Props) {
  const inicial = dados.reanimacao === null || dados.reanimacao === undefined
    ? null
    : reanimacaoValida(dados.reanimacao) ? dados.reanimacao : null;
  const [reanimacao, setReanimacao] = useState<Reanimacao | null>(inicial);
  const [primeiroDado, setPrimeiroDado] = useState('');
  const [segundoDado, setSegundoDado] = useState('');
  const [cura, setCura] = useState('1');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const podeIniciarPV = recursos.pvAtual === 0 && reanimacao === null;
  const podeIniciarColapso = biMaximo > 0 && recursos.biAtual >= biMaximo && reanimacao === null;
  const vantagem = !!reanimacao && (reanimacao.vantagemProximoTeste || (reanimacao.causa === 'colapso_bi' && origem === 'Cobaia'));
  const primeiro = Number(primeiroDado);
  const segundo = Number(segundoDado);
  const dadoValido = (n: number) => Number.isSafeInteger(n) && n >= 1 && n <= 20;
  const resultadoValido = primeiroDado.trim() !== '' && dadoValido(primeiro)
    && (vantagem ? segundoDado.trim() !== '' && dadoValido(segundo) : segundoDado.trim() === '');
  const estadoAtivo = reanimacao?.estado === 'em_andamento';
  const bloqueioVirtual = modoDados === 'virtuais';

  async function persistir(proxima: Reanimacao, recursosPatch: Partial<RecursosAtuais> = {}) {
    if (ocupado || bloqueado) return;
    setOcupado(true); setErro(''); setMensagem('');
    try {
      if (!await aoSalvar({ ...recursos, ...recursosPatch, reanimacao: proxima })) {
        throw new Error('O armazenamento não confirmou a alteração da Reanimação.');
      }
      setReanimacao(proxima);
      setPrimeiroDado(''); setSegundoDado('');
      setMensagem('Estado de Reanimação salvo e confirmado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a Reanimação.');
      throw e;
    } finally { setOcupado(false); }
  }

  async function iniciar(causa: 'pv_zero' | 'colapso_bi') {
    try { await persistir(iniciarReanimacao(causa)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível iniciar a Reanimação.'); }
  }

  async function registrarTeste() {
    if (!reanimacao || !estadoAtivo || bloqueioVirtual || !resultadoValido) return;
    try {
      const resultados = vantagem ? [primeiro, segundo] as [number, number] : primeiro;
      const resultado = resolverTesteReanimacao(reanimacao, resultados, pvMaximo, origem === 'Cobaia');
      const recursosPatch = resultado.pvAoDespertar === null ? {} : { pvAtual: resultado.pvAoDespertar };
      await persistir(resultado.reanimacao, recursosPatch);
      if (resultado.morteParaRegistroDoMestre) setMensagem('Três falhas: morte sinalizada para registro do Mestre. Nenhuma consequência adicional foi executada.');
      else if (resultado.transformacaoPendente) setMensagem('Três falhas: retorno como Zumbi Especial pendente para o próximo turno.');
      else if (resultado.pvAoDespertar !== null) setMensagem(`Três sucessos: personagem desperta com ${resultado.pvAoDespertar} PV.`);
      else if (resultado.reanimacao.estado === 'desacordada_ate_reducao_bi') setMensagem('Três sucessos: permanece Desacordada até a BI ficar abaixo do máximo.');
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

  async function registrarMedicina(sucesso: boolean) {
    if (!reanimacao) return;
    try { await persistir(concederAjudaMedicina(reanimacao, sucesso)); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível registrar o Teste de Medicina.'); }
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

  if (!reanimacao && !podeIniciarPV && !podeIniciarColapso) return null;

  return <details className="ficha-local-editor reanimacao-ficha" open={!!reanimacao}>
    <summary>Reanimação e estados críticos</summary>
    <p>Os dados são informados manualmente. A ficha não rola dados, não avança turnos e não executa morte ou transformação automaticamente.</p>
    {bloqueado && <p role="status">Salve ou descarte outras alterações pendentes da ficha antes de alterar a Reanimação.</p>}
    {!reanimacao && <>
      {podeIniciarPV && <button type="button" className="acao" disabled={ocupado || bloqueado} onClick={() => void iniciar('pv_zero')}>Iniciar Reanimação por 0 PV <span>→</span></button>}
      {podeIniciarColapso && <button type="button" className="acao" disabled={ocupado || bloqueado} onClick={() => void iniciar('colapso_bi')}>Iniciar Colapso Viral <span>→</span></button>}
      {podeIniciarPV && podeIniciarColapso && <p>As duas condições estão presentes. Selecione a causa que corresponde ao evento aplicado pelo Mestre; a ficha não escolhe uma delas automaticamente.</p>}
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
      {reanimacao.estado === 'aguardando_proximo_turno' && <button type="button" className="acao" disabled={ocupado || bloqueado} onClick={() => void iniciarProximoTurno()}>Iniciar Testes no próximo turno <span>→</span></button>}
      {estadoAtivo && <>
        {reanimacao.causa === 'pv_zero' && <>
          <h4>Primeiros Socorros · Medicina DT 15</h4>
          <p>Registre o resultado final do Teste, já considerando Treinamento e modificadores. Sucesso concede Vantagem ao próximo Teste de Reanimação.</p>
          {bloqueioVirtual && <p>O método está em Virtual, mas a rolagem virtual ainda não está implementada; não registre resultado de Medicina por este painel.</p>}
          <div className="recursos-controles">
            <button type="button" disabled={ocupado || bloqueado || bloqueioVirtual} onClick={() => void registrarMedicina(true)}>Registrar sucesso</button>
            <button type="button" disabled={ocupado || bloqueado || bloqueioVirtual} onClick={() => void registrarMedicina(false)}>Registrar falha</button>
          </div>
          <label>Cura recebida enquanto estava em 0 PV
            <input type="number" min="0" step="1" value={cura} disabled={ocupado || bloqueado} onChange={e => setCura(e.target.value)}/>
          </label>
          <button type="button" className="botao-claro" disabled={ocupado || bloqueado} onClick={() => void registrarCura()}>Acumular cura sem despertar</button>
        </>}
        {bloqueioVirtual
          ? <p>O método de dados está em Virtual, mas a rolagem virtual ainda não está implementada. Nenhum resultado será presumido.</p>
          : <>
            <h4>Teste de Reanimação · 1d20 contra DT 12</h4>
            {vantagem && <p>Vantagem ativa: informe dois resultados de d20; será considerado o melhor.</p>}
            <div className="recursos-controles">
              <label>Resultado do d20<input type="number" min="1" max="20" step="1" value={primeiroDado} disabled={ocupado || bloqueado} onChange={e => setPrimeiroDado(e.target.value)}/></label>
              {vantagem && <label>Segundo d20<input type="number" min="1" max="20" step="1" value={segundoDado} disabled={ocupado || bloqueado} onChange={e => setSegundoDado(e.target.value)}/></label>}
            </div>
            <button type="button" className="acao" disabled={ocupado || bloqueado || !resultadoValido} onClick={() => void registrarTeste()}>Registrar resultado do Teste <span>→</span></button>
          </>}
      </>}
      {reanimacao.estado === 'desacordada_ate_reducao_bi' && <button type="button" className="acao" disabled={ocupado || bloqueado || recursos.biAtual >= biMaximo} onClick={() => void encerrarColapso()}>Confirmar BI abaixo do máximo e encerrar <span>→</span></button>}
      {reanimacao.estado === 'morte_a_registrar' && <p>A regra sinaliza morte após três falhas. O registro e as consequências de campanha permanecem sob responsabilidade do Mestre.</p>}
      {reanimacao.estado === 'transformacao_no_proximo_turno' && <p>A regra determina o retorno como Zumbi Especial no próximo turno. A ficha não altera o controle da personagem nem aplica a transformação automaticamente.</p>}
    </>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
