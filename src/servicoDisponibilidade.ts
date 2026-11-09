import type {SupabaseClient} from '@supabase/supabase-js';
import {CATALOGO_INICIAL} from './comprasIniciais';
const ids=new Set(CATALOGO_INICIAL.map(i=>i.id));
export async function listarDisponibilidade(supabase:SupabaseClient,mesa:string):Promise<string[]>{
 const {data,error}=await supabase.rpc('listar_disponibilidade_inicial',{p_mesa:mesa});
 if(error)throw new Error(error.message);
 if(!Array.isArray(data)||data.some(r=>!r||typeof r.item_id!=='string'||!ids.has(r.item_id)))throw new Error('Resposta inesperada de disponibilidade.');
 return [...new Set<string>(data.map(r=>r.item_id))];
}
export async function alterarDisponibilidade(supabase:SupabaseClient,mesa:string,item:string,liberado:boolean,esperado:boolean):Promise<boolean>{
 if(!ids.has(item))throw new Error('Item fora do catálogo inicial.');
 const {data,error}=await supabase.rpc('definir_disponibilidade_inicial',{p_mesa:mesa,p_item:item,p_liberado:liberado,p_esperado:esperado});
 if(error)throw new Error(error.message);
 if(typeof data!=='boolean'||data!==liberado)throw new Error('Resposta inesperada. Atualize a disponibilidade.');
 return data;
}
