import { useState } from 'react';
import { CATALOGO_INICIAL, simularCompras } from './comprasIniciais';

type Props = {
  capacidade: number;
  plano: Record<string, number>;
  revisao: number;
  autoSalvar?: boolean;
  aoAlterarPlano: (plano: Record<string, number>) => void;
  aoAlterarPrevia?: (pendente: boolean) => void;
};

export default function PreviaCompras({ capacidade, plano, revisao, autoSalvar = false, aoAlterarPlano, aoAlterarPrevia }: Props) {
  const [busca, setBusca] = useState('');
  const [planoLocal, setPlanoLocal] = useState(plano);
  const [alterada, setAlterada] = useState(false);
  const [aviso, setAviso] = useState('');
  const planoAtual = autoSalvar ? plano : planoLocal;
  const resultado = simularCompras(planoAtual, capacidade);
  const pesquisar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

  function mudar(id: string, quantidade: number) {
    const proximo = { ...planoAtual };
    if (quantidade <= 0) delete proximo[id];
    else proximo[id] = quantidade;
    if (autoSalvar) aoAlterarPlano(proximo);
    else {
      setPlanoLocal(proximo);
      setAlterada(true);
      aoAlterarPrevia?.(true);
      setAviso('');
    }
  }

  function limpar() {
    if (autoSalvar) aoAlterarPlano({});
    else {
      setPlanoLocal({});
      setAlterada(true);
      aoAlterarPrevia?.(true);
      setAviso('');
    }
  }

  function aplicarAoRascunho() {
    aoAlterarPlano(planoLocal);
    setAlterada(false);
    aoAlterarPrevia?.(false);
    setAviso('Plano aplicado ao rascunho. Use “Salvar inventário” para gravá-lo neste dispositivo.');
  }

  return <details className="previa-compras">
    <summary>{autoSalvar ? 'Compras iniciais · plano salvo automaticamente' : 'Compras iniciais · prévia de compras'}</summary>
    <p>{autoSalvar ? 'As quantidades desta prévia são gravadas automaticamente no rascunho. Uma escolha inválida permanece para correção, mas não poderá ser finalizada.' : 'As quantidades ficam nesta prévia até você clicar em “Aplicar ao rascunho”; depois, use “Salvar inventário” para gravá-las neste dispositivo.'}</p>
    <p className="ficha-dica">Catálogo inicial parcial, com preços conferidos no livro. A compra depende dos itens liberados na Mesa; disponibilidade é validada pelo servidor. Salvar o plano não equipa, consome nem finaliza a personagem.</p>
    <label className="busca-compras">Buscar neste catálogo<input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: colete ou munição" /></label>
    <p className="saldo-compras"><strong>Prévia: {resultado.saldo}/3 Moedas restantes · {resultado.espacos}/{capacidade} Espaços</strong><br />Revisão do plano: {revisao}. Inclui Erva Verde, Lanterna Simples e moedas restantes; Característicos ocupam zero.</p>
    {!resultado.orcamentoValido && <p className="offline-erro" role="alert">O plano excede o orçamento disponível. A alteração foi preservada no rascunho; ajuste antes de finalizar.</p>}
    {!resultado.cabe && <p className="offline-erro" role="alert">O plano excede a capacidade do Inventário. A alteração foi preservada no rascunho; ajuste antes de finalizar.</p>}
    {CATALOGO_INICIAL.filter(item => pesquisar(item.nome).includes(pesquisar(busca))).map(item => {
      const quantidade = planoAtual[item.id] ?? 0;
      const proxima = quantidade >= 3 ? null : simularCompras({ ...planoAtual, [item.id]: quantidade + 1 }, capacidade);
      const motivo = !proxima ? 'Limite da prévia' : !proxima.orcamentoValido ? 'Saldo insuficiente' : !proxima.cabe ? 'Não cabe no Inventário' : '';
      return <div className="compra-linha" key={item.id}>
        <strong>{item.nome}</strong><small>{item.preco} Moeda(s) por {item.unidades} unidade(s) · {item.referencia}{item.id === 'municao-9mm' ? ' · até 30 por Espaço' : ''}</small>
        <div>
          <button type="button" className="botao-claro" disabled={!quantidade} aria-label={'Retirar ' + item.nome + ' da prévia'} onClick={() => mudar(item.id, Math.max(0, quantidade - 1))}>−</button>
          <span>{quantidade} compra(s){quantidade ? ' · ' + (quantidade * item.unidades) + ' unidade(s)' : ''}</span>
          <button type="button" className="botao-claro" disabled={!!motivo} aria-label={'Adicionar ' + item.nome + ' à prévia'} onClick={() => mudar(item.id, quantidade + 1)}>+</button>
        </div>
        {motivo && <small>{motivo}</small>}
      </div>;
    })}
    {CATALOGO_INICIAL.every(item => !pesquisar(item.nome).includes(pesquisar(busca))) && <p>Nenhum item encontrado neste catálogo.</p>}
    <p className="ficha-dica">Armaduras da prévia continuam guardadas. Comprar munição de reserva não instala Peças nem aumenta o pente de uma arma.</p>
    {!autoSalvar && alterada && <button type="button" className="botao-claro" onClick={aplicarAoRascunho}>Aplicar ao rascunho</button>}
    {aviso && <p className="offline-status" role="status">{aviso}</p>}
    <button type="button" className="botao-claro" disabled={!Object.keys(planoAtual).length} onClick={limpar}>Limpar prévia de compras</button>
  </details>;
}
