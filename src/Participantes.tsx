import DisponibilidadeInicial from './DisponibilidadeInicial';
import {listarDisponibilidade,alterarDisponibilidade} from './servicoDisponibilidade';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type Mesa = { id: string; nome: string; mestre_id: string; criada_em: string };
type Membro = {
  mesa_id: string;
  usuario_id: string;
  papel: 'mestre' | 'jogador';
  apelido: string | null;
  entrou_em: string;
};

type Props = {
  supabase: SupabaseClient;
  permitirDisponibilidade?: boolean;
  usuarioId: string;
  mesas: Mesa[];
  sinalAtualizacao: number;
  aoAtualizarMesas: () => Promise<void>;
};

function dataCurta(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(valor));
}

export default function Participantes({
  supabase, usuarioId, mesas, sinalAtualizacao, aoAtualizarMesas, permitirDisponibilidade=false
}: Props) {
  const [idSelecionado, setIdSelecionado] = useState('');
  const [membros, setMembros] = useState<Membro[]>([]);
  const [nomeEditado, setNomeEditado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const mesa = useMemo(() =>
    mesas.find(m => m.id === idSelecionado) ?? mesas[0] ?? null
  , [mesas, idSelecionado]);
  const mesaId = mesa?.id ?? '';
  const souMestre = mesa?.mestre_id === usuarioId;
  const nomeExibido = mesa?.nome ?? '';

  const atualizar = useCallback(async () => {
    if (!mesaId) { setMembros([]); setCarregando(false); return; }
    setCarregando(true);
    const { data, error } = await supabase
      .from('mesa_participantes')
      .select('mesa_id, usuario_id, papel, apelido, entrou_em')
      .eq('mesa_id', mesaId)
      .order('entrou_em', { ascending: true });

    if (error) {
      setErro('Não foi possível carregar os participantes: ' + error.message);
    } else {
      setMembros((data ?? []) as Membro[]);
      setErro('');
    }
    setCarregando(false);
  }, [supabase, mesaId]);

  useEffect(() => { void atualizar(); }, [atualizar, sinalAtualizacao]);
  useEffect(() => { setNomeEditado(nomeExibido); }, [mesaId, nomeExibido]);

  async function renomear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!souMestre || !mesa) return;
    const novoNome = nomeEditado.trim();
    if (novoNome.length < 2 || novoNome.length > 80) {
      setErro('O nome precisa ter entre 2 e 80 caracteres.');
      return;
    }
    setProcessando(true); setErro(''); setMensagem('');
    const { error } = await supabase.from('mesas')
      .update({ nome: novoNome }).eq('id', mesa.id);
    if (error) setErro('Falha ao renomear: ' + error.message);
    else { setMensagem('Nome da Mesa atualizado.'); await aoAtualizarMesas(); }
    setProcessando(false);
  }

  async function remover(membro: Membro) {
    if (!mesa || !souMestre || membro.papel === 'mestre') return;
    const nome = membro.apelido || 'Participante';
    if (!window.confirm(
      'Remover ' + nome + ' da Mesa "' + mesa.nome + '"? O acesso será revogado. ' +
      'Os registros da campanha não serão apagados.'
    )) return;

    setProcessando(true); setErro(''); setMensagem('');
    const { error, count } = await supabase.from('mesa_participantes')
      .delete({ count: 'exact' })
      .eq('mesa_id', mesa.id)
      .eq('usuario_id', membro.usuario_id)
      .eq('papel', 'jogador');
    if (error) setErro('Não foi possível remover: ' + error.message);
    else if (count !== 1) setErro('Participante não encontrado. Atualize a lista.');
    else {
      setMensagem(nome + ' foi removido da Mesa.');
      await Promise.all([atualizar(), aoAtualizarMesas()]);
    }
    setProcessando(false);
  }

  return <section className="area-participantes" aria-labelledby="titulo-participantes">
    <div className="titulo-area">
      <span className="sobretitulo"><i /> GESTÃO DA CAMPANHA</span>
      <h2 id="titulo-participantes">Participantes da Mesa</h2>
      <p className="secundario">A lista é visível somente para os membros autorizados da campanha.</p>
    </div>
    {mesas.length === 0 ? <div className="cartao cartao-padrao">
      <p className="secundario">Crie uma Mesa ou solicite entrada para visualizar participantes.</p>
    </div> : <div className="grade-participantes">
      <section className="cartao cartao-padrao">
        <p className="rotulo">CAMPANHA SELECIONADA</p>
        <label className="seletor-mesa">Mesa
          <select value={mesaId} onChange={e => {setIdSelecionado(e.target.value);setErro('');setMensagem('');}}>
            {mesas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>
        <div className="resumo-mesa">
          <div><small>CRIADA EM</small><strong>{mesa ? dataCurta(mesa.criada_em) : '-'}</strong></div>
          <div><small>PARTICIPANTES</small><strong>{carregando ? '…' : membros.length}</strong></div>
          <div><small>SEU PAPEL</small><strong>{souMestre ? 'Mestre' : 'Jogador'}</strong></div>
        </div>
        {souMestre ? <form className="formulario" onSubmit={renomear}>
          <label>Renomear campanha
            <input type="text" minLength={2} maxLength={80} required
              value={nomeEditado} onChange={e => setNomeEditado(e.target.value)} />
          </label>
          <button className="botao-claro" type="submit" disabled={processando || nomeEditado.trim() === mesa?.nome}>
            Salvar nome
          </button>
        </form> : <p className="dica">Apenas o Mestre pode renomear a campanha e gerenciar os participantes.</p>}
      </section>
      <section className="cartao cartao-padrao">
        <div className="linha-titulo">
          <div><p className="rotulo">EQUIPE AUTORIZADA</p><h3>Quem está na Mesa</h3></div>
          <button type="button" className="botao-claro" onClick={() => {void atualizar();}}
            disabled={carregando}>Atualizar</button>
        </div>
        {carregando && membros.length === 0 ? <p className="secundario">Carregando participantes...</p> :
          membros.length === 0 ? <p className="secundario">Nenhum participante encontrado.</p> :
          <ul className="lista-participantes">{membros.map(m => <li className="linha-participante" key={m.usuario_id}>
            <span className={'selo-papel '+(m.papel === 'mestre' ? 'selo-mestre' : '')}>
              {m.papel === 'mestre' ? 'M' : 'J'}
            </span>
            <div className="pessoa">
              <strong>{m.papel === 'mestre' ? 'Mestre' : (m.apelido || 'Jogador')}</strong>
              <small>{m.papel === 'mestre' ? 'MESTRE' : 'JOGADOR'}
                {m.usuario_id === usuarioId ? ' · VOCÊ' : ''}
                {' · ENTROU EM ' + dataCurta(m.entrou_em)}</small>
            </div>
            {souMestre && m.papel === 'jogador' && <button type="button"
              className="botao-remover" disabled={processando} onClick={() => {void remover(m);}}>
              Remover
            </button>}
          </li>)}</ul>}
        <p className="aviso">Remover revoga o acesso do jogador, mas não apaga seus registros. E-mails e dados privados de outros participantes não são exibidos.</p>
      </section>
    </div>}
    {permitirDisponibilidade&&souMestre&&mesa&&<DisponibilidadeInicial key={mesa.id} mesaNome={mesa.nome} aoListar={()=>listarDisponibilidade(supabase,mesa.id)} aoAlterar={(item,liberado,esperado)=>alterarDisponibilidade(supabase,mesa.id,item,liberado,esperado)}/>}
    {erro && <p className="erro" role="alert">{erro}</p>}
    {mensagem && <p className="sucesso" role="status">{mensagem}</p>}
  </section>;
}
