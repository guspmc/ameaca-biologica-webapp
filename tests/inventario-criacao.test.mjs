import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const nomes=['origens','equipamento','comprasIniciais','inventarioCriacao'];
const source=(await Promise.all(nomes.map(n=>readFile(new URL('../src/'+n+'.ts',import.meta.url),'utf8')))).map(s=>s.replace(/^import .*;\r?$/gm,'')).join('\n');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {planejarInventarioCriacao:planejar}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const ficha=(classe='Agente',kit='C',extra={})=>({classe,equipamento_inicial:kit,forca:3,origem:null,nivel:1,estado_ficha:'rascunho',compras_iniciais:{},...extra});
test('inventario inicial: nove kits oficiais, Caracteristicos fora da grade e armas carregadas sem reserva extra',()=>{
 for(const classe of ['Agente','Autodidata','Operador'])for(const kit of ['A','B','C']){
  const p=planejar(ficha(classe,kit));
  assert.equal(p.capacidade,7);assert.equal(p.ocupados,kit==='C'?3:kit==='B'?4:classe==='Agente'?4:5);
  assert.equal(p.itens.filter(i=>i.vinculadoClasse).length,2);
  assert.ok(p.itens.filter(i=>i.vinculadoClasse).every(i=>i.espacos===0&&i.posicao===null));
  assert.equal(p.itens.filter(i=>i.catalogoId==='erva-verde').length,1);
  assert.equal(p.itens.filter(i=>i.catalogoId==='lanterna-simples').length,1);
  assert.deepEqual(p.itens.filter(i=>i.local==='inventario').map(i=>i.posicao),Array.from({length:p.ocupados},(_,i)=>i));
  assert.equal(new Set(p.itens.map(i=>i.chaveCriacao)).size,p.itens.length);
  const arma=p.itens.find(i=>i.estado.tipo==='arma_fogo');
  if(arma){const esperado=arma.catalogoId==='sentinel-nine'?19:arma.catalogoId==='jmb-hp3'?13:10;assert.equal(arma.estado.carregada,esperado);assert.equal(arma.estado.capacidade,esperado);assert.equal(arma.estado.equipada,false);}
  assert.equal(p.itens.some(i=>i.estado.tipo==='municao'),false);
  assert.ok(p.itens.filter(i=>i.estado.tipo==='colete').every(i=>!i.estado.equipado));
 }
});
test('inventario inicial: 45 tiros viram pilhas de 30 e 15, saldo zero nao ocupa bloco',()=>{
 const p=planejar(ficha('Agente','C',{forca:0,compras_iniciais:{'municao-9mm':3}}));
 assert.equal(p.ocupados,4);
 assert.deepEqual(p.itens.filter(i=>i.estado.tipo==='municao').map(i=>i.quantidade),[30,15]);
 assert.equal(p.itens.some(i=>i.catalogoId==='moedas'),false);
 const q=planejar(ficha('Agente','C',{compras_iniciais:{'municao-9mm':2}}));
 assert.deepEqual(q.itens.filter(i=>i.estado.tipo==='municao').map(i=>i.quantidade),[30]);
 assert.equal(q.itens.find(i=>i.catalogoId==='moedas').quantidade,1);
});
test('inventario inicial: duas Facas sao instancias distintas; estados especiais nao equipam nem concedem bonus',()=>{
 const p=planejar(ficha('Agente','C',{compras_iniciais:{faca:2}}));
 const facas=p.itens.filter(i=>i.catalogoId==='faca');
 assert.equal(facas.length,2);assert.notEqual(facas[0].chaveCriacao,facas[1].chaveCriacao);
 assert.ok(facas.every(i=>i.quantidade===1&&i.estado.durabilidadeAtual===2&&i.estado.arremessavel&&!i.estado.equipada));
 const h=p.itens.find(i=>i.catalogoId==='hatchet');assert.equal(h.estado.indestrutivel,true);assert.equal(h.estado.durabilidadeAtual,null);
 const op=planejar(ficha('Operador','B'));assert.equal(op.itens.find(i=>i.catalogoId==='kendo').estado.placas,0);
 const auto=planejar(ficha('Autodidata','B'));assert.equal(auto.itens.find(i=>i.catalogoId==='pente-estendido').estado.instaladaEm,null);
 assert.equal(auto.itens.find(i=>i.catalogoId==='lemi').estado.capacidade,10);
});
test('inventario inicial: ordem de payload nao muda plano e entradas/saidas permanecem independentes',()=>{
 const f=ficha('Agente','C',{compras_iniciais:{faca:1,'lanterna-simples':1},pv_atual:2,bi_atual:5});
 const antes=structuredClone(f),a=planejar(f),b=planejar({...f,compras_iniciais:{'lanterna-simples':1,faca:1}});
 assert.deepEqual(a,b);assert.deepEqual(f,antes);
 const facas=a.itens.filter(i=>i.catalogoId==='faca');facas[0].estado.durabilidadeAtual=0;
 assert.equal(b.itens.find(i=>i.catalogoId==='faca').estado.durabilidadeAtual,2);
 assert.equal(a.itens.filter(i=>i.catalogoId==='lanterna-simples').length,2);
});
test('inventario inicial: entradas invalidas e excesso nao produzem plano parcial; Mochileiro acrescenta capacidade real',()=>{
 for(const patch of [{classe:null},{classe:'Outra'},{equipamento_inicial:'D'},{forca:-1},{forca:4},{forca:1.5},{nivel:2},{estado_ficha:'completa'},{origem:'Inventada'},{compras_iniciais:null},{compras_iniciais:[]},{compras_iniciais:{faca:4}},{compras_iniciais:{faca:-1}},{compras_iniciais:{faca:'1'}},{compras_iniciais:{intruso:1}},{compras_iniciais:{'colete-leve':2}}])assert.throws(()=>planejar(ficha('Agente','C',patch)));
 assert.throws(()=>planejar(ficha('Agente','B',{compras_iniciais:{faca:1}})));
 assert.throws(()=>planejar(ficha('Operador','A',{forca:0})));
 const p=planejar(ficha('Operador','A',{forca:0,origem:'Mochileiro'}));assert.equal(p.capacidade,5);assert.equal(p.ocupados,5);
 assert.throws(()=>planejar(ficha('Agente','C',{forca:0,compras_iniciais:{faca:2}})));
});
