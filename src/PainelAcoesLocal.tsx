import { useRef, useState } from 'react';

type Props = {
  dados: Record<string, unknown>;
  saAtual: number;
  saMaximo: number;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

type ManobraSA = {
  id: string;
  nome: string;
  custo: number;
  descricao: string;
  patch?: Record<string, unknown>;
};

export default function PainelAcoesLocal({ dados, saAtual, saMaximo, aoSalvar }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const bloqueio = useRef(false);
  const mirarPreparado = dados.mirarPreparado === true;

  async function salvarSA(delta: number, patchExtra: Record<string, unknown> = {}, mensagem?: string) {
    if (salvando || bloqueio.current) return;
    const proximo = Math.min(saMaximo, Math.max(0, saAtual + delta));
    if (proximo === saAtual && Object.keys(patchExtra).length === 0) return;
    bloqueio.current = true;
    setSalvando(true);
    setErro('');
    setConfirmacao('');
    try {
      const salvo = await aoSalvar({ saAtual: proximo, ...patchExtra });
      if (!salvo) throw new Error('O salvamento não foi confirmado. Nenhuma alteração foi registrada.');
      setConfirmacao(mensagem ?? `SA atualizado: ${proximo}/${saMaximo}.`);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível salvar a alteração.');
    } finally {
      bloqueio.current = false;
      setSalvando(false);
    }
  }

  const manobras: ManobraSA[] = [
    { id: 'esforco-movimento', nome: 'Esforço · Movimento adicional', custo: 1, descricao: 'Gasta 1 SA.' },
    { id: 'esforco-acao-bonus', nome: 'Esforço · Ação Bônus adicional', custo: 1, descricao: 'Gasta 1 SA.' },
    { id: 'esforco-reacao', nome: 'Esforço · Reação adicional', custo: 1, descricao: 'Gasta 1 SA.' },
    { id: 'esforco-acao', nome: 'Esforço · Ação adicional', custo: 2, descricao: 'Gasta 2 SA.' },
    { id: 'fuga', nome: 'Fuga', custo: 1, descricao: 'Após Disparada; gasta 1 SA.' },
    { id: 'contra-ataque', nome: 'Contra-Ataque', custo: 1, descricao: 'Após Aparar ou Esquivar com sucesso; gasta 1 SA.' },
    { id: 'finalizar', nome: 'Finalizar', custo: 3, descricao: 'Gasta 3 SA.' },
    { id: 'finalizacao-dupla', nome: 'Finalização Dupla', custo: 3, descricao: 'Gasta 3 SA; a Reação e os demais requisitos são resolvidos com a Mesa.' },
  ];

  return <details className="ficha-local-editor painel-acoes-local" open>
    <summary>Manobras com gasto de SA</summary>
    <p>O custo é descontado ao registrar a manobra. A Ficha não controla turnos; use os ajustes no topo para corrigir o saldo quando necessário.</p>
    <h4>Manobras</h4>
    <div className="painel-acoes-lista">
      {manobras.map(manobra => <div className="painel-acoes-linha" key={manobra.id}>
        <span><strong>{manobra.nome}</strong><small>{manobra.descricao}</small></span>
        <button type="button" disabled={salvando || saAtual < manobra.custo || saMaximo < manobra.custo} onClick={() => void salvarSA(-manobra.custo, {}, `${manobra.nome} registrado: −${manobra.custo} SA.`)}>Gastar · {manobra.custo} SA</button>
      </div>)}
      <div className="painel-acoes-linha">
        <span><strong>Mirar</strong><small>Gasta 1 SA; concede +2 no próximo Teste de Ataque e permite escolher uma região específica.</small></span>
        <button type="button" disabled={salvando || saAtual < 1 || saMaximo < 1 || mirarPreparado} onClick={() => void salvarSA(-1, { mirarPreparado: true }, 'Mirar registrado: −1 SA. O bônus está preparado na calculadora de Ataque.')}>Mirar · 1 SA</button>
      </div>
      {mirarPreparado && <div className="painel-acoes-linha">
        <span><strong>Mirar preparado</strong><small>A preparação permanece até ser consumida. Se precisar cancelar, ajuste o SA manualmente após limpar a preparação.</small></span>
        <button type="button" disabled={salvando} onClick={() => void salvarSA(0, { mirarPreparado: false }, 'Preparação de Mirar removida.')}>Cancelar Mirar</button>
      </div>}
    </div>
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {confirmacao && <p className="offline-status" role="status">{confirmacao}</p>}
    {salvando && <p className="ficha-local-legenda" role="status">Salvando alterações…</p>}
  </details>;
}
