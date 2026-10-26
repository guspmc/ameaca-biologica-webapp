import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),modulos={},require=createRequire(import.meta.url);
for(const [nome,arquivo] of [['inventarioConsulta','../src/inventarioConsulta.ts'],['consultaContextual','../src/consultaContextual.ts'],['consultaInventarioLocal','../src/consultaInventarioLocal.ts'],['estadoInventario','./ui/estadoInventario.ts'],['PainelInventarioLocal','../src/PainelInventarioLocal.tsx']]){
 let s=ts.transpileModule(await readFile(new URL(arquivo,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 s=s.replaceAll("'react'",JSON.stringify(pathToFileURL(require.resolve('react')).href)).replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
 for(const [n,u]of Object.entries(modulos))s=s.replaceAll("'./"+n+"'",JSON.stringify(u));modulos[nome]=uri(s);
}
const {lerInventarioConsulta:ler,filtrarExemplares:filtrar,detalheExemplar:detalhe}=await import(modulos.inventarioConsulta);
const {prepararConsultaInventarioLocal:controle}=await import(modulos.consultaInventarioLocal),{prepararInventarioQA:servidor,FICHAS_INVENTARIO:F}=await import(modulos.estadoInventario),{default:Painel}=await import(modulos.PainelInventarioLocal);
const bruto=async(modo='normal',c=F.A)=>servidor(modo).carregar(c);
const preparar=(modo='normal')=>{const s=servidor(modo),c=controle(s.carregar);return {s,c};};
const consultar=async c=>{c.selecionar(F.A);await c.consultar();return c.estado();};
const html=e=>renderToStaticMarkup(React.createElement(Painel,{estado:e,aoConsultar:()=>{throw Error('não deve consultar ao renderizar');}}));

test('inventário: seleção e renderização inertes, contexto inválido não chama transporte',async()=>{
 const {s,c}=preparar();assert.equal(await c.consultar(),'descartada');html(c.estado());c.selecionar(F.A);html(c.estado());assert.equal(s.estado().consultas,0);
 assert.throws(()=>c.selecionar({...F.A,mesaId:'errada'}));assert.equal(c.estado().selecao,null);await c.consultar();assert.equal(s.estado().consultas,0);
});
test('inventário: duas facas mantêm exemplares e durabilidades independentes',async()=>{
 const v=ler(await bruto(),F.A.personagemId),facas=filtrar(v,'FACA','todos');assert.equal(v.itens.length,8);assert.equal(v.itens.reduce((n,i)=>n+i.espacos,0),6);assert.equal(v.capacidade,7);
 assert.equal(facas.length,2);assert.notEqual(facas[0].instanciaId,facas[1].instanciaId);assert.deepEqual(facas.map(i=>i.estado.durabilidadeAtual),[1,2]);
});
test('inventário: parser e estado retornado não expõem referências mutáveis',async()=>{
 const b=await bruto(),v=ler(b,F.A.personagemId);b.itens[2].estado.carregada=9;assert.equal(v.itens[2].estado.carregada,4);
 const {c}=preparar();await consultar(c);const e=c.estado();e.valor.itens[2].estado.carregada=9;e.selecao.nome='forjada';assert.equal(c.estado().valor.itens[2].estado.carregada,4);assert.equal(c.estado().selecao.nome,F.A.nome);
});
test('inventário: rejeita lista contaminada, IDs e posições duplicados ou personagem diferente',async()=>{
 for(const alterar of [v=>v.historia='SEGREDO',v=>v.itens[0].historia='SEGREDO',v=>v.itens.push(structuredClone(v.itens[0])),v=>v.itens[1].posicao=0,v=>v.personagemId=F.B.personagemId,v=>v.itens[0].catalogoId='desconhecido']){
  const v=await bruto();alterar(v);assert.throws(()=>ler(v,F.A.personagemId),/Inventário não verificado/);
 }
});
test('inventário: estados, quantidades e campos de cada tipo são validados estritamente',async()=>{
 for(const alterar of [v=>v.itens[2].estado.carregada=11,v=>v.itens[3].estado.durabilidadeAtual=-1,v=>v.itens[3].estado.durabilidadeAtual=3,v=>v.itens[0].quantidade=2,v=>v.itens[0].estado.tipo='ferramenta',v=>v.itens[6].estado.durabilidadeAtual=0,v=>v.itens[6].espacos=1,v=>v.itens[2].estado.equipada='false',v=>v.revisao=NaN]){
  const v=await bruto();alterar(v);assert.throws(()=>ler(v,F.A.personagemId));
 }
});
test('inventário: pilhas 30 e 15 ocupam dois espaços sem recarregar arma',async()=>{
 const v=ler(await bruto('pilhas'),F.A.personagemId);assert.deepEqual(v.itens.filter(i=>i.estado.tipo==='municao').map(i=>i.quantidade),[30,15]);assert.equal(v.itens.reduce((n,i)=>n+i.espacos,0),8);assert.equal(v.itens[2].estado.carregada,4);
 const q=structuredClone(v);q.itens.at(-1).quantidade=31;assert.throws(()=>ler(q,F.A.personagemId));
});
test('inventário: zero munição, durabilidade e placas são preservados, peça permanece guardada',async()=>{
 const {c}=preparar('estados');const a=(await consultar(c)).valor;await c.consultar();assert.deepEqual(c.estado().valor,a);
 assert.equal(a.itens[2].estado.carregada,0);assert.equal(a.itens[3].estado.durabilidadeAtual,0);assert.equal(a.itens[8].estado.placas,0);assert.equal(a.itens[9].estado.instaladaEm,null);assert.match(detalhe(a.itens[6]),/Indestrutível/);
});
test('inventário: busca ignora acentos e caixa, filtra detalhe e identificador sem alterar capacidade',async()=>{
 const v=ler(await bruto('pilhas'),F.A.personagemId);assert.equal(filtrar(v,'  MUNICAO  ','todos').length,2);assert.equal(filtrar(v,'4/10','todos').length,1);assert.equal(filtrar(v,v.itens[3].instanciaId,'todos').length,1);
 assert.equal(filtrar(v,'','caracteristico').length,2);assert.equal(filtrar(v,'','inventario').length,8);assert.equal(filtrar(v,'inexistente','todos').length,0);assert.equal(v.itens.length,10);assert.equal(v.capacidade,9);
 const copia=filtrar(v,'','todos');copia[0].nome='alterado';assert.notEqual(v.itens[0].nome,'alterado');
});
test('inventário: excesso de capacidade informa divergência sem descartar exemplares',async()=>{
 const {c}=preparar('excesso');const e=await consultar(c);assert.equal(e.valor.itens.length,8);assert.equal(e.valor.capacidade,4);assert.match(html(e),/6\/4 Espaços/);assert.match(html(e),/Nada foi descartado/);
});
test('inventário: vazio consultado difere de seleção ainda não consultada',async()=>{
 const {c}=preparar('vazio');assert.match(html(c.estado()),/Nenhuma consulta enviada/);const e=await consultar(c);assert.match(html(e),/sem itens registrados/);assert.equal(e.erro,null);assert.equal(e.valor.itens.length,0);
});
test('inventário: recusa e resposta inválida não expõem segredo ou lista parcial, repetição é explícita',async()=>{
 for(const modo of ['recusa','invalido']){const {s,c}=preparar(modo);const e=await consultar(c);assert.equal(e.valor,null);assert.ok(e.erro);assert.ok(!JSON.stringify(e).includes('SEGREDO'));assert.equal(s.estado().consultas,1);await c.consultar();assert.equal(c.estado().valor.itens.length,8);assert.equal(s.estado().consultas,2);}
});
test('inventário: cliques simultâneos compartilham consulta e atualização falha remove resultado anterior',async()=>{
 let resolver,n=0;const c=controle(()=>{n++;return new Promise(r=>resolver=r);});c.selecionar(F.A);const a=c.consultar(),b=c.consultar();assert.strictEqual(a,b);resolver(await bruto());await a;assert.equal(n,1);
 let falha=false;const d=controle(async()=>{if(falha)throw Error('SEGREDO');return bruto();});await consultar(d);falha=true;const p=d.consultar();assert.equal(d.estado().valor,null);await p;assert.ok(d.estado().erro);
});
test('inventário: resposta atrasada de A não substitui B',async()=>{
 const {s,c}=preparar('atraso');c.selecionar(F.A);const p=c.consultar();c.selecionar(F.B);await c.consultar();s.entregar();assert.equal(await p,'descartada');assert.equal(c.estado().valor.personagemId,F.B.personagemId);assert.equal(c.estado().valor.itens[0].nome,'Erva Verde de B');
});
test('inventário: encerrar ou retornar A após B invalida a consulta antiga',async()=>{
 for(const voltar of [false,true]){const {s,c}=preparar('atraso');c.selecionar(F.A);const p=c.consultar();c.encerrar();if(voltar){c.selecionar(F.B);c.selecionar(F.A);}s.entregar();assert.equal(await p,'descartada');assert.equal(c.estado().valor,null);assert.equal(c.estado().carregando,false);}
});
test('inventário: rejeição tardia não apaga consulta atual de outra ficha',async()=>{
 let rejeitar,n=0;const c=controle(ctx=>++n===1?new Promise((_,r)=>rejeitar=r):bruto('normal',ctx));c.selecionar(F.A);const p=c.consultar();c.selecionar(F.B);await c.consultar();rejeitar(Error('SEGREDO'));assert.equal(await p,'descartada');assert.equal(c.estado().valor.personagemId,F.B.personagemId);assert.equal(c.estado().erro,null);
});
test('inventário: apresentação escapa nomes, identifica exemplares e não oferece operação de jogo',async()=>{
 const {c}=preparar();const e=await consultar(c);e.valor.itens[0].nome='<script>malicioso</script>';const h=html(e);assert.ok(!h.includes('<script>'));assert.ok(h.includes('&lt;script&gt;'));assert.ok(h.includes('Exemplar:'));assert.equal((h.match(/<details/g)||[]).length,8);
 for(const rotulo of ['Usar item','Equipar item','Recarregar arma','Transferir item','Descartar item'])assert.ok(!h.includes('>'+rotulo+'<'));
});
