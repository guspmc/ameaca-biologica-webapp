import { useState } from 'react';
import { opcoesEquipamento } from './equipamento';
import PreviaCompras from './PreviaCompras';
import AutoSaveStatusLocal from './AutoSaveStatusLocal';
import { useAutoSaveLocal } from './useAutoSaveLocal';

type Dados = { equipamentoInicial: string; comprasIniciais: Record<string, number>; revisaoCompras: number };
type Props = {
  classe: string;
  capacidade: number;
  kitInicial: string;
  comprasIniciais: Record<string, number>;
  revisaoCompras: number;
  aoSalvar: (dados: Dados) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  mensagemSucesso?: string;
};

export default function EditorInventarioLocal({ classe, capacidade, kitInicial, comprasIniciais, revisaoCompras, aoSalvar, aoAlterarPendencia, mensagemSucesso }: Props) {
  const [kit, setKit] = useState(kitInicial);
  const [plano, setPlano] = useState(comprasIniciais);
  const [revisao, setRevisao] = useState(revisaoCompras);
  const [sujo, setSujo] = useState(false);
  const [planoAplicado, setPlanoAplicado] = useState(false);
  const opcoes = opcoesEquipamento(classe);
  const valor: Dados = {
    equipamentoInicial: kit,
    comprasIniciais: kit === 'C' ? plano : {},
    revisaoCompras: kit === 'C' ? revisao : 0,
  };
  const autosave = useAutoSaveLocal({
    valor,
    chave: JSON.stringify({ kit, plano, revisao, planoAplicado }),
    sujo,
    aoSalvar,
    validar: atual => {
      if (!opcoes.some(item => item.id === atual.equipamentoInicial)) return 'Selecione um conjunto inicial válido.';
      if (atual.equipamentoInicial === 'C' && !planoAplicado) return 'Aplique primeiro um plano válido de compras para o conjunto Personalizado.';
      return null;
    },
    aoConfirmar: () => { setSujo(false); aoAlterarPendencia(false); },
  });
  const ocupado = autosave.estado === 'sincronizando';

  function marcarAlteracao() {
    setSujo(true);
    aoAlterarPendencia(true);
  }

  return <div className="ficha-local-editor">
    <h3>Editar Inventário inicial</h3>
    <p>Esta etapa altera somente o planejamento da criação. Não equipa, consome, transfere nem modifica um inventário ativo. A escolha é salva automaticamente após confirmação do plano válido.</p>
    <label>Conjunto inicial<select value={kit} disabled={ocupado} onChange={e => { setKit(e.target.value); marcarAlteracao(); }}>
      <option value="">Selecione um conjunto</option>{opcoes.map(item => <option key={item.id} value={item.id}>{item.id} · {item.nome}</option>)}
    </select></label>
    {kit === 'C' ? <PreviaCompras
      key={kitInicial + ':' + revisaoCompras}
      capacidade={capacidade}
      planoSalvo={plano}
      revisaoSalva={revisao}
      aoAlterarPendencia={pendente => { if (pendente) { setPlanoAplicado(false); marcarAlteracao(); } }}
      aoSalvar={async proximo => {
        setPlano(proximo);
        const nova = revisao + 1;
        setRevisao(nova);
        setPlanoAplicado(true);
        marcarAlteracao();
        return nova;
      }}
    /> : <p>O conjunto A ou B usa os itens previstos no livro. Ao confirmar a escolha no servidor, o plano de compras personalizado anterior será removido do rascunho.</p>}
    <AutoSaveStatusLocal estado={autosave.estado} erro={autosave.erro} mensagemSucesso={mensagemSucesso ?? 'Planejamento do inventário salvo e confirmado pelo servidor.'} aoTentarNovamente={autosave.tentarNovamente} />
  </div>;
}
