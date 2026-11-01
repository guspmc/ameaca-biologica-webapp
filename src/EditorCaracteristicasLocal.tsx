import { useState } from 'react';
import { ORIGENS } from './origens';
import { ARMAS_OPERARIO } from './armaOperario';
import { HABILIDADES_BASICAS } from './habilidades';
import { opcoesEquipamento } from './equipamento';

type Dados = { classe: string; origem: string; armaOperario: string; habilidadeBasica: string; equipamentoInicial: string };
type Props = { iniciais: Dados; aoSalvar: (dados: Dados) => Promise<boolean> };

export default function EditorCaracteristicasLocal({ iniciais, aoSalvar }: Props) {
  const [dados, setDados] = useState(iniciais);
  const [mensagem, setMensagem] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const habilidades = HABILIDADES_BASICAS.filter(item => item.classe === dados.classe);
  const kits = opcoesEquipamento(dados.classe);
  async function salvar() {
    if (!dados.origem || !dados.habilidadeBasica || !dados.equipamentoInicial ||
      (dados.origem === 'Operário' && !ARMAS_OPERARIO.includes(dados.armaOperario as never))) {
      setMensagem('Preencha Origem, Habilidade Básica, conjunto inicial e, para Operário, a arma obrigatória.');
      return;
    }
    setOcupado(true); setMensagem('');
    try {
      const ok = await aoSalvar({ ...dados, armaOperario: dados.origem === 'Operário' ? dados.armaOperario : '' });
      setMensagem(ok ? 'Características gravadas no rascunho local.' : 'Não foi possível gravar. Confira o aviso do laboratório.');
    } finally { setOcupado(false); }
  }
  return <div className="ficha-local-editor">
    <h3>Editar Características</h3>
    <p>Alterar Classe ou Origem pode tornar Perícias, Habilidade ou Equipamento incompatíveis. O salvamento será recusado se alguma escolha existente deixar de ser válida; nada será apagado automaticamente.</p>
    <label>Classe<select value={dados.classe} disabled={ocupado} onChange={e => setDados(atual => ({ ...atual, classe: e.target.value, habilidadeBasica: '', equipamentoInicial: '' }))}>
      <option>Agente</option><option>Autodidata</option><option>Operador</option>
    </select></label>
    <label>Origem<select value={dados.origem} disabled={ocupado} onChange={e => setDados(atual => ({ ...atual, origem: e.target.value, armaOperario: '' }))}>
      <option value="">Selecione uma Origem</option>{ORIGENS.map(item => <option key={item.nome} value={item.nome}>{item.nome}</option>)}
    </select></label>
    {dados.origem === 'Operário' && <label>Arma escolhida<select value={dados.armaOperario} disabled={ocupado} onChange={e => setDados(atual => ({ ...atual, armaOperario: e.target.value }))}>
      <option value="">Selecione uma arma</option>{ARMAS_OPERARIO.map(item => <option key={item} value={item}>{item}</option>)}
    </select></label>}
    <label>Habilidade Básica<select value={dados.habilidadeBasica} disabled={ocupado} onChange={e => setDados(atual => ({ ...atual, habilidadeBasica: e.target.value }))}>
      <option value="">Selecione uma Habilidade</option>{habilidades.map(item => <option key={item.id} value={item.id}>{item.nome} · {item.ramo}</option>)}
    </select></label>
    <label>Equipamento Inicial<select value={dados.equipamentoInicial} disabled={ocupado} onChange={e => setDados(atual => ({ ...atual, equipamentoInicial: e.target.value }))}>
      <option value="">Selecione um conjunto</option>{kits.map(item => <option key={item.id} value={item.id}>{item.id} · {item.nome}</option>)}
    </select></label>
    {mensagem && <p role="status">{mensagem}</p>}
    <button type="button" className="acao" onClick={salvar} disabled={ocupado}>Salvar características <span>→</span></button>
  </div>;
}
