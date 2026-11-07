export type ModoFuncionamento='automatico'|'misto'|'manual';
export const AUTOMACOES=[
 {id:'municao',nome:'Munição após disparos registrados',detalhe:'Consumo somente após Atacar ou Registrar Disparo; consultar um teste não consome.',padrao:true},
 {id:'inventario',nome:'Inventário após uso confirmado',detalhe:'Atualização ao concluir uso; abrir os detalhes de um item não o consome.',padrao:true},
 {id:'duracaoEfeitos',nome:'Duração de efeitos',detalhe:'Acompanhar durações elegíveis; sem aplicar Dano contínuo ou solicitar testes espontaneamente.',padrao:true},
 {id:'biInfectante',nome:'BI após ataque infectante',detalhe:'Opção independente, respeitando dano efetivo e exceções da regra.',padrao:null},
 {id:'durabilidadeAparar',nome:'Durabilidade ao Aparar',detalhe:'Opção independente para Aparar; não desconta em ataques comuns e respeita Indestrutível.',padrao:null}
] as const;
export type AutomacaoId=typeof AUTOMACOES[number]['id'];
export type ConfiguracaoFuncionamento={modo:ModoFuncionamento;preferenciasMisto:Record<AutomacaoId,boolean|null>};
export function configuracaoInicial():ConfiguracaoFuncionamento{
 return {modo:'misto',preferenciasMisto:{municao:true,inventario:true,duracaoEfeitos:true,biInfectante:null,durabilidadeAparar:null}};
}
export function automacoesEfetivas(config:ConfiguracaoFuncionamento):Record<AutomacaoId,boolean|null>{
 return Object.fromEntries(AUTOMACOES.map(a=>[a.id,config.modo==='automatico'?true:config.modo==='manual'?false:config.preferenciasMisto[a.id]])) as Record<AutomacaoId,boolean|null>;
}
