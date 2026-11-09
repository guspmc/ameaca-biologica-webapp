// Projecao da escolha de criacao. Nao e um inventario ativo nem saldo mutavel.
export type ItemInicial={id:string;nome:string;espacos:number;detalhe:string};
export type OpcaoInicial='A'|'B'|'C';
const item=(id:string,nome:string,espacos:number,detalhe=''):ItemInicial=>({id,nome,espacos,detalhe});
export function capacidadeInventario(forca:number,origem:string|null){return 4+forca+(origem==='Mochileiro'?1:0);}
export function opcoesEquipamento(classe:string|null):{id:OpcaoInicial;nome:string;referencia:string}[]{
  if(!classe||!['Agente','Autodidata','Operador'].includes(classe))return [];
  const agente=classe==='Agente';
  const referencia=agente?'J 30':classe==='Autodidata'?'J 34':'J 38';
  return [
    {id:'A',nome:agente?'Sentinel Nine + Colete Acolchoado':'Bastão de Beisebol + Colete Acolchoado + 1 Moeda Antiga',referencia},
    {id:'B',nome:agente?'JMB Hp3 + 1 Moeda Antiga':'LEMI + 1 Moeda Antiga',referencia},
    {id:'C',nome:'Personalizado · 3 Moedas Antigas',referencia}
  ];
}
export function equipamentoInicial(classe:string|null,opcao:string|null):ItemInicial[]{
  if(!opcoesEquipamento(classe).some(o=>o.id===opcao))return [];
  const itens=[item('erva-verde','Erva Verde',1,'1 unidade · J 68'),item('lanterna-simples','Lanterna Simples',1,'Cone 12 m · J 67')];
  if(opcao==='C')return [...itens,item('moedas','Moedas Antigas',1,'3 moedas no mesmo bloco · compras ainda pendentes')];
  const agente=classe==='Agente';
  if(opcao==='A')return [...itens,
    agente?item('sentinel-nine','Sentinel Nine',1,'19/19 tiros · 9 mm · sem reserva · J 53'):item('bastao','Bastão de Beisebol',1,'Durabilidade 2/2 · J 50'),
    item('colete-acolchoado','Colete Acolchoado',1,'Guardado · +1 Defesa somente quando equipado · J 67'),
    ...(!agente?[item('moedas','Moedas Antigas',1,'1 moeda')]:[])];
  return [...itens,agente?item('jmb-hp3','JMB Hp3',1,'13/13 tiros · 9 mm · sem reserva · J 53'):item('lemi','LEMI',1,'10/10 tiros · 9 mm · sem reserva · J 53'),item('moedas','Moedas Antigas',1,'1 moeda')];
}
export function caracteristicos(classe:string|null):ItemInicial[]{
  switch(classe){
    case 'Agente':return [item('gazua-profissional','Gazua Profissional',0,'Reutilizável · J 69'),item('hatchet','Hatchet',0,'Em posse · Indestrutível · Arremessável · J 50–51')];
    case 'Autodidata':return [item('kit-socorros','Kit de Primeiros Socorros',0,'Vinculado à Classe · J 70'),item('pente-estendido','Pente Estendido 9 mm',0,'Guardado · +5 capacidade quando instalado em arma compatível · J 64')];
    case 'Operador':return [item('kendo','Colete de Placas Kendo',0,'0 placas · Guardado · J 66–67'),item('kit-ferramentas','Kit de Ferramentas',0,'Vinculado à Classe · J 69')];
    default:return [];
  }
}
export function espacosOcupados(itens:ItemInicial[]){return itens.reduce((n,i)=>n+i.espacos,0);}
