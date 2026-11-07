// Catalogo parcial verificado. Simulacao de criacao: nenhum saldo ou item persistido.
export const CATALOGO_INICIAL=[
  {id:'bastao',nome:'Bastão de Beisebol',preco:1,unidades:1,pilha:1,referencia:'J 50'},
  {id:'faca',nome:'Faca',preco:1,unidades:1,pilha:1,referencia:'J 50'},
  {id:'colete-acolchoado',nome:'Colete Acolchoado',preco:1,unidades:1,pilha:1,referencia:'J 67'},
  {id:'colete-leve',nome:'Colete Balístico Leve',preco:2,unidades:1,pilha:1,referencia:'J 67'},
  {id:'lanterna-simples',nome:'Lanterna Simples',preco:1,unidades:1,pilha:1,referencia:'J 67'},
  {id:'municao-9mm',nome:'Munição 9 mm',preco:1,unidades:15,pilha:30,referencia:'J 65'}
];
export function simularCompras(plano:Record<string,number>,capacidade:number){
  if(!Number.isInteger(capacidade)||capacidade<0||capacidade>100)throw new Error('Capacidade inválida.');
  let gasto=0,espacos=2; // Erva Verde e Lanterna Simples comuns.
  const itens:{id:string;nome:string;quantidade:number;espacos:number}[]=[];
  for(const [id,n] of Object.entries(plano)){
    const item=CATALOGO_INICIAL.find(i=>i.id===id);
    if(!item||!Number.isInteger(n)||n<0||n>3)throw new Error('Escolha de compra inválida.');
    if(!n)continue;
    gasto+=item.preco*n;
    const quantidade=n*item.unidades;
    const ocupa=Math.ceil(quantidade/item.pilha);
    espacos+=ocupa;itens.push({id,nome:item.nome,quantidade,espacos:ocupa});
  }
  const saldo=3-gasto;
  if(saldo>0)espacos+=1; // Ate tres moedas restantes, um unico bloco.
  return {gasto,saldo,espacos,itens,cabe:espacos<=capacidade,orcamentoValido:saldo>=0};
}
