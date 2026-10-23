import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
// Compila os modulos reais juntos, sem duplicar regras no adaptador de teste.
const files=['origens','habilidades','pericias','equipamento','textoPersonagem','conferenciaCriacao'];
const source=(await Promise.all(files.map(f=>readFile(new URL('../src/'+f+'.ts',import.meta.url),'utf8')))).map(s=>s.replace(/^import .*;\r?$/gm,'')).join('\n');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {revisarCriacao,classePersonagem}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const ficha={nome:'Sobrevivente ficticio',classe:'Operador',nivel:1,forca:3,agilidade:1,vigor:3,astucia:0,
  origem:'Investigador',pericia_origem_treinada:'Investigação',pericia_origem_extra:null,
  pontos_pericia_classe:{Atletismo:1,Luta:2},habilidade_basica:'parrudo',equipamento_inicial:'B',
  pv_maximo:20,sa_maximo:1,bi_maximo:9,defesa:11};
const linha=(f,nome)=>revisarCriacao(f).find(l=>l.nome===nome);
test('revisao confere exemplo oficial Operador/Parrudo sem alterar valores ou ativar ficha',()=>{
  const input=structuredClone(ficha),before=structuredClone(input);
  assert.equal(revisarCriacao(input).every(l=>l.estado==='conferido'),true);
  assert.match(linha(input,'PV máximos').detalhe,/Parrudo 5 = 20/);
  assert.match(linha(input,'Equipamento inicial').detalhe,/4\/7/);
  assert.deepEqual(input,before);
});
test('revisao aponta escolhas ausentes e invalidas; nao confunde parcial com completo',()=>{
  assert.equal(linha({...ficha,pontos_pericia_classe:{Luta:1}},'Pontos de Perícia').estado,'pendente');
  assert.equal(linha({...ficha,pontos_pericia_classe:{Luta:2,Atletismo:2}},'Pontos de Perícia').estado,'revisar');
  assert.equal(linha({...ficha,pontos_pericia_classe:{Vontade:2,Atletismo:1}},'Pontos de Perícia').estado,'revisar');
  assert.equal(linha({...ficha,habilidade_basica:null},'Habilidade Básica').estado,'pendente');
  assert.equal(linha({...ficha,habilidade_basica:'rolamento'},'Habilidade Básica').estado,'revisar');
  assert.equal(linha({...ficha,equipamento_inicial:null},'Equipamento inicial').estado,'pendente');
  assert.equal(linha({...ficha,forca:0,vigor:0},'Atributos').estado,'revisar');
  assert.equal(linha({...ficha,pv_maximo:99},'PV máximos').estado,'revisar');
  assert.equal(linha({...ficha,nivel:2},'Classe e nível').estado,'revisar');
  assert.equal(linha({...ficha,nivel:2},'PV máximos'),undefined);
});
test('revisao respeita lista ampliada, grau gratuito e capacidade; Personalizado continua pendente',()=>{
  const f={...ficha,origem:'Acadêmico',pericia_origem_treinada:'Investigação',pontos_pericia_classe:{Medicina:2,Luta:1}};
  assert.equal(linha(f,'Pontos de Perícia').estado,'conferido');
  assert.equal(linha({...f,pontos_pericia_classe:{Investigação:2,Luta:1}},'Pontos de Perícia').estado,'revisar');
  const amnesico={...f,origem:'Amnésico',pericia_origem_treinada:'Vontade',pericia_origem_extra:'Medicina'};
  assert.equal(linha(amnesico,'Origem e Treinamento').estado,'conferido');
  assert.equal(linha({...amnesico,pericia_origem_extra:'Vontade'},'Origem e Treinamento').estado,'revisar');
  const fraco={...ficha,forca:0,agilidade:3,vigor:3,astucia:1,equipamento_inicial:'A',origem:'Mochileiro',pericia_origem_treinada:'Atletismo'};
  assert.equal(linha(fraco,'Equipamento inicial').estado,'conferido');
  assert.equal(linha({...fraco,origem:'Policial',pericia_origem_treinada:'Pontaria'},'Equipamento inicial').estado,'revisar');
  assert.equal(linha({...ficha,equipamento_inicial:'C'},'Compras do Personalizado').estado,'pendente');
});
test('flexao depende apenas da declaracao explicita da personagem e preserva Classe mecanica',()=>{
  assert.equal(classePersonagem('Operador',' Feminino '),'Operadora');
  assert.equal(classePersonagem('Operador','MULHER'),'Operadora');
  for(const genero of [undefined,'','Não informado','não binário','Masculino'])assert.equal(classePersonagem('Operador',genero),'Operador');
  assert.equal(classePersonagem('Agente','Feminino'),'Agente');
  assert.equal(classePersonagem('Autodidata','Feminino'),'Autodidata');
  assert.equal(classePersonagem(null,'Feminino'),'Classe pendente');
  assert.equal(ficha.classe,'Operador');
});

test('revisao combina bonus de Origem nos maximos e usa genero apenas na apresentacao',()=>{
 const cobaia={...ficha,origem:'Cobaia',pericia_origem_treinada:'Reflexos',bi_maximo:11,identidade:{genero:'Feminino'}};
 assert.equal(linha(cobaia,'BI máxima').estado,'conferido');
 assert.match(linha(cobaia,'BI máxima').detalhe,/Cobaia 2.*Parruda 3 = 11/);
 assert.match(linha(cobaia,'Classe e nível').detalhe,/Operadora/);
 const universitaria={...ficha,origem:'Universitária',pericia_origem_treinada:'Medicina',sa_maximo:2};
 assert.equal(linha(universitaria,'SA máximo').estado,'conferido');
 assert.match(linha(universitaria,'SA máximo').detalhe,/Universitária 1 = 2/);
 const policial={...ficha,origem:'Policial',pericia_origem_treinada:'Pontaria',defesa:13};
 assert.equal(linha(policial,'Defesa básica').estado,'conferido');
});
