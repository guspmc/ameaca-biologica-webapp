import {classePersonagem,termoPersonagem} from './textoPersonagem';
import {ORIGENS} from './origens';
import {HABILIDADES_BASICAS} from './habilidades';
import {PONTOS_CLASSE,PERICIAS_CLASSE} from './pericias';
import {capacidadeInventario,equipamentoInicial,espacosOcupados,opcoesEquipamento} from './equipamento';
export type FichaRevisao={identidade?:{genero?:string};nome:string;classe:string|null;nivel:number;forca:number;agilidade:number;vigor:number;astucia:number;origem:string|null;pericia_origem_treinada:string|null;pericia_origem_extra:string|null;pontos_pericia_classe:Record<string,number>;habilidade_basica:string|null;equipamento_inicial:string|null;pv_maximo:number|null;sa_maximo:number|null;bi_maximo:number|null;defesa:number|null};
export type Conferencia={nome:string;estado:'conferido'|'pendente'|'revisar';detalhe:string;secao:string};
export function revisarCriacao(f:FichaRevisao):Conferencia[]{
  const linhas:Conferencia[]=[];
  const termo=(nome:string)=>termoPersonagem(nome,f.identidade?.genero);
  const add=(nome:string,estado:Conferencia['estado'],detalhe:string,secao='perfil')=>linhas.push({nome,estado,detalhe,secao});
  add('Identificação',f.nome.trim().length>=2&&f.nome.trim().length<=60?'conferido':'revisar',f.nome+' · campos narrativos opcionais');
  const classeValida=Object.hasOwn(PONTOS_CLASSE,f.classe??'');
  add('Classe e nível',classeValida&&f.nivel===1?'conferido':'revisar',`${classePersonagem(f.classe,f.identidade?.genero)} · nível ${f.nivel}. Esta revisão cobre a criação de nível 1.`);
  const attrs=[f.forca,f.agilidade,f.vigor,f.astucia];
  const attrsValidos=attrs.every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&attrs.reduce((a,b)=>a+b,0)===7&&attrs.filter(n=>n===0).length<=1;
  add('Atributos',attrsValidos?'conferido':'revisar',`FOR ${f.forca} · AGI ${f.agilidade} · VIG ${f.vigor} · AST ${f.astucia}. Base 1 em cada, +3 pontos; uma redução a 0 permite +1.`, 'pericias');
  const origem=ORIGENS.find(o=>o.nome===f.origem);
  const todas=['Acrobacia','Atletismo','Fortitude','Furtividade','Investigação','Luta','Medicina','Percepção','Pontaria','Reflexos','Sobrevivência','Vontade'];
  const treinada=f.pericia_origem_treinada;
  const extra=f.origem==='Amnésico'?f.pericia_origem_extra:origem?.pericias.find(p=>p!==treinada);
  const origemValida=!!origem&&!!treinada&&(f.origem==='Amnésico'?todas.includes(treinada)&&!!extra&&todas.includes(extra)&&extra!==treinada:origem.pericias.includes(treinada)&&!f.pericia_origem_extra);
  add('Origem e Treinamento',origemValida?'conferido':f.origem?'revisar':'pendente',`${termo(f.origem??'Escolha a Origem')} · Treinamento gratuito: ${treinada??'pendente'}${extra?' · outra opção: '+extra:''}`);
  const pontos=f.pontos_pericia_classe??{};
  const usados=Object.values(pontos).reduce((a,b)=>a+b,0);
  const limite=PONTOS_CLASSE[f.classe??'']??0;
  const permitidas=new Set([...(PERICIAS_CLASSE[f.classe??'']??[]),...(origemValida&&extra?[extra]:[])]);
  const pontosValidos=classeValida&&origemValida&&Object.entries(pontos).every(([p,n])=>permitidas.has(p)&&Number.isInteger(n)&&n>=0&&n+(p===treinada?1:0)<=2)&&usados<=limite;
  add('Pontos de Perícia',!pontosValidos?'revisar':usados===limite?'conferido':'pendente',`${usados}/${limite} pontos salvos. Treinamento da Origem é gratuito; Mestre é o grau máximo.`,'pericias');
  const hab=HABILIDADES_BASICAS.find(h=>h.id===f.habilidade_basica&&h.classe===f.classe);
  add('Habilidade Básica',hab?'conferido':f.habilidade_basica?'revisar':'pendente',hab?`${termo(hab.nome)} · ${hab.referencia}`:'Escolha uma Básica da sua Classe.');
  const kit=opcoesEquipamento(f.classe).find(o=>o.id===f.equipamento_inicial);
  const ocupados=espacosOcupados(equipamentoInicial(f.classe,f.equipamento_inicial));
  const capacidade=capacidadeInventario(f.forca,f.origem);
  add('Equipamento inicial',kit?(ocupados<=capacidade?'conferido':'revisar'):f.equipamento_inicial?'revisar':'pendente',kit?`${kit.id} · ${kit.nome} · ${ocupados}/${capacidade} Espaços. Característicos: 0 Espaços.`:'Escolha o conjunto inicial.','itens');
  if(kit?.id==='C')add('Compras do Personalizado','pendente','As três Moedas estão previstas; compras antes da primeira cena ainda não estão disponíveis.','itens');
  if(classeValida&&f.nivel===1&&attrsValidos){
    const pv=({Agente:10,Autodidata:8,Operador:12}[f.classe as 'Agente'|'Autodidata'|'Operador'])+f.vigor+(hab?.id==='parrudo'?5:0);
    const sa=f.agilidade+f.astucia+(f.origem==='Universitária'?1:0);
    const bi=({Agente:8,Autodidata:10,Operador:6}[f.classe as 'Agente'|'Autodidata'|'Operador'])+f.astucia+(f.origem==='Cobaia'?2:0)+(hab?.id==='parrudo'?3:0);
    const def=10+f.agilidade+(f.origem==='Policial'?2:0);
    for(const [nome,salvo,esperado,formula] of [
      ['PV máximos',f.pv_maximo,pv,`Base da Classe + VIG ${f.vigor}${hab?.id==='parrudo'?' + '+termo('Parrudo')+' 5':''}`],
      ['SA máximo',f.sa_maximo,sa,`AGI ${f.agilidade} + AST ${f.astucia}${f.origem==='Universitária'?' + '+termo('Universitária')+' 1':''}`],
      ['BI máxima',f.bi_maximo,bi,`Base da Classe + AST ${f.astucia}${f.origem==='Cobaia'?' + Cobaia 2':''}${hab?.id==='parrudo'?' + '+termo('Parrudo')+' 3':''}`],
      ['Defesa básica',f.defesa,def,`10 + AGI ${f.agilidade}${f.origem==='Policial'?' + Policial 2':''} · sem Colete equipado`]
    ] as const)add(nome,salvo===esperado?'conferido':'revisar',`${formula} = ${esperado}. Salvo: ${salvo??'ausente'}.`);
    add('Capacidade de Inventário','conferido',`4 + FOR ${f.forca}${f.origem==='Mochileiro'?' + '+termo('Mochileiro')+' 1':''} = ${capacidade}. Expansão equipada: nenhuma.`,'itens');
  }
  return linhas;
}
