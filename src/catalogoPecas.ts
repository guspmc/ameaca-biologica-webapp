export type CategoriaPeca = 'corpo-a-corpo' | 'armas-de-fogo-e-especiais';
export type TipoPeca = 'generica' | 'especifica';

export type PerfilPeca = {
  id: string;
  nome: string;
  tipo: TipoPeca;
  categoria: CategoriaPeca;
  compatibilidade: string[];
  efeito: string;
  aquisicao: string;
  referencia: string;
};

const referenciaGenerica = 'Arquivo do Jogador v1.0, p. 62–63';
const referenciaEspecifica = 'Arquivo do Jogador v1.0, p. 64';

const pecas: PerfilPeca[] = [
  // Peças Genéricas — Corpo a Corpo
  { id: 'alca', nome: 'Alça', tipo: 'generica', categoria: 'corpo-a-corpo', compatibilidade: ['Arma de 1 mão compatível'], efeito: 'Soltar voluntariamente mantém a arma presa; recuperar usa Interação Gratuita com Objeto.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'aprimoramento-corpo-a-corpo-ofensivo', nome: 'Aprimoramento Corpo a Corpo Ofensivo', tipo: 'generica', categoria: 'corpo-a-corpo', compatibilidade: ['Arma Corpo a Corpo compatível'], efeito: '+1d4 de Dano.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'cabo-tatico', nome: 'Cabo Tático', tipo: 'generica', categoria: 'corpo-a-corpo', compatibilidade: ['Arma Corpo a Corpo compatível'], efeito: 'Contra-Ataques com a arma têm Vantagem.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'contrapeso', nome: 'Contrapeso', tipo: 'generica', categoria: 'corpo-a-corpo', compatibilidade: ['Arma Corpo a Corpo compatível'], efeito: 'Reduz em 1 o resultado natural necessário para Crítico.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'reforco', nome: 'Reforço', tipo: 'generica', categoria: 'corpo-a-corpo', compatibilidade: ['Arma Corpo a Corpo compatível'], efeito: '+2 Durabilidade Máxima; sem efeito em armas Indestrutíveis.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },

  // Peças Genéricas — Armas de Fogo
  { id: 'bandoleira', nome: 'Bandoleira', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Armas de 2 mãos que ocupem 2 Espaços e possuam Espaço de Peça disponível'], efeito: 'Soltar voluntariamente mantém a arma presa; recuperar usa Interação Gratuita com Objeto.', aquisicao: '1 Moeda para Submetralhadora; 2 Moedas para Escopeta ou Rifle; demais, Exploração', referencia: referenciaGenerica },
  { id: 'compensador-submetralhadora', nome: 'Compensador para Submetralhadora', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Submetralhadora com Rajada e Espaço de Peça'], efeito: 'Rajada passa de Ação Completa para Ação. Não concede Rajada a arma que não possua essa opção.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'coronha-escopeta', nome: 'Coronha para Escopetas', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Escopeta com Espaço de Peça'], efeito: 'Estabilidade: ignora Desvantagem por usar a escopeta uma categoria além do alcance normal. Se não tinha coronha, permite Coronhada.', aquisicao: '2 Moedas Antigas', referencia: referenciaGenerica },
  { id: 'coronha-rifle', nome: 'Coronha para Rifles', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Rifle com Espaço de Peça'], efeito: 'Vantagem ao Mirar. Se não tinha coronha, passa a permitir Coronhada.', aquisicao: '2 Moedas Antigas', referencia: referenciaGenerica },
  { id: 'coronha-submetralhadora', nome: 'Coronha para Submetralhadora', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Submetralhadora com Espaço de Peça'], efeito: 'Vantagem ao Mirar; frágil, não permite Coronhada nem Aparar pela coronha.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'freio-boca-9mm', nome: 'Freio de Boca 9 mm', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Arma 9 mm com Espaço de Peça'], efeito: 'Reduz em 1 o resultado natural necessário para Crítico.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'freio-boca-magnum', nome: 'Freio de Boca Magnum', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Magnum com Espaço de Peça, exceto Requiem'], efeito: 'Reduz o Coice em 1 categoria de Ação, nunca abaixo de Interação Gratuita com Objeto.', aquisicao: 'Exploração', referencia: referenciaGenerica },
  { id: 'mira-biossensora', nome: 'Mira Biossensora', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Rifle de Precisão com Espaço de Peça'], efeito: 'Detecta assinaturas térmicas/anomalias; identifica parasitas/organismos internos quando aplicável.', aquisicao: '2 Moedas Antigas', referencia: referenciaGenerica },
  { id: 'mira-laser', nome: 'Mira Laser', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Pistolas 9 mm e Submetralhadoras com Espaço de Peça disponível'], efeito: 'Uma vez por turno, Mirar com a arma não consome SA.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'mira-telescopica', nome: 'Mira Telescópica', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Rifle de Precisão com Espaço de Peça'], efeito: 'Permite usar o alcance Muito Longo de Rifles de Precisão sem a penalidade de alcance prevista pela arma.', aquisicao: '2 Moedas Antigas', referencia: referenciaGenerica },
  { id: 'pente-estendido-9mm', nome: 'Pente Estendido 9 mm', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Arma 9 mm com Espaço de Peça'], efeito: '+5 Capacidade Máxima.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'pente-estendido-magnum', nome: 'Pente Estendido Magnum', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Magnum com Espaço de Peça, exceto Requiem, Wolfsban e Elephant'], efeito: '+3 Capacidade Máxima.', aquisicao: 'Exploração', referencia: referenciaGenerica },
  { id: 'pente-estendido-rifle', nome: 'Pente Estendido Rifle', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Rifle com Espaço de Peça'], efeito: '+5 Capacidade Máxima para Rifle; +3 para Rifle de Precisão.', aquisicao: '2 Moedas Antigas', referencia: referenciaGenerica },
  { id: 'pente-estendido-submetralhadora', nome: 'Pente Estendido Submetralhadora', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Submetralhadora com Espaço de Peça'], efeito: '+10 Capacidade Máxima.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'silenciador-9mm', nome: 'Silenciador 9 mm', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Arma 9 mm com Espaço de Peça'], efeito: 'Disparo não revela automaticamente posição pelo som; Vantagem em testes aplicáveis para permanecer oculto após disparar.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },
  { id: 'silenciador-submetralhadora', nome: 'Silenciador Submetralhadora', tipo: 'generica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Submetralhadora com Espaço de Peça'], efeito: 'Mesmo efeito do Silenciador 9 mm.', aquisicao: '1 Moeda Antiga', referencia: referenciaGenerica },

  // Peças Específicas
  { id: 'bateria-alta-capacidade', nome: 'Bateria de Alta Capacidade', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Spark Shot'], efeito: 'Bateria: 7 → 10 Cargas.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'cano-longo-wolfsbane', nome: 'Cano Longo', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['M1851 Wolfsbane'], efeito: '+2 Dados de Dano do mesmo tipo: 4d6 → 6d6; a arma ocupa 2 Espaços e seu Coice aumenta em 1 categoria de Ação.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'cano-ventilado-requiem', nome: 'Cano Ventilado', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Requiem'], efeito: 'Reduz o Coice da Requiem em 1 categoria. Com essa redução, permite disparar com 1 mão. Enquanto instalado, a arma ocupa 2 Espaços.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'cilindro-alta-capacidade-wolfsbane', nome: 'Cilindro de Alta Capacidade', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['M1851 Wolfsbane'], efeito: 'Capacidade Máxima 5 → 8.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'coronha-gm79', nome: 'Coronha', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['GM 79'], efeito: 'Adiciona alcance Curto: passa a Curto/Médio.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'coronha-matilda', nome: 'Coronha', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Matilda'], efeito: 'Habilita Disparo Cadenciado; o Disparo Cadenciado da Matilda consome 3 cartuchos em vez de 5. Continua utilizável com 1 mão; não permite Coronhada nem Aparar; passa a 2 Espaços.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'empunhadura-pesada-requiem', nome: 'Empunhadura Pesada', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Requiem'], efeito: 'Reduz em 1 o resultado natural necessário para Crítico.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'engate-triplo-besta', nome: 'Engate Triplo', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Besta'], efeito: 'Consome 3 virotes e permite dispará-los simultaneamente. Faça um Teste de Ataque para cada virote. Eles partem do mesmo ponto e se distanciam 1,5 m entre si para cada 1,5 m percorrido, mantendo o virote central em linha. Criaturas largas podem ser atingidas por todos os virotes cujas trajetórias atravessem seus espaços.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'protetor-cano-requiem', nome: 'Protetor de Cano', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Requiem'], efeito: '+2 dados do mesmo tipo: 4d6 → 6d6.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
  { id: 'valvula-acao-rapida-lancachamas', nome: 'Válvula de Ação Rápida', tipo: 'especifica', categoria: 'armas-de-fogo-e-especiais', compatibilidade: ['Lança-Chamas Químico'], efeito: 'Cone 4,5 m → 6 m.', aquisicao: 'Exploração', referencia: referenciaEspecifica },
];

const porId = new Map(pecas.map(peca => [peca.id, peca]));

function clonar(peca: PerfilPeca): PerfilPeca {
  return { ...peca, compatibilidade: [...peca.compatibilidade] };
}

/** Catálogo de referência. Não instala peças nem altera armas ou inventário. */
export function listarPecasExtras(): PerfilPeca[] {
  return pecas.map(clonar);
}

export function consultarPecaExtra(id: string): PerfilPeca | null {
  const peca = porId.get(id);
  return peca ? clonar(peca) : null;
}

export function listarCategoriasPecas(): CategoriaPeca[] {
  return ['corpo-a-corpo', 'armas-de-fogo-e-especiais'];
}

export function listarTiposPecas(): TipoPeca[] {
  return ['generica', 'especifica'];
}
