import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const {outputText}=ts.transpileModule(await readFile(new URL('../src/funcionamentoFicha.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {configuracaoInicial,automacoesEfetivas}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('funcionamento: Misto inicia com tres padroes aprovados e duas escolhas explicitamente indefinidas',()=>{
 const c=configuracaoInicial();
 assert.equal(c.modo,'misto');
 assert.deepEqual(automacoesEfetivas(c),{municao:true,inventario:true,duracaoEfeitos:true,biInfectante:null,durabilidadeAparar:null});
});
test('funcionamento: alternar modos preserva preferencias Misto sem alterar escolhas',()=>{
 const c=configuracaoInicial();c.preferenciasMisto.municao=false;c.preferenciasMisto.biInfectante=true;
 const before=structuredClone(c);
 assert.deepEqual(Object.values(automacoesEfetivas({...c,modo:'automatico'})),[true,true,true,true,true]);
 assert.deepEqual(Object.values(automacoesEfetivas({...c,modo:'manual'})),[false,false,false,false,false]);
 assert.deepEqual(automacoesEfetivas(c),c.preferenciasMisto);
 assert.deepEqual(c,before);
});
test('funcionamento: restaurar padrao cria estado independente e nao reutiliza escolhas da outra ficha',()=>{
 const a=configuracaoInicial(),b=configuracaoInicial();a.preferenciasMisto.inventario=false;
 assert.equal(b.preferenciasMisto.inventario,true);assert.notEqual(a.preferenciasMisto,b.preferenciasMisto);
});
