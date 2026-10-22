import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type Mesa = { id: string; nome: string; mestre_id: string };
type Pedido = {
  id: string;
  mesa_id: string;
  usuario_id: string;
  apelido: string;
  status: 'pendente' | 'aprovada' | 'recusada';
  criada_em: string;
};

export const CONVITE_LOCAL = 'ameaca-biologica:convite-pendente-v1';

type Props = {
  supabase: SupabaseClient;
  usuarioId: string;
  mesas: Mesa[];
  aoAtualizarMesas: () => Promise<void>;
};

export default function Convites({ supabase, usuarioId, mesas, aoAtualizarMesas }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [codigo, setCodigo] = useState(() => localStorage.getItem(CONVITE_LOCAL) || '');
  const [apelido, setApelido] = useState('');
  const [mesaSelecionada, setMesaSelecionada] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);

  const minhasMesas = useMemo(() => mesas.filter(mesa => mesa.mestre_id === usuarioId), [mesas, usuarioId]);
  const idSelecionado = minhasMesas.some(m => m.id === mesaSelecionada)
    ? mesaSelecionada : (minhasMesas[0]?.id ?? '');
  const idsMestre = useMemo(() => new Set(minhasMesas.map(m => m.id)), [minhasMesas]);
  const meusPedidos = pedidos.filter(p => p.usuario_id === usuarioId);
  const pendentes = pedidos.filter(p => p.status === 'pendente' && idsMestre.has(p.mesa_id));

  const atualizarPedidos = useCallback(async () => {
    const { data, error } = await supabase.from('solicitacoes_entrada')
      .select('id, mesa_id, usuario_id, apelido, status, criada_em')
      .order('criada_em', { ascending: false });
    if (error) setErro('Não foi possível consultar solicitações: ' + error.message);
    else setPedidos((data ?? []) as Pedido[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    void atualizarPedidos();
    const intervalo = window.setInterval(() => { void atualizarPedidos(); }, 20000);
    return () => window.clearInterval(intervalo);
  }, [atualizarPedidos]);

  function nomeMesa(id: string) {
    return mesas.find(m => m.id === id)?.nome ?? 'Mesa';
  }

  async function gerarCodigo() {
    if (!idSelecionado) return;
    if (codigoGerado && !window.confirm('Gerar outro código invalidará o convite anterior. Continuar?')) return;
    setProcessando(true); setErro(''); setMensagem('');
    const { data, error } = await supabase.rpc('gerar_convite_mesa', { p_mesa: idSelecionado });
    if (error) setErro('Não foi possível gerar o convite: ' + error.message);
    else {
      setCodigoGerado(data as string);
      setMensagem('Convite gerado. Compartilhe o código ou o link. Ele expira em 7 dias.');
    }
    setProcessando(false);
  }

  const linkConvite = codigoGerado
    ? window.location.origin + import.meta.env.BASE_URL + '#convite=' + encodeURIComponent(codigoGerado)
    : '';

  async function copiarLink() {
    try { await navigator.clipboard.writeText(linkConvite); setMensagem('Link copiado! Envie a quem deseja convidar.'); }
    catch { setMensagem('Copie o endereço exibido e compartilhe com o jogador.'); }
  }

  async function solicitar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setProcessando(true); setErro(''); setMensagem('');
    const { error } = await supabase.rpc('solicitar_entrada_mesa', {
      p_codigo: codigo.trim(), p_apelido: apelido.trim()
    });
    if (error) setErro('Não foi possível solicitar entrada: ' + error.message);
    else {
      localStorage.removeItem(CONVITE_LOCAL);
      setCodigo('');
      setMensagem('Solicitação enviada! O Mestre precisa aprovar sua entrada.');
      await atualizarPedidos();
    }
    setProcessando(false);
  }

  async function responder(pedido: Pedido, aceitar: boolean) {
    setProcessando(true); setErro(''); setMensagem('');
    const { error } = await supabase.rpc('responder_solicitacao_mesa', {
      p_solicitacao: pedido.id, p_aprovar: aceitar
    });
    if (error) setErro('Não foi possível responder: ' + error.message);
    else {
      setMensagem(aceitar ? 'Jogador aprovado e adicionado à Mesa.' : 'Solicitação recusada.');
      await Promise.all([atualizarPedidos(), aoAtualizarMesas()]);
    }
    setProcessando(false);
  }

  return <section className="area-convites" aria-labelledby="titulo-convites">
    <div className="titulo-area">
      <span className="sobretitulo"><i /> ACESSO À CAMPANHA</span>
      <h2 id="titulo-convites">Convites e solicitações</h2>
      <p className="secundario">O Mestre controla quem pode participar. Compartilhar o convite não libera acesso automaticamente.</p>
    </div>
    <div className="grade-convites">
      <section className="cartao cartao-padrao">
        <p className="rotulo">ENTRAR COMO JOGADOR</p>
        <h3>Solicitar entrada</h3>
        <p className="secundario">Recebeu um código ou link do Mestre? Informe um apelido para ele identificar você.</p>
        <form className="formulario" onSubmit={solicitar}>
          <label>Código do convite
            <input type="text" required value={codigo} maxLength={40}
              onChange={e => setCodigo(e.target.value)} placeholder="AB-..." autoComplete="off" />
          </label>
          <label>Seu apelido na Mesa
            <input type="text" minLength={2} maxLength={40} required value={apelido}
              onChange={e => setApelido(e.target.value)} placeholder="Ex.: Jill Valentine" />
          </label>
          <button type="submit" className="acao" disabled={processando}>Solicitar aprovação <span aria-hidden="true">→</span></button>
        </form>
        {meusPedidos.length > 0 && <div className="pedidos-meus">
          <h4>Suas solicitações</h4>
          {meusPedidos.map(p => <div key={p.id} className="pedido-compacto">
            <span>{p.apelido}</span><span className={'status-pedido status-'+p.status}>
              {p.status === 'pendente' ? 'Aguardando Mestre' : p.status === 'aprovada' ? 'Aprovada' : 'Recusada'}
            </span>
          </div>)}
        </div>}
      </section>

      <section className="cartao cartao-padrao">
        <p className="rotulo">ACESSO DO MESTRE</p>
        <h3>Gerenciar convites</h3>
        {minhasMesas.length === 0
          ? <p className="secundario">Crie uma Mesa para gerar convites e aprovar jogadores.</p>
          : <>
            <p className="secundario">Escolha sua Mesa para gerar um convite válido por sete dias. Um novo código substitui o anterior.</p>
            <div className="formulario">
              <label>Mesa
                <select value={idSelecionado} onChange={e => { setMesaSelecionada(e.target.value); setCodigoGerado(''); }}>
                  {minhasMesas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </label>
              <button type="button" className="acao" disabled={processando} onClick={() => {void gerarCodigo();}}>Gerar convite <span aria-hidden="true">↗</span></button>
              {codigoGerado && <div className="convite-gerado">
                <span>CÓDIGO ATIVO · EXPIRA EM 7 DIAS</span>
                <strong>{codigoGerado}</strong>
                <div className="link-convite">{linkConvite}</div>
                <button type="button" className="botao-claro" onClick={() => {void copiarLink();}}>Copiar link de convite</button>
              </div>}
            </div>
            <div className="solicitacoes-topo">
              <h4>Aguardando sua aprovação ({pendentes.length})</h4>
              <button type="button" className="botao-claro" onClick={() => {void atualizarPedidos();}}>Atualizar</button>
            </div>
            {carregando ? <p className="secundario">Carregando solicitações...</p> :
              pendentes.length === 0 ? <p className="secundario">Nenhuma solicitação pendente.</p> :
                <ul className="lista-pedidos">{pendentes.map(p => <li key={p.id} className="pedido">
                  <div><strong>{p.apelido}</strong><small>{nomeMesa(p.mesa_id)}</small></div>
                  <div className="acoes-pedido">
                    <button className="botao-claro" disabled={processando} type="button" onClick={() => {void responder(p,false);}}>Recusar</button>
                    <button className="botao-aprovar" disabled={processando} type="button" onClick={() => {void responder(p,true);}}>Aprovar</button>
                  </div>
                </li>)}</ul>}
            <p className="aviso">O apelido é informado pelo solicitante; confirme com seus amigos antes de aprovar desconhecidos.</p>
          </>}
      </section>
    </div>
    {erro && <p className="erro" role="alert">{erro}</p>}
    {mensagem && <p className="sucesso" role="status">{mensagem}</p>}
    <p className="aviso">Solicitações são atualizadas periodicamente. A sincronização completa de fichas entrará em outro marco.</p>
  </section>;
}
