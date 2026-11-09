import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
async function modulo(nome){
 const {outputText}=ts.transpileModule(await readFile(new URL('../src/'+nome+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 return import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
}
const {simularCompras}=await modulo('comprasIniciais');
const {termoPersonagem}=await modulo('textoPersonagem');
test('compras: saldo inclui moedas remanescentes e itens comuns, sem conceder itens extras',()=>{
 assert.deepEqual(simularCompras({},4),{gasto:0,saldo:3,espacos:3,itens:[],cabe:true,orcamentoValido:true});
 const r=simularCompras({bastao:1,'colete-acolchoado':1},4);
 assert.equal(r.saldo,1);assert.equal(r.espacos,5);assert.equal(r.cabe,false);
 assert.equal(simularCompras({'colete-leve':2},7).orcamentoValido,false);
 assert.equal(simularCompras({'lanterna-simples':3},4).cabe,false);
});
test('compras: 9 mm usa lotes de 15 e pilhas oficiais de 30, sem cobrar moeda de saldo zero',()=>{
 const dois=simularCompras({'municao-9mm':2},4);
 assert.equal(dois.itens[0].quantidade,30);assert.equal(dois.itens[0].espacos,1);assert.equal(dois.saldo,1);assert.equal(dois.espacos,4);
 const tres=simularCompras({'municao-9mm':3},4);
 assert.equal(tres.itens[0].quantidade,45);assert.equal(tres.itens[0].espacos,2);assert.equal(tres.saldo,0);assert.equal(tres.espacos,4);
});
test('compras: invalido e fora do catalogo recusado; calculo nao modifica plano',()=>{
 for(const plano of [{Hatchet:1},{bastao:-1},{bastao:0.5},{bastao:4},{bastao:NaN}])assert.throws(()=>simularCompras(plano,7),/inválida/);
 for(const capacidade of [-1,NaN,1.5])assert.throws(()=>simularCompras({},capacidade),/inválida/);
 const plano={bastao:1};simularCompras(plano,7);assert.deepEqual(plano,{bastao:1});
});
test('flexoes de Origem, Habilidade e Ramo respeitam genero declarado e mantem termos invariantes',()=>{
 for(const [original,feminino] of [['Investigador','Investigadora'],['Acadêmico','Acadêmica'],['Amnésico','Amnésica'],['Criminoso','Criminosa'],['Desgarrado','Desgarrada'],['Lutador','Lutadora'],['Mercenário','Mercenária'],['Mochileiro','Mochileira'],['Operário','Operária'],['Servidor Público','Servidora Pública'],['Armeiro','Armeira'],['Parrudo','Parruda'],['Impiedoso','Impiedosa'],['Brigão','Brigona']]){
   assert.equal(termoPersonagem(original,' Feminino '),feminino);
   assert.equal(termoPersonagem(original,'Masculino'),original);
   assert.equal(termoPersonagem(original,'não binário'),original);
 }
 assert.equal(termoPersonagem('Universitária','Masculino'),'Universitário');
 assert.equal(termoPersonagem('Curiosa','Masculino'),'Curioso');
 for(const termo of ['Policial','Militar','Agente de Saúde','Cobaia','Atleta','Herbalista','GOLPE SUJO','Luta','Mestre'])assert.equal(termoPersonagem(termo,'Feminino'),termo);
 assert.equal(termoPersonagem('Investigador'),'Investigador');
});
