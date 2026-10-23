// Flexao apenas por declaracao explicita. Nunca inferir pelo nome ou pela conta.
export function classePersonagem(classe:string|null,genero?:string){
  const feminino=['feminino','feminina','mulher','f'].includes((genero??'').trim().toLocaleLowerCase('pt-BR'));
  return classe==='Operador'&&feminino?'Operadora':classe??'Classe pendente';
}
