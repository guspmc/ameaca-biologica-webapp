import { useState } from 'react';
import { AUTOMACOES, automacoesEfetivas, normalizarConfiguracaoFuncionamento, type ConfiguracaoFuncionamento, type ConfiguracaoFuncionamentoCompleta, type ModoFuncionamento, type ModoDados, type VisibilidadeRolagem } from './funcionamentoFicha';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useSalvamentoEditorLocal } from './useSalvamentoEditorLocal';

type Props = {
  inicial?: ConfiguracaoFuncionamento;
  aoSalvar: (configuracao: ConfiguracaoFuncionamentoCompleta) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  autoSalvar?: boolean;
  origemDados?: 'local' | 'servidor';
};

export default function FuncionamentoFichaLocal({ inicial, aoSalvar, aoAlterarPendencia, autoSalvar = false, origemDados = 'local' }: Props) {
  const [config, setConfig] = useState(() => normalizarConfiguracaoFuncionamento(inicial));
  const [sujo, setSujo] = useState(false);
  const valor = normalizarConfiguracaoFuncionamento(config);
  const salvamento = useSalvamentoEditorLocal({
    autoSalvar, valor, chave: JSON.stringify(config), sujo, setSujo, aoSalvar, aoAlterarPendencia,
    mensagemSucesso: origemDados === 'servidor' ? 'Preferências confirmadas pelo servidor.' : 'Preferências salvas neste dispositivo.',
  });
  const ocupado = salvamento.ocupado;
  const efetivas = automacoesEfetivas(config);

  function atualizar(proxima: ConfiguracaoFuncionamentoCompleta) {
    setConfig(proxima);
    setSujo(true);
    aoAlterarPendencia(true);
  }

  return <div className="ficha-local-editor">
    <h3>Funcionamento da ficha</h3>
    <p>Defina como os controles elegíveis deverão operar. Cada preferência é salva automaticamente após uma breve pausa. Esta configuração não executa ações, rolagens ou alterações de recursos por conta própria.</p>
    <h4>Dados e histórico</h4>
    <label>Método de dados
      <select value={config.modoDados} disabled={ocupado} onChange={evento => atualizar({ ...config, modoDados: evento.target.value as ModoDados })}>
        <option value="fisicos">Físicos</option>
        <option value="virtuais">Virtuais</option>
        <option value="mistos">Mistos</option>
      </select>
    </label>
    <label>Visibilidade padrão das rolagens
      <select value={config.visibilidadeRolagem} disabled={ocupado} onChange={evento => atualizar({ ...config, visibilidadeRolagem: evento.target.value as VisibilidadeRolagem })}>
        <option value="publica">Pública</option>
        <option value="privada">Privada</option>
      </select>
    </label>
    <p>Preferências individuais, salvas por personagem. Quando o histórico estiver disponível, rolagens privadas serão visíveis apenas ao autor; consequências seguem suas próprias permissões. Informar resultado de dado físico é opcional e não presume face natural quando só o total for conhecido.</p>
    <p>Essas opções ficam persistidas agora, mas a execução de dados virtuais, o registro/histórico e a aplicação da visibilidade ainda dependem do módulo de rolagens.</p>
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
    {autoSalvar
      ? <AutoSaveStatusLocal estado={salvamento.autosave.estado} erro={salvamento.autosave.erro} mensagemSucesso={origemDados === 'servidor' ? 'Preferências confirmadas pelo servidor.' : 'Preferências salvas neste dispositivo.'} aoTentarNovamente={salvamento.autosave.tentarNovamente} />
      : <>
          {salvamento.erroManual && <p className="offline-erro" role="alert">{salvamento.erroManual}</p>}
          {salvamento.sucessoManual && <p className="offline-status" role="status">{salvamento.sucessoManual}</p>}
          {sujo && <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void salvamento.salvarManual()}>Salvar preferências</button>}
        </>}
  </div>;
}
