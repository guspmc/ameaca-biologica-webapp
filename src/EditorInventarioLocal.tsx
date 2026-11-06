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
  const opcoes = opcoesEquipamento(classe);
  const valor: Dados = {
    equipamentoInicial: kit,
    comprasIniciais: kit === 'C' ? plano : {},
    revisaoCompras: kit === 'C' ? revisao : 0,
  };
  const autosave = useAutoSaveLocal({
    valor,
    chave: JSON.stringify({ kit, plano, revisao }),
    sujo,
    aoSalvar,
    aoConfirmar: () => { setSujo(false); aoAlterarPendencia(false); },
  });
  const ocupado = autosave.estado === 'sincronizando';

  function marcarAlteracao() {
    setSujo(true);
    aoAlterarPendencia(true);
  }

  function alterarPlano(proximo: Record<string, number>) {
    setPlano(proximo);
    setRevisao(atual => atual + 1);
    marcarAlteracao();
  }

  function alterarKit(proximo: string) {
    if (kit === 'C' && proximo !== 'C' && Object.values(plano).some(quantidade => quantidade > 0) &&
        !window.confirm('O plano de compras personalizado será removido do rascunho. Deseja trocar o conjunto?')) return;
    if (proximo !== 'C') {
      setPlano({});
      setRevisao(0);
    }
    setKit(proximo);
    marcarAlteracao();
  }

  return <div className="ficha-local-editor">
    <h3>Editar Inventário inicial</h3>
    <p>Esta etapa altera somente o planejamento da criação. Não equipa, consome, transfere nem modifica um inventário ativo. As escolhas são salvas automaticamente no rascunho.</p>
    <label>Conjunto inicial<select value={kit} disabled={ocupado} onChange={e => alterarKit(e.target.value)}>
      <option value="">Selecione um conjunto</option>{opcoes.map(item => <option key={item.id} value={item.id}>{item.id} · {item.nome}</option>)}
    </select></label>
    {kit === 'C' && <PreviaCompras capacidade={capacidade} plano={plano} revisao={revisao} aoAlterarPlano={alterarPlano} />}
    {kit !== 'C' && <p>O conjunto A ou B usa os itens previstos no livro. Ao confirmar a escolha no servidor, o plano de compras personalizado anterior será removido do rascunho.</p>}
    <AutoSaveStatusLocal estado={autosave.estado} erro={autosave.erro} mensagemSucesso={mensagemSucesso ?? 'Planejamento do inventário salvo e confirmado pelo servidor.'} aoTentarNovamente={autosave.tentarNovamente} />
  </div>;
}
