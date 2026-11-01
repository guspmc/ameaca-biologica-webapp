import { dadosDaClasse } from './classesFicha';
import { PERICIAS_CLASSE, bonusTreinamento } from './pericias';
import { ORIGENS } from './origens';
import { capacidadeInventario, caracteristicos, equipamentoInicial as itensDoKit, opcoesEquipamento, espacosOcupados } from './equipamento';
import { HABILIDADES_BASICAS } from './habilidades';
import type { AtributosIniciais } from './atributosCriacao';

type DadosFichaLocal = {
  classe?: unknown;
  origem?: unknown;
  armaOperario?: unknown;
  atributos?: unknown;
  periciaOrigemTreinada?: unknown;
  periciaOrigemExtra?: unknown;
  habilidadeBasica?: unknown;
  equipamentoInicial?: unknown;
  distribuicaoPericias?: unknown;
};

type Props = {
  nome: string;
  mesa: string;
  dados: Record<string, unknown>;
  aoFechar: () => void;
};

const ATRIBUTOS: { chave: keyof AtributosIniciais; sigla: string; nome: string }[] = [
  { chave: 'forca', sigla: 'FOR', nome: 'Força' },
  { chave: 'agilidade', sigla: 'AGI', nome: 'Agilidade' },
  { chave: 'vigor', sigla: 'VIG', nome: 'Vigor' },
  { chave: 'astucia', sigla: 'AST', nome: 'Astúcia' },
];

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

export default function FichaLocal({ nome, mesa, dados, aoFechar }: Props) {
  const ficha = dados as DadosFichaLocal;
  const classe = typeof ficha.classe === 'string' ? ficha.classe : '';
  const origem = typeof ficha.origem === 'string' ? ficha.origem : '';
  const atributos = ficha.atributos && typeof ficha.atributos === 'object'
    ? ficha.atributos as AtributosIniciais
    : { forca: 1, agilidade: 1, vigor: 1, astucia: 1 };
  const distribuicao = ficha.distribuicaoPericias && typeof ficha.distribuicaoPericias === 'object'
    ? ficha.distribuicaoPericias as Record<string, number>
    : {};
  const treinada = typeof ficha.periciaOrigemTreinada === 'string' ? ficha.periciaOrigemTreinada : '';
  const extra = typeof ficha.periciaOrigemExtra === 'string' ? ficha.periciaOrigemExtra : '';
  const dadosClasse = dadosDaClasse(classe);
  const dadosOrigem = ORIGENS.find(item => item.nome === origem);
  const habilidade = HABILIDADES_BASICAS.find(item => item.id === ficha.habilidadeBasica && item.classe === classe);
  const pv = (classe === 'Agente' ? 10 : classe === 'Autodidata' ? 8 : classe === 'Operador' ? 12 : 0) + numero(atributos.vigor) + (habilidade?.id === 'parrudo' ? 5 : 0);
  const sa = numero(atributos.agilidade) + numero(atributos.astucia) + (origem === 'Universitária' ? 1 : 0);
  const bi = (classe === 'Agente' ? 8 : classe === 'Autodidata' ? 10 : classe === 'Operador' ? 6 : 0) + numero(atributos.astucia) + (origem === 'Cobaia' ? 2 : 0) + (habilidade?.id === 'parrudo' ? 3 : 0);
  const defesa = 10 + numero(atributos.agilidade) + (origem === 'Policial' ? 2 : 0);
  const capacidade = capacidadeInventario(numero(atributos.forca), origem);
  const listaPericias = [...new Set([...(PERICIAS_CLASSE[classe] ?? []), ...(dadosOrigem?.pericias ?? []), ...(extra ? [extra] : [])])].sort();
  const itensClasse = caracteristicos(classe);
  const kitSelecionado = typeof ficha.equipamentoInicial === 'string' ? ficha.equipamentoInicial : '';
  const kit = opcoesEquipamento(classe).find(item => item.id === kitSelecionado);
  const itensKit = itensDoKit(classe, kitSelecionado);
  const espacosKit = espacosOcupados(itensKit);
  const ramo = dadosClasse?.ramos ?? [];

  return <div className="ficha-local-fundo" role="dialog" aria-modal="true" aria-labelledby="ficha-local-titulo">
    <article className="ficha-local">
      <header className="ficha-local-topo">
        <button type="button" className="ficha-local-voltar" onClick={aoFechar}>← Voltar</button>
        <div><strong>AMEAÇA BIOLÓGICA</strong><small>FICHA LOCAL · RASCUNHO</small></div>
        <span className="ficha-local-selo">NÃO ATIVA</span>
      </header>
      <div className="ficha-local-corpo">
        <div className="ficha-local-identidade">
          <span>REGISTRO DO SOBREVIVENTE · {mesa || 'MESA LOCAL'}</span>
          <h1 id="ficha-local-titulo">{nome}</h1>
          <p>{classe || 'Classe pendente'} · {origem || 'Origem pendente'} · Nível 1 (criação)</p>
          {origem === 'Operário' && typeof ficha.armaOperario === 'string' && <small>Arma escolhida: {ficha.armaOperario}</small>}
        </div>

        <div className="ficha-local-recursos">
          <div><small>PV MÁX.</small><strong>{pv}</strong><span>Atual pendente</span></div>
          <div><small>SA MÁX.</small><strong>{sa}</strong><span>Atual pendente</span></div>
          <div><small>BI MÁX.</small><strong>{bi}</strong><span>Atual pendente</span></div>
          <div><small>DEFESA</small><strong>{defesa}</strong><span>Sem equipamento</span></div>
        </div>

        <nav className="ficha-local-nav" aria-label="Seções da ficha">
          <a href="#ficha-local-caracteristicas">Características</a>
          <a href="#ficha-local-pericias">Atributos e Perícias</a>
          <a href="#ficha-local-combate">Combate</a>
          <a href="#ficha-local-inventario">Inventário</a>
        </nav>

        <section id="ficha-local-caracteristicas" className="ficha-local-secao">
          <h2><span>01</span> Características</h2>
          <div className="ficha-local-grade">
            <div><small>CLASSE</small><strong>{classe || 'Pendente'}</strong><p>{dadosClasse?.identidade ?? 'Dados da Classe ainda não definidos.'}</p></div>
            <div><small>ORIGEM</small><strong>{origem || 'Pendente'}</strong><p>{dadosOrigem?.beneficio ?? 'Benefício da Origem ainda não definido.'}</p></div>
            <div><small>RAMOS DA CLASSE</small><strong>{ramo.length ? ramo.join(' · ') : 'Pendente'}</strong><p>Ramos disponíveis para desenvolvimento futuro. Nenhum foi escolhido nesta etapa.</p></div>
            <div><small>PROFICIÊNCIAS</small><strong>{dadosClasse?.proficiencias.length ?? 0} registros</strong><p>{dadosClasse?.proficiencias.join(' · ') ?? 'Pendente'}</p></div>
          </div>
          <div className="ficha-local-nota"><strong>Habilidade Básica · {habilidade?.nome ?? 'Não selecionada'}</strong><p>{habilidade ? habilidade.efeito : 'Ainda não selecionada. Nenhuma habilidade foi presumida para o personagem.'}</p></div>
        </section>

        <section id="ficha-local-pericias" className="ficha-local-secao">
          <h2><span>02</span> Atributos e Perícias</h2>
          <div className="ficha-local-atributos">
            {ATRIBUTOS.map(item => <div key={item.chave}><small>{item.sigla}</small><strong>{numero(atributos[item.chave])}</strong><span>{item.nome}</span></div>)}
          </div>
          <div className="ficha-local-pontos"><span>Treinamento gratuito da Origem</span><strong>{treinada || 'Pendente'}</strong></div>
          {origem === 'Amnésico' && <div className="ficha-local-pontos"><span>Segunda Perícia da Origem</span><strong>{extra || 'Pendente'}</strong></div>}
          <div className="ficha-local-pericias">
            {listaPericias.map(pericia => {
              const grau = Math.min(2, Math.max(0, numero(distribuicao[pericia]) + (pericia === treinada ? 1 : 0)));
              const rotulo = grau === 2 ? 'Mestre' : grau === 1 ? 'Treinada' : 'Não Treinada';
              return <div key={pericia}><span>{pericia}<small>{rotulo}{pericia === treinada ? ' · Origem' : ''}</small></span><strong>+{bonusTreinamento(grau)}</strong></div>;
            })}
          </div>
          <p className="ficha-local-legenda">O bônus exibido representa apenas o Treinamento. O total de cada Teste também depende do Atributo associado e de efeitos contextuais.</p>
        </section>

        <section id="ficha-local-combate" className="ficha-local-secao">
          <h2><span>03</span> Combate</h2>
          <div className="ficha-local-grade">
            <div><small>DEFESA BÁSICA</small><strong>{defesa}</strong><p>10 + AGI{origem === 'Policial' ? ' + 2 da Origem Policial' : ''}. Equipamentos ainda não aplicados.</p></div>
            <div><small>MOVIMENTO</small><strong>9 m</strong><p>Movimento base.</p></div>
            <div><small>HABILIDADE DE CLASSE</small><strong>{habilidade?.nome ?? 'Não selecionada'}</strong><p>{habilidade ? habilidade.efeito : 'Os efeitos de combate não são executados nesta ficha de rascunho.'}</p></div>
            <div><small>ARMAS</small><strong>Não equipadas</strong><p>A escolha de arma e a resolução de Ataques serão integradas ao módulo de equipamento/combate.</p></div>
          </div>
          <p className="ficha-local-aviso">Combate ativo, iniciativa, ações, Ataques, Dano, munição e Condições ainda não estão implementados aqui. Nenhuma rolagem ou efeito é simulado.</p>
        </section>

        <section id="ficha-local-inventario" className="ficha-local-secao">
          <h2><span>04</span> Inventário</h2>
          <div className="ficha-local-inventario-topo"><span>CAPACIDADE BASE</span><strong>{capacidade} Espaços</strong></div>
          <div className="ficha-local-itens">
            <strong>Itens característicos</strong>
            {itensClasse.length ? itensClasse.map(item => <div key={item.id}><strong>{item.nome}</strong><small>{item.detalhe} · Característico · 0 Espaços</small></div>) : <p>Itens característicos ainda não definidos para esta Classe.</p>}
            <strong>Conjunto inicial · {kit ? kit.id + ' — ' + kit.nome : 'Não selecionado'}</strong>
            {itensKit.length ? itensKit.map(item => <div key={item.id}><strong>{item.nome}</strong><small>{item.detalhe} · {item.espacos} Espaço(s)</small></div>) : <p>Nenhum conjunto inicial selecionado.</p>}
          </div>
          <p className="ficha-local-legenda">A capacidade considera 4 + FOR{origem === 'Mochileiro' ? ' + 1 de Mochileiro' : ''} = {capacidade} Espaços. O conjunto selecionado ocupa {espacosKit} Espaço(s). Compras personalizadas do conjunto C, estado de equipamento e operações de Inventário ainda não estão integrados.</p>
        </section>

        <footer className="ficha-local-rodape">AMEAÇA BIOLÓGICA RPG · DADOS LOCAIS · RASCUNHO NÃO ATIVO</footer>
      </div>
    </article>
  </div>;
}
