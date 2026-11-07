import {capacidadeInventario,caracteristicos,equipamentoInicial,opcoesEquipamento} from './equipamento';
import {simularCompras} from './comprasIniciais';
import {ORIGENS} from './origens';
export type EstadoItemCriacao=
 |{tipo:'arma_fogo';calibre:'9mm';carregada:number;capacidade:number;equipada:false}
 |{tipo:'arma_corpo';durabilidadeAtual:number|null;durabilidadeMaxima:number|null;indestrutivel:boolean;arremessavel:boolean;equipada:false}
 |{tipo:'municao';calibre:'9mm';limitePilha:30}
 |{tipo:'moedas';limiteBloco:3}
 |{tipo:'colete';equipado:false;placas?:number}
 |{tipo:'peca';instaladaEm:null}
 |{tipo:'consumivel'}
 |{tipo:'lanterna';equipada:false}
 |{tipo:'ferramenta'};
export type ItemCriacao={
 chaveCriacao:string;catalogoId:string;nome:string;quantidade:number;espacos:0|1;
 local:'inventario'|'caracteristico';posicao:number|null;vinculadoClasse:boolean;estado:EstadoItemCriacao;
};
export type EntradaInventarioCriacao={
 classe:string|null;equipamento_inicial:string|null;forca:number;origem:string|null;
 nivel:number;estado_ficha:string;compras_iniciais?:Record<string,number>;
};
function estadoCriacao(id:string):EstadoItemCriacao{
 const capacidade=id==='sentinel-nine'?19:id==='jmb-hp3'?13:id==='lemi'?10:0;
 if(capacidade)return {tipo:'arma_fogo',calibre:'9mm',carregada:capacidade,capacidade,equipada:false};
 if(['bastao','faca','hatchet'].includes(id)){
  const hatchet=id==='hatchet';
  return {tipo:'arma_corpo',durabilidadeAtual:hatchet?null:2,durabilidadeMaxima:hatchet?null:2,indestrutivel:hatchet,arremessavel:id==='faca'||hatchet,equipada:false};
 }
 if(id==='municao-9mm')return {tipo:'municao',calibre:'9mm',limitePilha:30};
 if(id==='moedas')return {tipo:'moedas',limiteBloco:3};
 if(['colete-acolchoado','colete-leve','kendo'].includes(id))return id==='kendo'?{tipo:'colete',equipado:false,placas:0}:{tipo:'colete',equipado:false};
 if(id==='pente-estendido')return {tipo:'peca',instaladaEm:null};
 if(id==='erva-verde')return {tipo:'consumivel'};
 if(id==='lanterna-simples')return {tipo:'lanterna',equipada:false};
 if(['gazua-profissional','kit-socorros','kit-ferramentas'].includes(id))return {tipo:'ferramenta'};
 throw new Error('Item sem estado inicial conferido.');
}
// Plano local deterministico de novas instancias. Nao grava, ativa ou reconstrui inventario existente.
export function planejarInventarioCriacao(f:EntradaInventarioCriacao){
 if(f.estado_ficha!=='rascunho'||f.nivel!==1)throw new Error('Preparacao restrita ao rascunho de nivel 1.');
 if(!Number.isInteger(f.forca)||f.forca<0||f.forca>3)throw new Error('FOR invalida para criacao.');
 if(f.origem!==null&&!ORIGENS.some(o=>o.nome===f.origem))throw new Error('Origem invalida.');
 if(!opcoesEquipamento(f.classe).some(o=>o.id===f.equipamento_inicial))throw new Error('Classe ou kit inicial invalido.');
 const compras=f.compras_iniciais===undefined?{}:f.compras_iniciais;
 if(compras===null||typeof compras!=='object'||Array.isArray(compras))throw new Error('Plano de compras invalido.');
 if(f.equipamento_inicial!=='C'&&Object.keys(compras).length)throw new Error('Compras salvas exigem kit C.');
 const capacidade=capacidadeInventario(f.forca,f.origem);
 const itens:ItemCriacao[]=[];let posicao=0;
 function adicionar(id:string,nome:string,quantidade:number,fonte:string,caracteristico=false){
  const limite=id==='municao-9mm'?30:id==='moedas'?3:1;
  let restante=quantidade,indice=0;
  while(restante>0){
   const qtd=Math.min(restante,limite);
   itens.push({chaveCriacao:fonte+':'+id+':'+indice++,catalogoId:id,nome,quantidade:qtd,espacos:caracteristico?0:1,
    local:caracteristico?'caracteristico':'inventario',posicao:caracteristico?null:posicao++,vinculadoClasse:caracteristico,estado:estadoCriacao(id)});
   restante-=qtd;
  }
 }
 for(const i of caracteristicos(f.classe))adicionar(i.id,i.nome,1,'caracteristico',true);
 const kit=equipamentoInicial(f.classe,f.equipamento_inicial);
 for(const i of kit.filter(i=>i.id!=='moedas'))adicionar(i.id,i.nome,1,i.id==='erva-verde'||i.id==='lanterna-simples'?'comum':'kit');
 if(f.equipamento_inicial==='C'){
  const plano=simularCompras(compras,capacidade);
  if(!plano.orcamentoValido||!plano.cabe)throw new Error('Compras excedem saldo ou capacidade.');
  for(const i of [...plano.itens].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0))adicionar(i.id,i.nome,i.quantidade,'compra');
  if(plano.saldo>0)adicionar('moedas','Moedas Antigas',plano.saldo,'saldo');
 }else if(kit.some(i=>i.id==='moedas'))adicionar('moedas','Moedas Antigas',1,'kit');
 if(posicao>capacidade)throw new Error('Kit excede capacidade.');
 return {capacidade,ocupados:posicao,itens};
}
