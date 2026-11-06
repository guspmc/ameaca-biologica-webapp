import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAutoSaveLocal } from './useAutoSaveLocal';

type Opcoes<T> = {
  autoSalvar: boolean;
  valor: T;
  chave: string;
  sujo: boolean;
  setSujo: Dispatch<SetStateAction<boolean>>;
  aoSalvar: (valor: T) => Promise<boolean>;
  aoAlterarPendencia: (pendente: boolean) => void;
  mensagemSucesso?: string;
  atraso?: number;
};

export function useSalvamentoEditorLocal<T>({
  autoSalvar, valor, chave, sujo, setSujo, aoSalvar, aoAlterarPendencia, mensagemSucesso, atraso,
}: Opcoes<T>) {
  const [salvandoManual, setSalvandoManual] = useState(false);
  const [erroManual, setErroManual] = useState('');
  const [sucessoManual, setSucessoManual] = useState('');
  const autosave = useAutoSaveLocal({
    valor,
    chave,
    sujo: autoSalvar && sujo,
    aoSalvar,
    atraso,
    aoConfirmar: () => { setSujo(false); aoAlterarPendencia(false); },
  });

  const salvarManual = useCallback(async () => {
    if (autoSalvar || !sujo || salvandoManual) return;
    setSalvandoManual(true);
    setErroManual('');
    setSucessoManual('');
    try {
      const confirmado = await aoSalvar(valor);
      if (!confirmado) throw new Error('O armazenamento não confirmou o salvamento.');
      setSujo(false);
      aoAlterarPendencia(false);
      setSucessoManual(mensagemSucesso ?? 'Alterações salvas neste dispositivo.');
    } catch (problema) {
      setErroManual(problema instanceof Error ? problema.message : 'Não foi possível confirmar o salvamento.');
    } finally {
      setSalvandoManual(false);
    }
  }, [autoSalvar, sujo, salvandoManual, aoSalvar, valor, setSujo, aoAlterarPendencia, mensagemSucesso]);

  return {
    autosave,
    ocupado: autoSalvar ? autosave.estado === 'sincronizando' : salvandoManual,
    salvarManual,
    salvandoManual,
    erroManual,
    sucessoManual,
  };
}
