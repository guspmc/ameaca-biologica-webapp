// Projeção de leitura local. Não reconstrói itens a partir de kit ou catálogo:
// munição, durabilidade e quantidades vêm do snapshot recebido.
export type EstadoExemplar=
 |{tipo:'arma_fogo';calibre:string;carregada:number;capacidade:number;equipada:boolean}
 |{tipo:'arma_corpo';durabilidadeAtual:number|null;durabilidadeMaxima:number|null;indestrutivel:boolean;arremessavel:boolean;equipada:boolean}
 |{tipo:'municao';calibre:string;limitePilha:number}
 |{tipo:'moedas';limiteBloco:number}
 |{tipo:'colete';equipado:boolean;placas?:number}
 |{tipo:'peca';instaladaEm:string|null}
 |{tipo:'consumivel'}|{tipo:'lanterna';equipada:boolean}|{tipo:'ferramenta'};
export type ExemplarConsulta={instanciaId:string;catalogoId:string;nome:string;quantidade:number;espacos:0|1;local:'inventario'|'caracteristico';posicao:number|null;estado:EstadoExemplar};
export type InventarioConsulta={personagemId:string;revisao:number;capacidade:number;itens:ExemplarConsulta[]};
const objeto=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const natural=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const positivo=(v:unknown):v is number=>natural(v)&&v>0;
const texto=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
const chaves=(v:Record<string,unknown>,ks:string[])=>Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k));
const tipos:Record<string,EstadoExemplar['tipo']>={'gazua-profissional':'ferramenta',hatchet:'arma_corpo','erva-verde':'consumivel','lanterna-simples':'lanterna','sentinel-nine':'arma_fogo','colete-acolchoado':'colete','jmb-hp3':'arma_fogo',moedas:'moedas','kit-socorros':'ferramenta','pente-estendido':'peca',bastao:'arma_corpo',lemi:'arma_fogo',kendo:'colete','kit-ferramentas':'ferramenta',faca:'arma_corpo','colete-leve':'colete','municao-9mm':'municao'};
function validoEstado(e:unknown,tipo:string):e is EstadoExemplar{
 if(!objeto(e)||e.tipo!==tipo)return false;
 switch(e.tipo){
  case 'arma_fogo':return chaves(e,['tipo','calibre','carregada','capacidade','equipada'])&&texto(e.calibre)&&natural(e.carregada)&&positivo(e.capacidade)&&e.carregada<=e.capacidade&&typeof e.equipada==='boolean';
  case 'arma_corpo':return chaves(e,['tipo','durabilidadeAtual','durabilidadeMaxima','indestrutivel','arremessavel','equipada'])&&typeof e.indestrutivel==='boolean'&&typeof e.arremessavel==='boolean'&&typeof e.equipada==='boolean'&&(e.indestrutivel?e.durabilidadeAtual===null&&e.durabilidadeMaxima===null:natural(e.durabilidadeAtual)&&positivo(e.durabilidadeMaxima)&&e.durabilidadeAtual<=e.durabilidadeMaxima);
  case 'municao':return chaves(e,['tipo','calibre','limitePilha'])&&texto(e.calibre)&&e.limitePilha===30;
  case 'moedas':return chaves(e,['tipo','limiteBloco'])&&e.limiteBloco===3;
  case 'colete':return chaves(e,e.placas===undefined?['tipo','equipado']:['tipo','equipado','placas'])&&typeof e.equipado==='boolean'&&(e.placas===undefined||natural(e.placas));
  case 'peca':return chaves(e,['tipo','instaladaEm'])&&(e.instaladaEm===null||uuid(e.instaladaEm));
  case 'lanterna':return chaves(e,['tipo','equipada'])&&typeof e.equipada==='boolean';
  case 'consumivel':case 'ferramenta':return chaves(e,['tipo']);
  default:return false;
 }
}
export function lerInventarioConsulta(v:unknown,personagemId:string):InventarioConsulta{
 const ids=new Set<string>(),posicoes=new Set<number>();
 const invalido=():never=>{throw Error('Inventário não verificado. Consulte novamente antes de continuar.');};
 if(!uuid(personagemId)||!objeto(v)||!chaves(v,['personagemId','revisao','capacidade','itens'])||v.personagemId!==personagemId||!natural(v.revisao)||!natural(v.capacidade)||!Array.isArray(v.itens))return invalido();
 for(const i of v.itens){
  if(!objeto(i)||!chaves(i,['instanciaId','catalogoId','nome','quantidade','espacos','local','posicao','estado'])||!uuid(i.instanciaId)||ids.has(i.instanciaId)||!texto(i.nome)||!texto(i.catalogoId)||!Object.hasOwn(tipos,i.catalogoId)||!positivo(i.quantidade)||!validoEstado(i.estado,tipos[i.catalogoId]))return invalido();
  const limite=i.estado.tipo==='municao'?30:i.estado.tipo==='moedas'?3:1;if(i.quantidade>limite)return invalido();
  if(i.local==='inventario'){if(i.espacos!==1||!natural(i.posicao)||posicoes.has(i.posicao))return invalido();posicoes.add(i.posicao);}
  else if(i.local!=='caracteristico'||i.espacos!==0||i.posicao!==null)return invalido();
  ids.add(i.instanciaId);
 }
 return structuredClone(v) as InventarioConsulta;
}
export function detalheExemplar(i:ExemplarConsulta):string{
 const e=i.estado;
 switch(e.tipo){
  case 'arma_fogo':return `${e.carregada}/${e.capacidade} tiros · ${e.calibre} · ${e.equipada?'Empunhada':'Guardada'}`;
  case 'arma_corpo':return `${e.indestrutivel?'Indestrutível':`Durabilidade ${e.durabilidadeAtual}/${e.durabilidadeMaxima}`} · ${e.equipada?'Empunhada':'Guardada'}${e.arremessavel?' · Arremessável':''}`;
  case 'municao':return `${i.quantidade} cartuchos · ${e.calibre} · reserva separada da arma`;
  case 'moedas':return `${i.quantidade} moeda(s) neste bloco`;
  case 'colete':return `${e.equipado?'Equipado':'Guardado'}${e.placas===undefined?'':` · ${e.placas} placa(s)`}`;
  case 'peca':return e.instaladaEm?`Instalada no exemplar ${e.instaladaEm}`:'Peça guardada, não instalada';
  case 'lanterna':return e.equipada?'Equipada':'Guardada';
  case 'consumivel':return `${i.quantidade} unidade · consultar não consome`;
  case 'ferramenta':return 'Ferramenta em posse';
 }
}
const normalizar=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
export function filtrarExemplares(v:InventarioConsulta,busca:string,local:'todos'|'inventario'|'caracteristico'){
 const termo=normalizar(busca);
 return v.itens.filter(i=>(local==='todos'||i.local===local)&&normalizar(`${i.nome} ${i.instanciaId} ${detalheExemplar(i)}`).includes(termo)).sort((a,b)=>a.local===b.local?(a.posicao??0)-(b.posicao??0)||a.instanciaId.localeCompare(b.instanciaId):a.local==='inventario'?-1:1).map(i=>structuredClone(i));
}
