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
};

const perfis: PerfilArma[] = [
  { id: 'bastao', nome: 'Bastão de Beisebol', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50' },
  { id: 'cutelo', nome: 'Cutelo', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'machadinha', nome: 'Machadinha', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Arremessável'], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'martelo', nome: 'Martelo', categoria: 'corpo-a-corpo', dano: '1d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: [], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'hatchet', nome: 'Hatchet', categoria: 'corpo-a-corpo', dano: '2d4', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Indestrutível', 'Arremessável', 'Pode Aparar e Contra-Atacar'], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'machado', nome: 'Machado', categoria: 'corpo-a-corpo', dano: '1d8', multiplicadorCritico: 3, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Duas mãos'], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'marreta', nome: 'Marreta', categoria: 'corpo-a-corpo', dano: '3d4', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Duas mãos'], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'motosserra', nome: 'Motosserra', categoria: 'corpo-a-corpo', dano: '3d6', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'forca', propriedades: ['Cada 6 no dano gera outro dado, podendo encadear', 'Ataques com Desvantagem', 'Ligar exige Movimento'], referencia: 'Arquivo do Jogador, p. 50–51' },
  { id: 'sentinel-nine', nome: 'Sentinel Nine', categoria: 'arma-fogo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'agilidade', capacidade: 19, calibre: '9 mm', recarga: 'Ação Bônus', propriedades: [], referencia: 'Arquivo do Jogador, p. 53' },
  { id: 'jmb-hp3', nome: 'JMB Hp3', categoria: 'arma-fogo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'agilidade', capacidade: 13, calibre: '9 mm', recarga: 'Ação Bônus', propriedades: [], referencia: 'Arquivo do Jogador, p. 53' },
  { id: 'lemi', nome: 'LEMI', categoria: 'arma-fogo', dano: '1d8', multiplicadorCritico: 2, criticoNatural: 20, atributoDano: 'agilidade', capacidade: 10, calibre: '9 mm', recarga: 'Ação Bônus', propriedades: [], referencia: 'Arquivo do Jogador, p. 53' },
];

const porId = new Map(perfis.map(perfil => [perfil.id, perfil]));

export function consultarPerfilArma(id: string): PerfilArma | null {
  const perfil = porId.get(id);
  return perfil ? { ...perfil, propriedades: [...perfil.propriedades] } : null;
}

export function listarPerfisArma(): PerfilArma[] {
  return perfis.map(perfil => ({ ...perfil, propriedades: [...perfil.propriedades] }));
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
  forca: number;
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
  const { dadosRolados, forca, critico, perfil, armaOperarioEscolhida = false, dadosAdicionais = 0 } = entrada;
  if (![dadosRolados, forca, dadosAdicionais].every(Number.isFinite) || dadosRolados < 0 || forca < 0 || dadosAdicionais < 0) {
    throw new Error('Dano rolado, FOR e dados adicionais precisam ser valores não negativos.');
  }
  const dados = dadosRolados + dadosAdicionais;
  const multiplicador = critico ? perfil.multiplicadorCritico : 1;
  if (armaOperarioEscolhida && perfil.categoria === 'corpo-a-corpo') {
    const atributoMultiplicado = forca * multiplicador;
    const bonusOperarioNaoMultiplicado = forca;
    return { dados, atributoMultiplicado, bonusOperarioNaoMultiplicado, multiplicador, total: dados * multiplicador + atributoMultiplicado + bonusOperarioNaoMultiplicado };
  }
  const atributoMultiplicado = forca * multiplicador;
  return { dados, atributoMultiplicado, bonusOperarioNaoMultiplicado: 0, multiplicador, total: (dados + forca) * multiplicador };
}
