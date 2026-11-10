export type PerfilArma = {
  id: string;
  nome: string;
  categoria: 'corpo-a-corpo' | 'arma-fogo';
  dano: string;
  multiplicadorCritico: number;
  criticoNatural: 19 | 20;
  atributoDano: 'forca' | 'agilidade';
  capacidade?: number;
  calibre?: string;
  recarga?: string;
  propriedades: string[];
  referencia: string;
  grau?: 'Comum' | 'Tática';
  maos?: (1 | 2)[];
  espacos?: number;
  pecas?: number;
  durabilidade?: number | 'Indestrutível';
  alcance?: 'Curto';
  aquisicao?: string;
  regrasEspeciais?: string[];
};

const perfis: PerfilArma[] = [
  { id: 'bastao', nome: 'Bastão de Beisebol', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50', grau: 'Comum', maos: [1, 2], espacos: 1, pecas: 0, durabilidade: 2, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'cutelo', nome: 'Cutelo', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1], espacos: 1, pecas: 0, durabilidade: 2, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'machadinha', nome: 'Machadinha', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1], espacos: 1, pecas: 1, durabilidade: 2, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'martelo', nome: 'Martelo', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1], espacos: 1, pecas: 0, durabilidade: 2, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'hatchet', nome: 'Hatchet', categoria: 'corpo-a-corpo', dano: '2d4', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Indestrutível', 'Arremessável', 'Pode Aparar e Contra-Atacar'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [1], espacos: 1, pecas: 3, durabilidade: 'Indestrutível', alcance: 'Curto', aquisicao: 'Exploração', regrasEspeciais: ['Em Contra-Ataque, se o alvo estiver Vulnerável ou o golpe causar Dano Massivo, aciona Decepamento; o Narrador resolve o efeito conforme a regra da arma.'] },
  { id: 'machado', nome: 'Machado', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Duas mãos'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [2], espacos: 2, pecas: 1, durabilidade: 3, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'marreta', nome: 'Marreta', categoria: 'corpo-a-corpo', dano: '3d4', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Duas mãos'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [2], espacos: 2, pecas: 1, durabilidade: 3, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'motosserra', nome: 'Motosserra', categoria: 'corpo-a-corpo', dano: '3d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Cada 6 no dano gera outro dado, podendo encadear', 'Ataques com Desvantagem', 'Ligar exige Movimento'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [2], espacos: 2, pecas: 0, durabilidade: 4, alcance: 'Curto', aquisicao: 'Exploração' },
  { id: 'faca', nome: 'Faca', categoria: 'corpo-a-corpo', dano: '1d4', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1], espacos: 1, pecas: 0, durabilidade: 2, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'punhal', nome: 'Punhal', categoria: 'corpo-a-corpo', dano: '1d4', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1], espacos: 1, pecas: 0, durabilidade: 1, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'replica-espada', nome: 'Réplica de Espada', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1, 2], espacos: 2, pecas: 1, durabilidade: 4, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'replica-katana', nome: 'Réplica de Katana', categoria: 'corpo-a-corpo', dano: '1d10', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Comum', maos: [1, 2], espacos: 2, pecas: 1, durabilidade: 3, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'cassetete', nome: 'Cassetete', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [1], espacos: 1, pecas: 0, durabilidade: 3, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'faca-combate', nome: 'Faca de Combate', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [1], espacos: 1, pecas: 2, durabilidade: 5, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'machete', nome: 'Machete', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51', grau: 'Tática', maos: [1], espacos: 1, pecas: 1, durabilidade: 4, alcance: 'Curto', aquisicao: '1 Moeda Antiga' },
  { id: 'sentinel-nine', nome: 'Sentinel Nine', categoria: 'arma-fogo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'agilidade', capacidade: 19, calibre: '9 mm', recarga: 'Ação Bônus', propriedades: [], referencia: 'Arquivo do Jogador, p. 53' },
  { id: 'jmb-hp3', nome: 'JMB Hp3', categoria: 'arma-fogo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'agilidade', capacidade: 13, calibre: '9 mm', recarga: 'Ação Bônus', propriedades: [], referencia: 'Arquivo do Jogador, p. 53' },
  { id: 'lemi', nome: 'LEMI', categoria: 'arma-fogo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'agilidade', capacidade: 10, calibre: '9 mm', recarga: 'Ação Bônus', propriedades: [], referencia: 'Arquivo do Jogador, p. 53' },
];

const porId = new Map(perfis.map(perfil => [perfil.id, perfil]));

function clonarPerfilArma(perfil: PerfilArma): PerfilArma {
  return {
    ...perfil,
    propriedades: [...perfil.propriedades],
    ...(perfil.maos ? { maos: [...perfil.maos] } : {}),
    ...(perfil.regrasEspeciais ? { regrasEspeciais: [...perfil.regrasEspeciais] } : {}),
  };
}

export function possuiFormulaDanoConvencional(dano: string | null | undefined): boolean {
  return typeof dano === 'string' && /^\d+d\d+$/i.test(dano.trim());
}

export function consultarPerfilArma(id: string): PerfilArma | null {
  const perfil = porId.get(id);
  return perfil ? clonarPerfilArma(perfil) : null;
}

export function listarPerfisArma(): PerfilArma[] {
  return perfis.map(clonarPerfilArma);
}

export type ResultadoAtaqueArma = {
  sucesso: boolean;
  critico: boolean;
  falhaCritica: boolean;
  fechaReacoesDefensivas: boolean;
  aplicaExposto: boolean;
};

/** Resolve somente os resultados naturais e a margem crítica; não rola nem altera a ficha. */
export function resolverAtaqueArma(faceNatural: number, total: number, defesa: number, perfil: PerfilArma): ResultadoAtaqueArma {
  if (!Number.isInteger(faceNatural) || faceNatural < 1 || faceNatural > 20) throw new Error('A face natural deve estar entre 1 e 20.');
  if (!Number.isFinite(total) || !Number.isFinite(defesa)) throw new Error('Total e Defesa precisam ser números válidos.');
  if (faceNatural === 1) return { sucesso: false, critico: false, falhaCritica: true, fechaReacoesDefensivas: false, aplicaExposto: true };
  if (faceNatural === 20) return { sucesso: true, critico: true, falhaCritica: false, fechaReacoesDefensivas: true, aplicaExposto: false };
  const sucesso = total >= defesa;
  const critico = sucesso && faceNatural >= perfil.criticoNatural;
  return { sucesso, critico, falhaCritica: false, fechaReacoesDefensivas: false, aplicaExposto: false };
}

export type EntradaDanoArma = {
  dadosRolados: number;
  valorAtributo: number;
  critico: boolean;
  perfil: PerfilArma;
  armaOperarioEscolhida?: boolean;
  dadosAdicionais?: number;
};

export type ResultadoDanoArma = {
  dados: number;
  atributoMultiplicado: number;
  bonusOperarioNaoMultiplicado: number;
  multiplicador: number;
  total: number;
};

/** Recebe resultados já rolados. Nunca gera dados; respeita a exceção de Operário no crítico. */
export function calcularDanoArma(entrada: EntradaDanoArma): ResultadoDanoArma {
  const { dadosRolados, valorAtributo, critico, perfil, armaOperarioEscolhida = false, dadosAdicionais = 0 } = entrada;
  if (![dadosRolados, valorAtributo, dadosAdicionais].every(Number.isSafeInteger) || dadosRolados < 0 || valorAtributo < 0 || dadosAdicionais < 0) {
    throw new Error('Dano rolado, Atributo e dados adicionais precisam ser inteiros não negativos.');
  }
  if (!Number.isSafeInteger(perfil.multiplicadorCritico) || perfil.multiplicadorCritico < 1) {
    throw new Error('O multiplicador crítico do perfil precisa ser um inteiro positivo.');
  }
  const dados = dadosRolados + dadosAdicionais;
  const multiplicador = critico ? perfil.multiplicadorCritico : 1;
  if (armaOperarioEscolhida && perfil.categoria === 'corpo-a-corpo') {
    const atributoMultiplicado = valorAtributo * multiplicador;
    const bonusOperarioNaoMultiplicado = valorAtributo;
    return { dados, atributoMultiplicado, bonusOperarioNaoMultiplicado, multiplicador, total: dados * multiplicador + atributoMultiplicado + bonusOperarioNaoMultiplicado };
  }
  const atributoMultiplicado = valorAtributo * multiplicador;
  return { dados, atributoMultiplicado, bonusOperarioNaoMultiplicado: 0, multiplicador, total: (dados + valorAtributo) * multiplicador };
}

/** Bônus de Ataque da Origem Operário, apenas com a arma escolhida na criação. */
export function bonusAtaqueOperario(armaOperarioEscolhida: boolean): number {
  return armaOperarioEscolhida ? 1 : 0;
}
