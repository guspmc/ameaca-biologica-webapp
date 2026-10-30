import { useEffect, useState, type FormEvent } from 'react';
import { gravarRegistroLaboratorio, lerLaboratorio, type ArmazenamentoLocal, type EstadoLaboratorio } from './laboratorioLocal';

const armazenamento: ArmazenamentoLocal = {
  getItem: chave => window.localStorage.getItem(chave),
  setItem: (chave, valor) => window.localStorage.setItem(chave, valor),
  removeItem: chave => window.localStorage.removeItem(chave),
};

function dataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor));
}

export default function LaboratorioLocal() {
  const [estado, setEstado] = useState<EstadoLaboratorio | null>(null);
  const [nomeMesa, setNomeMesa] = useState('');
  const [mesaSelecionada, setMesaSelecionada] = useState('');
  const [nomePersonagem, setNomePersonagem] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    try { setEstado(lerLaboratorio(armazenamento)); }
    catch (problema) { setErro(problema instanceof Error ? problema.message : 'Não foi possível ler os dados locais.'); }
  }, []);

  const mesas = estado?.registros.filter(registro => registro.tipo === 'mesa') ?? [];
  const personagens = estado?.registros.filter(registro => registro.tipo === 'personagem') ?? [];

  function gravar(tipo: 'mesa' | 'personagem', nome: string, dados: Record<string, unknown>) {
    setErro(''); setAviso(''); setOcupado(true);
    try {
      const registro = {
        id: globalThis.crypto.randomUUID(), tipo, nome,
        atualizadoEm: new Date().toISOString(), dados,
      };
      const proximo = gravarRegistroLaboratorio(armazenamento, registro);
      setEstado(proximo);
      setAviso(tipo === 'mesa' ? 'Mesa fictícia gravada neste dispositivo.' : 'Rascunho fictício gravado neste dispositivo.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível salvar. Nenhum sucesso foi indicado.');
    } finally { setOcupado(false); }
  }

  function criarMesa(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = nomeMesa.trim();
    if (nome.length < 2 || nome.length > 80) { setErro('O nome da Mesa deve ter entre 2 e 80 caracteres.'); return; }
    gravar('mesa', nome, { ficticio: true });
    setNomeMesa('');
  }

  function criarPersonagem(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = nomePersonagem.trim();
    if (!mesaSelecionada || nome.length < 2 || nome.length > 80) { setErro('Selecione uma Mesa e informe um nome entre 2 e 80 caracteres.'); return; }
    gravar('personagem', nome, { mesaId: mesaSelecionada, ficticio: true, etapa: 'rascunho-identidade' });
    setNomePersonagem('');
  }

  return <div className="aplicativo laboratorio-local">
    <header className="topo"><div className="topo-interno">
      <span className="marca" aria-hidden="true">AB</span>
      <div className="nome-marca"><strong>AMEAÇA BIOLÓGICA</strong><small>LABORATÓRIO DE DESENVOLVIMENTO</small></div>
      <span className="tag">AMBIENTE ISOLADO</span>
    </div></header>
    <main className="central">
      <div className="lab-alerta" role="status">
        <strong>LABORATÓRIO LOCAL — DADOS FICTÍCIOS</strong>
        <p>Este ambiente usa somente o armazenamento deste navegador. Não conecta ao Supabase, não autentica contas e não sincroniza com Mesas reais.</p>
      </div>
      <div className="cabecalho-central"><div>
        <span className="sobretitulo"><i /> AMBIENTE DE TESTES</span><h1>Laboratório local</h1>
        <p>Base isolada para validar as próximas etapas da ficha e do painel.</p>
      </div></div>
      {!estado && !erro && <p className="vazio">Carregando armazenamento local...</p>}
      <div className="grade">
        <section className="cartao cartao-padrao">
          <p className="rotulo">DADOS FICTÍCIOS</p><h2>Criar Mesa de teste</h2>
          <p className="secundario">A Mesa existe apenas neste navegador e não representa uma campanha online.</p>
          <form className="formulario" onSubmit={criarMesa}>
            <label>Nome da Mesa <input value={nomeMesa} onChange={e => setNomeMesa(e.target.value)} minLength={2} maxLength={80} required disabled={!estado || ocupado} placeholder="Ex.: Incidente no Hospital" /></label>
            <button className="acao" type="submit" disabled={!estado || ocupado}>Criar Mesa fictícia <span>→</span></button>
          </form>
          <div className="lab-lista"><h3>Mesas locais ({mesas.length})</h3>
            {mesas.length === 0 ? <p className="vazio">Nenhuma Mesa fictícia cadastrada.</p> :
              <ul className="lista-mesas">{mesas.map(mesa => <li key={mesa.id}><div className="linha-mesa lab-linha"><span className="sigla">L</span><span className="detalhes-mesa"><strong>{mesa.nome}</strong><small>LOCAL · {dataHora(mesa.atualizadoEm)}</small></span></div></li>)}</ul>}
          </div>
        </section>
        <section className="cartao cartao-padrao">
          <p className="rotulo">RASCUNHO NÃO OFICIAL</p><h2>Personagens de teste</h2>
          <p className="secundario">Nesta primeira etapa, o laboratório registra somente a identidade e a Mesa associada. Ainda não é a ficha oficial nem aplica regras.</p>
          <form className="formulario" onSubmit={criarPersonagem}>
            <label>Mesa do personagem <select required value={mesaSelecionada} onChange={e => setMesaSelecionada(e.target.value)} disabled={!estado || mesas.length === 0 || ocupado}>
              <option value="">Selecione uma Mesa local</option>{mesas.map(mesa => <option key={mesa.id} value={mesa.id}>{mesa.nome}</option>)}
            </select></label>
            <label>Nome do personagem <input value={nomePersonagem} onChange={e => setNomePersonagem(e.target.value)} minLength={2} maxLength={80} required disabled={!estado || mesas.length === 0 || ocupado} placeholder="Ex.: Alex Morgan" /></label>
            <button className="acao" type="submit" disabled={!estado || mesas.length === 0 || ocupado}>Criar rascunho local <span>→</span></button>
          </form>
          <div className="lab-lista"><h3>Rascunhos ({personagens.length})</h3>
            {personagens.length === 0 ? <p className="vazio">Nenhum rascunho de personagem.</p> :
              <ul className="lista-mesas">{personagens.map(personagem => {
                const mesa = mesas.find(item => item.id === personagem.dados.mesaId);
                return <li key={personagem.id}><div className="linha-mesa lab-linha"><span className="sigla">P</span><span className="detalhes-mesa"><strong>{personagem.nome}</strong><small>{mesa?.nome ?? 'Mesa não encontrada'} · RASCUNHO LOCAL</small></span></div></li>;
              })}</ul>}
          </div>
        </section>
      </div>
      {erro && <p className="erro lab-mensagem" role="alert">{erro}</p>}
      {aviso && <p className="sucesso lab-mensagem" role="status">{aviso}</p>}
      <p className="lab-nota">A gravação só é confirmada quando o navegador conclui o armazenamento local. Os dados permanecem neste dispositivo até serem apagados pelo usuário no próprio navegador.</p>
      <footer>AMEAÇA BIOLÓGICA RPG · LABORATÓRIO LOCAL · NÃO É A VERSÃO PUBLICADA</footer>
    </main>
  </div>;
}
