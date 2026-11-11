import { useEffect, useRef, useState } from 'react';
import { lembretesCondicoesPorTurno } from './condicoesFicha';
import {
  comprarRecursoPorEsforco, consumirAcaoCompleta, consumirInteracaoGratuita,
  consumirRecursoNormal, gastarSAEmManobra,
  saNaJanelaEsforco, type EstadoEconomiaAcoes, type RecursoAcao,
} from './economiaAcoes';
import {
  aplicarManobraCombate, aplicarReacaoCombate, carregarEstadoTurnoCombate, encerrarTurnoCombate,
  iniciarTurnoCombate, registrarResolucaoAtaqueAdicional, registrarFinalizacaoDupla, type EstadoTurnoCombate,
} from './estadoTurnoCombate';
import { registrarCombateDuasArmas, registrarDisparada, registrarFuga, registrarMirar, registrarAtaque, registrarFinalizar, registrarAjudar } from './manobrasOperacionais';
import { avaliarAtaqueOportunidade, registrarAtaqueOportunidade, prepararContraAtaque, consultarRetaliacao, avaliarNaoVaiEscapar, registrarNaoVaiEscapar } from './reacoesCombate';

type Props = {
  dados: Record<string, unknown>;
  saAtual: number;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
  origemDados?: 'local' | 'servidor';
  origem?: string;
  habilidadesAtivas?: string[];
};

const RECURSOS: { id: RecursoAcao; nome: string; custo: string }[] = [
  { id: 'acao', nome: 'Ação', custo: '2 SA' },
  { id: 'movimento', nome: 'Movimento', custo: '1 SA' },
  { id: 'acaoBonus', nome: 'Ação Bônus', custo: '1 SA' },
  { id: 'reacao', nome: 'Reação', custo: '1 SA' },
];

function carregarEstado(dados: Record<string, unknown>, saAtual: number) {
  return carregarEstadoTurnoCombate(dados.estadoTurnoCombate, dados.economiaAcoes, saAtual);
}

function comEconomia(
  estado: EstadoTurnoCombate,
  operacao: (economia: EstadoEconomiaAcoes) => EstadoEconomiaAcoes,
): EstadoTurnoCombate {
  return { ...estado, economia: operacao(estado.economia) };
}

export default function PainelAcoesLocal({ dados, saAtual, aoSalvar, origemDados = 'local', origem = '', habilidadesAtivas = [] }: Props) {
  const estadoInicial = carregarEstado(dados, saAtual);
  const chaveInicial = JSON.stringify([dados.estadoTurnoCombate ?? null, dados.economiaAcoes ?? null, saAtual]);
  const [inicial, setInicial] = useState(estadoInicial);
  const [estado, setEstado] = useState(estadoInicial.estado);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [confirmouDuasArmas, setConfirmouDuasArmas] = useState(false);
  const [confirmouAjudarElegivel, setConfirmouAjudarElegivel] = useState(false);
  const [confirmouTreinamentoAjudar, setConfirmouTreinamentoAjudar] = useState(false);
  const [confirmouAliadoFinalizou, setConfirmouAliadoFinalizou] = useState(false);
  const [confirmouAlvoSobreviveu, setConfirmouAlvoSobreviveu] = useState(false);
  const [confirmouAindaNaoAgio, setConfirmouAindaNaoAgio] = useState(false);
  const [confirmouSaidaVoluntaria, setConfirmouSaidaVoluntaria] = useState(false);
  const [confirmouQuadradoAmeacado, setConfirmouQuadradoAmeacado] = useState(false);
  const [confirmouSemProtecaoAoO, setConfirmouSemProtecaoAoO] = useState(false);
  const [confirmouDefesaBemSucedida, setConfirmouDefesaBemSucedida] = useState(false);
  const [confirmouAtaqueCorpoACorpo, setConfirmouAtaqueCorpoACorpo] = useState(false);
  const [confirmouReacaoDaDefesa, setConfirmouReacaoDaDefesa] = useState(false);
  const [confirmouAoOParaVoceOuAliado, setConfirmouAoOParaVoceOuAliado] = useState(false);
  const [confirmouCombateCorpoACorpo, setConfirmouCombateCorpoACorpo] = useState(false);
  const bloqueioOperacao = useRef(false);
  useEffect(() => {
    if (salvando) return;
    setInicial(estadoInicial);
    setEstado(estadoInicial.estado);
  }, [chaveInicial, salvando]);

  async function aplicar(operacao: (atual: EstadoTurnoCombate) => EstadoTurnoCombate, mensagemConfirmada?: string) {
    if (!inicial.valido || salvando || bloqueioOperacao.current) return;
    bloqueioOperacao.current = true;
    try {
      const proximo = operacao(estado);
      setSalvando(true);
      setErro('');
      setConfirmacao('');
      const salvo = await aoSalvar({ saAtual: proximo.economia.saAtual, estadoTurnoCombate: proximo, economiaAcoes: proximo.economia, economiaAcoesSaldoBase: estado.economia.saAtual });
      if (!salvo) throw new Error('O salvamento não foi confirmado. Nenhum gasto foi registrado na ficha.');
      setEstado(proximo);
      if ((!estado.economia.turnoEmAndamento && proximo.economia.turnoEmAndamento)
        || (!estado.manobras.combateDuasArmasUsado && proximo.manobras.combateDuasArmasUsado)) {
        setConfirmouDuasArmas(false);
      }
      if (mensagemConfirmada?.startsWith('Ajudar')) {
        setConfirmouAjudarElegivel(false);
        setConfirmouTreinamentoAjudar(false);
      }
      if (!estado.economia.turnoEmAndamento && proximo.economia.turnoEmAndamento) {
        setConfirmouAjudarElegivel(false);
        setConfirmouTreinamentoAjudar(false);
      }
      if (!estado.proximoTurnoComprometido && proximo.proximoTurnoComprometido) {
        setConfirmouAliadoFinalizou(false);
        setConfirmouAlvoSobreviveu(false);
        setConfirmouAindaNaoAgio(false);
      }
      if (mensagemConfirmada?.startsWith('Ataque de Oportunidade')) {
        setConfirmouSaidaVoluntaria(false);
        setConfirmouQuadradoAmeacado(false);
        setConfirmouSemProtecaoAoO(false);
      }
      if (mensagemConfirmada?.startsWith('Contra-Ataque registrado')) {
        setConfirmouDefesaBemSucedida(false);
        setConfirmouAtaqueCorpoACorpo(false);
        setConfirmouReacaoDaDefesa(false);
      }
      if (mensagemConfirmada?.startsWith('Não Vai Escapar registrado')) {
        setConfirmouAoOParaVoceOuAliado(false);
        setConfirmouCombateCorpoACorpo(false);
      }
      setConfirmacao(mensagemConfirmada ?? (origemDados === 'servidor' ? 'Economia de ações confirmada pelo servidor.' : 'Economia de ações salva neste dispositivo.'));
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível registrar a ação.');
    } finally {
      bloqueioOperacao.current = false;
      setSalvando(false);
    }
  }

  const economia = estado.economia;
  const janela = saNaJanelaEsforco(economia);
  const retaliacao = consultarRetaliacao({
    habilidadeAtiva: habilidadesAtivas.includes('retaliacao'),
    defesaBemSucedida: confirmouDefesaBemSucedida,
  });
  return <details className="ficha-local-editor painel-acoes-local">
    <summary>Economia de Ações · {saNaJanelaEsforco(economia)}/3 SA · {economia.turnoEmAndamento ? 'Meu turno ativo' : 'Meu turno encerrado'}</summary>
    {!inicial.valido
      ? <p className="offline-erro" role="alert">O registro salvo da economia de ações está inválido. Ele foi preservado e o painel foi bloqueado para evitar sobrescrever dados.</p>
      : <>
          <div className="ficha-local-grade">
            <div><small>SURTO DE ADRENALINA</small><strong>{economia.saAtual} SA</strong><p>Disponível para Esforço e Manobras.</p></div>
            <div><small>JANELA DE 3 SA</small><strong>{janela}/3 SA</strong><p>Gasto do fim do último turno ao fim deste turno.</p></div>
            <div><small>TURNO DA PERSONAGEM</small><strong>{economia.turnoEmAndamento ? 'Em andamento' : 'Encerrado'}</strong><p>O painel apenas renova seus próprios marcadores; não controla a Iniciativa nem os turnos do Encontro.</p></div>
            <div><small>PRÓXIMO TURNO</small><strong>{estado.proximoTurnoComprometido ? 'Ação + Movimento comprometidos' : 'Sem compromisso'}</strong><p>Penalidade da Finalização Dupla, quando registrada.</p></div>
            <div><small>INTERAÇÃO GRATUITA</small><strong>{economia.interacaoGratuitaUsada ? 'Utilizada' : 'Disponível'}</strong><p>Recurso paralelo, não comprado por Esforço.</p></div>
          </div>

          <h4>Recursos normais</h4>
          <div className="painel-acoes-lista">
            {RECURSOS.map(recurso => {
              const foraDoTurno = !economia.turnoEmAndamento && recurso.id !== 'reacao';
              const usado = economia.normaisUsados[recurso.id];
              return <div className="painel-acoes-linha" key={recurso.id}>
                <span><strong>{recurso.nome}</strong><small>{usado ? 'Uso normal registrado' : 'Uso normal disponível'} · Extras por Esforço: {economia.comprasEsforco[recurso.id]}</small></span>
                <button type="button" disabled={salvando || foraDoTurno || usado} onClick={() => void aplicar(atual => comEconomia(atual, economiaAtual => consumirRecursoNormal(economiaAtual, recurso.id)))}>Usar</button>
                <button type="button" disabled={salvando || foraDoTurno || economia.saAtual < (recurso.id === 'acao' ? 2 : 1) || janela >= 3} onClick={() => void aplicar(atual => comEconomia(atual, economiaAtual => comprarRecursoPorEsforco(economiaAtual, recurso.id)))}>Comprar · {recurso.custo}</button>
              </div>;
            })}
          </div>

          <h4>Contra-Ataque</h4>
          <div className="ficha-local-editor">
            <p>Depois de Aparar ou Esquivar com sucesso, você pode gastar 1 SA e usar uma Reação para fazer um Ataque normal contra a Defesa do agressor. Por padrão, responde apenas a Ataques Corpo a Corpo; Habilidades podem criar exceções. O painel registra custos e condições confirmadas, mas não executa o Ataque.</p>
            <label><input type="checkbox" checked={confirmouDefesaBemSucedida} disabled={salvando} onChange={evento => setConfirmouDefesaBemSucedida(evento.target.checked)} /> Confirmo que Aparar ou Esquivar foi bem-sucedido.</label>
            <label><input type="checkbox" checked={confirmouAtaqueCorpoACorpo} disabled={salvando} onChange={evento => setConfirmouAtaqueCorpoACorpo(evento.target.checked)} /> O Ataque que originou a defesa foi Corpo a Corpo.</label>
            {economia.normaisUsados.reacao && habilidadesAtivas.includes('contra-ataque-instintivo') && <label><input type="checkbox" checked={confirmouReacaoDaDefesa} disabled={salvando} onChange={evento => setConfirmouReacaoDaDefesa(evento.target.checked)} /> Confirmo que a Reação já consumida foi a usada nesta defesa bem-sucedida; Contra-Ataque Instintivo permite aproveitá-la.</label>}
            {retaliacao.atordoaAgressor && <p className="ficha-local-legenda">Retaliação: o agressor fica Atordoado; seu Contra-Ataque recebe Vantagem e acrescenta 1 dado de Dano se acertar. A aplicação ao agressor e a rolagem permanecem manuais.</p>}
            <p className="ficha-local-legenda">{economia.normaisUsados.reacao
              ? habilidadesAtivas.includes('contra-ataque-instintivo')
                ? 'Se a Reação usada foi a defesa confirmada acima, marque a confirmação para Contra-Ataque Instintivo reutilizá-la; se não marcar, o registro comprará uma Reação adicional por 1 SA.'
                : 'Sua Reação normal já foi usada: o Contra-Ataque precisará comprar outra Reação por 1 SA, além do custo de 1 SA da Manobra.'
              : 'O registro consumirá sua Reação normal e 1 SA pela Manobra.'}</p>
            <button type="button"
              disabled={salvando || !confirmouDefesaBemSucedida || !confirmouAtaqueCorpoACorpo
                || economia.saAtual < (economia.normaisUsados.reacao && !(habilidadesAtivas.includes('contra-ataque-instintivo') && confirmouReacaoDaDefesa) ? 2 : 1)
                || janela + (economia.normaisUsados.reacao && !(habilidadesAtivas.includes('contra-ataque-instintivo') && confirmouReacaoDaDefesa) ? 2 : 1) > 3}
              onClick={() => void aplicar(atual => aplicarReacaoCombate(atual, economiaAtual =>
                prepararContraAtaque({
                  economia: economiaAtual,
                  defesaBemSucedida: confirmouDefesaBemSucedida,
                  ataqueCorpoACorpo: confirmouAtaqueCorpoACorpo,
                  mesmaReacaoAutorizada: habilidadesAtivas.includes('contra-ataque-instintivo') && confirmouReacaoDaDefesa,
                }),
              ).estado, economia.normaisUsados.reacao && !(habilidadesAtivas.includes('contra-ataque-instintivo') && confirmouReacaoDaDefesa)
                ? 'Contra-Ataque registrado: Reação adicional comprada por 1 SA e custo de Manobra de 1 SA. Execute o Ataque manualmente.'
                : 'Contra-Ataque registrado: custo de Manobra de 1 SA. Execute o Ataque manualmente.')}>Registrar Contra-Ataque · Reação + 1 SA</button>
          </div>

          {habilidadesAtivas.includes('nao-vai-escapar') && <div className="ficha-local-editor">
            <h4>Não Vai Escapar · Ataque de Oportunidade</h4>
            <p>Quando uma criatura provocar Ataque de Oportunidade para você ou para um aliado em combate Corpo a Corpo, você pode usar sua Reação para atacá-la. Imediatamente antes do Ataque, pode deslocar-se até 3 m, terminando adjacente ao alvo; esse deslocamento não provoca Ataques de Oportunidade. A Ficha registra a Reação; o deslocamento e o Ataque continuam manuais.</p>
            <label><input type="checkbox" checked={confirmouAoOParaVoceOuAliado} disabled={salvando} onChange={evento => setConfirmouAoOParaVoceOuAliado(evento.target.checked)} /> Confirmo que a criatura provocou Ataque de Oportunidade para mim ou para um aliado.</label>
            <label><input type="checkbox" checked={confirmouCombateCorpoACorpo} disabled={salvando} onChange={evento => setConfirmouCombateCorpoACorpo(evento.target.checked)} /> Confirmo que o gatilho ocorreu em combate Corpo a Corpo.</label>
            <p className="ficha-local-legenda">{economia.normaisUsados.reacao ? 'A Reação normal já foi usada: este registro comprará outra Reação por 1 SA.' : 'O registro consumirá sua Reação normal, sem custo de SA.'}</p>
            <button type="button"
              disabled={salvando || !confirmouAoOParaVoceOuAliado || !confirmouCombateCorpoACorpo
                || (economia.normaisUsados.reacao && (economia.saAtual < 1 || janela >= 3))}
              onClick={() => {
                const avaliacao = avaliarNaoVaiEscapar({
                  habilidadeAtiva: habilidadesAtivas.includes('nao-vai-escapar'),
                  criaturaProvocouAtaqueDeOportunidade: true,
                  gatilhoFoiParaVoceOuAliado: confirmouAoOParaVoceOuAliado,
                  combateCorpoACorpo: confirmouCombateCorpoACorpo,
                });
                const comprada = economia.normaisUsados.reacao;
                void aplicar(atual => aplicarReacaoCombate(atual, economiaAtual =>
                  registrarNaoVaiEscapar({ economia: economiaAtual, avaliacao }),
                ).estado, comprada
                  ? 'Não Vai Escapar registrado: Reação adicional comprada por 1 SA. Desloque-se até 3 m e termine adjacente antes do Ataque.'
                  : 'Não Vai Escapar registrado: Reação normal consumida. Desloque-se até 3 m e termine adjacente antes do Ataque.');
              }}>Registrar Não Vai Escapar · Reação</button>
          </div>}

          <h4>Ataque de Oportunidade</h4>
          <div className="ficha-local-editor">
            <p>Registre somente depois de confirmar com a Mesa que a criatura saiu voluntariamente de um quadrado ameaçado por você e não estava protegida contra esse gatilho. O Ataque não interrompe o Movimento do alvo. A Ficha registra a Reação, mas não realiza o Ataque nem verifica posições.</p>
            <label><input type="checkbox" checked={confirmouSaidaVoluntaria} disabled={salvando} onChange={evento => setConfirmouSaidaVoluntaria(evento.target.checked)} /> A saída da criatura foi voluntária.</label>
            <label><input type="checkbox" checked={confirmouQuadradoAmeacado} disabled={salvando} onChange={evento => setConfirmouQuadradoAmeacado(evento.target.checked)} /> A criatura saiu de um quadrado ameaçado por mim.</label>
            <label><input type="checkbox" checked={confirmouSemProtecaoAoO} disabled={salvando} onChange={evento => setConfirmouSemProtecaoAoO(evento.target.checked)} /> A criatura não estava protegida contra Ataque de Oportunidade.</label>
            <p className="ficha-local-legenda">{economia.normaisUsados.reacao ? 'Sua Reação normal já foi usada: registrar este Ataque comprará outra Reação por 1 SA, respeitando a janela de 3 SA.' : 'O registro consumirá sua Reação normal, sem custo de SA.'}</p>
            <button type="button"
              disabled={salvando || !confirmouSaidaVoluntaria || !confirmouQuadradoAmeacado || !confirmouSemProtecaoAoO || (economia.normaisUsados.reacao && (economia.saAtual < 1 || janela >= 3))}
              onClick={() => {
                const gatilho = avaliarAtaqueOportunidade({
                  saiuVoluntariamente: confirmouSaidaVoluntaria,
                  saiuQuadradoAmeacado: confirmouQuadradoAmeacado,
                  protegidoContraGatilho: !confirmouSemProtecaoAoO,
                });
                const comprada = economia.normaisUsados.reacao;
                void aplicar(atual => aplicarReacaoCombate(atual, economiaAtual =>
                  registrarAtaqueOportunidade({ economia: economiaAtual, gatilho }),
                ).estado, comprada
                  ? 'Ataque de Oportunidade registrado: Reação adicional comprada por 1 SA. O Movimento do alvo não é interrompido.'
                  : 'Ataque de Oportunidade registrado: Reação normal consumida. O Movimento do alvo não é interrompido.');
              }}>Registrar Ataque de Oportunidade · Reação</button>
          </div>

          <h4>Ajudar</h4>
          <div className="ficha-local-editor">
            <p>Ajudar consome sua Ação. Quando a tarefa puder receber auxílio e você cumprir os requisitos de treinamento, o aliado recebe Vantagem no Teste. A Ficha não decide se a tarefa pode ser ajudada nem quais requisitos se aplicam: confirme isso com a Mesa.</p>
            <label><input type="checkbox" checked={confirmouAjudarElegivel} disabled={salvando || !economia.turnoEmAndamento || economia.normaisUsados.acao} onChange={evento => setConfirmouAjudarElegivel(evento.target.checked)} /> Confirmo que a tarefa admite auxílio e que cumpro os requisitos de treinamento.</label>
            {origem === 'Servidor Público' && <>
              <label><input type="checkbox" checked={confirmouTreinamentoAjudar} disabled={salvando || !confirmouAjudarElegivel || !economia.turnoEmAndamento || economia.normaisUsados.acao} onChange={evento => setConfirmouTreinamentoAjudar(evento.target.checked)} /> Confirmo que sou Treinado ou Mestre na Perícia do Teste do aliado.</label>
              <p className="ficha-local-legenda">Servidor Público: além da Vantagem normal de Ajudar, o aliado recebe +2 no Teste de Perícia.</p>
            </>}
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || economia.normaisUsados.acao || !confirmouAjudarElegivel || (origem === 'Servidor Público' && !confirmouTreinamentoAjudar)}
              onClick={() => void aplicar(atual => aplicarManobraCombate(atual, registrarAjudar).estado, origem === 'Servidor Público' ? 'Ajudar registrado: Ação consumida; aliado recebe Vantagem e +2 no Teste de Perícia, conforme as confirmações.' : 'Ajudar registrado: Ação consumida; aliado recebe Vantagem, conforme as confirmações.')}>Registrar Ajudar · Ação</button>
          </div>

          <h4>Ação Completa e Interação Gratuita</h4>
          <div className="recursos-controles">
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || economia.normaisUsados.acao || economia.normaisUsados.movimento} onClick={() => void aplicar(atual => comEconomia(atual, consumirAcaoCompleta))}>Ação Completa · Ação + Movimento</button>
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || economia.interacaoGratuitaUsada} onClick={() => void aplicar(atual => comEconomia(atual, consumirInteracaoGratuita))}>Registrar Interação Gratuita</button>
          </div>

          <h4>Manobras com gasto de SA</h4>
          <div className="recursos-controles">
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || economia.saAtual < 1 || janela >= 3} onClick={() => void aplicar(atual => comEconomia(atual, economiaAtual => gastarSAEmManobra(economiaAtual, 1)))}>Registrar Manobra · 1 SA</button>
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || economia.saAtual < 3 || janela > 0} onClick={() => void aplicar(atual => comEconomia(atual, economiaAtual => gastarSAEmManobra(economiaAtual, 3)))}>Registrar Manobra · 3 SA</button>
          </div>
          <p className="ficha-local-legenda">Use o registro de Manobra somente após uma regra autorizar o gasto. Contra-Ataque, por exemplo, exige defesa bem-sucedida e 1 SA + Reação. O painel não faz rolagens nem presume gatilhos.</p>

          <h4>Finalizar e Finalização Dupla</h4>
          <div className="recursos-controles">
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || economia.saAtual < 3 || janela + 3 > 3} onClick={() => void aplicar(atual => aplicarManobraCombate(atual, registrarFinalizar).estado)}>Registrar Finalizar · 3 SA</button>
          </div>
          <p className="ficha-local-legenda">Finalizar não consome Ação nem Movimento normais. O Ataque contra a Defesa e o deslocamento de até seu Movimento exclusivamente para alcançar o alvo fazem parte da Manobra e continuam sendo resolvidos manualmente. Em acerto, registre a Fortitude do alvo contra DT igual ao resultado do Ataque; a Ficha não rola pelo alvo nem aplica Dano.</p>
          <div className="ficha-local-editor">
            <strong>Finalização Dupla · Reação + 3 SA</strong>
            <p>Confirme as três condições da regra antes de registrar: um aliado Finalizou, o alvo sobreviveu e esta personagem ainda não agiu na rodada. A confirmação é contextual e não é inferida pela Ficha.</p>
            <label><input type="checkbox" checked={confirmouAliadoFinalizou} disabled={salvando || estado.proximoTurnoComprometido} onChange={evento => setConfirmouAliadoFinalizou(evento.target.checked)} /> Um aliado realizou Finalizar.</label>
            <label><input type="checkbox" checked={confirmouAlvoSobreviveu} disabled={salvando || estado.proximoTurnoComprometido} onChange={evento => setConfirmouAlvoSobreviveu(evento.target.checked)} /> O alvo sobreviveu à primeira Finalização.</label>
            <label><input type="checkbox" checked={confirmouAindaNaoAgio} disabled={salvando || estado.proximoTurnoComprometido} onChange={evento => setConfirmouAindaNaoAgio(evento.target.checked)} /> Minha personagem ainda não agiu nesta rodada.</label>
            <button type="button" disabled={salvando || estado.proximoTurnoComprometido || economia.normaisUsados.reacao || economia.saAtual < 3 || janela + 3 > 3 || !confirmouAliadoFinalizou || !confirmouAlvoSobreviveu || !confirmouAindaNaoAgio}
              onClick={() => void aplicar(atual => registrarFinalizacaoDupla(atual, { aliadoFinalizou: confirmouAliadoFinalizou, alvoSobreviveu: confirmouAlvoSobreviveu, personagemAindaNaoAgioNaRodada: confirmouAindaNaoAgio }))}>Registrar Finalização Dupla</button>
            {estado.proximoTurnoComprometido && <p role="status">Ação e Movimento do próximo turno estão comprometidos. Ação Bônus e Ação Livre permanecem disponíveis.</p>}
          </div>

          <h4>Manobras registradas</h4>
          <div className="ficha-local-grade">
            <div><small>DISPARADA</small><strong>{estado.manobras.disparadaUsada ? 'Utilizada' : 'Disponível'}</strong></div>
            <div><small>FUGA</small><strong>{estado.manobras.fugaUsada ? 'Utilizada' : 'Não utilizada'}</strong></div>
            <div><small>MIRAR</small><strong>{estado.manobras.mirarPreparado ? 'Preparado para o próximo Ataque' : 'Não preparado'}</strong></div>
            <div><small>DUAS ARMAS</small><strong>{estado.manobras.combateDuasArmasUsado ? 'Utilizado' : 'Não utilizado'}</strong></div>
            <div><small>MOVIMENTOS ADICIONAIS</small><strong>{estado.movimentosAdicionaisConcedidos}</strong><p>Concedidos por Disparada/Fuga; o deslocamento é realizado pela Mesa.</p></div>
            <div><small>ATAQUE ADICIONAL</small><strong>{estado.ataqueAdicionalAutorizado ? 'Autorizado' : 'Não autorizado'}</strong><p>O painel registra a autorização, sem executar o Ataque.</p></div>
          </div>
          <div className="recursos-controles">
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || estado.manobras.mirarPreparado || economia.saAtual < 1 || janela >= 3} onClick={() => void aplicar(atual => aplicarManobraCombate(atual, registrarMirar).estado)}>Mirar · 1 SA</button>
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || estado.manobras.disparadaUsada || economia.normaisUsados.acao} onClick={() => void aplicar(atual => aplicarManobraCombate(atual, registrarDisparada).estado)}>Disparada</button>
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || !estado.manobras.disparadaUsada || estado.manobras.fugaUsada || economia.saAtual < 1 || janela >= 3} onClick={() => void aplicar(atual => aplicarManobraCombate(atual, registrarFuga).estado)}>Fuga · 1 SA</button>
            <button type="button" disabled={salvando || !economia.turnoEmAndamento || !estado.manobras.mirarPreparado || economia.normaisUsados.acao} onClick={() => void aplicar(atual => aplicarManobraCombate(atual, registrarAtaque).estado)}>Registrar Ataque (consome Mirar)</button>
          </div>
          <p className="ficha-local-legenda">Estes controles registram custos e marcadores. Disparada/Fuga não movem a personagem; Mirar não rola o Ataque nem aplica o bônus. O registro de Ataque consome a preparação de Mirar, mas a resolução continua manual.</p>

          <div className="ficha-local-editor">
            <strong>Combate com Duas Armas · 1 vez por turno</strong>
            <p>Após usar a Ação Atacar com uma Arma Corpo a Corpo de Grau Comum e Mãos 1 empunhada em uma mão, você pode gastar a Ação Bônus para realizar um Ataque adicional com outra arma que cumpra os mesmos requisitos, empunhada na outra mão. O Ataque adicional não adiciona FOR ao Dano.</p>
            <label><input type="checkbox" checked={confirmouDuasArmas} disabled={salvando || !economia.turnoEmAndamento || estado.manobras.combateDuasArmasUsado} onChange={evento => setConfirmouDuasArmas(evento.target.checked)} /> Confirmo que o Ataque inicial e as duas armas cumprem os requisitos descritos.</label>
            <div className="recursos-controles">
              <button type="button" disabled={salvando || !economia.turnoEmAndamento || !economia.normaisUsados.acao || economia.normaisUsados.acaoBonus || estado.manobras.combateDuasArmasUsado || !confirmouDuasArmas} onClick={() => void aplicar(atual => aplicarManobraCombate(atual, (economiaAtual, manobras) => registrarCombateDuasArmas(economiaAtual, manobras, true)).estado)}>Registrar Combate com Duas Armas · Ação Bônus</button>
              <button type="button" disabled={salvando || !economia.turnoEmAndamento || !estado.ataqueAdicionalAutorizado} onClick={() => void aplicar(registrarResolucaoAtaqueAdicional)}>Registrar Ataque adicional realizado</button>
            </div>
            <p className="ficha-local-legenda">O aplicativo registra a elegibilidade confirmada pelo jogador e o gasto da Ação Bônus. O Ataque e sua rolagem continuam manuais; registrar sua realização apenas consome a autorização pendente.</p>
          </div>

          <h4>Condições que exigem atenção neste turno</h4>
          {economia.turnoEmAndamento ? (() => {
            const lembretes = lembretesCondicoesPorTurno(dados.condicoes);
            return lembretes.inicio.length || lembretes.fim.length ? <div className="ficha-local-editor">
              {lembretes.inicio.length > 0 && <><strong>Início do turno</strong><ul>{lembretes.inicio.map(item => <li key={item}>{item}</li>)}</ul></>}
              {lembretes.fim.length > 0 && <><strong>Fim do turno</strong><ul>{lembretes.fim.map(item => <li key={item}>{item}</li>)}</ul></>}
              <small>Estes são lembretes de consulta. A ficha não faz Testes, não aplica Dano e não encerra Condições automaticamente.</small>
            </div> : <p>Nenhuma Condição ativa exige uma verificação automática de início/fim de turno neste painel.</p>;
          })() : <p>Inicie seu turno para exibir os lembretes de Condições com efeitos por turno.</p>}
          <h4>Controle do turno</h4>
          <div className="recursos-controles">
            {economia.turnoEmAndamento
              ? <button type="button" disabled={salvando} onClick={() => void aplicar(encerrarTurnoCombate)}>Registrar fim do meu turno</button>
              : <button type="button" disabled={salvando} onClick={() => void aplicar(iniciarTurnoCombate)}>Registrar início do meu turno</button>}
          </div>
          {erro && <p className="offline-erro" role="alert">{erro}</p>}
          {confirmacao && <p className="offline-status" role="status">{confirmacao}</p>}
          {salvando && <p className="ficha-local-legenda" role="status">Salvando alterações…</p>}
        </>}
  </details>;
}
