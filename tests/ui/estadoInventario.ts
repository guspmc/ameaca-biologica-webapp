import type {ContextoInventario} from '../../src/consultaInventarioLocal';
import type {EstadoExemplar,ExemplarConsulta,InventarioConsulta} from '../../src/inventarioConsulta';
export type CenarioInventario='normal'|'pilhas'|'estados'|'vazio'|'excesso'|'invalido'|'recusa'|'atraso';
const id=(n:number)=>`e5000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const FICHAS_INVENTARIO={A:{usuarioId:id(1),mesaId:id(2),personagemId:id(3),nome:'Inventário fictício A'},B:{usuarioId:id(1),mesaId:id(2),personagemId:id(4),nome:'Inventário fictício B'}};
export function prepararInventarioQA(cenario:CenarioInventario){
 let consultas=0,pendente:(()=>void)|null=null;
 function snapshot(c:ContextoInventario):InventarioConsulta{
  const itens:ExemplarConsulta[]=[];
  function add(catalogoId:string,nome:string,estado:EstadoExemplar,quantidade=1,caracteristico=false){const posicao=itens.filter(i=>i.local==='inventario').length;itens.push({instanciaId:id(100+itens.length),catalogoId,nome,estado,quantidade,espacos:caracteristico?0:1,local:caracteristico?'caracteristico':'inventario',posicao:caracteristico?null:posicao});}
  if(cenario!=='vazio'){
   add('erva-verde',c.personagemId===FICHAS_INVENTARIO.B.personagemId?'Erva Verde de B':'Erva Verde',{tipo:'consumivel'});
   add('lanterna-simples','Lanterna Simples',{tipo:'lanterna',equipada:false});
   add('lemi','LEMI',{tipo:'arma_fogo',calibre:'9mm',carregada:4,capacidade:10,equipada:false});
   add('faca','Faca',{tipo:'arma_corpo',durabilidadeAtual:1,durabilidadeMaxima:2,indestrutivel:false,arremessavel:true,equipada:false});
   add('faca','Faca',{tipo:'arma_corpo',durabilidadeAtual:2,durabilidadeMaxima:2,indestrutivel:false,arremessavel:true,equipada:false});
   add('moedas','Moedas Antigas',{tipo:'moedas',limiteBloco:3},2);
   add('hatchet','Hatchet',{tipo:'arma_corpo',durabilidadeAtual:null,durabilidadeMaxima:null,indestrutivel:true,arremessavel:true,equipada:false},1,true);
   add('gazua-profissional','Gazua Profissional',{tipo:'ferramenta'},1,true);
  }
  if(cenario==='pilhas'){add('municao-9mm','Munição 9 mm',{tipo:'municao',calibre:'9mm',limitePilha:30},30);add('municao-9mm','Munição 9 mm',{tipo:'municao',calibre:'9mm',limitePilha:30},15);}
  if(cenario==='estados'){
   itens[2].estado={tipo:'arma_fogo',calibre:'9mm',carregada:0,capacidade:10,equipada:true};
   itens[3].estado={tipo:'arma_corpo',durabilidadeAtual:0,durabilidadeMaxima:2,indestrutivel:false,arremessavel:true,equipada:false};
   add('kendo','Colete de Placas Kendo',{tipo:'colete',equipado:false,placas:0},1,true);
   add('pente-estendido','Pente Estendido 9 mm',{tipo:'peca',instaladaEm:null},1,true);
  }
  return {personagemId:c.personagemId,revisao:7,capacidade:cenario==='excesso'?4:cenario==='pilhas'?9:7,itens};
 }
 return {
  estado:()=>({consultas,aguardando:pendente!==null}),entregar(){pendente?.();},
  carregar(c:ContextoInventario):Promise<unknown>{
   consultas++;const v=snapshot(c);
   if(cenario==='recusa'&&consultas===1)return Promise.reject(Error('SEGREDO DE QA'));
   const resposta=cenario==='invalido'&&consultas===1?{...v,itens:[...v.itens,{...v.itens[0],historia:'SEGREDO DE QA'}]}:v;
   if(cenario==='atraso'&&c.personagemId===FICHAS_INVENTARIO.A.personagemId&&!pendente)return new Promise(resolve=>{pendente=()=>{pendente=null;resolve(resposta);};});
   return Promise.resolve(resposta);
  }
 };
}
