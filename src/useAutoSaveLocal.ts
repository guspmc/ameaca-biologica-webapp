import { useEffect, useRef, useState } from 'react';

export type EstadoAutoSaveLocal = 'ocioso' | 'pendente' | 'sincronizando' | 'salvo' | 'erro' | 'invalido';

type Opcoes<T> = {
  valor: T;
  chave: string;
  sujo: boolean;
  aoSalvar: (valor: T) => Promise<boolean>;
  validar?: (valor: T) => string | null;
  aoConfirmar: () => void;
  atraso?: number;
};

export function useAutoSaveLocal<T>({
  valor, chave, sujo, aoSalvar, validar, aoConfirmar, atraso = 650,
}: Opcoes<T>) {
  const [estado, setEstado] = useState<EstadoAutoSaveLocal>('ocioso');
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const versao = useRef(0);
  const referencias = useRef({ valor, aoSalvar, validar, aoConfirmar });
  referencias.current = { valor, aoSalvar, validar, aoConfirmar };

  useEffect(() => {
    if (!sujo) return;
    const versaoAtual = ++versao.current;
    setEstado('pendente');
    setErro('');
    const temporizador = window.setTimeout(async () => {
      const atual = referencias.current.valor;
      const erroValidacao = referencias.current.validar?.(atual) ?? null;
      if (erroValidacao) {
        if (versao.current === versaoAtual) {
          setEstado('invalido');
          setErro(erroValidacao);
        }
        return;
      }
      setEstado('sincronizando');
      setErro('');
      try {
        const confirmado = await referencias.current.aoSalvar(atual);
        if (versao.current !== versaoAtual) return;
        if (!confirmado) throw new Error('O servidor não confirmou o salvamento.');
        setEstado('salvo');
        setErro('');
        referencias.current.aoConfirmar();
      } catch (problema) {
        if (versao.current !== versaoAtual) return;
        setEstado('erro');
        setErro(problema instanceof Error ? problema.message : 'Não foi possível confirmar o salvamento.');
      }
    }, atraso);
    return () => window.clearTimeout(temporizador);
  }, [chave, sujo, tentativa, atraso]);

  useEffect(() => () => { versao.current += 1; }, []);

  return {
    estado,
    erro,
    tentarNovamente: () => setTentativa(atual => atual + 1),
  };
}
