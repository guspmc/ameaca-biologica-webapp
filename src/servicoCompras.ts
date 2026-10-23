import type {SupabaseClient} from '@supabase/supabase-js';
export async function salvarPlanoCompras(supabase:SupabaseClient,id:string,plano:Record<string,number>,revisao:number){
  const {data,error}=await supabase.rpc('salvar_compras_rascunho',{p_personagem:id,p_plano:{...plano},p_revisao:revisao});
  if(error)throw new Error(error.message);
  if(!Number.isInteger(data)||data<0)throw new Error('Resposta inesperada ao salvar compras. Recarregue para conferir o plano.');
  return data as number;
}
