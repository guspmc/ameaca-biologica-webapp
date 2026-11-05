import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import FichaLocal from './FichaLocal';
import { criarFilaSerializada } from './filaSerializada';
import { criarBackup, lerArquivoBackup, nomeDeCopiaUnico, serializarBackup } from './backupFicha';
import { adicionarPersonagens, excluirPersonagem, listarPersonagens, obterPersonagem, salvarPersonagem, salvarPatchPersonagem, substituirPersonagens, type PersonagemLocal } from './persistenciaFicha';

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
  const [temEdicoesPendentes, setTemEdicoesPendentes] = useState(false);
  const [exclusaoPendente, setExclusaoPendente] = useState<string | null>(null);
  const [backupPendente, setBackupPendente] = useState<ReturnType<typeof lerArquivoBackup> | null>(null);
  const [arquivoInputKey, setArquivoInputKey] = useState(0);
  const filaGravacao = useRef(criarFilaSerializada());
  const camposPendentesRef = useRef(new Set<string>());
  const secoesNaoSalvasRef = useRef(new Set<string>());
  const selecionadoRef = useRef<PersonagemLocal | null>(selecionado);
  selecionadoRef.current = selecionado;

  useEffect(() => {
    if (!temEdicoesPendentes) return;
    function prevenirSaida(evento: BeforeUnloadEvent) {
      evento.preventDefault();
      evento.returnValue = '';
    }
    window.addEventListener('beforeunload', prevenirSaida);
    return () => window.removeEventListener('beforeunload', prevenirSaida);
  }, [temEdicoesPendentes]);

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
    if (nomeLimpo.length < 2 || nomeLimpo.length > 80 || ocupado) { if (nomeLimpo.length < 2 || nomeLimpo.length > 80) setErro('O nome deve ter entre 2 e 80 caracteres.'); return; }
    setOcupado(true); setErro('');
    const instante = agora();
    const personagem: PersonagemLocal = {
      id: novoId(), geracao: novoId(), nome: nomeLimpo, criadoEm: instante, atualizadoEm: instante,
      dados: { versaoModelo: 1, estadoFicha: 'rascunho' },
    };
    try {
      await salvarPersonagem(personagem);
      await atualizarLista();
      secoesNaoSalvasRef.current.clear();
      setTemEdicoesPendentes(false);
      setSelecionado(personagem);
      setNome('');
      setStatus('Ficha criada e gravada neste dispositivo.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível criar a ficha.'); }
    finally { setOcupado(false); }
  }

  async function salvarDados(patch: Record<string, unknown>, nomeAtualizado?: string): Promise<boolean> {
    // Serializa gravações rápidas para não descartar patches concorrentes.
    const operacao = filaGravacao.current.enfileirar(async () => {
      const base = selecionadoRef.current;
      if (!base) return false;
      setStatus('Salvando no dispositivo…'); setErro('');
      try {
        const atualizado = await salvarPatchPersonagem(base.id, patch, base.dados, nomeAtualizado, base.nome, base.geracao);
        for (const campo of Object.keys(patch)) camposPendentesRef.current.delete(campo);
        const chavesCaracteristicas = ['classe', 'origem', 'armaOperario', 'habilidadeBasica'];
        if (chavesCaracteristicas.some(campo => campo in patch)) secoesNaoSalvasRef.current.delete('Características');
        if (['atributos', 'periciaOrigemTreinada', 'periciaOrigemExtra', 'distribuicaoPericias'].some(campo => campo in patch)) secoesNaoSalvasRef.current.delete('Atributos e Perícias');
        if ('identidade' in patch) secoesNaoSalvasRef.current.delete('Identificação');
        if (['comprasIniciais', 'revisaoCompras'].some(campo => campo in patch)
          || ('equipamentoInicial' in patch && !chavesCaracteristicas.some(campo => campo in patch))) {
          secoesNaoSalvasRef.current.delete('Inventário');
        }
        setTemEdicoesPendentes(secoesNaoSalvasRef.current.size > 0 || camposPendentesRef.current.size > 0);
        selecionadoRef.current = atualizado;
        setSelecionado(atualizado);
        setPersonagens(lista => lista.map(p => p.id === atualizado.id ? atualizado : p).sort((a,b) => b.atualizadoEm.localeCompare(a.atualizadoEm)));
        setStatus('Salvo neste dispositivo.');
        return true;
      } catch (e) {
        for (const campo of Object.keys(patch)) camposPendentesRef.current.add(campo);
        setErro(e instanceof Error ? e.message : 'Falha ao salvar.');
        setStatus('Não foi possível confirmar o salvamento.');
        return false;
      }
    });
    return operacao;
  }

  async function abrirPersonagem(id: string) {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    try {
      const atual = await obterPersonagem(id);
      if (!atual) {
        await atualizarLista();
        setErro('Esta ficha não está mais disponível. A lista foi atualizada.');
        return;
      }
      selecionadoRef.current = atual;
      setSelecionado(atual);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível abrir a ficha.');
    } finally {
      setOcupado(false);
    }
  }

  async function recarregarFicha() {
    const atual = selecionadoRef.current;
    if (!atual) return;
    if (!window.confirm('As alterações ainda não salvas nesta aba serão descartadas. Reabrir a ficha com os dados mais recentes gravados por outra aba?')) return;
    try {
      const atualizada = await obterPersonagem(atual.id);
      if (!atualizada) {
        setErro('Esta ficha não existe mais neste dispositivo. Volte à lista e atualize os registros.');
        return;
      }
      camposPendentesRef.current.clear();
      secoesNaoSalvasRef.current.clear();
      setTemEdicoesPendentes(false);
      selecionadoRef.current = atualizada;
      setSelecionado(atualizada);
      setPersonagens(lista => lista.map(p => p.id === atualizada.id ? atualizada : p).sort((x,y) => y.atualizadoEm.localeCompare(x.atualizadoEm)));
      setErro('');
      setStatus('Ficha atualizada com os dados mais recentes do dispositivo.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível atualizar a ficha.');
    }
  }

  function registrarPendencia(secao: string, pendente: boolean) {
    if (pendente) secoesNaoSalvasRef.current.add(secao);
    else secoesNaoSalvasRef.current.delete(secao);
    setTemEdicoesPendentes(secoesNaoSalvasRef.current.size > 0 || camposPendentesRef.current.size > 0);
  }

  async function fecharFicha() {
    setStatus('Concluindo salvamentos pendentes…');
    await filaGravacao.current.aguardar();
    if (camposPendentesRef.current.size > 0) {
      setErro('Há alterações que não foram confirmadas: ' + [...camposPendentesRef.current].join(', ') + '. Revise essas seções e tente salvar novamente antes de fechar.');
      setStatus('Fechamento interrompido: há alterações não confirmadas.');
      return;
    }
    let descartouAlteracoes = false;
    if (secoesNaoSalvasRef.current.size > 0) {
      const secoes = [...secoesNaoSalvasRef.current];
      const descartar = window.confirm('Há alterações ainda não salvas em: ' + secoes.join(', ') + '.\n\nSe fechar agora, essas alterações serão descartadas. Deseja fechar mesmo assim?');
      if (!descartar) {
        setStatus('Ficha mantida aberta. Salve as alterações ou feche quando estiver pronto.');
        return;
      }
      descartouAlteracoes = true;
    }
    secoesNaoSalvasRef.current.clear();
    setTemEdicoesPendentes(false);
    selecionadoRef.current = null;
    setSelecionado(null);
    setExclusaoPendente(null);
    setStatus(descartouAlteracoes ? 'Ficha fechada. As alterações locais não salvas foram descartadas.' : 'Ficha fechada. Última gravação confirmada no dispositivo.');
  }

  async function excluirDaLista(id: string) {
    if (ocupado) return;
    setOcupado(true); setErro('');
    try {
      await filaGravacao.current.aguardar();
      await excluirPersonagem(id);
      setExclusaoPendente(null);
      await atualizarLista();
      setStatus('Ficha excluída deste dispositivo.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao excluir.'); }
    finally { setOcupado(false); }
  }

  async function selecionarBackup(arquivo?: File) {
    if (!arquivo) return;
    setErro('');
    try {
      if (arquivo.size > 10 * 1024 * 1024) throw new Error('O backup excede o limite de 10 MB.');
      const texto = await arquivo.text();
      setBackupPendente(lerArquivoBackup(texto));
      setStatus('Backup validado. Revise a prévia antes de importar.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o backup.');
      setStatus('Importação não realizada.');
    } finally {
      setArquivoInputKey(k => k + 1);
    }
  }

  async function importarBackup(modo: 'copias' | 'substituir') {
    if (!backupPendente || ocupado) return;
    setOcupado(true); setErro('');
    try {
      await filaGravacao.current.aguardar();
      if (modo === 'substituir') {
        await substituirPersonagens(backupPendente.personagens);
      } else {
        const existentes = await listarPersonagens();
        const ids = new Set(existentes.map(p => p.id));
        const nomes = new Set(existentes.map(p => p.nome.toLocaleLowerCase()));
        const copias = backupPendente.personagens.map(p => {
          let id = novoId();
          while (ids.has(id)) id = novoId();
          ids.add(id);
          const nome = nomes.has(p.nome.toLocaleLowerCase('pt-BR'))
            ? nomeDeCopiaUnico(p.nome, nomes)
            : p.nome;
          nomes.add(nome.toLocaleLowerCase('pt-BR'));
          return { ...p, id, geracao: novoId(), nome };
        });
        await adicionarPersonagens(copias);
      }
      const lista = await atualizarLista();
      setSelecionado(null);
      setBackupPendente(null);
      setStatus(modo === 'substituir' ? 'Backup restaurado. O conjunto local foi substituído.' : 'Cópias importadas e gravadas neste dispositivo.');

    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao importar backup.');
      setStatus('A importação não foi confirmada.');
    } finally { setOcupado(false); }
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
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Arquivo de backup preparado para download.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível exportar o backup.'); }
  }

  if (selecionado) return <FichaLocal
    nome={selecionado.nome} mesa="DISPOSITIVO LOCAL" dados={selecionado.dados}
    aoFechar={() => { void fecharFicha(); }}
    aoRecarregar={recarregarFicha}
    aoAlterarPendencia={registrarPendencia}
    aoEditar={secao => document.getElementById(secao === 'caracteristicas' ? 'ficha-local-caracteristicas' : secao === 'pericias' ? 'ficha-local-pericias' : 'ficha-local-inventario')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    aoSalvarCaracteristicas={salvarDados}
    aoSalvarIdentidade={({ nome, identidade }) => salvarDados({ identidade }, nome)}
    aoSalvarAtributosPericias={salvarDados}
    aoSalvarInventario={salvarDados}
    aoSalvarFuncionamento={configuracao => salvarDados({ configuracaoFuncionamento: configuracao })}
    status={status}
    erro={erro}
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
        <div className="offline-painel-topo"><div><small>REGISTROS LOCAIS</small><h2>Personagens</h2></div><div className="offline-backup-acoes"><button type="button" className="offline-exportar" onClick={exportar} disabled={!personagens.length || ocupado}>Exportar backup JSON ↓</button><label className="offline-exportar offline-importar" htmlFor="backup-json">Importar backup JSON ↑</label><input key={arquivoInputKey} id="backup-json" type="file" accept="application/json,.json" disabled={ocupado} onChange={e=>void selecionarBackup(e.target.files?.[0])} hidden /></div></div>
        <p className="offline-status" role="status">{carregando ? 'Carregando…' : status}</p>
        {erro && <p className="offline-erro" role="alert">{erro}</p>}
        {backupPendente && <section className="offline-importacao" aria-label="Prévia do backup"><div><small>BACKUP VALIDADO · V{backupPendente.versao}</small><h3>Prévia da restauração</h3><p>Exportado em {new Date(backupPendente.exportadoEm).toLocaleString("pt-BR")}</p><strong>{backupPendente.personagens.length} personagem(ns)</strong><ul>{backupPendente.personagens.map(p=><li key={p.id}>{p.nome}</li>)}</ul></div><p>Escolha como importar. Substituir apaga as fichas atuais deste navegador. A opção de cópias preserva as fichas atuais.</p><div><button type="button" onClick={()=>void importarBackup("copias")} disabled={ocupado}>Adicionar como cópias</button><button type="button" onClick={()=>void importarBackup("substituir")} disabled={ocupado}>Substituir fichas locais</button><button type="button" onClick={()=>setBackupPendente(null)} disabled={ocupado}>Cancelar</button></div></section>}
        {personagens.length ? <ul className="offline-lista">{personagens.map(p=><li key={p.id}>
          <button type="button" onClick={()=>void abrirPersonagem(p.id)} disabled={ocupado}>
            <span className="offline-avatar">☣</span><span><strong>{p.nome}</strong><small>Atualizada em {new Date(p.atualizadoEm).toLocaleString('pt-BR')}</small></span><b>ABRIR →</b>
          </button>
          {exclusaoPendente === p.id ? <div className="offline-confirmar"><span>Excluir esta ficha deste dispositivo?</span><button type="button" onClick={()=>void excluirDaLista(p.id)} disabled={ocupado}>Confirmar exclusão</button><button type="button" onClick={()=>setExclusaoPendente(null)}>Cancelar</button></div> : <button type="button" className="offline-excluir" onClick={()=>setExclusaoPendente(p.id)}>Excluir</button>}
        </li>)}</ul> : !carregando && <div className="offline-vazio"><span>☣</span><strong>Nenhum registro encontrado</strong><p>Crie sua primeira ficha para começar. Ela ficará salva neste dispositivo.</p></div>}
        <form className="offline-criar" onSubmit={criar}>
          <label htmlFor="novo-personagem">Criar personagem</label>
          <div><input id="novo-personagem" value={nome} onChange={e=>setNome(e.target.value)} minLength={2} maxLength={80} placeholder="Nome do personagem" required disabled={ocupado || carregando}/><button type="submit" disabled={ocupado || carregando || !nome.trim()}>Criar ficha <span>＋</span></button></div>
        </form>
      </section>
      <footer className="offline-rodape">ARMAZENAMENTO LOCAL · FAÇA BACKUPS REGULARES · A VERSÃO DESTA FICHA AINDA ESTÁ EM DESENVOLVIMENTO</footer>
    </section>
  </main>;
}
