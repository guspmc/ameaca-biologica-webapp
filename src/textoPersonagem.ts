// Flexao apenas por declaracao explicita. Nunca inferir pelo nome ou pela conta.
const FORMAS:Record<string,[string,string]>={
  'REGISTRO DO SOBREVIVENTE':['REGISTRO DO SOBREVIVENTE','REGISTRO DA SOBREVIVENTE'],
  Operador:['Operador','Operadora'],Acadêmico:['Acadêmico','Acadêmica'],Amnésico:['Amnésico','Amnésica'],
  Criminoso:['Criminoso','Criminosa'],Desgarrado:['Desgarrado','Desgarrada'],Investigador:['Investigador','Investigadora'],
  Lutador:['Lutador','Lutadora'],Mercenário:['Mercenário','Mercenária'],Mochileiro:['Mochileiro','Mochileira'],
  Operário:['Operário','Operária'],'Servidor Público':['Servidor Público','Servidora Pública'],
  Universitária:['Universitário','Universitária'],Armeiro:['Armeiro','Armeira'],Parrudo:['Parrudo','Parruda'],
  Curiosa:['Curioso','Curiosa'],Impiedoso:['Impiedoso','Impiedosa'],Brigão:['Brigão','Brigona']
};
export function termoPersonagem(termo:string,genero?:string){
  const declarado=(genero??'').trim().toLocaleLowerCase('pt-BR');
  const indice=['feminino','feminina','mulher','f'].includes(declarado)?1:
    ['masculino','homem','m'].includes(declarado)?0:null;
  return indice!==null&&Object.hasOwn(FORMAS,termo)?FORMAS[termo][indice]:termo;
}
export function classePersonagem(classe:string|null,genero?:string){return termoPersonagem(classe??'Classe pendente',genero);}
