import { useRef, useState } from 'react';
import {
  comprarRecursoPorEsforco, consumirAcaoCompleta, consumirInteracaoGratuita,
  consumirRecursoNormal, economiaAcoesInicial, encerrarTurnoAcoes,
  estadoEconomiaAcoesValido, gastarSAEmManobra, iniciarTurnoAcoes,
  saNaJanelaEsforco, type EstadoEconomiaAcoes, type RecursoAcao,
} from './economiaAcoes';

type Props = {
  dados: Record<string, unknown>;
  saAtual: number;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
};

const RECURSOS: { id: RecursoAcao; nome: string; custo: string }[] = [
  { id: 'acao', nome: 'Ação', custo: '2 SA' },
  { id: 'movimento', nome: 'Movimento', custo: '1 SA' },
  { id: 'acaoBonus', nome: 'Ação Bônus', custo: '1 SA' },
  { id: 'reacao', nome: 'Reação', custo: '1 SA' },
];

function carregarEstado(dados: Record<string, unknown>, saAtual: number): { estado: EstadoEconomiaAcoes; valido: boolean } {
  const salvo = dados.economiaAcoes;
  if (salvo === undefined || salvo === null) return { estado: economiaAcoesInicial(saAtual), valido: true };
  if (!estadoEconomiaAcoesValido(salvo)) return { estado: economiaAcoesInicial(saAtual), valido: false };
  return { estado: { ...salvo, saAtual }, valido: true };
}

export default function PainelAcoesLocal({ dados, saAtual, aoSalvar }: Props) {
  const [inicial] = useState(() => carregarEstado(dados, saAtual));
  const [estado, setEstado] = useState(inicial.estado);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const bloqueioOperacao = useRef(false);

  async function aplicar(operacao: (atual: EstadoEconomiaAcoes) => EstadoEconomiaAcoes) {
    if (!inicial.valido || salvando || bloqueioOperacao.current) return;
    bloqueioOperacao.current = true;
    try {
      const proximo = operacao(estado);
      setSalvando(true);
      setErro('');
      setConfirmacao('');
      const salvo = await aoSalvar({ saAtual: proximo.saAtual, economiaAcoes: proximo, economiaAcoesSaldoBase: estado.saAtual });
      if (!salvo) throw new Error('O armazenamento local não confirmou a atualização. Nenhum gasto foi registrado na ficha.');
      setEstado(proximo);
      setConfirmacao('Economia de ações salva neste dispositivo.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível registrar a ação.');
    } finally {
      bloqueioOperacao.current = false;
      setSalvando(false);
    }
  }

  const janela = saNaJanelaEsforco(estado);
  return <details className="ficha-local-editor painel-acoes-local">
    <summary>Economia de Ações · {saNaJanelaEsforco(estado)}/3 SA · {estado.turnoEmAndamento ? 'Meu turno ativo' : 'Meu turno encerrado'}</summary>
    {!inicial.valido
      ? <p className="offline-erro" role="alert">O registro salvo da economia de ações está inválido. Ele foi preservado e o painel foi bloqueado para evitar sobrescrever dados.</p>
      : <>
          <div className="ficha-local-grade">
            <div><small>SURTO DE ADRENALINA</small><strong>{estado.saAtual} SA</strong><p>Disponível para Esforço e Manobras.</p></div>
            <div><small>JANELA DE 3 SA</small><strong>{janela}/3 SA</strong><p>Gasto do fim do último turno ao fim deste turno.</p></div>
            <div><small>TURNO DA PERSONAGEM</small><strong>{estado.turnoEmAndamento ? 'Em andamento' : 'Encerrado'}</strong><p>O painel apenas renova seus próprios marcadores; não controla a Iniciativa nem os turnos do Encontro.</p></div>
            <div><small>INTERAÇÃO GRATUITA</small><strong>{estado.interacaoGratuitaUsada ? 'Utilizada' : 'Disponível'}</strong><p>Recurso paralelo, não comprado por Esforço.</p></div>
          </div>

          <h4>Recursos normais</h4>
          <div className="painel-acoes-lista">
            {RECURSOS.map(recurso => {
              const foraDoTurno = !estado.turnoEmAndamento && recurso.id !== 'reacao';
              const usado = estado.normaisUsados[recurso.id];
              return <div className="painel-acoes-linha" key={recurso.id}>
                <span><strong>{recurso.nome}</strong><small>{usado ? 'Uso normal registrado' : 'Uso normal disponível'} · Extras por Esforço: {estado.comprasEsforco[recurso.id]}</small></span>
                <button type="button" disabled={salvando || foraDoTurno || usado} onClick={() => void aplicar(atual => consumirRecursoNormal(atual, recurso.id))}>Usar</button>
                <button type="button" disabled={salvando || foraDoTurno || estado.saAtual < (recurso.id === 'acao' ? 2 : 1) || janela >= 3} onClick={() => void aplicar(atual => comprarRecursoPorEsforco(atual, recurso.id))}>Comprar · {recurso.custo}</button>
              </div>;
            })}
          </div>

          <h4>Ação Completa e Interação Gratuita</h4>
          <div className="recursos-controles">
            <button type="button" disabled={salvando || !estado.turnoEmAndamento || estado.normaisUsados.acao || estado.normaisUsados.movimento} onClick={() => void aplicar(consumirAcaoCompleta)}>Ação Completa · Ação + Movimento</button>
            <button type="button" disabled={salvando || !estado.turnoEmAndamento || estado.interacaoGratuitaUsada} onClick={() => void aplicar(consumirInteracaoGratuita)}>Registrar Interação Gratuita</button>
          </div>

          <h4>Manobras com gasto de SA</h4>
          <div className="recursos-controles">
            <button type="button" disabled={salvando || !estado.turnoEmAndamento || estado.saAtual < 1 || janela >= 3} onClick={() => void aplicar(atual => gastarSAEmManobra(atual, 1))}>Registrar Manobra · 1 SA</button>
            <button type="button" disabled={salvando || !estado.turnoEmAndamento || estado.saAtual < 3 || janela > 0} onClick={() => void aplicar(atual => gastarSAEmManobra(atual, 3))}>Registrar Manobra · 3 SA</button>
          </div>
          <p className="ficha-local-legenda">Use o registro de Manobra somente após uma regra autorizar o gasto. Contra-Ataque, por exemplo, exige defesa bem-sucedida e 1 SA + Reação. O painel não faz rolagens nem presume gatilhos.</p>

          <h4>Controle do turno</h4>
          <div className="recursos-controles">
            {estado.turnoEmAndamento
              ? <button type="button" disabled={salvando} onClick={() => void aplicar(encerrarTurnoAcoes)}>Registrar fim do meu turno</button>
              : <button type="button" disabled={salvando} onClick={() => void aplicar(iniciarTurnoAcoes)}>Registrar início do meu turno</button>}
          </div>
          {erro && <p className="offline-erro" role="alert">{erro}</p>}
          {confirmacao && <p className="offline-status" role="status">{confirmacao}</p>}
          {salvando && <p className="ficha-local-legenda" role="status">Salvando no dispositivo…</p>}
        </>}
  </details>;
}
