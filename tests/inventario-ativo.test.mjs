import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materializarInventarioInicial, validarInventarioAtivo } from '../src/inventarioAtivo.ts';
import { lerInventarioConsulta } from '../src/inventarioConsulta.ts';

const uuid = n => '00000000-0000-4000-8000-' + String(n).padStart(12,'0');
const ficha = (classe='Agente',kit='A',extra={}) => ({classe,equipamento_inicial:kit,forca:3,origem:null,nivel:1,estado_ficha:'rascunho',compras_iniciais:{},...extra});
function ids(){let n=0;return()=>uuid(++n);}

test('materialização cria exemplares com IDs únicos, posição e estado inicial validados',()=>{
 const inventario=materializarInventarioInicial(ficha('Agente','A'),uuid(100),ids());
 assert.equal(inventario.revisao,1);assert.equal(inventario.capacidade,7);assert.equal(inventario.itens.length,6);
 assert.equal(new Set(inventario.itens.map(i=>i.instanciaId)).size,6);
 assert.deepEqual(inventario.itens.filter(i=>i.local==='inventario').map(i=>i.posicao),[0,1,2,3]);
 assert.ok(inventario.itens.filter(i=>i.local==='caracteristico').every(i=>i.posicao===null&&i.espacos===0));
 assert.equal(inventario.itens.find(i=>i.catalogoId==='sentinel-nine').estado.carregada,19);
 assert.equal(inventario.itens.find(i=>i.catalogoId==='sentinel-nine').estado.equipada,false);
 assert.deepEqual(validarInventarioAtivo(inventario,uuid(100)),inventario);
});

test('materialização preserva kit C, pilhas e itens repetidos como instâncias separadas',()=>{
 const inventario=materializarInventarioInicial(ficha('Agente','C',{compras_iniciais:{faca:2,'municao-9mm':1}}),uuid(101),ids());
 const facas=inventario.itens.filter(i=>i.catalogoId==='faca');
 assert.equal(facas.length,2);assert.notEqual(facas[0].instanciaId,facas[1].instanciaId);
 assert.deepEqual(inventario.itens.filter(i=>i.estado.tipo==='municao').map(i=>i.quantidade),[15]);
 assert.ok(inventario.itens.every(i=>i.estado.tipo!=='arma_fogo'||i.estado.carregada===i.estado.capacidade));
});

test('materialização aceita identificador hexadecimal compacto do servidor LAN',()=>{
 const inventario=materializarInventarioInicial(ficha(), 'a'.repeat(32), ids());
 assert.equal(inventario.personagemId,'a'.repeat(32));
 assert.deepEqual(validarInventarioAtivo(inventario,'a'.repeat(32)),inventario);
});

test('materialização recusa IDs repetidos, inválidos e identificador de personagem inválido',()=>{
 assert.throws(()=>materializarInventarioInicial(ficha(),uuid(102),()=>uuid(1)),/identificadores únicos/);
 assert.throws(()=>materializarInventarioInicial(ficha(),uuid(102),()=>'sem-id'),/identificadores únicos/);
 assert.throws(()=>materializarInventarioInicial(ficha(),'personagem-invalido',ids()));
});

test('validação do inventário ativo rejeita adulteração, colisão e revisão inválida',()=>{
 const base=materializarInventarioInicial(ficha(),uuid(103),ids());
 const adulterado=structuredClone(base);adulterado.itens[0].quantidade=999;
 assert.throws(()=>validarInventarioAtivo(adulterado,uuid(103)));
 const colisao=structuredClone(base);colisao.itens[1].posicao=colisao.itens[0].posicao;
 assert.throws(()=>validarInventarioAtivo(colisao,uuid(103)));
 const revisao=structuredClone(base);revisao.revisao=-1;
 assert.throws(()=>validarInventarioAtivo(revisao,uuid(103)));
 assert.throws(()=>validarInventarioAtivo(base,uuid(104)));
});
