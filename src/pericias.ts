export const PONTOS_CLASSE:Record<string,number>={Agente:4,Autodidata:5,Operador:3};
export const PERICIAS_CLASSE:Record<string,string[]>={
  Agente:['Acrobacia','Furtividade','Investigação','Luta','Percepção','Pontaria','Reflexos','Sobrevivência'],
  Autodidata:['Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade'],
  Operador:['Atletismo','Fortitude','Investigação','Luta','Percepção','Pontaria'],
};
export function grauPericia(nome:string,treinada:string|null,pontos:Record<string,number>):number{
  return (pontos[nome]??0)+(nome===treinada?1:0);
}
export function bonusTreinamento(grau:number):number{return grau===2?3:grau===1?2:0;}
export function totalPontos(pontos:Record<string,number>):number{
  return Object.values(pontos).reduce((a,b)=>a+b,0);
}
