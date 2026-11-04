import { useState } from 'react';
import { opcoesEquipamento } from './equipamento';
import PreviaCompras from './PreviaCompras';

type Props = {
  classe: string;
  capacidade: number;
  kitInicial: string;
  comprasIniciais: Record<string, number>;
  revisaoCompras: number;
  aoSalvar: (dados: { equipamentoInicial: string; comprasIniciais: Record<string, number>; revisaoCompras: number }) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  mensagemSucesso?: string;
};
export default function EditorInventarioLocal({ classe, capacidade, kitInicial, comprasIniciais, revisaoCompras, aoSalvar, aoAlterarPendencia, mensagemSucesso }: Props) {
  const [kit, setKit] = useState(kitInicial);
  const [plano, setPlano] = useState(comprasIniciais);
  const [revisao, setRevisao] = useState(revisaoCompras);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [planoAplicado, setPlanoAplicado] = useState(false);
  const opcoes = opcoesEquipamento(classe);
  async function salvar() {
    if (!opcoes.some(item => item.id === kit)) { setMensagem('Selecione um conjunto inicial válido.'); return; }
    if (kit === 'C' && !planoAplicado) { setMensagem('Aplique primeiro um plano válido de compras para o conjunto Personalizado.'); return; }
    setOcupado(true); setMensagem('');
    try {
      const ok = await aoSalvar({ equipamentoInicial: kit, comprasIniciais: kit === 'C' ? plano : {}, revisaoCompras: kit === 'C' ? revisao : 0 });
      if (ok) aoAlterarPendencia(false);
      setMensagem(ok ? (mensagemSucesso ?? 'Planejamento do inventário gravado no rascunho local.') : 'Não foi possível gravar. Confira o aviso do laboratório.');
    } finally { setOcupado(false); }
  }
  return <div className="ficha-local-editor">
    <h3>Editar Inventário inicial</h3>
    <p>Esta etapa altera somente o planejamento da criação. Não equipa, consome, transfere nem modifica um inventário ativo.</p>
    <label>Conjunto inicial<select value={kit} disabled={ocupado} onChange={e => { setKit(e.target.value); aoAlterarPendencia(true); setMensagem(''); }}>
      <option value="">Selecione um conjunto</option>{opcoes.map(item => <option key={item.id} value={item.id}>{item.id} · {item.nome}</option>)}
    </select></label>
    {kit === 'C' ? <PreviaCompras key={kitInicial + ':' + revisaoCompras} capacidade={capacidade} planoSalvo={plano} revisaoSalva={revisao} aoAlterarPendencia={aoAlterarPendencia} aoSalvar={async proximo => { setPlano(proximo); const nova = revisao + 1; setRevisao(nova); setPlanoAplicado(true); return nova; }} /> : <p>O conjunto A ou B usa os itens previstos no livro. Ao salvar essa escolha, o plano de compras personalizado anterior será descartado do rascunho.</p>}
    {mensagem && <p role="status">{mensagem}</p>}
    <button type="button" className="acao" onClick={salvar} disabled={ocupado}>Salvar planejamento <span>→</span></button>
  </div>;
}
