import type { PerfilArmaFogo } from './catalogoArmasFogo';

export type ModosDisparoArmaFogo = {
  disparoUnico: boolean;
  cadenciado: boolean;
  cartuchosCadenciado: 3 | 5;
  rajada: boolean;
  perfuracao: string | null;
};

export function consultarModosDisparoArmaFogo(
  perfil: PerfilArmaFogo,
  coronhaMatildaConfirmada = false,
): ModosDisparoArmaFogo {
  const propriedades = perfil.propriedades;
  const matildaComCoronha = perfil.id === 'matilda' && coronhaMatildaConfirmada;
  const cadenciado = propriedades.includes('Disparo Cadenciado')
    || (perfil.id === 'matilda' && matildaComCoronha);
  const rajada = propriedades.includes('Rajada') || propriedades.includes('Rajada Exclusiva');
  const perfuracao = propriedades.some(propriedade => propriedade.includes('Perfuração'))
    ? perfil.id === 'punisher'
      ? 'Após acertar o primeiro alvo, faça um novo Teste de Ataque contra apenas 1 alvo adicional de tamanho Médio ou menor na mesma Linha. A Punisher não perde Dados de Dano e o projétil para após esse alvo.'
      : 'Após acertar o primeiro alvo, faça um novo Teste de Ataque contra o próximo alvo na mesma Linha. Para cada alvo subsequente atingido, remova 1 Dado de Dano da arma; alvos acima de tamanho Médio removem mais 1 Dado por categoria de tamanho. Não some AGI ao Dano dos alvos subsequentes. O projétil para ao atingir cobertura ou objeto, ou quando os Dados de Dano chegam a 0.'
    : null;
  return {
    disparoUnico: !propriedades.includes('Sem Disparo Único') && !propriedades.includes('Rajada Exclusiva'),
    cadenciado,
    cartuchosCadenciado: perfil.id === 'matilda' && matildaComCoronha ? 3 : 5,
    rajada,
    perfuracao,
  };
}
