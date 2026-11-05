import { useEffect, useState, type FormEvent } from 'react';
import { gravarRegistroLaboratorio, lerLaboratorio, type ArmazenamentoLocal, type EstadoLaboratorio } from './persistenciaLaboratorio';
import { ORIGENS } from './origens';
import { ARMAS_OPERARIO, armaOperarioValida } from './armaOperario';
import { atributosIniciaisValidos, pontosRestantesAtributos, type AtributosIniciais } from './atributosCriacao';
import { NOMES_PERICIAS, periciasPermitidasNaCriacao, distribuicaoPericiasValida, pontosGastosPericias } from './periciasCriacao';
import { PONTOS_CLASSE } from './pericias';
import FichaLocal from './FichaLocal';
import { HABILIDADES_BASICAS } from './habilidades';
import { opcoesEquipamento, capacidadeInventario } from './equipamento';
import PreviaCompras from './PreviaCompras';
import RevisaoCriacao from './RevisaoCriacao';
import { simularCompras } from './comprasIniciais';
import { configuracaoInicial, type ConfiguracaoFuncionamento } from './funcionamentoFicha';

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
  const [personagemEmEdicao, setPersonagemEmEdicao] = useState<string | null>(null);
  const [classePersonagem, setClassePersonagem] = useState('Agente');
  const [origemPersonagem, setOrigemPersonagem] = useState('');
  const [armaOperario, setArmaOperario] = useState('');
  const [habilidadeBasica, setHabilidadeBasica] = useState('');
  const [equipamentoInicial, setEquipamentoInicial] = useState('');
  const [comprasIniciais, setComprasIniciais] = useState<Record<string, number>>({});
  const [revisaoCompras, setRevisaoCompras] = useState(0);
  const [funcionamento, setFuncionamento] = useState<ConfiguracaoFuncionamento>(() => configuracaoInicial());
  const [revisaoFuncionamento, setRevisaoFuncionamento] = useState(0);
  const [atributos, setAtributos] = useState<AtributosIniciais>({ forca: 1, agilidade: 1, vigor: 1, astucia: 1 });
  const [periciaTreinada, setPericiaTreinada] = useState('');
  const [periciaExtraAmnesico, setPericiaExtraAmnesico] = useState('');
  const [distribuicaoPericias, setDistribuicaoPericias] = useState<Record<string, number>>({});
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [fichaAberta, setFichaAberta] = useState<{ id: string; nome: string; mesa: string; dados: Record<string, unknown> } | null>(null);

  useEffect(() => {
    try { setEstado(lerLaboratorio(armazenamento)); }
    catch (problema) { setErro(problema instanceof Error ? problema.message : 'Não foi possível ler os dados locais.'); }
  }, []);

  const mesas = estado?.registros.filter(registro => registro.tipo === 'mesa') ?? [];
  const personagens = estado?.registros.filter(registro => registro.tipo === 'personagem') ?? [];

  function gravar(tipo: 'mesa' | 'personagem', nome: string, dados: Record<string, unknown>, idExistente?: string): boolean {
    setErro(''); setAviso(''); setOcupado(true);
    try {
      const registro = {
        id: idExistente ?? globalThis.crypto.randomUUID(), tipo, nome,
        atualizadoEm: new Date().toISOString(), dados,
      };
      const proximo = gravarRegistroLaboratorio(armazenamento, registro);
      setEstado(proximo);
      setAviso(tipo === 'mesa' ? 'Mesa fictícia gravada neste dispositivo.' : 'Rascunho fictício gravado neste dispositivo.');
      return true;
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível salvar. Nenhum sucesso foi indicado.');
      return false;
    } finally { setOcupado(false); }
  }

  function criarMesa(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = nomeMesa.trim();
    if (nome.length < 2 || nome.length > 80) { setErro('O nome da Mesa deve ter entre 2 e 80 caracteres.'); return; }
    if (gravar('mesa', nome, { ficticio: true })) setNomeMesa('');
  }

  function alterarAtributo(chave: keyof AtributosIniciais, delta: -1 | 1) {
    setAtributos(anteriores => {
      const valor = anteriores[chave] + delta;
      if (valor < 0 || valor > 3) return anteriores;
      if (delta === 1 && pontosRestantesAtributos(anteriores) <= 0) return anteriores;
      if (valor === 0 && Object.entries(anteriores).some(([nome, atual]) => nome !== chave && atual === 0)) return anteriores;
      return { ...anteriores, [chave]: valor };
    });
  }

  const periciasPermitidas = periciasPermitidasNaCriacao(classePersonagem, origemPersonagem, periciaTreinada, periciaExtraAmnesico);
  const pontosClasse = PONTOS_CLASSE[classePersonagem] ?? 0;
  const pontosGastos = pontosGastosPericias(distribuicaoPericias);

  function alterarGrauPericia(nome: string, delta: -1 | 1) {
    setDistribuicaoPericias(anteriores => {
      const atual = anteriores[nome] ?? 0;
      const maximo = nome === periciaTreinada ? 1 : 2;
      if (atual + delta < 0 || atual + delta > maximo) return anteriores;
      if (delta === 1 && pontosGastosPericias(anteriores) >= pontosClasse) return anteriores;
      return { ...anteriores, [nome]: atual + delta };
    });
  }

  function carregarEdicao(id: string, nome: string, dados: Record<string, unknown>, secao: 'caracteristicas' | 'pericias' | 'inventario' = 'caracteristicas') {
    setPersonagemEmEdicao(id);
    setNomePersonagem(nome);
    setMesaSelecionada(String(dados.mesaId ?? ''));
    setClassePersonagem(String(dados.classe ?? 'Agente'));
    setOrigemPersonagem(String(dados.origem ?? ''));
    setHabilidadeBasica(String(dados.habilidadeBasica ?? ''));
    setEquipamentoInicial(String(dados.equipamentoInicial ?? ''));
    setComprasIniciais((dados.comprasIniciais as Record<string, number>) ?? {});
    setRevisaoCompras(Number(dados.revisaoCompras ?? 0));
    setFuncionamento(dados.funcionamento && typeof dados.funcionamento === 'object' ? dados.funcionamento as ConfiguracaoFuncionamento : configuracaoInicial());
    setRevisaoFuncionamento(Number(dados.revisaoFuncionamento ?? 0));
    setArmaOperario(String(dados.armaOperario ?? ''));
    setAtributos((dados.atributos as AtributosIniciais) ?? { forca: 1, agilidade: 1, vigor: 1, astucia: 1 });
    setPericiaTreinada(String(dados.periciaOrigemTreinada ?? ''));
    setPericiaExtraAmnesico(String(dados.periciaOrigemExtra ?? ''));
    setDistribuicaoPericias((dados.distribuicaoPericias as Record<string, number>) ?? {});
    setErro('');
    setAviso('Rascunho carregado para edição. As alterações só serão gravadas ao salvar.');
    setFichaAberta(null);
    const destino = secao === 'pericias' ? 'laboratorio-pericias' : secao === 'inventario' ? 'laboratorio-inventario' : 'laboratorio-caracteristicas';
    document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function salvarPersonagem(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = nomePersonagem.trim();
    if (!mesaSelecionada || nome.length < 2 || nome.length > 80) { setErro('Selecione uma Mesa e informe um nome entre 2 e 80 caracteres.'); return; }
    if (!origemPersonagem) { setErro('Escolha uma Origem para o personagem.'); return; }
    if (!atributosIniciaisValidos(atributos)) { setErro('Distribua os 3 pontos iniciais entre os quatro Atributos. Você pode reduzir apenas um deles a 0.'); return; }
    if (!distribuicaoPericiasValida(classePersonagem, origemPersonagem, periciaTreinada, distribuicaoPericias, periciaExtraAmnesico)) { setErro('Escolha o Treinamento da Origem e distribua os pontos que desejar, sem ultrapassar o limite da Classe nem os graus permitidos.'); return; }
    if (origemPersonagem === 'Operário' && !armaOperarioValida(armaOperario)) { setErro('A Origem Operário exige a escolha de uma das seis armas permitidas.'); return; }
    if (!habilidadeBasica || !HABILIDADES_BASICAS.some(h => h.id === habilidadeBasica && h.classe === classePersonagem)) { setErro('Escolha uma Habilidade Básica válida para a Classe.'); return; }
    if (!opcoesEquipamento(classePersonagem).some(opcao => opcao.id === equipamentoInicial)) { setErro('Escolha um conjunto de Equipamento Inicial.'); return; }
    if (equipamentoInicial === 'C') { const plano = simularCompras(comprasIniciais, capacidadeInventario(atributos.forca, origemPersonagem)); if (!plano.orcamentoValido || !plano.cabe || revisaoCompras < 1) { setErro('Confira e salve um plano válido de compras para o conjunto Personalizado.'); return; } }
    if (gravar('personagem', nome, { mesaId: mesaSelecionada, classe: classePersonagem, origem: origemPersonagem, armaOperario: origemPersonagem === 'Operário' ? armaOperario : null, atributos, periciaOrigemTreinada: periciaTreinada, periciaOrigemExtra: origemPersonagem === 'Amnésico' ? periciaExtraAmnesico : null, distribuicaoPericias, habilidadeBasica, equipamentoInicial, comprasIniciais: equipamentoInicial === 'C' ? comprasIniciais : {}, revisaoCompras: equipamentoInicial === 'C' ? revisaoCompras : 0, funcionamento, revisaoFuncionamento, ficticio: true, etapa: 'rascunho-criacao-inicial' }, personagemEmEdicao ?? undefined)) {
      setNomePersonagem('');
      setPersonagemEmEdicao(null);
      setAviso(personagemEmEdicao ? 'Rascunho atualizado sem criar outro registro.' : 'Rascunho criado neste dispositivo.');
    }
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
          <p className="secundario">O laboratório registra um rascunho com Mesa, Classe, Origem, Atributos, Perícias, Habilidade Básica, equipamento, compras e preferências de funcionamento. Ainda não é a ficha oficial ativa.</p>
          <form className="formulario" onSubmit={salvarPersonagem}>
            <label>Mesa do personagem <select required value={mesaSelecionada} onChange={e => setMesaSelecionada(e.target.value)} disabled={!estado || mesas.length === 0 || ocupado}>
              <option value="">Selecione uma Mesa local</option>{mesas.map(mesa => <option key={mesa.id} value={mesa.id}>{mesa.nome}</option>)}
            </select></label>
            <label id="laboratorio-caracteristicas">Classe <select value={classePersonagem} onChange={e => { setClassePersonagem(e.target.value); setDistribuicaoPericias({}); setHabilidadeBasica(''); setEquipamentoInicial(''); setComprasIniciais({}); setRevisaoCompras(0); setFuncionamento(configuracaoInicial()); setRevisaoFuncionamento(0); }} disabled={!estado || ocupado}><option value="Agente">Agente</option><option value="Autodidata">Autodidata</option><option value="Operador">Operador</option></select></label>
            <label>Origem <select required value={origemPersonagem} onChange={e => { setOrigemPersonagem(e.target.value); setArmaOperario(''); setPericiaTreinada(''); setPericiaExtraAmnesico(''); setDistribuicaoPericias({}); }} disabled={!estado || ocupado}><option value="">Selecione uma Origem</option>{ORIGENS.map(origem => <option key={origem.nome} value={origem.nome}>{origem.nome}</option>)}</select></label>
            {origemPersonagem === 'Operário' && <label>Arma Corpo a Corpo semelhante a ferramenta <select required value={armaOperario} onChange={e => setArmaOperario(e.target.value)} disabled={!estado || ocupado}><option value="">Escolha uma arma</option>{ARMAS_OPERARIO.map(arma => <option key={arma} value={arma}>{arma}</option>)}</select><small>Escolha obrigatória na criação. A arma recebe +1 no Teste de Ataque e soma 2 × FOR ao dano, conforme a regra da Origem.</small></label>}
            {origemPersonagem && <div className="criar-pericias" id="laboratorio-pericias">
              <strong>Treinamento da Origem</strong>
              <p className="ajuda-atributos">Escolha uma das Perícias da Origem para receber Treinamento gratuito. A outra entra nas opções para distribuir os pontos da Classe.</p>
              <label>Perícia Treinada <select required value={periciaTreinada} onChange={e => { setPericiaTreinada(e.target.value); setDistribuicaoPericias({}); }} disabled={!estado || ocupado}>
                <option value="">Escolha a Perícia Treinada</option>{(origemPersonagem === 'Amnésico' ? NOMES_PERICIAS : (ORIGENS.find(o => o.nome === origemPersonagem)?.pericias ?? [])).map(nome => <option key={nome} value={nome}>{nome}</option>)}
              </select></label>
              {origemPersonagem === 'Amnésico' && <label>Segunda Perícia da Origem <select required value={periciaExtraAmnesico} onChange={e => { setPericiaExtraAmnesico(e.target.value); setDistribuicaoPericias({}); }} disabled={!estado || ocupado}>
                <option value="">Escolha outra Perícia</option>{NOMES_PERICIAS.filter(nome => nome !== periciaTreinada).map(nome => <option key={nome} value={nome}>{nome}</option>)}
              </select></label>}
              <div className="criar-linha"><strong>Pontos de Perícia · {classePersonagem}</strong><span className={pontosGastos === pontosClasse ? 'pontos-prontos' : 'pontos-restantes'}>{pontosGastos}/{pontosClasse} gastos</span></div>
              <p className="ajuda-atributos">Cada ponto eleva uma Perícia Não Treinada a Treinada ou Treinada a Mestre. O máximo é Mestre. A Perícia gratuita da Origem já começa Treinada. Você pode deixar pontos da Classe sem gastar.</p>
              {periciasPermitidas.length === 0 ? <p className="vazio">Escolha o Treinamento da Origem para liberar a distribuição.</p> :
                <div className="lista-pericias-lab">{periciasPermitidas.map(nome => {
                  const gasto = distribuicaoPericias[nome] ?? 0;
                  const grau = gasto + (nome === periciaTreinada ? 1 : 0);
                  return <div className="linha-pericia-lab" key={nome}><span><strong>{nome}</strong><small>{grau === 0 ? 'Não Treinada' : grau === 1 ? 'Treinada' : 'Mestre'}{nome === periciaTreinada ? ' · Origem' : ''}</small></span>
                    <div className="controle-stat"><button type="button" aria-label={'Diminuir '+nome} onClick={() => alterarGrauPericia(nome,-1)} disabled={!estado || ocupado || gasto === 0}>−</button><b>{gasto}</b><button type="button" aria-label={'Aumentar '+nome} onClick={() => alterarGrauPericia(nome,1)} disabled={!estado || ocupado || gasto >= (nome === periciaTreinada ? 1 : 2) || pontosGastos >= pontosClasse}>+</button></div>
                  </div>;
                })}</div>}
            </div>}
            <label>Habilidade Básica <select value={habilidadeBasica} onChange={e => setHabilidadeBasica(e.target.value)} disabled={!estado || ocupado}>
              <option value="">Selecione uma Habilidade Básica</option>{HABILIDADES_BASICAS.filter(habilidade => habilidade.classe === classePersonagem).map(habilidade => <option key={habilidade.id} value={habilidade.id}>{habilidade.nome} · {habilidade.ramo}</option>)}
            </select><small>Escolha uma Habilidade Básica da Classe. Os efeitos são informativos nesta etapa; não são executados automaticamente.</small></label>
            <label id="laboratorio-inventario">Equipamento Inicial <select value={equipamentoInicial} onChange={e => setEquipamentoInicial(e.target.value)} disabled={!estado || ocupado}>
              <option value="">Selecione um conjunto inicial</option>{opcoesEquipamento(classePersonagem).map(opcao => <option key={opcao.id} value={opcao.id}>{opcao.id} · {opcao.nome}</option>)}
            </select><small>O conjunto C abre um planejador de compras. O catálogo ainda é parcial; as escolhas entram no rascunho quando você salva o personagem.</small></label>
            <div className="criar-atributos">
              <div className="criar-linha"><strong>Atributos iniciais</strong><span className={pontosRestantesAtributos(atributos) === 0 ? 'pontos-prontos' : 'pontos-restantes'}>{pontosRestantesAtributos(atributos)} ponto(s) restante(s)</span></div>
              <p className="ajuda-atributos">Todos começam em 1. Distribua +3 pontos. Opcionalmente reduza um único Atributo a 0 para receber +1 ponto. Máximo 3 na criação.</p>
              <div className="criar-grid">{([
                ['forca','FOR'],['agilidade','AGI'],['vigor','VIG'],['astucia','AST']
              ] as const).map(([chave, sigla]) => <div className="criar-stat" key={chave}>
                <small>{sigla}</small><div className="controle-stat">
                  <button type="button" aria-label={'Diminuir '+sigla} onClick={() => alterarAtributo(chave,-1)} disabled={!estado || ocupado || atributos[chave] === 0}>−</button>
                  <b>{atributos[chave]}</b>
                  <button type="button" aria-label={'Aumentar '+sigla} onClick={() => alterarAtributo(chave,1)} disabled={!estado || ocupado || atributos[chave] === 3 || pontosRestantesAtributos(atributos) === 0}>+</button>
                </div></div>)}</div>
            </div>
            {equipamentoInicial === 'C' && <div><PreviaCompras key={personagemEmEdicao ?? 'novo'} capacidade={capacidadeInventario(atributos.forca, origemPersonagem)} planoSalvo={comprasIniciais} revisaoSalva={revisaoCompras} aoSalvar={async plano => { setComprasIniciais(plano); const nova = revisaoCompras + 1; setRevisaoCompras(nova); return nova; }} /></div>}
            <label>Nome do personagem <input value={nomePersonagem} onChange={e => setNomePersonagem(e.target.value)} minLength={2} maxLength={80} required disabled={!estado || mesas.length === 0 || ocupado} placeholder="Ex.: Alex Morgan" /></label>
            <RevisaoCriacao ficha={{ nome: nomePersonagem, classe: classePersonagem, nivel: 1, forca: atributos.forca, agilidade: atributos.agilidade, vigor: atributos.vigor, astucia: atributos.astucia, origem: origemPersonagem || null, pericia_origem_treinada: periciaTreinada || null, pericia_origem_extra: periciaExtraAmnesico || null, pontos_pericia_classe: distribuicaoPericias, habilidade_basica: habilidadeBasica || null, equipamento_inicial: equipamentoInicial || null, compras_iniciais: comprasIniciais, revisao_compras: revisaoCompras, pv_maximo: (classePersonagem === 'Agente' ? 10 : classePersonagem === 'Autodidata' ? 8 : 12) + atributos.vigor + (habilidadeBasica === 'parrudo' ? 5 : 0), sa_maximo: atributos.agilidade + atributos.astucia + (origemPersonagem === 'Universitária' ? 1 : 0), bi_maximo: (classePersonagem === 'Agente' ? 8 : classePersonagem === 'Autodidata' ? 10 : 6) + atributos.astucia + (origemPersonagem === 'Cobaia' ? 2 : 0) + (habilidadeBasica === 'parrudo' ? 3 : 0), defesa: 10 + atributos.agilidade + (origemPersonagem === 'Policial' ? 2 : 0) }} funcionamento={{ inicial: funcionamento, revisaoInicial: revisaoFuncionamento, aoSalvar: async config => { setFuncionamento(config); const nova = revisaoFuncionamento + 1; setRevisaoFuncionamento(nova); return nova; } }} irPara={secao => document.getElementById(secao === 'itens' ? 'laboratorio-inventario' : secao === 'pericias' ? 'laboratorio-pericias' : 'laboratorio-caracteristicas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
            <button className="acao" type="submit" disabled={!estado || mesas.length === 0 || ocupado}>{personagemEmEdicao ? 'Salvar alterações do rascunho' : 'Criar rascunho local'} <span>→</span></button>
            {personagemEmEdicao && <button className="botao-claro" type="button" disabled={ocupado} onClick={() => { setPersonagemEmEdicao(null); setMesaSelecionada(''); setNomePersonagem(''); setClassePersonagem('Agente'); setOrigemPersonagem(''); setArmaOperario(''); setHabilidadeBasica(''); setEquipamentoInicial(''); setComprasIniciais({}); setRevisaoCompras(0); setFuncionamento(configuracaoInicial()); setRevisaoFuncionamento(0); setAtributos({ forca: 1, agilidade: 1, vigor: 1, astucia: 1 }); setPericiaTreinada(''); setPericiaExtraAmnesico(''); setDistribuicaoPericias({}); setErro(''); setAviso('Edição cancelada. O rascunho salvo foi preservado; o formulário foi limpo para uma nova criação.'); }}>Cancelar edição</button>}
          </form>
          <div className="lab-lista"><h3>Rascunhos ({personagens.length})</h3>
            {personagens.length === 0 ? <p className="vazio">Nenhum rascunho de personagem.</p> :
              <ul className="lista-mesas">{personagens.map(personagem => {
                const mesa = mesas.find(item => item.id === personagem.dados.mesaId);
                return <li key={personagem.id}><div className="linha-mesa lab-linha"><span className="sigla">P</span><span className="detalhes-mesa"><strong>{personagem.nome}</strong><small>{mesa?.nome ?? 'Mesa não encontrada'} · {String(personagem.dados.classe ?? 'Classe pendente')} · {String(personagem.dados.origem ?? 'Origem pendente')}{personagem.dados.armaOperario ? ' · '+String(personagem.dados.armaOperario) : ''} · RASCUNHO LOCAL</small></span><button className="botao-claro" type="button" onClick={() => setFichaAberta({ id: personagem.id, nome: personagem.nome, mesa: mesa?.nome ?? 'Mesa não encontrada', dados: personagem.dados })}>Abrir ficha</button><button className="botao-claro" type="button" disabled={ocupado} onClick={() => carregarEdicao(personagem.id, personagem.nome, personagem.dados)}>Continuar edição</button></div></li>;
              })}</ul>}
          </div>
        </section>
      </div>
      {fichaAberta && <FichaLocal nome={fichaAberta.nome} mesa={fichaAberta.mesa} dados={fichaAberta.dados} aoFechar={() => setFichaAberta(null)} aoEditar={secao => carregarEdicao(fichaAberta.id, fichaAberta.nome, fichaAberta.dados, secao)} aoSalvarCaracteristicas={async alteracoes => {
        const dadosAtualizados: Record<string, unknown> = { ...fichaAberta.dados, ...alteracoes };
        const classe = String(dadosAtualizados.classe ?? '');
        const origem = String(dadosAtualizados.origem ?? '');
        const arma = dadosAtualizados.armaOperario;
        const habilidade = String(dadosAtualizados.habilidadeBasica ?? '');
        const kit = String(dadosAtualizados.equipamentoInicial ?? '');
        const treinada = String(dadosAtualizados.periciaOrigemTreinada ?? '');
        const extra = String(dadosAtualizados.periciaOrigemExtra ?? '');
        const distribuicao = (dadosAtualizados.distribuicaoPericias as Record<string, number>) ?? {};
        const compras = (dadosAtualizados.comprasIniciais as Record<string, number>) ?? {};
        const revisao = Number(dadosAtualizados.revisaoCompras ?? 0);
        const forca = Number((dadosAtualizados.atributos as AtributosIniciais | undefined)?.forca ?? 1);
        const compraValida = kit !== 'C' || (() => { const plano = simularCompras(compras, capacidadeInventario(forca, origem)); return plano.orcamentoValido && plano.cabe && revisao >= 1; })();
        if (!ORIGENS.some(item => item.nome === origem) ||
          !distribuicaoPericiasValida(classe, origem, treinada, distribuicao, extra) ||
          !HABILIDADES_BASICAS.some(item => item.id === habilidade && item.classe === classe) ||
          !opcoesEquipamento(classe).some(item => item.id === kit) ||
          (origem === 'Operário' && !armaOperarioValida(arma)) || !compraValida) {
          setErro('Características não salvas: uma escolha atual ficou incompatível. Ajuste primeiro Perícias ou Equipamento no formulário de edição; nenhuma informação foi apagada.');
          return false;
        }
        const ok = gravar('personagem', fichaAberta.nome, dadosAtualizados, fichaAberta.id);
        if (ok) setFichaAberta(atual => atual ? { ...atual, dados: dadosAtualizados } : atual);
        return ok;
      }} aoSalvarRecursos={async recursos => {
        const dadosAtualizados: Record<string, unknown> = { ...fichaAberta.dados, ...recursos };
        const ok = gravar('personagem', fichaAberta.nome, dadosAtualizados, fichaAberta.id);
        if (ok) setFichaAberta(atual => atual ? { ...atual, dados: dadosAtualizados } : atual);
        return ok;
      }} aoSalvarFuncionamento={async configuracao => {
        const dadosAtualizados: Record<string, unknown> = { ...fichaAberta.dados, configuracaoFuncionamento: configuracao };
        const ok = gravar('personagem', fichaAberta.nome, dadosAtualizados, fichaAberta.id);
        if (ok) setFichaAberta(atual => atual ? { ...atual, dados: dadosAtualizados } : atual);
        return ok;
      }} aoSalvarInventario={async alteracoes => {
        const dadosAtualizados: Record<string, unknown> = { ...fichaAberta.dados, ...alteracoes };
        const classe = String(dadosAtualizados.classe ?? '');
        const kit = String(dadosAtualizados.equipamentoInicial ?? '');
        const attrs = (dadosAtualizados.atributos as AtributosIniciais | undefined) ?? { forca: 1, agilidade: 1, vigor: 1, astucia: 1 };
        const origem = String(dadosAtualizados.origem ?? '');
        if (!opcoesEquipamento(classe).some(item => item.id === kit)) {
          setErro('Planejamento não salvo: conjunto inicial incompatível com a Classe.');
          return false;
        }
        if (kit === 'C') {
          try {
            const plano = simularCompras(alteracoes.comprasIniciais, capacidadeInventario(attrs.forca, origem));
            if (!plano.orcamentoValido || !plano.cabe || alteracoes.revisaoCompras < 1) {
              setErro('Planejamento não salvo: confira orçamento, capacidade e aplicação das compras.');
              return false;
            }
          } catch {
            setErro('Planejamento não salvo: o plano de compras é inválido.');
            return false;
          }
        } else if (Object.keys(alteracoes.comprasIniciais).length || alteracoes.revisaoCompras !== 0) {
          setErro('Planejamento não salvo: kits A e B não podem manter compras personalizadas.');
          return false;
        }
        const ok = gravar('personagem', fichaAberta.nome, dadosAtualizados, fichaAberta.id);
        if (ok) setFichaAberta(atual => atual ? { ...atual, dados: dadosAtualizados } : atual);
        return ok;
      }} aoSalvarAtributosPericias={async alteracoes => {
        const dadosAtualizados: Record<string, unknown> = { ...fichaAberta.dados, ...alteracoes };
        const classe = String(dadosAtualizados.classe ?? '');
        const origem = String(dadosAtualizados.origem ?? '');
        const attrs = dadosAtualizados.atributos as AtributosIniciais;
        const treinada = String(dadosAtualizados.periciaOrigemTreinada ?? '');
        const extra = String(dadosAtualizados.periciaOrigemExtra ?? '');
        const distribuicao = (dadosAtualizados.distribuicaoPericias as Record<string, number>) ?? {};
        if (!atributosIniciaisValidos(attrs) || !distribuicaoPericiasValida(classe, origem, treinada, distribuicao, extra)) {
          setErro('A edição foi recusada: confira Atributos e Perícias conforme as regras da criação.');
          return false;
        }
        const ok = gravar('personagem', fichaAberta.nome, dadosAtualizados, fichaAberta.id);
        if (ok) {
          setFichaAberta(atual => atual ? { ...atual, dados: dadosAtualizados } : atual);
          setAviso('Atributos e Perícias atualizados no rascunho local.');
        }
        return ok;
      }} />}
      {erro && <p className="erro lab-mensagem" role="alert">{erro}</p>}
      {aviso && <p className="sucesso lab-mensagem" role="status">{aviso}</p>}
      <p className="lab-nota">A gravação só é confirmada quando o navegador conclui o armazenamento local. Os dados permanecem neste dispositivo até serem apagados pelo usuário no próprio navegador.</p>
      <footer>AMEAÇA BIOLÓGICA RPG · LABORATÓRIO LOCAL · NÃO É A VERSÃO PUBLICADA</footer>
    </main>
  </div>;
}
