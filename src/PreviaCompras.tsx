import { useState } from 'react';
import { CATALOGO_INICIAL, simularCompras } from './comprasIniciais';

type Props = {
  capacidade: number;
  plano: Record<string, number>;
  revisao: number;
  aoAlterarPlano: (plano: Record<string, number>) => void;
};

export default function PreviaCompras({ capacidade, plano, revisao, aoAlterarPlano }: Props) {
  const [busca, setBusca] = useState('');
  const resultado = simularCompras(plano, capacidade);
  const pesquisar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

  function mudar(id: string, quantidade: number) {
    const proximo = { ...plano };
    if (quantidade <= 0) delete proximo[id];
    else proximo[id] = quantidade;
    aoAlterarPlano(proximo);
  }

  return <details className="previa-compras">
    <summary>Compras iniciais · plano salvo automaticamente</summary>
    <p>As quantidades desta prévia são gravadas automaticamente no rascunho. A prévia calcula orçamento e capacidade; uma escolha inválida permanece no rascunho para correção, mas não poderá ser finalizada.</p>
    <p className="ficha-dica">Catálogo inicial parcial, com preços conferidos no livro. A compra depende dos itens liberados na Mesa; disponibilidade é validada pelo servidor. Salvar o plano não equipa, consome nem finaliza a personagem.</p>
    <label className="busca-compras">Buscar neste catálogo<input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: colete ou munição" /></label>
    <p className="saldo-compras"><strong>Prévia: {resultado.saldo}/3 Moedas restantes · {resultado.espacos}/{capacidade} Espaços</strong><br />Revisão do plano: {revisao}. Inclui Erva Verde, Lanterna Simples e moedas restantes; Característicos ocupam zero.</p>
    {!resultado.orcamentoValido && <p className="offline-erro" role="alert">O plano excede o orçamento disponível. A alteração foi preservada no rascunho; ajuste antes de finalizar.</p>}
    {!resultado.cabe && <p className="offline-erro" role="alert">O plano excede a capacidade do Inventário. A alteração foi preservada no rascunho; ajuste antes de finalizar.</p>}
    {CATALOGO_INICIAL.filter(item => pesquisar(item.nome).includes(pesquisar(busca))).map(item => {
      const quantidade = plano[item.id] ?? 0;
      const proxima = quantidade >= 3 ? null : simularCompras({ ...plano, [item.id]: quantidade + 1 }, capacidade);
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
    <button type="button" className="botao-claro" disabled={!Object.keys(plano).length} onClick={() => aoAlterarPlano({})}>Limpar prévia de compras</button>
  </details>;
}
