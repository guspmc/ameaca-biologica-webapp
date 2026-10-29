import type {SupabaseClient} from '@supabase/supabase-js';
import type {ConfiguracaoFuncionamento} from './funcionamentoFicha';
export async function salvarFuncionamento(supabase:SupabaseClient,id:string,config:ConfiguracaoFuncionamento,revisao:number):Promise<number>{
 const {data,error}=await supabase.rpc('salvar_funcionamento_rascunho',{
  p_personagem:id,p_configuracao:{modo:config.modo,preferenciasMisto:{...config.preferenciasMisto}},p_revisao:revisao
 });
 if(error)throw new Error(error.message);
 if(!Number.isInteger(data)||data<0)throw new Error('Resposta inesperada ao salvar funcionamento.');
 return data as number;
}
