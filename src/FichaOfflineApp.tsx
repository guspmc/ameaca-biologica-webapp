import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import FichaLocal from './FichaLocal';
import { criarBackup, serializarBackup } from './backupFicha';
import { excluirPersonagem, listarPersonagens, salvarPersonagem, type PersonagemLocal } from './persistenciaFicha';

function agora() { return new Date().toISOString(); }
function novoId() { return globalThis.crypto?.randomUUID?.() ?? `personagem-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export default function FichaOfflineApp() {
  const [personagens, setPersonagens] = useState<PersonagemLocal[]>([]);
  const [selecionado, setSelecionado] = useState<PersonagemLocal | null>(null);
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [status, setStatus] = useState('Carregando fichas deste dispositivo…');
  const [erro, setErro] = useState('');
  const [exclusaoPendente, setExclusaoPendente] = useState<string | null>(null);
  const gravacao = useRef(false);

  async function atualizarLista() {
    const lista = await listarPersonagens();
    setPersonagens(lista);
    return lista;
  }
  useEffect(() => {
    let ativo = true;
    listarPersonagens().then(lista => {
      if (!ativo) return;
      setPersonagens(lista);
      setStatus(lista.length ? 'Dados carregados deste dispositivo.' : 'Nenhuma ficha neste dispositivo.');
    }).catch(e => {
      if (ativo) { setErro(e instanceof Error ? e.message : 'Falha ao abrir o armazenamento local.'); setStatus('Armazenamento indisponível.'); }
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || ocupado) return;
    setOcupado(true); setErro('');
    const instante = agora();
    const personagem: PersonagemLocal = {
      id: novoId(), nome: nomeLimpo, criadoEm: instante, atualizadoEm: instante,
      dados: { versaoModelo: 1, estadoFicha: 'rascunho' },
    };
    try {
      await salvarPersonagem(personagem);
      await atualizarLista();
      setSelecionado(personagem);
      setNome('');
      setStatus('Ficha criada e gravada neste dispositivo.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível criar a ficha.'); }
    finally { setOcupado(false); }
  }

  async function salvarDados(patch: Record<string, unknown>): Promise<boolean> {
    if (!selecionado || gravacao.current) return false;
    gravacao.current = true;
    setStatus('Salvando no dispositivo…'); setErro('');
    try {
      const atualizado: PersonagemLocal = {
        ...selecionado,
        atualizadoEm: agora(),
        dados: { ...selecionado.dados, ...patch },
      };
      await salvarPersonagem(atualizado);
      setSelecionado(atualizado);
      setPersonagens(lista => lista.map(p => p.id === atualizado.id ? atualizado : p).sort((a,b) => b.atualizadoEm.localeCompare(a.atualizadoEm)));
      setStatus('Salvo neste dispositivo.');
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar.'); setStatus('Não foi possível confirmar o salvamento.');
      return false;
    } finally { gravacao.current = false; }
  }

  async function excluirDaLista(id: string) {
    if (ocupado) return;
    setOcupado(true); setErro('');
    try {
      await excluirPersonagem(id);
      setExclusaoPendente(null);
      await atualizarLista();
      setStatus('Ficha excluída deste dispositivo.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao excluir.'); }
    finally { setOcupado(false); }
  }

    async function exportar() {
    setErro('');
    try {
      const backup = criarBackup(await listarPersonagens());
      const arquivo = new Blob([serializarBackup(backup)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ameaca-biologica-backup-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Arquivo de backup preparado para download.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível exportar o backup.'); }
  }

  if (selecionado) return <FichaLocal
    nome={selecionado.nome} mesa="DISPOSITIVO LOCAL" dados={selecionado.dados}
    aoFechar={() => { setSelecionado(null); setExclusaoPendente(null); }}
    aoEditar={() => undefined}
    aoSalvarCaracteristicas={salvarDados}
    aoSalvarAtributosPericias={salvarDados}
    aoSalvarInventario={salvarDados}
  />;

  return <main className="offline-app">
    <header className="offline-topo">
      <div className="offline-marca">AB</div>
      <div><strong>AMEAÇA BIOLÓGICA</strong><small>FICHA DO JOGADOR · MODO OFFLINE</small></div>
      <span>SEM CONTA · SEM SERVIDOR</span>
    </header>
    <section className="offline-conteudo">
      <div className="offline-intro">
        <small>ARQUIVO PESSOAL DO SOBREVIVENTE</small>
        <h1>Suas fichas.<br/><em>Seu dispositivo.</em></h1>
        <p>As fichas são armazenadas localmente neste navegador. Não dependem de login ou conexão com a internet.</p>
      </div>
      <section className="offline-painel">
        <div className="offline-painel-topo"><div><small>REGISTROS LOCAIS</small><h2>Personagens</h2></div><button type="button" className="offline-exportar" onClick={exportar} disabled={!personagens.length}>Exportar backup JSON ↓</button></div>
        <p className="offline-status" role="status">{carregando ? 'Carregando…' : status}</p>
        {erro && <p className="offline-erro" role="alert">{erro}</p>}
        {personagens.length ? <ul className="offline-lista">{personagens.map(p=><li key={p.id}>
          <button type="button" onClick={()=>{setSelecionado(p);setErro('');}}>
            <span className="offline-avatar">☣</span><span><strong>{p.nome}</strong><small>Atualizada em {new Date(p.atualizadoEm).toLocaleString('pt-BR')}</small></span><b>ABRIR →</b>
          </button>
          {exclusaoPendente === p.id ? <div className="offline-confirmar"><span>Excluir esta ficha deste dispositivo?</span><button type="button" onClick={()=>void excluirDaLista(p.id)} disabled={ocupado}>Confirmar exclusão</button><button type="button" onClick={()=>setExclusaoPendente(null)}>Cancelar</button></div> : <button type="button" className="offline-excluir" onClick={()=>setExclusaoPendente(p.id)}>Excluir</button>}
        </li>)}</ul> : !carregando && <div className="offline-vazio"><span>☣</span><strong>Nenhum registro encontrado</strong><p>Crie sua primeira ficha para começar. Ela ficará salva neste dispositivo.</p></div>}
        <form className="offline-criar" onSubmit={criar}>
          <label htmlFor="novo-personagem">Criar personagem</label>
          <div><input id="novo-personagem" value={nome} onChange={e=>setNome(e.target.value)} maxLength={80} placeholder="Nome do personagem" required disabled={ocupado || carregando}/><button type="submit" disabled={ocupado || carregando || !nome.trim()}>Criar ficha <span>＋</span></button></div>
        </form>
        {selecionado && confirmarExclusao && <p>Confirme a exclusão no próprio registro.</p>}
      </section>
      <footer className="offline-rodape">ARMAZENAMENTO LOCAL · FAÇA BACKUPS REGULARES · A VERSÃO DESTA FICHA AINDA ESTÁ EM DESENVOLVIMENTO</footer>
    </section>
  </main>;
}
