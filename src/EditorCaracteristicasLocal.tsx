import { useState } from 'react';
import { ORIGENS } from './origens';
import { ARMAS_OPERARIO } from './armaOperario';
import { HABILIDADES_BASICAS } from './habilidades';
import { opcoesEquipamento } from './equipamento';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useAutoSaveLocal } from './useAutoSaveLocal';

type Dados = { classe: string; origem: string; armaOperario: string; habilidadeBasica: string; equipamentoInicial: string };
type Props = { iniciais: Dados; aoSalvar: (dados: Dados) => Promise<boolean>; aoAlterarPendencia: (pendente: boolean) => void; mensagemSucesso?: string };

export default function EditorCaracteristicasLocal({ iniciais, aoSalvar, aoAlterarPendencia, mensagemSucesso }: Props) {
  const [dados, setDados] = useState(iniciais);
  const [sujo, setSujo] = useState(false);
  const habilidades = HABILIDADES_BASICAS.filter(item => item.classe === dados.classe);
  const kits = opcoesEquipamento(dados.classe);
  const autosave = useAutoSaveLocal({
    valor: dados,
    chave: JSON.stringify(dados),
    sujo,
    aoSalvar,
    validar: atual => {
      const habilidadesAtuais = HABILIDADES_BASICAS.filter(item => item.classe === atual.classe);
      const kitsAtuais = opcoesEquipamento(atual.classe);
      if (!ORIGENS.some(item => item.nome === atual.origem) ||
          !habilidadesAtuais.some(item => item.id === atual.habilidadeBasica) ||
          !kitsAtuais.some(item => item.id === atual.equipamentoInicial) ||
          (atual.origem === 'Operário' && !ARMAS_OPERARIO.includes(atual.armaOperario as never))) {
        return 'Preencha Origem, Habilidade Básica, conjunto inicial e, para Operário, a arma obrigatória.';
      }
      return null;
    },
    aoConfirmar: () => { setSujo(false); aoAlterarPendencia(false); },
  });
  const ocupado = autosave.estado === 'sincronizando';

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
    <label>Equipamento Inicial<select value={dados.equipamentoInicial} disabled={ocupado} onChange={e => alterar({ ...dados, equipamentoInicial: e.target.value })}>
      <option value="">Selecione um conjunto</option>{dados.equipamentoInicial && !kits.some(item => item.id === dados.equipamentoInicial) && <option value={dados.equipamentoInicial}>{dados.equipamentoInicial} · incompatível com a Classe</option>}{kits.map(item => <option key={item.id} value={item.id}>{item.id} · {item.nome}</option>)}
    </select></label>
    <AutoSaveStatusLocal estado={autosave.estado} erro={autosave.erro} mensagemSucesso={mensagemSucesso ?? 'Características salvas e confirmadas pelo servidor.'} aoTentarNovamente={autosave.tentarNovamente} />
  </div>;
}
