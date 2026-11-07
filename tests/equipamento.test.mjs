import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const {outputText}=ts.transpileModule(await readFile(new URL('../src/equipamento.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {equipamentoInicial,caracteristicos,espacosOcupados,capacidadeInventario}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('kits oficiais: comuns uma vez, moedas em um bloco, Caracteristicos fora dos Espacos',()=>{
  for(const classe of ['Agente','Autodidata','Operador']){
    for(const opcao of ['A','B','C']){
      const itens=equipamentoInicial(classe,opcao);
      assert.equal(itens.filter(i=>i.id==='erva-verde').length,1);
      assert.equal(itens.filter(i=>i.id==='lanterna-simples').length,1);
      assert.equal(espacosOcupados(itens),opcao==='C'?3:opcao==='A'&&classe!=='Agente'?5:4);
      assert.equal(caracteristicos(classe).length,2);
      assert.equal(espacosOcupados(caracteristicos(classe)),0);
      if(opcao==='C')assert.equal(itens.find(i=>i.id==='moedas').detalhe.startsWith('3 moedas'),true);
    }
  }
  assert.equal(equipamentoInicial('Agente','A').find(i=>i.id==='sentinel-nine').detalhe.startsWith('19/19'),true);
  assert.equal(equipamentoInicial('Agente','B').find(i=>i.id==='jmb-hp3').detalhe.startsWith('13/13'),true);
  assert.equal(equipamentoInicial('Autodidata','B').find(i=>i.id==='lemi').detalhe.startsWith('10/10'),true);
});
test('capacidade baixa bloqueia kit maior; Mochileiro acrescenta um; escolha ausente nao concede itens',()=>{
  assert.equal(capacidadeInventario(0,null),4);
  assert.equal(capacidadeInventario(0,'Mochileiro'),5);
  assert.equal(espacosOcupados(equipamentoInicial('Operador','A'))>capacidadeInventario(0,null),true);
  for(const [classe,opcao] of [['Outra','A'],['Agente',null],['Agente','D']])assert.deepEqual(equipamentoInicial(classe,opcao),[]);
});
