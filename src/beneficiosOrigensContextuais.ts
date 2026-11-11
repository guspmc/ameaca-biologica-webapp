export type EstadoBeneficioAmnesico = {
  versao: 1;
  usadoNaSessao: boolean;
  vantagemSobrevivenciaPendente: boolean;
};

export type EstadoBeneficioMilitar = {
  versao: 1;
  vantagemAtaqueFogoPendente: boolean;
};

export const beneficioAmnesicoInicial = (): EstadoBeneficioAmnesico => ({
  versao: 1, usadoNaSessao: false, vantagemSobrevivenciaPendente: false,
});

export const beneficioMilitarInicial = (): EstadoBeneficioMilitar => ({
  versao: 1, vantagemAtaqueFogoPendente: false,
});

function objetoSimples(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor)
    && Object.getPrototypeOf(valor) === Object.prototype;
}

export function beneficioAmnesicoValido(valor: unknown): valor is EstadoBeneficioAmnesico {
  return objetoSimples(valor)
    && Object.keys(valor).sort().join('|') === 'usadoNaSessao|vantagemSobrevivenciaPendente|versao'
    && valor.versao === 1
    && typeof valor.usadoNaSessao === 'boolean'
    && typeof valor.vantagemSobrevivenciaPendente === 'boolean';
}

export function registrarVislumbresDoPassado(
  estado: EstadoBeneficioAmnesico,
  confirmacoes: { localConhecido: boolean; tentativaRealizada: boolean; testeBemSucedido: boolean; informacaoUtil: boolean },
): EstadoBeneficioAmnesico {
  if (!beneficioAmnesicoValido(estado) || !confirmacoes || Object.keys(confirmacoes).sort().join('|') !== 'informacaoUtil|localConhecido|tentativaRealizada|testeBemSucedido'
    || Object.values(confirmacoes).some(valor => typeof valor !== 'boolean')) {
    throw new Error('Estado ou confirmações de Vislumbres do Passado inválidos.');
  }
  if (estado.usadoNaSessao) throw new Error('Vislumbres do Passado já foi usado nesta sessão.');
  if (!confirmacoes.localConhecido || !confirmacoes.tentativaRealizada) {
    throw new Error('Vislumbres do Passado exige local conhecido antes da amnésia e tentativa AST DT 10 realizada.');
  }
  if (confirmacoes.informacaoUtil && !confirmacoes.testeBemSucedido) {
    throw new Error('Informação útil só pode ser registrada após sucesso no Teste AST DT 10.');
  }
  return {
    versao: 1,
    usadoNaSessao: true,
    vantagemSobrevivenciaPendente: estado.vantagemSobrevivenciaPendente
      || (confirmacoes.testeBemSucedido && confirmacoes.informacaoUtil),
  };
}

/** O início de sessão renova o uso, mas não apaga uma Vantagem ainda não consumida. */
export function renovarSessaoAmnesico(estado: EstadoBeneficioAmnesico): EstadoBeneficioAmnesico {
  if (!beneficioAmnesicoValido(estado)) throw new Error('Estado de Vislumbres do Passado inválido.');
  return { ...estado, usadoNaSessao: false };
}

export function consumirVantagemAmnesico(estado: EstadoBeneficioAmnesico): EstadoBeneficioAmnesico {
  if (!beneficioAmnesicoValido(estado) || !estado.vantagemSobrevivenciaPendente) {
    throw new Error('Não há Vantagem de Vislumbres do Passado pendente.');
  }
  return { ...estado, vantagemSobrevivenciaPendente: false };
}

export function beneficioMilitarValido(valor: unknown): valor is EstadoBeneficioMilitar {
  return objetoSimples(valor)
    && Object.keys(valor).sort().join('|') === 'vantagemAtaqueFogoPendente|versao'
    && valor.versao === 1
    && typeof valor.vantagemAtaqueFogoPendente === 'boolean';
}

export function registrarMorteComArmaDeFogo(
  estado: EstadoBeneficioMilitar,
  confirmacoes: { inimigoMorto: boolean; armaDeFogo: boolean },
): EstadoBeneficioMilitar {
  if (!beneficioMilitarValido(estado) || !confirmacoes
    || Object.keys(confirmacoes).sort().join('|') !== 'armaDeFogo|inimigoMorto'
    || Object.values(confirmacoes).some(valor => typeof valor !== 'boolean')) {
    throw new Error('Estado ou confirmações do benefício Militar inválidos.');
  }
  if (!confirmacoes.inimigoMorto || !confirmacoes.armaDeFogo) {
    throw new Error('Militar exige confirmação de inimigo morto por Ataque com arma de fogo.');
  }
  if (estado.vantagemAtaqueFogoPendente) throw new Error('A Vantagem do benefício Militar já está pendente.');
  return { versao: 1, vantagemAtaqueFogoPendente: true };
}

export function consumirVantagemMilitar(
  estado: EstadoBeneficioMilitar,
  primeiroAtaqueDoProximoTurno: boolean,
): EstadoBeneficioMilitar {
  if (!beneficioMilitarValido(estado) || !estado.vantagemAtaqueFogoPendente || primeiroAtaqueDoProximoTurno !== true) {
    throw new Error('Confirme o primeiro Ataque com arma de fogo do próximo turno para consumir o benefício Militar.');
  }
  return { versao: 1, vantagemAtaqueFogoPendente: false };
}
