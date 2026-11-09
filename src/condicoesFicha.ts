export const CATALOGO_CONDICOES = {
  agarrado: { nome: 'Agarrado', efeito: 'Movimento 0; não recebe bônus de Movimento.', duracao: 'ate-remocao', remocao: 'Termina se quem agarra ficar Incapacitado, se o alvo sair do alcance por efeito externo ou se escapar com Ação e Atletismo/Reflexos contra a DT original.' },
  amedrontado: { nome: 'Amedrontado', efeito: 'Desvantagem em testes aplicáveis enquanto perceber a fonte; tenta se afastar/fugir e não pode se aproximar voluntariamente.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte do medo.' },
  atordoado: { nome: 'Atordoado', efeito: 'Não pode realizar Ações, Reações ou Movimento. Ataques e Manobras ofensivas resistidas contra o alvo recebem Vantagem.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  caido: { nome: 'Caído', efeito: 'Só se desloca Rastejando; levantar custa metade do Movimento. Ataques próprios têm Desvantagem; Ataques Corpo a Corpo contra o alvo têm Vantagem e à distância têm Desvantagem.', duracao: 'ate-remocao', remocao: 'Até se levantar ou outro efeito remover; com Movimento 0, não pode levantar.' },
  cego: { nome: 'Cego', efeito: 'Desvantagem em Ataques; Ataques contra o alvo têm Vantagem; falha automaticamente em testes que dependam exclusivamente de visão.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  'colapso-viral': { nome: 'Colapso Viral', efeito: 'Consequência de atingir a BI Máxima; personagem Desacordada e usa Reanimação específica.', duracao: 'estado-derivado', remocao: 'Conforme BI e fluxo específico de Colapso Viral.' },
  corrosao: { nome: 'Corrosão', efeito: '1d4 de Dano ao final de cada turno. No início do turno, Fortitude DT 12; em sucesso termina antes do Dano. Fora de combate, Dano uma única vez por exposição, salvo regra específica.', duracao: 'ate-remocao', remocao: 'Se a fonte não definir duração, termina com Teste bem-sucedido ou duração específica da fonte.' },
  desacordado: { nome: 'Desacordado', efeito: 'Inconsciente; não realiza Ações ou Reações e não percebe conscientemente o ambiente.', duracao: 'conforme-fonte', remocao: 'Em 0 PV, segue Testes de Reanimação; outras fontes determinam como despertar.' },
  desorientado: { nome: 'Desorientado', efeito: 'Não pode usar Atacar, tem Desvantagem em Testes de Perícia e perde a contribuição de AGI na Defesa.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  enfraquecido: { nome: 'Enfraquecido', efeito: 'Desvantagem em Testes baseados em FOR e em Fortitude.', duracao: 'conforme-fonte', remocao: 'A fonte determina duração e cura.' },
  exposto: { nome: 'Exposto', efeito: '-2 na Defesa; não impõe penalidade em Ataques, Perícias, Reações ou outros valores.', duracao: 'conforme-fonte', remocao: 'Quando causado por Falha Crítica, dura até o final do próximo turno da criatura.' },
  imobilizado: { nome: 'Imobilizado', efeito: 'Movimento 0; Desvantagem nos próprios Ataques; Ataques contra o alvo têm Vantagem; Desvantagem em Reflexos.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  incapacitado: { nome: 'Incapacitado', efeito: 'Não pode realizar Ações nem Reações.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  intoxicado: { nome: 'Intoxicado', efeito: 'Movimento reduzido em 3 m. Desvantagem em Testes de Ataque e Perícia; Testes de Atributo permanecem normais.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  queimadura: { nome: 'Queimadura', efeito: '1d6 de Dano ao final de cada turno. Sem duração específica da fonte, dura 1d4 rodadas; Reflexos DT 12 no início do turno apaga as chamas em sucesso. Fora de combate, Dano uma única vez.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte; sem duração específica, Reflexos DT 12 pode apagar as chamas.' },
  surdo: { nome: 'Surdo', efeito: 'Falha automaticamente em testes que dependam exclusivamente de audição.', duracao: 'conforme-fonte', remocao: 'Conforme a fonte.' },
  surpreendido: { nome: 'Surpreendido', efeito: 'No primeiro turno, não pode se mover nem realizar Ações. Enquanto durar, não pode usar Reações nem gastar SA.', duracao: 'ate-fim-primeiro-turno', remocao: 'Normalmente termina ao fim do primeiro turno da própria criatura, salvo efeito específico.' },
  vulneravel: { nome: 'Vulnerável', efeito: 'Habilita efeitos específicos; não derrota nem mata o alvo por si só.', duracao: 'estado-derivado', remocao: 'Enquanto PV Atuais forem iguais ou inferiores a 1/5 dos PV Máximos, salvo regra específica.' },
  'infectado-especial': { nome: 'Infectado Especial', efeito: 'Transformação: recupera 1 Dado de Vida; perde Habilidades de Classe; mantém Atributos, Perícias e aptidão para armas; Desvantagem em ataques com armas de fogo.', duracao: 'estado-transformacao', remocao: 'Pode reverter conforme BI e efeitos aplicáveis antes da progressão seguinte.' },
  'cabeca-carmesim': { nome: 'Cabeça Carmesim', efeito: 'Transformação: não usa Armas nem Habilidades; recupera 1 Dado de Vida por Nível; Ataques Corpo a Corpo que causem Dano causam +2 BI.', duracao: 'estado-transformacao', remocao: 'Reverte quando BI chega a 0; se PV chegar a 0 antes, ocorre Morte.' },
} as const;

export type CondicaoId = keyof typeof CATALOGO_CONDICOES;
export type InstanciaCondicao = { id: string; condicao: CondicaoId; fonte: string; duracao?: string; observacao: string; estado?: 'ativa' | 'encerrada'; encerradaEm?: string | null };
const IDS = Object.keys(CATALOGO_CONDICOES) as CondicaoId[];
function objetoSimples(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
    && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
}
export function instanciaCondicaoValida(v: unknown): v is InstanciaCondicao {
  if (!objetoSimples(v)) return false;
  const chaves = Object.keys(v).sort().join('|');
  const legado = chaves === 'condicao|duracao|fonte|id|observacao' || chaves === 'condicao|fonte|id|observacao';
  const atual = chaves === 'condicao|duracao|encerradaEm|estado|fonte|id|observacao' || chaves === 'condicao|encerradaEm|estado|fonte|id|observacao';
  return (legado || atual)
    && typeof v.id === 'string' && v.id.trim().length > 0 && v.id.length <= 100
    && typeof v.condicao === 'string' && IDS.includes(v.condicao as CondicaoId)
    && typeof v.fonte === 'string' && v.fonte.trim().length > 0 && v.fonte.length <= 160
    && (v.duracao === undefined || (typeof v.duracao === 'string' && v.duracao.trim().length > 0 && v.duracao.length <= 160))
    && typeof v.observacao === 'string' && v.observacao.length <= 500
    && (!atual || (v.estado === 'ativa' || v.estado === 'encerrada')
      && (v.encerradaEm === null || (typeof v.encerradaEm === 'string' && !Number.isNaN(Date.parse(v.encerradaEm))))
      && (v.estado === 'ativa' ? v.encerradaEm === null : typeof v.encerradaEm === 'string'));
}
export function listaCondicoesValida(v: unknown): v is InstanciaCondicao[] {
  if (!Array.isArray(v) || v.length > 100) return false;
  const ids = new Set<string>();
  for (const item of v) { if (!instanciaCondicaoValida(item) || ids.has(item.id)) return false; ids.add(item.id); }
  return true;
}
export function adicionarInstanciaCondicao(atuais: InstanciaCondicao[], nova: InstanciaCondicao): InstanciaCondicao[] {
  if (!listaCondicoesValida(atuais) || !instanciaCondicaoValida(nova)) throw new Error('Registro de Condições inválido.');
  if (atuais.some(item => item.id === nova.id)) throw new Error('Identificador de Condição já utilizado.');
  return [...atuais, { ...nova }];
}
export function removerInstanciaCondicao(atuais: InstanciaCondicao[], id: string): InstanciaCondicao[] {
  if (!listaCondicoesValida(atuais) || typeof id !== 'string' || !id) throw new Error('Registro de Condições inválido.');
  return atuais.filter(item => item.id !== id);
}
/** Registros legados sem estado explícito continuam sendo considerados ativos. */
export function condicaoEstaAtiva(item: InstanciaCondicao): boolean {
  return item.estado !== 'encerrada';
}
export function condicoesAtivas(atuais: InstanciaCondicao[]): InstanciaCondicao[] {
  if (!listaCondicoesValida(atuais)) throw new Error('Registro de Condições inválido.');
  return atuais.filter(condicaoEstaAtiva);
}
export function encerrarInstanciaCondicao(atuais: InstanciaCondicao[], id: string, encerradaEm = new Date().toISOString()): InstanciaCondicao[] {
  if (!listaCondicoesValida(atuais) || typeof id !== 'string' || !id || Number.isNaN(Date.parse(encerradaEm))) throw new Error('Registro de Condições inválido.');
  if (!atuais.some(item => item.id === id && condicaoEstaAtiva(item))) throw new Error('Condição ativa não encontrada.');
  return atuais.map(item => item.id === id ? { ...item, estado: 'encerrada', encerradaEm } : { ...item });
}
/** Fontes distintas permanecem registradas, mas a mesma Condição só produz um conjunto de efeitos. */
export function condicoesComEfeitoUnico(atuais: InstanciaCondicao[]): CondicaoId[] {
  if (!listaCondicoesValida(atuais)) throw new Error('Registro de Condições inválido.');
  return [...new Set(condicoesAtivas(atuais).map(item => item.condicao))];
}
/** Lembretes de resolução por turno. Apenas orienta o jogador; nunca rola, aplica Dano ou encerra Condições. */
export function lembretesCondicoesPorTurno(valor: unknown): { inicio: string[]; fim: string[] } {
  if (!listaCondicoesValida(valor)) return { inicio: [], fim: [] };
  const ativas = condicoesAtivas(valor);
  const inicio: string[] = [];
  const fim: string[] = [];
  if (ativas.some(item => item.condicao === 'queimadura')) {
    inicio.push('Queimadura: faça Reflexos DT 12; em sucesso, apague as chamas.');
    fim.push('Queimadura: aplique 1d6 de Dano ao final do turno, se ainda estiver ativa.');
  }
  if (ativas.some(item => item.condicao === 'corrosao')) {
    inicio.push('Corrosão: faça Fortitude DT 12; em sucesso, encerre antes do Dano.');
    fim.push('Corrosão: se permaneceu ativa após o Teste do início do turno, aplique 1d4 de Dano.');
  }
  if (ativas.some(item => item.condicao === 'surpreendido')) {
    fim.push('Surpreendido: normalmente termina ao final do primeiro turno da própria criatura; confira se este é o turno aplicável.');
  }
  if (ativas.some(item => item.condicao === 'exposto')) {
    fim.push('Exposto: se foi causado por Falha Crítica, termina ao final do próximo turno da criatura; confira a origem e a contagem antes de encerrar.');
  }
  return { inicio, fim };
}

/** Vulnerável é derivada dos PV; não deve ser cadastrada como uma instância manual. */
export function vulneravelPorPV(pvAtual: number, pvMaximo: number): boolean {
  if (!Number.isSafeInteger(pvAtual) || pvAtual < 0 || !Number.isSafeInteger(pvMaximo) || pvMaximo <= 0) throw new Error('PV inválidos para avaliar Vulnerável.');
  return pvAtual * 5 <= pvMaximo;
}

/** Gera ID compatível com navegadores/WebViews sem crypto.randomUUID funcional. */
export function gerarIdCondicao(provedor: { randomUUID?: unknown } | null = globalThis.crypto): string {
  if (typeof provedor?.randomUUID === 'function') {
    return (provedor.randomUUID as () => string).call(provedor);
  }
  const aleatorio = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, caractere => {
    const valor = Number.parseInt(aleatorio(), 16);
    return (caractere === 'x' ? valor : (valor & 0x3) | 0x8).toString(16);
  });
}
