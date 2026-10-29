import {prepararConsultaContextual} from './consultaContextual';
import {lerInventarioConsulta,type InventarioConsulta} from './inventarioConsulta';
export type ContextoInventario={usuarioId:string;mesaId:string;personagemId:string;nome:string};
export function prepararConsultaInventarioLocal(carregar:(contexto:ContextoInventario)=>Promise<unknown>){
 const leitura=prepararConsultaContextual<InventarioConsulta>();let contexto:ContextoInventario|null=null;
 let curso:{chave:number;promessa:Promise<'atual'|'descartada'>}|null=null,geracao=0;
 function encerrar(){geracao++;contexto=null;curso=null;leitura.invalidar();}
 return {
  encerrar,
  selecionar(c:ContextoInventario){
   encerrar();
   const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
   if(!c||![c.usuarioId,c.mesaId,c.personagemId].every(uuid)||typeof c.nome!=='string'||!c.nome.trim())throw Error('Seleção de inventário inválida.');
   contexto={...c};leitura.selecionar(JSON.stringify([c.usuarioId,c.mesaId,c.personagemId]));
  },
  estado(){return {...leitura.estado(),selecao:contexto?{...contexto}:null};},
  consultar():Promise<'atual'|'descartada'>{
   if(!contexto)return Promise.resolve('descartada');if(curso?.chave===geracao)return curso.promessa;
   const c={...contexto};const promessa=leitura.consultar(async()=>lerInventarioConsulta(await carregar(c),c.personagemId)).finally(()=>{if(curso?.promessa===promessa)curso=null;});
   curso={chave:geracao,promessa};return promessa;
  }
 };
}
