// Fixture de interface servida somente pelo Vite local. Sem chamadas de rede/Supabase.
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import FichasJogador from '../../src/FichasJogador';
import '../../src/styles.css';
let ficha={id:'fixture-ficha',nome:'Sobrevivente fictício',mesa_id:'fixture-mesa',jogador_id:'fixture-jogador',
  classe:'Agente',origem:'Policial',pericia_origem_treinada:'Pontaria',pericia_origem_extra:null,
  pontos_pericia_classe:{},nivel:1,forca:2,agilidade:2,vigor:2,astucia:1,
  pv_atual:12,pv_maximo:12,sa_atual:3,sa_maximo:3,bi_atual:0,bi_maximo:9,defesa:14,estado_ficha:'rascunho'};
const mock={
  from:()=>({select:()=>({order:async()=>({data:[structuredClone(ficha)],error:null})})}),
  rpc:async(nome:string,args:{p_pontos:Record<string,number>})=>{
    if(nome!=='definir_pericias_rascunho')return {error:{message:'Esta fixture permite apenas salvar Perícias.'}};
    ficha={...ficha,pontos_pericia_classe:{...args.p_pontos}};
    return {error:null};
  }
};
createRoot(document.getElementById('root')!).render(<>
  <p className="ambiente-teste">QA DE INTERFACE · Ficha fictícia em memória · Sem conexão com contas ou banco</p>
  <main><FichasJogador supabase={mock as unknown as SupabaseClient} usuarioId="fixture-jogador"
    mesas={[{id:'fixture-mesa',nome:'Mesa fictícia',mestre_id:'fixture-mestre'}]} sinalAtualizacao={0}/></main>
</>);
