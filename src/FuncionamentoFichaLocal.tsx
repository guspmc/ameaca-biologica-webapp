import { useState } from 'react';
import { AUTOMACOES, automacoesEfetivas, configuracaoInicial, type ConfiguracaoFuncionamento, type ModoFuncionamento } from './funcionamentoFicha';

type Props = {
  inicial?: ConfiguracaoFuncionamento;
  aoSalvar: (configuracao: ConfiguracaoFuncionamento) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
};

function copiar(config: ConfiguracaoFuncionamento): ConfiguracaoFuncionamento {
  return { modo: config.modo, preferenciasMisto: { ...config.preferenciasMisto } };
}

export default function FuncionamentoFichaLocal({ inicial, aoSalvar, aoAlterarPendencia }: Props) {
  const [config, setConfig] = useState(() => copiar(inicial ?? configuracaoInicial()));
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const efetivas = automacoesEfetivas(config);

  function atualizar(proxima: ConfiguracaoFuncionamento) {
    setConfig(proxima);
    aoAlterarPendencia(true);
    setMensagem('');
    setErro('');
  }

  async function salvar() {
    if (ocupado) return;
    setOcupado(true);
    setMensagem('');
    setErro('');
    try {
      const confirmado = await aoSalvar(copiar(config));
      if (!confirmado) throw new Error('O armazenamento não confirmou a gravação.');
      aoAlterarPendencia(false);
      setMensagem('Preferências salvas e confirmadas.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível salvar as preferências.');
    } finally {
      setOcupado(false);
    }
  }

  return <div className="ficha-local-editor">
    <h3>Funcionamento da ficha</h3>
    <p>Defina como os controles elegíveis deverão operar. Esta configuração não executa ações, rolagens ou alterações de recursos por conta própria.</p>
    <label>Modo de funcionamento
      <select value={config.modo} disabled={ocupado} onChange={evento => atualizar({ ...config, modo: evento.target.value as ModoFuncionamento })}>
        <option value="automatico">Automático</option>
        <option value="misto">Misto</option>
        <option value="manual">Manual</option>
      </select>
    </label>
    <p>Automático habilita as automações elegíveis; Manual deixa os registros sob controle do jogador; Misto permite escolher cada automação separadamente.</p>
    <strong>Preferências do modo Misto</strong>
    <div className="funcionamento-opcoes">
      {AUTOMACOES.map(automacao => <label key={automacao.id}>
        {automacao.nome}
        <select
          value={config.preferenciasMisto[automacao.id] === null ? 'definir' : String(config.preferenciasMisto[automacao.id])}
          disabled={ocupado || config.modo !== 'misto'}
          onChange={evento => atualizar({
            ...config,
            preferenciasMisto: {
              ...config.preferenciasMisto,
              [automacao.id]: evento.target.value === 'definir' ? null : evento.target.value === 'true',
            },
          })}
        >
          {automacao.padrao === null && <option value="definir">A definir</option>}
          <option value="true">Habilitado</option>
          <option value="false">Desabilitado</option>
        </select>
        <small>{automacao.detalhe}</small>
      </label>)}
    </div>
    <div role="status">
      <strong>Resultado do modo atual</strong>
      <ul>{AUTOMACOES.map(automacao => <li key={automacao.id}>{automacao.nome}: {efetivas[automacao.id] === null ? 'A definir' : efetivas[automacao.id] ? 'Habilitado' : 'Desabilitado'}</li>)}</ul>
    </div>
    <p className="ficha-local-legenda">As escolhas específicas do Misto são preservadas ao alternar para Automático ou Manual. A mudança de modo afeta somente operações futuras quando os respectivos módulos estiverem implementados.</p>
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {mensagem && <p className="offline-status" role="status">{mensagem}</p>}
    <button type="button" className="acao" disabled={ocupado} onClick={() => void salvar()}>{ocupado ? 'Salvando…' : 'Salvar funcionamento'} <span>→</span></button>
  </div>;
}
