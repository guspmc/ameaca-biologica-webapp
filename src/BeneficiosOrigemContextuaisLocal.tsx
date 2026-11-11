import { useState } from 'react';
import {
  beneficioAmnesicoInicial, beneficioAmnesicoValido, renovarSessaoAmnesico,
  registrarVislumbresDoPassado, consumirVantagemAmnesico,
  beneficioMilitarInicial, beneficioMilitarValido, registrarMorteComArmaDeFogo,
  consumirVantagemMilitar,
} from './beneficiosOrigensContextuais';

type Props = {
  dados: Record<string, unknown>;
  origem: string;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

export default function BeneficiosOrigemContextuaisLocal({ dados, origem, aoSalvar }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [localConhecido, setLocalConhecido] = useState(false);
  const [tentativaRealizada, setTentativaRealizada] = useState(false);
  const [informacaoUtil, setInformacaoUtil] = useState(false);
  const [inimigoMorto, setInimigoMorto] = useState(false);
  const [armaDeFogo, setArmaDeFogo] = useState(false);
  const [primeiroAtaqueDoProximoTurno, setPrimeiroAtaqueDoProximoTurno] = useState(false);
  const amnesico = dados.beneficioAmnesico ?? beneficioAmnesicoInicial();
  const militar = dados.beneficioMilitar ?? beneficioMilitarInicial();
  const amnesicoValido = beneficioAmnesicoValido(amnesico);
  const militarValido = beneficioMilitarValido(militar);

  async function salvar(patch: Record<string, unknown>, sucesso: string): Promise<boolean> {
    if (ocupado) return false;
    setOcupado(true); setErro(''); setMensagem('');
    try {
      if (!await aoSalvar(patch)) throw new Error('O armazenamento não confirmou o benefício.');
      setMensagem(sucesso);
      return true;
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível salvar o benefício.');
      return false;
    } finally { setOcupado(false); }
  }

  async function registrarVislumbres() {
    try {
      const atualizado = registrarVislumbresDoPassado(amnesico as ReturnType<typeof beneficioAmnesicoInicial>, {
        localConhecido, tentativaRealizada, informacaoUtil,
      });
      const salvo = await salvar({ beneficioAmnesico: atualizado }, atualizado.vantagemSobrevivenciaPendente
        ? 'Vislumbres registrados. Vantagem pendente no próximo Teste de Sobrevivência relacionado.'
        : 'Tentativa de Vislumbres registrada nesta sessão.');
      if (salvo) { setLocalConhecido(false); setTentativaRealizada(false); setInformacaoUtil(false); }
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível registrar Vislumbres do Passado.');
    }
  }

  async function novaSessao() {
    if (!window.confirm('Confirmar o início de uma nova sessão? Isso renova apenas o uso de Vislumbres do Passado; uma Vantagem pendente será preservada.')) return;
    try {
      const atualizado = renovarSessaoAmnesico(amnesico as ReturnType<typeof beneficioAmnesicoInicial>);
      await salvar({ beneficioAmnesico: atualizado }, 'Nova sessão registrada; Vislumbres do Passado disponível novamente.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível renovar a sessão.');
    }
  }

  async function consumirVislumbres() {
    try {
      const atualizado = consumirVantagemAmnesico(amnesico as ReturnType<typeof beneficioAmnesicoInicial>);
      await salvar({ beneficioAmnesico: atualizado }, 'Vantagem de Vislumbres do Passado marcada como consumida.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível consumir a Vantagem.');
    }
  }

  async function registrarMilitar() {
    try {
      const atualizado = registrarMorteComArmaDeFogo(militar as ReturnType<typeof beneficioMilitarInicial>, { inimigoMorto, armaDeFogo });
      const salvo = await salvar({ beneficioMilitar: atualizado }, 'Benefício Militar registrado: Vantagem pendente no primeiro Ataque com arma de fogo do próximo turno.');
      if (salvo) { setInimigoMorto(false); setArmaDeFogo(false); }
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível registrar o benefício Militar.');
    }
  }

  async function consumirMilitar() {
    try {
      const atualizado = consumirVantagemMilitar(militar as ReturnType<typeof beneficioMilitarInicial>, primeiroAtaqueDoProximoTurno);
      await salvar({ beneficioMilitar: atualizado }, 'Vantagem do benefício Militar marcada como consumida.');
      setPrimeiroAtaqueDoProximoTurno(false);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível consumir a Vantagem Militar.');
    }
  }

  if (origem !== 'Amnésico' && origem !== 'Militar') return null;

  return <details className="ficha-local-editor beneficios-origem-contextuais">
    <summary>Benefícios contextuais da Origem</summary>
    {origem === 'Amnésico' && <>
      <h4>Vislumbres do Passado · 1 vez por sessão</h4>
      <p>Em local conhecido antes da amnésia, resolva AST DT 10 conforme o modo de funcionamento da Ficha. Registre a tentativa depois de resolvê-la; informação útil concede Vantagem no próximo Teste relacionado de Sobrevivência. O WebApp não rola o Teste nem administra sessões automaticamente.</p>
      {!amnesicoValido
        ? <p className="offline-erro" role="alert">O registro de Vislumbres está inválido; o benefício permanece bloqueado até revisão.</p>
        : <>
            <p>{amnesico.usadoNaSessao ? 'Uso já registrado nesta sessão.' : 'Uso disponível nesta sessão.'}</p>
            <label><input type="checkbox" checked={localConhecido} disabled={ocupado || amnesico.usadoNaSessao} onChange={evento => setLocalConhecido(evento.target.checked)} /> Confirmo que o local era conhecido antes da amnésia.</label>
            <label><input type="checkbox" checked={tentativaRealizada} disabled={ocupado || amnesico.usadoNaSessao} onChange={evento => { setTentativaRealizada(evento.target.checked); if (!evento.target.checked) setInformacaoUtil(false); }} /> Confirmo que resolvi o Teste AST DT 10.</label>
            <label><input type="checkbox" checked={informacaoUtil} disabled={ocupado || amnesico.usadoNaSessao || !tentativaRealizada} onChange={evento => setInformacaoUtil(evento.target.checked)} /> A informação obtida foi útil.</label>
            <button type="button" className="acao" disabled={ocupado || amnesico.usadoNaSessao || !localConhecido || !tentativaRealizada} onClick={() => void registrarVislumbres()}>Registrar uso de Vislumbres do Passado</button>
            <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void novaSessao()}>Registrar início de nova sessão</button>
            {amnesico.vantagemSobrevivenciaPendente && <>
              <p className="ficha-local-aviso">Vantagem pendente no próximo Teste relacionado de Sobrevivência. Aplique-a manualmente no modo Misto/Manual ou selecione Vantagem no rolador Automático.</p>
              <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void consumirVislumbres()}>Marcar Vantagem como consumida após o Teste</button>
            </>}
          </>}
    </>}
    {origem === 'Militar' && <>
      <h4>Resposta disciplinada · benefício após abate com arma de fogo</h4>
      <p>Após matar um inimigo com arma de fogo, recebe Vantagem no primeiro Ataque com arma de fogo no próximo turno. Confirme o evento com a Mesa e aplique Vantagem manualmente; a Ficha não verifica a morte nem administra o turno.</p>
      {!militarValido
        ? <p className="offline-erro" role="alert">O registro do benefício Militar está inválido; nenhum estado será alterado.</p>
        : <>
            <p>{militar.vantagemAtaqueFogoPendente ? 'Vantagem pendente no primeiro Ataque com arma de fogo do próximo turno.' : 'Nenhuma Vantagem Militar pendente.'}</p>
            <label><input type="checkbox" checked={inimigoMorto} disabled={ocupado || militar.vantagemAtaqueFogoPendente} onChange={evento => setInimigoMorto(evento.target.checked)} /> Confirmo que um inimigo morreu.</label>
            <label><input type="checkbox" checked={armaDeFogo} disabled={ocupado || militar.vantagemAtaqueFogoPendente} onChange={evento => setArmaDeFogo(evento.target.checked)} /> Confirmo que a morte foi causada por um Ataque com arma de fogo.</label>
            <button type="button" className="acao" disabled={ocupado || militar.vantagemAtaqueFogoPendente || !inimigoMorto || !armaDeFogo} onClick={() => void registrarMilitar()}>Registrar benefício Militar</button>
            {militar.vantagemAtaqueFogoPendente && <>
              <label><input type="checkbox" checked={primeiroAtaqueDoProximoTurno} disabled={ocupado} onChange={evento => setPrimeiroAtaqueDoProximoTurno(evento.target.checked)} /> Confirmo que este foi o primeiro Ataque com arma de fogo do próximo turno.</label>
              <button type="button" className="botao-claro" disabled={ocupado || !primeiroAtaqueDoProximoTurno} onClick={() => void consumirMilitar()}>Marcar Vantagem como consumida</button>
            </>}
          </>}
    </>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
  </details>;
}
