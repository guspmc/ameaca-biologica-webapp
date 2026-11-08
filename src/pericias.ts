export const PONTOS_CLASSE:Record<string,number>={Agente:4,Autodidata:5,Operador:3};
export const PERICIAS_CLASSE:Record<string,string[]>={
  Agente:['Acrobacia','Furtividade','Investigação','Luta','Percepção','Pontaria','Reflexos','Sobrevivência'],
  Autodidata:['Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade'],
  Operador:['Atletismo','Fortitude','Investigação','Luta','Percepção','Pontaria'],
};
export function grauPericia(nome:string,treinada:string|null,pontos:Record<string,number>,periciaOrigemExtra:string|null=null,periciaTentativaErro:string|null=null):number{
  return Math.min(2,(pontos[nome]??0)+(nome===treinada?1:0)+(nome===periciaOrigemExtra?1:0)+(nome===periciaTentativaErro?1:0));
}
export function bonusTentativaErro(nome:string,treinada:string|null,pontos:Record<string,number>,periciaOrigemExtra:string|null=null,periciaTentativaErro:string|null=null):number{
  return grauPericia(nome,treinada,pontos,periciaOrigemExtra,periciaTentativaErro)===0?1:0;
}
export function bonusTreinamento(grau:number):number{return grau===2?3:grau===1?2:0;}
export function totalPontos(pontos:Record<string,number>):number{
  return Object.values(pontos).reduce((a,b)=>a+b,0);
}

export const ATRIBUTO_PERICIA: Record<string, 'forca' | 'agilidade' | 'vigor' | 'astucia'> = {
  Acrobacia: 'agilidade',
  Atletismo: 'forca',
  Fortitude: 'vigor',
  Furtividade: 'agilidade',
  Investigação: 'astucia',
  Luta: 'forca',
  Medicina: 'astucia',
  Percepção: 'astucia',
  Pontaria: 'agilidade',
  Reflexos: 'agilidade',
  Sobrevivência: 'astucia',
  Vontade: 'astucia',
};

export function valorBasePericia(
  nome: string,
  atributos: Record<'forca' | 'agilidade' | 'vigor' | 'astucia', number>,
  treinada: string | null,
  pontos: Record<string, number>,
  periciaOrigemExtra: string | null = null,
  periciaTentativaErro: string | null = null,
): number {
  const atributo = ATRIBUTO_PERICIA[nome];
  if (!atributo) throw new Error('Perícia desconhecida: ' + nome);
  return atributos[atributo] + bonusTreinamento(grauPericia(nome, treinada, pontos, periciaOrigemExtra, periciaTentativaErro));
}

export function valorPassivoPericia(
  nome: string,
  atributos: Record<'forca' | 'agilidade' | 'vigor' | 'astucia', number>,
  treinada: string | null,
  pontos: Record<string, number>,
  periciaOrigemExtra: string | null = null,
  periciaTentativaErro: string | null = null,
): number {
  return 10 + valorBasePericia(nome, atributos, treinada, pontos, periciaOrigemExtra, periciaTentativaErro);
}
