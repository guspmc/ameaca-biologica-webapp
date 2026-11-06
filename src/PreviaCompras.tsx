import { useState } from 'react';
import { CATALOGO_INICIAL, simularCompras } from './comprasIniciais';

type Props = {
  capacidade: number;
  plano?: Record<string, number>;
  revisao?: number;
  autoSalvar?: boolean;
  aoAlterarPlano?: (plano: Record<string, number>) => void;
  aoAlterarPrevia?: (pendente: boolean) => void;
  // Compatibilidade com a tela online antiga, que confirma o plano diretamente no servidor.
  planoSalvo?: Record<string, number>;
  revisaoSalva?: number;
  aoSalvar?: (plano: Record<string, number>, revisao: number) => Promise<number>;
};

export default function PreviaCompras({
  capacidade, plano, revisao, autoSalvar = false, aoAlterarPlano, aoAlterarPrevia,
  planoSalvo, revisaoSalva, aoSalvar,
}: Props) {
  const [busca, setBusca] = useState('');
  const [planoLocal, setPlanoLocal] = useState(() => plano ?? planoSalvo ?? {});
  const [alterada, setAlterada] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const planoAtual = autoSalvar ? (plano ?? {}) : planoLocal;
  const revisaoAtual = revisao ?? revisaoSalva ?? 0;
  const resultado = simularCompras(planoAtual, capacidade);
  const pesquisar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

  function mudar(id: string, quantidade: number) {
    const proximo = { ...planoAtual };
    if (quantidade <= 0) delete proximo[id];
    else proximo[id] = quantidade;
    if (autoSalvar) aoAlterarPlano?.(proximo);
    else {
      setPlanoLocal(proximo);
      setAlterada(true);
      aoAlterarPrevia?.(true);
      setAviso('');
      setErro('');
    }
  }

  function limpar() {
    if (autoSalvar) aoAlterarPlano?.({});
    else {
      setPlanoLocal({});
      setAlterada(true);
      aoAlterarPrevia?.(true);
      setAviso('');
      setErro('');
    }
  }

  async function aplicarAoRascunho() {
    setErro('');
    if (aoSalvar) {
      setSalvando(true);
      try {
        const novaRevisao = await aoSalvar(planoLocal, revisaoAtual);
        setAlterada(false);
        aoAlterarPrevia?.(false);
        setAviso('Plano de compras salvo e confirmado pelo servidor. Revisão ' + novaRevisao + '.');
      } catch (problema) {
        setErro(problema instanceof Error ? problema.message : 'Não foi possível confirmar o plano de compras.');
      } finally {
        setSalvando(false);
      }
      return;
    }
    aoAlterarPlano?.(planoLocal);
    setAlterada(false);
    aoAlterarPrevia?.(false);
    setAviso('Plano aplicado ao rascunho. Use “Salvar inventário” para gravá-lo neste dispositivo.');
  }

  return <details className="previa-compras">
    <summary>{autoSalvar ? 'Compras iniciais · salvamento automático ativo' : 'Compras iniciais · prévia de compras'}</summary>
    <p>{autoSalvar ? 'As quantidades desta prévia seguem automaticamente para o fluxo de salvamento do rascunho. O plano só é considerado salvo após a confirmação do servidor; o estado da gravação aparece no editor.' : 'As quantidades ficam nesta prévia até você confirmar a aplicação; depois, o plano é salvo pelo fluxo correspondente.'}</p>
    <p className="ficha-dica">Catálogo inicial parcial, com preços conferidos no livro. A compra depende dos itens liberados na Mesa; disponibilidade é validada pelo servidor. Salvar o plano não equipa, consome nem finaliza a personagem.</p>
    <label className="busca-compras">Buscar neste catálogo<input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: colete ou munição" /></label>
    <p className="saldo-compras"><strong>Prévia: {resultado.saldo}/3 Moedas restantes · {resultado.espacos}/{capacidade} Espaços</strong><br />Revisão do plano: {revisaoAtual}. Inclui Erva Verde, Lanterna Simples e moedas restantes; Característicos ocupam zero.</p>
    {!resultado.orcamentoValido && <p className="offline-erro" role="alert">O plano excede o orçamento disponível. A alteração foi preservada no rascunho; ajuste antes de finalizar.</p>}
    {!resultado.cabe && <p className="offline-erro" role="alert">O plano excede a capacidade do Inventário. A alteração foi preservada no rascunho; ajuste antes de finalizar.</p>}
    {CATALOGO_INICIAL.filter(item => pesquisar(item.nome).includes(pesquisar(busca))).map(item => {
      const quantidade = planoAtual[item.id] ?? 0;
      const proxima = quantidade >= 3 ? null : simularCompras({ ...planoAtual, [item.id]: quantidade + 1 }, capacidade);
      const motivo = !proxima ? 'Limite da prévia' : !proxima.orcamentoValido ? 'Saldo insuficiente' : !proxima.cabe ? 'Não cabe no Inventário' : '';
      return <div className="compra-linha" key={item.id}>
        <strong>{item.nome}</strong><small>{item.preco} Moeda(s) por {item.unidades} unidade(s) · {item.referencia}{item.id === 'municao-9mm' ? ' · até 30 por Espaço' : ''}</small>
        <div>
          <button type="button" className="botao-claro" disabled={salvando || !quantidade} aria-label={'Retirar ' + item.nome + ' da prévia'} onClick={() => mudar(item.id, Math.max(0, quantidade - 1))}>−</button>
          <span>{quantidade} compra(s){quantidade ? ' · ' + (quantidade * item.unidades) + ' unidade(s)' : ''}</span>
          <button type="button" className="botao-claro" disabled={salvando || !!motivo} aria-label={'Adicionar ' + item.nome + ' à prévia'} onClick={() => mudar(item.id, quantidade + 1)}>+</button>
        </div>
        {motivo && <small>{motivo}</small>}
      </div>;
    })}
    {CATALOGO_INICIAL.every(item => !pesquisar(item.nome).includes(pesquisar(busca))) && <p>Nenhum item encontrado neste catálogo.</p>}
    <p className="ficha-dica">Armaduras da prévia continuam guardadas. Comprar munição de reserva não instala Peças nem aumenta o pente de uma arma.</p>
    {!autoSalvar && alterada && <button type="button" className="botao-claro" disabled={salvando} onClick={() => void aplicarAoRascunho()}>{salvando ? 'Salvando plano…' : aoSalvar ? 'Salvar Plano de Compras' : 'Aplicar ao rascunho'}</button>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {aviso && <p className="offline-status" role="status">{aviso}</p>}
    <button type="button" className="botao-claro" disabled={salvando || !Object.keys(planoAtual).length} onClick={limpar}>Limpar prévia de compras</button>
  </details>;
}
