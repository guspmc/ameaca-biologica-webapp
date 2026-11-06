import { useState } from 'react';
import { ORIGENS } from './origens';
import { ARMAS_OPERARIO } from './armaOperario';
import { HABILIDADES_BASICAS } from './habilidades';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useSalvamentoEditorLocal } from './useSalvamentoEditorLocal';

type Dados = { classe: string; origem: string; armaOperario: string; habilidadeBasica: string };
type Props = { iniciais: Dados; aoSalvar: (dados: Dados) => Promise<boolean>; aoAlterarPendencia: (pendente: boolean) => void; mensagemSucesso?: string; autoSalvar?: boolean };

export default function EditorCaracteristicasLocal({ iniciais, aoSalvar, aoAlterarPendencia, mensagemSucesso, autoSalvar = false }: Props) {
  const [dados, setDados] = useState(iniciais);
  const [sujo, setSujo] = useState(false);
  const habilidades = HABILIDADES_BASICAS.filter(item => item.classe === dados.classe);
  const salvamento = useSalvamentoEditorLocal({
    autoSalvar, valor: dados, chave: JSON.stringify(dados), sujo, setSujo, aoSalvar, aoAlterarPendencia,
    mensagemSucesso: mensagemSucesso ?? 'Características salvas e confirmadas pelo servidor.',
  });
  const ocupado = salvamento.ocupado;

  function alterar(proxima: Dados) {
    setDados(proxima);
    setSujo(true);
    aoAlterarPendencia(true);
  }

  return <div className="ficha-local-editor">
    <h3>Editar Características</h3>
    <p>Alterações são salvas automaticamente após uma breve pausa. Classe ou Origem podem tornar Perícias, Habilidade ou Equipamento incompatíveis; corrija os avisos para concluir a sincronização.</p>
    <label>Classe<select value={dados.classe} disabled={ocupado} onChange={e => alterar({ ...dados, classe: e.target.value })}>
      <option>Agente</option><option>Autodidata</option><option>Operador</option>
    </select></label>
    <label>Origem<select value={dados.origem} disabled={ocupado} onChange={e => alterar({ ...dados, origem: e.target.value })}>
      <option value="">Selecione uma Origem</option>{ORIGENS.map(item => <option key={item.nome} value={item.nome}>{item.nome}</option>)}
    </select></label>
    {dados.origem === 'Operário' && <label>Arma escolhida<select value={dados.armaOperario} disabled={ocupado} onChange={e => alterar({ ...dados, armaOperario: e.target.value })}>
      <option value="">Selecione uma arma</option>{ARMAS_OPERARIO.map(item => <option key={item} value={item}>{item}</option>)}
    </select></label>}
    <label>Habilidade Básica<select value={dados.habilidadeBasica} disabled={ocupado} onChange={e => alterar({ ...dados, habilidadeBasica: e.target.value })}>
      <option value="">Selecione uma Habilidade</option>{dados.habilidadeBasica && !habilidades.some(item => item.id === dados.habilidadeBasica) && <option value={dados.habilidadeBasica}>{HABILIDADES_BASICAS.find(item => item.id === dados.habilidadeBasica)?.nome ?? dados.habilidadeBasica} · incompatível com a Classe</option>}{habilidades.map(item => <option key={item.id} value={item.id}>{item.nome} · {item.ramo}</option>)}
    </select></label>
    {autoSalvar
      ? <AutoSaveStatusLocal estado={salvamento.autosave.estado} erro={salvamento.autosave.erro} mensagemSucesso={mensagemSucesso ?? 'Características salvas e confirmadas pelo servidor.'} aoTentarNovamente={salvamento.autosave.tentarNovamente} />
      : <>
          {salvamento.erroManual && <p className="offline-erro" role="alert">{salvamento.erroManual}</p>}
          {salvamento.sucessoManual && <p className="offline-status" role="status">{salvamento.sucessoManual}</p>}
          {sujo && <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void salvamento.salvarManual()}>Salvar características</button>}
        </>}
  </div>;
}
