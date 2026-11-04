import { useState } from 'react';
import { ORIGENS } from './origens';
import { ARMAS_OPERARIO } from './armaOperario';
import { HABILIDADES_BASICAS } from './habilidades';
import { opcoesEquipamento } from './equipamento';

type Dados = { classe: string; origem: string; armaOperario: string; habilidadeBasica: string; equipamentoInicial: string };
type Props = { iniciais: Dados; aoSalvar: (dados: Dados) => Promise<boolean>; aoAlterarPendencia: (pendente: boolean) => void; mensagemSucesso?: string };

export default function EditorCaracteristicasLocal({ iniciais, aoSalvar, aoAlterarPendencia, mensagemSucesso }: Props) {
  const [dados, setDados] = useState(iniciais);
  const [mensagem, setMensagem] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const habilidades = HABILIDADES_BASICAS.filter(item => item.classe === dados.classe);
  const kits = opcoesEquipamento(dados.classe);
  async function salvar() {
    if (!ORIGENS.some(item => item.nome === dados.origem) || !habilidades.some(item => item.id === dados.habilidadeBasica) || !kits.some(item => item.id === dados.equipamentoInicial) ||
      (dados.origem === 'Operário' && !ARMAS_OPERARIO.includes(dados.armaOperario as never))) {
      setMensagem('Preencha Origem, Habilidade Básica, conjunto inicial e, para Operário, a arma obrigatória.');
      return;
    }
    setOcupado(true); setMensagem('');
    try {
      const ok = await aoSalvar({ ...dados });
      if (ok) aoAlterarPendencia(false);
      setMensagem(ok ? (mensagemSucesso ?? 'Características gravadas no rascunho local.') : 'Não foi possível gravar. Confira o aviso do laboratório.');
    } finally { setOcupado(false); }
  }
  return <div className="ficha-local-editor">
    <h3>Editar Características</h3>
    <p>Alterar Classe ou Origem pode tornar Perícias, Habilidade ou Equipamento incompatíveis. As escolhas anteriores são preservadas; revise os avisos e corrija incompatibilidades antes de considerar a criação conferida.</p>
    <label>Classe<select value={dados.classe} disabled={ocupado} onChange={e => { setDados(atual => ({ ...atual, classe: e.target.value })); aoAlterarPendencia(true); }}>
      <option>Agente</option><option>Autodidata</option><option>Operador</option>
    </select></label>
    <label>Origem<select value={dados.origem} disabled={ocupado} onChange={e => { setDados(atual => ({ ...atual, origem: e.target.value })); aoAlterarPendencia(true); }}>
      <option value="">Selecione uma Origem</option>{ORIGENS.map(item => <option key={item.nome} value={item.nome}>{item.nome}</option>)}
    </select></label>
    {dados.origem === 'Operário' && <label>Arma escolhida<select value={dados.armaOperario} disabled={ocupado} onChange={e => { setDados(atual => ({ ...atual, armaOperario: e.target.value })); aoAlterarPendencia(true); }}>
      <option value="">Selecione uma arma</option>{ARMAS_OPERARIO.map(item => <option key={item} value={item}>{item}</option>)}
    </select></label>}
    <label>Habilidade Básica<select value={dados.habilidadeBasica} disabled={ocupado} onChange={e => { setDados(atual => ({ ...atual, habilidadeBasica: e.target.value })); aoAlterarPendencia(true); }}>
      <option value="">Selecione uma Habilidade</option>{dados.habilidadeBasica && !habilidades.some(item => item.id === dados.habilidadeBasica) && <option value={dados.habilidadeBasica}>{HABILIDADES_BASICAS.find(item => item.id === dados.habilidadeBasica)?.nome ?? dados.habilidadeBasica} · incompatível com a Classe</option>}{habilidades.map(item => <option key={item.id} value={item.id}>{item.nome} · {item.ramo}</option>)}
    </select></label>
    <label>Equipamento Inicial<select value={dados.equipamentoInicial} disabled={ocupado} onChange={e => { setDados(atual => ({ ...atual, equipamentoInicial: e.target.value })); aoAlterarPendencia(true); }}>
      <option value="">Selecione um conjunto</option>{dados.equipamentoInicial && !kits.some(item => item.id === dados.equipamentoInicial) && <option value={dados.equipamentoInicial}>{dados.equipamentoInicial} · incompatível com a Classe</option>}{kits.map(item => <option key={item.id} value={item.id}>{item.id} · {item.nome}</option>)}
    </select></label>
    {mensagem && <p role="status">{mensagem}</p>}
    <button type="button" className="acao" onClick={salvar} disabled={ocupado}>Salvar características <span>→</span></button>
  </div>;
}
