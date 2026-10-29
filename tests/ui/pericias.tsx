// Fixture de interface servida somente pelo Vite local. Sem chamadas de rede/Supabase.
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import FichasJogador from '../../src/FichasJogador';
import '../../src/styles.css';
const comprasQA=location.pathname.endsWith('/compras.html');
const revisaoQA=location.pathname.endsWith('/revisao.html')||comprasQA;
const equipamentoQA=location.pathname.endsWith('/equipamento.html');
const habilidadeQA=location.pathname.endsWith('/habilidades.html')||equipamentoQA||revisaoQA;
let ficha={id:'fixture-ficha',nome:'Sobrevivente fictício',mesa_id:'fixture-mesa',jogador_id:'fixture-jogador',
  classe:habilidadeQA?'Operador':'Agente',origem:'Policial',pericia_origem_treinada:'Pontaria',pericia_origem_extra:null,
  compras_iniciais:{} as Record<string,number>,revisao_compras:0,identidade:{} as Record<string,string>,habilidade_basica:null as string|null,equipamento_inicial:null as string|null,
  pontos_pericia_classe:{},nivel:1,forca:2,agilidade:2,vigor:2,astucia:1,
  pv_atual:habilidadeQA?14:12,pv_maximo:habilidadeQA?14:12,sa_atual:3,sa_maximo:3,bi_atual:0,bi_maximo:habilidadeQA?7:9,defesa:14,estado_ficha:'rascunho'};
if(revisaoQA)ficha={...ficha,nome:'Sobrevivente fictícia',forca:3,agilidade:1,vigor:3,astucia:0,origem:'Investigador',pericia_origem_treinada:'Investigação',identidade:{genero:'Feminino'},pontos_pericia_classe:{Atletismo:1,Luta:2},habilidade_basica:'parrudo',equipamento_inicial:'B',pv_atual:20,pv_maximo:20,sa_atual:1,sa_maximo:1,bi_maximo:9,defesa:11};
if(comprasQA)ficha={...ficha,habilidade_basica:'armeiro',equipamento_inicial:'C',pv_atual:15,pv_maximo:15,bi_maximo:6};
const mock={
  from:()=>({select:()=>({order:async()=>({data:[structuredClone(ficha)],error:null})})}),
  rpc:async(nome:string,args:{p_plano:Record<string,number>;p_revisao:number;p_pontos:Record<string,number>;p_habilidade:string|null;p_opcao:string|null;p_nome:string;p_identidade:Record<string,string>})=>{
    if(nome==='salvar_compras_rascunho'){if(args.p_revisao!==ficha.revisao_compras)return {error:{message:'Revisao desatualizada.'}};ficha={...ficha,compras_iniciais:{...args.p_plano},revisao_compras:ficha.revisao_compras+1};return {data:ficha.revisao_compras,error:null};}
    if(nome==='definir_identidade_rascunho'){ficha={...ficha,nome:args.p_nome,identidade:{...args.p_identidade}};return {error:null};}
    if(nome==='definir_equipamento_rascunho'){ficha={...ficha,equipamento_inicial:args.p_opcao};return {error:null};}
    if(nome==='definir_habilidade_rascunho'){
      ficha={...ficha,habilidade_basica:args.p_habilidade};
      return {error:null};
    }
    if(nome!=='definir_pericias_rascunho')return {error:{message:'Esta fixture permite apenas salvar Perícias.'}};
    ficha={...ficha,pontos_pericia_classe:{...args.p_pontos}};
    return {error:null};
  }
};
createRoot(document.getElementById('root')!).render(<>
  <p className="ambiente-teste">QA DE INTERFACE · Ficha fictícia em memória · Sem banco · Derivados de Habilidade testados somente no SQL</p>
  <main><FichasJogador supabase={mock as unknown as SupabaseClient} usuarioId="fixture-jogador"
    mesas={[{id:'fixture-mesa',nome:'Mesa fictícia',mestre_id:'fixture-mestre'}]} sinalAtualizacao={0}/></main>
</>);
