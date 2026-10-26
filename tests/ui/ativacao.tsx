import {createRoot} from 'react-dom/client';
import {useMemo,useState} from 'react';
import RevisaoAtivacao from '../../src/RevisaoAtivacao';
import ResumoOperacional from '../../src/ResumoOperacional';
import {criarEstadoAtivacao,type Cenario} from './estadoAtivacao';
import {prepararIdsFicticios} from './idsFicticios';
import '../../src/styles.css';
import './ativacao.css';
// Fixture em memoria. Nenhum Supabase, Auth, rede de campanha ou armazenamento.
function Fixture(){
 const [cenario,setCenario]=useState<Cenario>('normal'),[geracao,setGeracao]=useState(0),[,redesenhar]=useState(0);
 const banco=useMemo(()=>criarEstadoAtivacao(cenario),[cenario,geracao]);
 const criarId=useMemo(()=>prepararIdsFicticios(),[cenario,geracao]);
 const s=banco.estado();
 return <main className="qa-ciclo"><div className="qa-banner"><strong>SIMULAÇÃO ISOLADA · SEM DADOS DE CAMPANHA</strong><p>Esta página usa somente dados fictícios em memória. F5, trocar o cenário ou Reiniciar zera tudo. As falhas de cada cenário acontecem uma vez.</p></div>
 <h1>Revisão e resumo da Mesa</h1>
 <div className="qa-controles"><label>Cenário de teste <select value={cenario} onChange={e=>{setCenario(e.target.value as Cenario);setGeracao(g=>g+1);}}>
 <option value="normal">Normal</option><option value="pendencias">Escolhas pendentes</option><option value="lotada">Dez vagas ocupadas</option><option value="revisao">Dados mudaram antes de confirmar</option><option value="antes">Falha antes de gravar</option><option value="resposta">Resposta perdida após gravar</option></select></label>
 <button type="button" className="botao-claro" onClick={()=>setGeracao(g=>g+1)}>Reiniciar simulação</button>
 <button type="button" className="botao-claro" onClick={()=>banco.falharProximoResumo()}>Simular recusa do próximo resumo</button></div>
 <p aria-label="Contadores da simulação">Tentativas: {s.tentativas} · conjuntos criados: {s.conjuntos} · PV {s.pv} · SA {s.sa} · BI {s.bi}</p>
 <div className="qa-grade"><RevisaoAtivacao key={'ativacao-'+geracao+'-'+cenario} criarId={criarId} aoConferir={()=>banco.conferir()} aoAtivar={async p=>{try{return await banco.ativar(p);}finally{redesenhar(n=>n+1);}}}/>
 <ResumoOperacional key={'resumo-'+geracao+'-'+cenario} mesaNome="Mesa fictícia" aoListar={()=>banco.listar()}/></div>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);

