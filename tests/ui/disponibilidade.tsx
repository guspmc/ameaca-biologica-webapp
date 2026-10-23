import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import DisponibilidadeInicial from '../../src/DisponibilidadeInicial';
import '../../src/styles.css';
// Fixture inteiramente em memoria: sem Supabase, Auth, armazenamento ou dados humanos.
const itens=new Set<string>();
let falhar=false;
function Fixture(){
 const [mensagem,setMensagem]=useState('');
 return <main style={{maxWidth:800,margin:'24px auto',padding:16}}>
  <h1>Teste isolado de disponibilidade</h1>
  <p>Dados fictícios em memória. Não altera nenhuma Mesa real. F5 reinicia tudo.</p>
  <button type="button" onClick={()=>{falhar=true;setMensagem('Próxima operação simulará falha.');}}>Simular falha na próxima operação</button>
  <p role="status">{mensagem}</p>
  <DisponibilidadeInicial mesaNome="Mesa fictícia" aoListar={async()=>{
   if(falhar){falhar=false;throw Error('Falha simulada. Tente atualizar novamente.');}
   return [...itens];
  }} aoAlterar={async(id,liberado,esperado)=>{
   if(falhar){falhar=false;throw Error('Falha simulada. Nada foi alterado.');}
   const atual=itens.has(id);
   if(atual===liberado)return atual;
   if(atual!==esperado)throw Error('Estado desatualizado. Atualize a lista.');
   if(liberado)itens.add(id);else itens.delete(id);
   return liberado;
  }}/>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
