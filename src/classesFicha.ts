export type ClasseFicha = 'Agente' | 'Autodidata' | 'Operador';

export type DadosClasseFicha = {
  pvPorNivel: string;
  biBase: number;
  saMaxima: string;
  pontosPericia: number;
  itensCaracteristicos: string[];
  ramos: string[];
  proficiencias: string[];
  identidade: string;
};

export const DADOS_CLASSES: Record<ClasseFicha, DadosClasseFicha> = {
  Agente: {
    pvPorNivel: '10 + VIG',
    biBase: 8,
    saMaxima: 'AGI + AST',
    pontosPericia: 4,
    itensCaracteristicos: ['Gazua Profissional', 'Hatchet'],
    ramos: ['Impiedoso', 'Oportunista', 'Rapina'],
    proficiencias: [
      'Armas Corpo a Corpo Comuns e Táticas',
      'Pistolas 9 mm até o Grau Militar',
      'Escopetas até o Grau Tática',
      'Submetralhadoras até o Grau Militar',
      'GM 79 e Killer7 especificamente',
    ],
    identidade: 'Táticas reativas, Ataques de Oportunidade, Contra-Ataques e Finalizações.',
  },
  Autodidata: {
    pvPorNivel: '8 + VIG',
    biBase: 10,
    saMaxima: 'AGI + AST',
    pontosPericia: 5,
    itensCaracteristicos: ['Kit de Primeiros Socorros', 'Pente Estendido 9 mm'],
    ramos: ['Combatente', 'Pau para Toda Obra', 'Socorrista'],
    proficiencias: [
      'Armas Corpo a Corpo Comuns e Táticas',
      'Pistolas 9 mm Comuns e Táticas',
      'Escopetas Comuns',
      'Submetralhadoras até o Grau Tática',
    ],
    identidade: 'Versatilidade, improvisação, sobrevivência e suporte.',
  },
  Operador: {
    pvPorNivel: '12 + VIG',
    biBase: 6,
    saMaxima: 'AGI + AST',
    pontosPericia: 3,
    itensCaracteristicos: ['Colete de Placas Kendo', 'Kit de Ferramentas'],
    ramos: ['Brigão', 'Especialista em Armamento', 'Tanque'],
    proficiencias: [
      'Armas Corpo a Corpo Comuns e Táticas',
      'Todas as Armas de Fogo convencionais, dos Graus Comum a Exótica',
    ],
    identidade: 'Linha de frente, domínio de arsenal, força bruta e permanência sob pressão.',
  },
};

export function dadosDaClasse(classe: string | null | undefined): DadosClasseFicha | null {
  if (classe === 'Agente' || classe === 'Autodidata' || classe === 'Operador') return DADOS_CLASSES[classe];
  return null;
}
