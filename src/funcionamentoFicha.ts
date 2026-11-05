export type ModoFuncionamento='automatico'|'misto'|'manual';
export type ModoDados='fisicos'|'virtuais'|'mistos';
export type VisibilidadeRolagem='publica'|'privada';
export const AUTOMACOES=[
 {id:'municao',nome:'Munição após disparos registrados',detalhe:'Consumo somente após Atacar ou Registrar Disparo; consultar um teste não consome.',padrao:true},
 {id:'inventario',nome:'Inventário após uso confirmado',detalhe:'Atualização ao concluir uso; abrir os detalhes de um item não o consome.',padrao:true},
 {id:'duracaoEfeitos',nome:'Duração de efeitos',detalhe:'Acompanhar durações elegíveis; sem aplicar Dano contínuo ou solicitar testes espontaneamente.',padrao:true},
 {id:'biInfectante',nome:'BI após ataque infectante',detalhe:'Opção independente, respeitando dano efetivo e exceções da regra.',padrao:null},
 {id:'durabilidadeAparar',nome:'Durabilidade ao Aparar',detalhe:'Opção independente para Aparar; não desconta em ataques comuns e respeita Indestrutível.',padrao:null}
] as const;
export type AutomacaoId=typeof AUTOMACOES[number]['id'];
export type ConfiguracaoFuncionamento={modo:ModoFuncionamento;preferenciasMisto:Record<AutomacaoId,boolean|null>;modoDados:ModoDados;visibilidadeRolagem:VisibilidadeRolagem};
export function configuracaoInicial():ConfiguracaoFuncionamento{
 return {modo:'misto',preferenciasMisto:{municao:true,inventario:true,duracaoEfeitos:true,biInfectante:null,durabilidadeAparar:null},modoDados:'mistos',visibilidadeRolagem:'publica'};
}
export function automacoesEfetivas(config:ConfiguracaoFuncionamento):Record<AutomacaoId,boolean|null>{
 return Object.fromEntries(AUTOMACOES.map(a=>[a.id,config.modo==='automatico'?true:config.modo==='manual'?false:config.preferenciasMisto[a.id]])) as Record<AutomacaoId,boolean|null>;
}

export function configuracaoFuncionamentoValida(valor: unknown): boolean {
 if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
 const config = valor as Record<string, unknown>;
 const obrigatorias = ['modo', 'preferenciasMisto'];
 const opcionais = ['modoDados', 'visibilidadeRolagem'];
 const chaves = Object.keys(config);
 if (obrigatorias.some(chave => !chaves.includes(chave)) || chaves.some(chave => ![...obrigatorias, ...opcionais].includes(chave))) return false;
 if (config.modo !== 'automatico' && config.modo !== 'misto' && config.modo !== 'manual') return false;
 if (config.modoDados !== undefined && config.modoDados !== 'fisicos' && config.modoDados !== 'virtuais' && config.modoDados !== 'mistos') return false;
 if (config.visibilidadeRolagem !== undefined && config.visibilidadeRolagem !== 'publica' && config.visibilidadeRolagem !== 'privada') return false;
 const preferencias = config.preferenciasMisto;
 if (!preferencias || typeof preferencias !== 'object' || Array.isArray(preferencias)) return false;
 const escolhas = preferencias as Record<string, unknown>;
 const ids = AUTOMACOES.map(item => item.id).sort();
 if (Object.keys(escolhas).sort().join('|') !== ids.join('|')) return false;
 return AUTOMACOES.every(item => item.padrao === null
  ? escolhas[item.id] === null || typeof escolhas[item.id] === 'boolean'
  : typeof escolhas[item.id] === 'boolean');
}

export function normalizarConfiguracaoFuncionamento(valor: unknown): ConfiguracaoFuncionamento {
 const padrao = configuracaoInicial();
 if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return padrao;
 const config = valor as Record<string, unknown>;
 if (!configuracaoFuncionamentoValida(valor)) return padrao;
 return {
  modo: config.modo as ModoFuncionamento,
  preferenciasMisto: { ...(config.preferenciasMisto as Record<AutomacaoId, boolean | null>) },
  modoDados: (config.modoDados as ModoDados | undefined) ?? padrao.modoDados,
  visibilidadeRolagem: (config.visibilidadeRolagem as VisibilidadeRolagem | undefined) ?? padrao.visibilidadeRolagem,
 };
}
