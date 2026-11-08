export type CategoriaArmaFogo =
  | 'Pistola 9 mm'
  | 'Escopeta'
  | 'Submetralhadora'
  | 'Rifle'
  | 'Rifle de Precisão'
  | 'Magnum'
  | 'Arma Especial';

export type GrauArmaFogo = 'Comum' | 'Tática' | 'Militar' | 'Exótica';

export type PerfilArmaFogo = {
  id: string;
  nome: string;
  categoria: CategoriaArmaFogo;
  grau?: GrauArmaFogo;
  dano: string | null;
  critico: string | null;
  capacidade: number;
  alcance: string;
  maos: 1 | 2;
  espacos: number | string;
  pecas: number;
  durabilidade: number;
  recarga: string;
  aquisicao: string;
  propriedades: string[];
  regrasEspeciais: string[];
  referencia: string;
};

const referencia = 'Arquivo do Jogador v1.0, Capítulo 3 — Arsenal e Equipamentos';

const perfis: PerfilArmaFogo[] = [
  // Pistolas 9 mm — p. 53–54
  { id: 'jmb-hp3', nome: 'JMB Hp3', categoria: 'Pistola 9 mm', grau: 'Comum', dano: '1d8', critico: 'x2', capacidade: 13, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 2, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '1 Moeda Antiga', propriedades: [], regrasEspeciais: [], referencia },
  { id: 'lemi', nome: 'LEMI', categoria: 'Pistola 9 mm', grau: 'Comum', dano: '1d8', critico: 'x2', capacidade: 10, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 3, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '1 Moeda Antiga', propriedades: [], regrasEspeciais: [], referencia },
  { id: 'nine-oh-nine', nome: 'Nine-Oh-Nine', categoria: 'Pistola 9 mm', grau: 'Comum', dano: '1d8', critico: 'x2', capacidade: 15, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 1, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '1 Moeda Antiga', propriedades: [], regrasEspeciais: [], referencia },
  { id: 'sentinel-nine', nome: 'Sentinel Nine', categoria: 'Pistola 9 mm', grau: 'Comum', dano: '1d8', critico: 'x2', capacidade: 19, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 1, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '1 Moeda Antiga', propriedades: [], regrasEspeciais: [], referencia },
  { id: 'albert-01r', nome: 'Albert-01R', categoria: 'Pistola 9 mm', grau: 'Tática', dano: '1d10', critico: '19–20 x3', capacidade: 3, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 0, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '2 Moedas Antigas', propriedades: [], regrasEspeciais: [], referencia },
  { id: 'blacktail', nome: 'Blacktail', categoria: 'Pistola 9 mm', grau: 'Tática', dano: '1d8', critico: '19–20 x2', capacidade: 9, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 0, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '2 Moedas Antigas', propriedades: [], regrasEspeciais: [], referencia },
  { id: 'samurai-edge', nome: 'Samurai Edge', categoria: 'Pistola 9 mm', grau: 'Tática', dano: '2d4', critico: 'x2', capacidade: 15, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 2, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '2 Moedas Antigas', propriedades: ['Vantagem ao Mirar'], regrasEspeciais: [], referencia },
  { id: 'silencer-9', nome: 'Silencer 9', categoria: 'Pistola 9 mm', grau: 'Tática', dano: '1d6', critico: 'x3', capacidade: 10, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 0, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '2 Moedas Antigas', propriedades: ['Silenciador fixo'], regrasEspeciais: ['Favorece furtividade e não chama atenção automaticamente pelo som dos disparos.'], referencia },
  { id: 'matilda', nome: 'Matilda', categoria: 'Pistola 9 mm', grau: 'Militar', dano: '1d8', critico: 'x2', capacidade: 18, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 2, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '3 Moedas Antigas', propriedades: ['Disparo Cadenciado com Coronha específica'], regrasEspeciais: ['Com a Coronha específica, Disparo Cadenciado consome 3 cartuchos em vez de 5.'], referencia },
  { id: 'punisher', nome: 'Punisher', categoria: 'Pistola 9 mm', grau: 'Militar', dano: '1d8', critico: 'x3', capacidade: 12, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 1, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '3 Moedas Antigas', propriedades: ['Perfuração'], regrasEspeciais: ['Após acertar, pode testar Ataque contra 1 alvo adicional de tamanho Médio ou menor na mesma Linha; não perde Dados de Dano por essa perfuração e para após o alvo adicional.'], referencia },

  // Escopetas — p. 55
  { id: 'w-870', nome: 'W-870', categoria: 'Escopeta', grau: 'Comum', dano: '3d6', critico: 'x3', capacidade: 3, alcance: 'Médio', maos: 2, espacos: 2, pecas: 2, durabilidade: 4, recarga: 'Movimento', aquisicao: '2 Moedas Antigas', propriedades: ['Ação por bombeamento', 'Coice de Escopeta: Ação Bônus'], regrasEspeciais: ['Bombear: Ação Bônus antes do próximo disparo.'], referencia },
  { id: 'hydra', nome: 'Hydra', categoria: 'Escopeta', grau: 'Tática', dano: '4d6', critico: 'x4', capacidade: 3, alcance: 'Curto', maos: 1, espacos: 1, pecas: 0, durabilidade: 3, recarga: 'Movimento', aquisicao: '3 Moedas Antigas', propriedades: ['Sem coronha', 'Não permite Coronhada', 'Coice de Escopeta: Ação Bônus'], regrasEspeciais: [], referencia },
  { id: 'riot-gun', nome: 'Riot Gun', categoria: 'Escopeta', grau: 'Tática', dano: '3d6', critico: 'x3', capacidade: 7, alcance: 'Médio', maos: 2, espacos: 2, pecas: 1, durabilidade: 4, recarga: 'Movimento', aquisicao: '3 Moedas Antigas', propriedades: ['Semiautomática', 'Não bombeia', 'Possui coronha e permite Coronhada', 'Coice de Escopeta: Ação Bônus'], regrasEspeciais: [], referencia },
  { id: 'striker', nome: 'Striker', categoria: 'Escopeta', grau: 'Militar', dano: '3d6', critico: 'x3', capacidade: 12, alcance: 'Médio', maos: 2, espacos: 2, pecas: 0, durabilidade: 4, recarga: 'Movimento', aquisicao: '4 Moedas Antigas', propriedades: ['Semiautomática', 'Não bombeia', 'Sem Coronhada', 'Coice de Escopeta: Ação Bônus'], regrasEspeciais: [], referencia },

  // Submetralhadoras — p. 56
  { id: 'tmp', nome: 'TMP', categoria: 'Submetralhadora', grau: 'Tática', dano: '2d4', critico: 'x2', capacidade: 30, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 3, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '2 Moedas Antigas', propriedades: ['Disparo Cadenciado', 'Com 2 mãos, Vantagem ao Mirar', 'Coronha Leve não permite Coronhada nem Aparar pela coronha'], regrasEspeciais: [], referencia },
  { id: 'gal', nome: 'Gal', categoria: 'Submetralhadora', grau: 'Militar', dano: '2d4', critico: 'x2', capacidade: 40, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 1, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '3 Moedas Antigas', propriedades: ['Disparo Cadenciado', 'Rajada', 'Sem Disparo Único', 'Com 2 mãos, Vantagem ao Mirar'], regrasEspeciais: [], referencia },
  { id: 'hk-mp5', nome: 'H&K MP5', categoria: 'Submetralhadora', grau: 'Militar', dano: '2d4', critico: 'x2', capacidade: 35, alcance: 'Curto/Médio', maos: 2, espacos: 2, pecas: 2, durabilidade: 4, recarga: 'Ação Bônus', aquisicao: '3 Moedas Antigas', propriedades: ['Disparo Cadenciado', 'Rajada'], regrasEspeciais: [], referencia },
  { id: 'chicago-sweeper', nome: 'Chicago Sweeper', categoria: 'Submetralhadora', grau: 'Exótica', dano: '4d4', critico: 'x2', capacidade: 50, alcance: 'Curto/Médio', maos: 2, espacos: 2, pecas: 0, durabilidade: 3, recarga: 'Ação Bônus', aquisicao: '4 Moedas Antigas', propriedades: ['Rajada Exclusiva'], regrasEspeciais: ['Só pode atacar por Rajada; não possui Disparo Único nem Disparo Cadenciado.'], referencia },

  // Rifles — p. 57
  { id: 'clatter-carbine', nome: 'Clatter Carbine', categoria: 'Rifle', grau: 'Militar', dano: '2d10', critico: 'x2', capacidade: 40, alcance: 'Médio/Longo', maos: 2, espacos: 2, pecas: 1, durabilidade: 4, recarga: 'Ação Bônus', aquisicao: '5 Moedas Antigas', propriedades: ['Disparo Cadenciado', 'Rajada', 'Sem Disparo Único'], regrasEspeciais: ['Disparo Cadenciado consome 5 cartuchos e adiciona +2 Dados de Dano.'], referencia },
  { id: 'dragoon', nome: 'Dragoon', categoria: 'Rifle', grau: 'Militar', dano: '2d10', critico: 'x2', capacidade: 30, alcance: 'Médio/Longo', maos: 2, espacos: 2, pecas: 2, durabilidade: 4, recarga: 'Ação Bônus', aquisicao: '5 Moedas Antigas', propriedades: ['Disparo Cadenciado', 'Rajada'], regrasEspeciais: ['Disparo Cadenciado consome 5 cartuchos e adiciona +2 Dados de Dano.'], referencia },
  { id: 'bear-commander', nome: 'Bear Commander', categoria: 'Rifle', grau: 'Exótica', dano: '1d10', critico: 'x2', capacidade: 30, alcance: 'Médio/Longo', maos: 2, espacos: 2, pecas: 0, durabilidade: 4, recarga: 'Ação Bônus', aquisicao: '6 Moedas Antigas', propriedades: ['Rajada', 'Lança-granadas integrado'], regrasEspeciais: ['Lançador integrado tem capacidade separada de 1 Cartucho GM 79 (Ácido, Explosivo ou Incendiário), alcance Médio, reserva de munição própria e recarga por Ação Bônus.'], referencia },

  // Rifles de Precisão — p. 58
  { id: 'stingray', nome: 'Stingray', categoria: 'Rifle de Precisão', grau: 'Tática', dano: '2d12', critico: 'x3', capacidade: 7, alcance: 'Longo/Muito Longo', maos: 2, espacos: 2, pecas: 2, durabilidade: 4, recarga: 'Ação Bônus', aquisicao: '4 Moedas Antigas', propriedades: ['Coice de Rifle de Precisão: Ação Bônus'], regrasEspeciais: ['Muito Longo exige Mira Telescópica para uso ideal.'], referencia },
  { id: 'svd', nome: 'SVD', categoria: 'Rifle de Precisão', grau: 'Militar', dano: '2d12', critico: 'x3', capacidade: 5, alcance: 'Longo/Muito Longo', maos: 2, espacos: 2, pecas: 1, durabilidade: 4, recarga: 'Ação Bônus', aquisicao: '5 Moedas Antigas', propriedades: ['Perfuração conforme regra universal', 'Manejar Ferrolho: Ação Bônus antes do próximo disparo'], regrasEspeciais: ['Muito Longo exige Mira Telescópica para uso ideal.'], referencia },

  // Magnums — p. 59
  { id: 'elephant-killer', nome: 'Elephant Killer', categoria: 'Magnum', dano: '4d6', critico: 'x4', capacidade: 5, alcance: 'Curto/Médio', maos: 2, espacos: 1, pecas: 0, durabilidade: 5, recarga: 'Ação', aquisicao: '4 Moedas Antigas', propriedades: ['Coice de Magnum: Movimento', 'Recarga Lenta', 'Decepamento', 'Carnificina'], regrasEspeciais: ['Exige 2 mãos.'], referencia },
  { id: 'killer7', nome: 'Killer7', categoria: 'Magnum', dano: '4d6', critico: 'x3', capacidade: 6, alcance: 'Curto/Médio', maos: 2, espacos: 1, pecas: 1, durabilidade: 5, recarga: 'Ação Bônus', aquisicao: '4 Moedas Antigas', propriedades: ['Semiautomática', 'Decepamento', 'Carnificina', 'Coice de Magnum: Movimento'], regrasEspeciais: ['Exige 2 mãos.'], referencia },
  { id: 'm1851-wolfsbane', nome: 'M1851 Wolfsbane', categoria: 'Magnum', dano: '4d6', critico: 'x3', capacidade: 5, alcance: 'Curto/Médio', maos: 2, espacos: 2, pecas: 2, durabilidade: 5, recarga: 'Ação Bônus', aquisicao: '4 Moedas Antigas', propriedades: ['Perfuração conforme regra universal', 'Decepamento', 'Carnificina', 'Coice de Magnum: Movimento'], regrasEspeciais: ['Exige 2 mãos.', 'Peças específicas: Cilindro de Alta Capacidade e Cano Longo.'], referencia },
  { id: 'requiem', nome: 'Requiem', categoria: 'Magnum', dano: '4d6', critico: 'x3', capacidade: 5, alcance: 'Curto/Médio', maos: 2, espacos: '1–2', pecas: 3, durabilidade: 5, recarga: 'Ação Bônus', aquisicao: '4 Moedas Antigas', propriedades: ['Modular', 'Decepamento', 'Carnificina', 'Coice de Magnum: Movimento'], regrasEspeciais: ['Exige 2 mãos, salvo redução específica.', '0–1 Peça instalada = 1 Espaço; 2–3 Peças = 2 Espaços. Peça que determine 2 Espaços aplica imediatamente.'], referencia },
  { id: 'sw-m29', nome: 'S&W M29', categoria: 'Magnum', dano: '4d6', critico: 'x3', capacidade: 6, alcance: 'Curto/Médio', maos: 2, espacos: 2, pecas: 0, durabilidade: 5, recarga: 'Ação', aquisicao: '4 Moedas Antigas', propriedades: ['Decepamento', 'Carnificina', 'Coice de Magnum: Movimento', 'Recarga Lenta', 'Poder de Parada'], regrasEspeciais: ['Exige 2 mãos.', 'Em Acerto Crítico, o alvo deve passar em Fortitude DT 15 ou fica Atordoado até o fim do próximo turno.'], referencia },

  // Armas Especiais — p. 60
  { id: 'besta', nome: 'Besta', categoria: 'Arma Especial', dano: '1d8', critico: '19–20 x2', capacidade: 1, alcance: 'Curto/Médio', maos: 2, espacos: 1, pecas: 1, durabilidade: 1, recarga: 'Movimento', aquisicao: 'Exploração', propriedades: ['Muito silenciosa', 'Engate Triplo'], regrasEspeciais: ['Virotes recuperáveis com Investigação DT 10.', 'Engate Triplo: dispara até 3 virotes, cada um com Teste de Ataque próprio; partem do mesmo ponto e se afastam 1,5 m entre si a cada 1,5 m percorrido. Criaturas acima de tamanho Médio podem ser atingidas por mais de um virote se ocuparem trajetórias diferentes.'], referencia },
  { id: 'gm-79', nome: 'GM 79', categoria: 'Arma Especial', dano: '4d6', critico: 'x4', capacidade: 1, alcance: 'Médio', maos: 2, espacos: 2, pecas: 1, durabilidade: 3, recarga: 'Movimento', aquisicao: 'Exploração', propriedades: ['Tiro único'], regrasEspeciais: ['Usa Cartuchos GM 79 Incendiário, Ácido e Explosivo; cada cartucho segue suas próprias regras.'], referencia },
  { id: 'lanca-chamas-quimico', nome: 'Lança-Chamas Químico', categoria: 'Arma Especial', dano: '3d6→6d6', critico: 'x2', capacidade: 100, alcance: 'Cone 4,5 m', maos: 2, espacos: 2, pecas: 1, durabilidade: 1, recarga: 'Movimento (reabastecer)', aquisicao: 'Exploração', propriedades: ['Consome 10 de Combustível por Ataque', 'Chama Contínua'], regrasEspeciais: ['Começa em 3d6; se no turno seguinte não usar Movimento e continuar atacando, recebe +1d6 cumulativo até 6d6. Mover ou falhar no Teste de Ataque encerra a acumulação; o próximo Ataque volta a 3d6.', 'Reabastecer transfere Combustível da reserva até a capacidade da arma.'], referencia },
  { id: 'redemption', nome: 'Redemption', categoria: 'Arma Especial', dano: '1d12', critico: 'x4', capacidade: 1, alcance: 'Curto/Médio', maos: 1, espacos: 1, pecas: 0, durabilidade: 1, recarga: 'Ação Bônus', aquisicao: 'Exploração', propriedades: ['Tiro único', 'Usa munição de Rifle', 'Forte Coice narrativo'], regrasEspeciais: ['Permanece utilizável com 1 mão.'], referencia },
  { id: 'rpg-7', nome: 'RPG-7', categoria: 'Arma Especial', dano: null, critico: null, capacidade: 1, alcance: 'Curto/Médio/Longo', maos: 2, espacos: 2, pecas: 0, durabilidade: 1, recarga: 'Movimento', aquisicao: 'Exploração', propriedades: ['Morte Instantânea'], regrasEspeciais: ['Perseguidores, Chefes e criaturas com regra própria podem avançar de fase ou sofrer o efeito indicado em sua ficha em vez de morrer imediatamente.', 'Após o disparo, a arma fica vazia.'], referencia },
  { id: 'spark-shot', nome: 'Spark Shot', categoria: 'Arma Especial', dano: '1d4 / 4d4', critico: 'x2', capacidade: 7, alcance: 'Curto/Médio', maos: 2, espacos: 2, pecas: 1, durabilidade: 1, recarga: 'Movimento (bateria)', aquisicao: 'Exploração', propriedades: ['Bateria padrão: 7 Cargas', 'Disparo normal: 1 Carga', 'Disparo Carregado: Ação Completa, 3 Cargas'], regrasEspeciais: ['O disparo carregado causa 4d4; alvo atingido e criaturas a até 1,5 m fazem Fortitude DT 15 ou ficam Atordoados até o fim do próximo turno e Imobilizados por 1d4 rodadas.', 'Ao substituir/recarregar a bateria, restaure as Cargas até a capacidade máxima: 7 normalmente ou 10 com Bateria de Alta Capacidade.'], referencia },
];

const porId = new Map(perfis.map(perfil => [perfil.id, perfil]));

function clonar(perfil: PerfilArmaFogo): PerfilArmaFogo {
  return {
    ...perfil,
    propriedades: [...perfil.propriedades],
    regrasEspeciais: [...perfil.regrasEspeciais],
  };
}

/** Catálogo de referência. Não representa posse, equipamento ativo ou munição carregada. */
export function listarPerfisArmasFogo(): PerfilArmaFogo[] {
  return perfis.map(clonar);
}

export function consultarPerfilArmaFogo(id: string): PerfilArmaFogo | null {
  const perfil = porId.get(id);
  return perfil ? clonar(perfil) : null;
}

export function listarCategoriasArmasFogo(): CategoriaArmaFogo[] {
  return ['Pistola 9 mm', 'Escopeta', 'Submetralhadora', 'Rifle', 'Rifle de Precisão', 'Magnum', 'Arma Especial'];
}
