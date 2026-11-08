import { useEffect, useMemo, useState } from 'react';
import {
  HABILIDADES_PROGRESSAO,
  ganhosProgressaoAte,
  validarProgressaoHabilidades,
  type EscolhaHabilidadeProgressao,
} from './progressaoHabilidades';

type Planejamento = { nivelAlvo: number; habilidades: EscolhaHabilidadeProgressao[] };
type Props = {
  classe: string;
  inicial?: Planejamento | null;
  aoSalvar: (planejamento: Planejamento) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  autoSalvar?: boolean;
};

export default function PlanejadorHabilidadesCriacaoLocal({
  classe, inicial, aoSalvar, aoAlterarPendencia, autoSalvar = false,
}: Props) {
  const [nivelAlvo, setNivelAlvo] = useState(inicial?.nivelAlvo ?? 1);
  const [habilidades, setHabilidades] = useState<EscolhaHabilidadeProgressao[]>(inicial?.habilidades ?? []);
  const [sujo, setSujo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const chaveInicial = JSON.stringify(inicial ?? null);
  useEffect(() => {
    if (sujo) return;
    setNivelAlvo(inicial?.nivelAlvo ?? 1);
    setHabilidades(inicial?.habilidades ?? []);
  }, [chaveInicial, sujo]);

  const ganhos = useMemo(() => ganhosProgressaoAte(nivelAlvo).habilidades, [nivelAlvo]);
  const escolhasPorNivel = new Map(habilidades.map(escolha => [escolha.nivel, escolha.habilidadeId]));
  const completas = habilidades.length === ganhos.length
    && ganhos.every(ganho => escolhasPorNivel.has(ganho.nivel));
  const validacao = completas
    ? validarProgressaoHabilidades(classe, nivelAlvo, habilidades)
    : { valida: false, pendencias: [] as { nivel: number; motivo: string }[] };

  function alterarNivel(valor: number) {
    setNivelAlvo(valor);
    const niveisPermitidos = new Set(ganhosProgressaoAte(valor).habilidades.map(item => item.nivel));
    setHabilidades(atuais => atuais.filter(item => niveisPermitidos.has(item.nivel)));
    setSujo(true);
    setErro('');
    setSucesso('');
    aoAlterarPendencia(true);
  }

  function alterarHabilidade(nivel: number, habilidadeId: string) {
    setHabilidades(atuais => {
      const semNivel = atuais.filter(item => item.nivel !== nivel);
      return habilidadeId ? [...semNivel, { nivel, habilidadeId }].sort((a, b) => a.nivel - b.nivel) : semNivel;
    });
    setSujo(true);
    setErro('');
    setSucesso('');
    aoAlterarPendencia(true);
  }

  async function salvar() {
    if (!Number.isInteger(nivelAlvo) || nivelAlvo < 1 || nivelAlvo > 10) {
      setErro('Escolha um Nível-alvo entre 1 e 10.');
      return;
    }
    if (completas && !validacao.valida) {
      setErro(validacao.pendencias.map(item => 'Nível ' + item.nivel + ': ' + item.motivo).join(' '));
      return;
    }
    setOcupado(true);
    setErro('');
    setSucesso('');
    try {
      const confirmou = await aoSalvar({ nivelAlvo, habilidades });
      if (!confirmou) {
        setErro('O armazenamento não confirmou o planejamento. As alterações continuam pendentes.');
        return;
      }
      setSujo(false);
      aoAlterarPendencia(false);
      setSucesso(completas ? 'Planejamento de Habilidades salvo e validado.' : 'Rascunho parcial do planejamento salvo. Ainda há escolhas pendentes.');
    } catch {
      setErro('Não foi possível salvar o planejamento. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  return <div className="ficha-local-editor">
    <h3>Planejamento de criação em Nível superior</h3>
    <p>Este é um plano de criação, não uma evolução aplicada. O Nível efetivo, os Atributos, as Perícias e os recursos da personagem permanecem inalterados até a validação completa da criação.</p>
    <label>Nível-alvo do rascunho
      <select value={nivelAlvo} onChange={evento => alterarNivel(Number(evento.target.value))} disabled={ocupado}>
        {Array.from({ length: 10 }, (_, indice) => indice + 1).map(nivel => <option key={nivel} value={nivel}>Nível {nivel}</option>)}
      </select>
    </label>
    <strong>Habilidades previstas</strong>
    {ganhos.map(ganho => {
      const opcoes = HABILIDADES_PROGRESSAO.filter(item => item.classe === classe && item.grau === ganho.grau);
      return <label key={ganho.nivel}>Nível {ganho.nivel} · {ganho.grau === 'basica' ? 'Básica' : ganho.grau === 'avancada' ? 'Avançada' : ganho.grau === 'superior' ? 'Superior' : 'Avassaladora'}
        <select value={escolhasPorNivel.get(ganho.nivel) ?? ''} onChange={evento => alterarHabilidade(ganho.nivel, evento.target.value)} disabled={ocupado || !classe}>
          <option value="">Selecione uma Habilidade</option>
          {opcoes.map(item => <option key={item.id} value={item.id}>{item.nome} · {item.ramo}</option>)}
        </select>
      </label>;
    })}
    {!classe && <p role="alert">Defina a Classe antes de escolher as Habilidades da progressão.</p>}
    {completas && !validacao.valida && <p role="alert">{validacao.pendencias.map(item => 'Nível ' + item.nivel + ': ' + item.motivo).join(' ')}</p>}
    {!completas && <p className="ficha-local-legenda">Rascunho incompleto: faltam {ganhos.length - habilidades.length} escolha(s). Você pode salvar parcialmente e continuar depois.</p>}
    {erro && <p className="offline-erro" role="alert">{erro}</p>}
    {sucesso && <p className="offline-status" role="status">{sucesso}</p>}
    {sujo && <button type="button" className="botao-claro" disabled={ocupado} onClick={() => void salvar()}>{ocupado ? 'Salvando…' : 'Salvar planejamento'}</button>}
    {!sujo && sucesso && <small>Última alteração confirmada pelo armazenamento.</small>}
    {autoSalvar && <small>O planejamento permanece explícito e separado da aplicação dos ganhos da personagem.</small>}
  </div>;
}
