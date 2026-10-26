import {createRoot} from 'react-dom/client';
import {useMemo,useState} from 'react';
import {prepararConsultaResumoLocal} from '../../src/consultaResumoLocal';
import PainelResumoLocal from '../../src/PainelResumoLocal';
import {prepararResumoQA,MESAS_RESUMO,type CenarioResumo} from './estadoResumo';
import '../../src/styles.css';import './ativacao.css';
function Painel({cenario}:{cenario:CenarioResumo}){
 const servidor=useMemo(()=>prepararResumoQA(cenario),[cenario]);
 const controle=useMemo(()=>prepararConsultaResumoLocal(servidor.cliente),[servidor]);
 const [vista,setVista]=useState(controle.estado()),[dados,setDados]=useState(servidor.estado());
 const atualizar=()=>{setVista(controle.estado());setDados(servidor.estado());};
 async function consultar(){const p=controle.consultar();atualizar();await Promise.resolve();atualizar();await p;atualizar();}
 return <><div className="qa-controles">
  <button className="botao-claro" onClick={()=>{controle.selecionar(MESAS_RESUMO.A);atualizar();}}>Selecionar Mesa A fictícia</button>
  <button className="botao-claro" onClick={()=>{controle.selecionar(MESAS_RESUMO.B);atualizar();}}>Selecionar Mesa B fictícia</button>
  <button className="botao-claro" onClick={()=>{controle.encerrar();atualizar();}}>Encerrar seleção fictícia</button>
  <button className="botao-claro" disabled={!dados.aguardando} onClick={()=>{servidor.entregar();atualizar();}}>Entregar resposta atrasada</button>
 </div><p>Consultas: {dados.consultas} · resposta atrasada: {dados.aguardando?'aguardando':'nenhuma'} · Escritas: 0</p>
 <PainelResumoLocal estado={vista} aoConsultar={()=>{void consultar();}}/></>;
}
function Fixture(){const [cenario,setCenario]=useState<CenarioResumo>('normal'),[geracao,setGeracao]=useState(0);return <main className="qa-ciclo">
 <div className="qa-banner"><strong>SIMULAÇÃO ISOLADA · RESUMO DA MESA</strong><p>Dados fictícios em memória. Sem conta, banco ou campanha. F5, trocar cenário ou Reiniciar zera tudo. Os botões de Mesa e seleção não são login/logout real.</p></div>
 <h1>Resumo em consulta segura</h1><div className="qa-controles"><label>Cenário <select value={cenario} onChange={e=>{setCenario(e.target.value as CenarioResumo);setGeracao(g=>g+1);}}>
 <option value="normal">Normal</option><option value="desconhecidas">Passivas a conferir</option><option value="condicoes">Condições registradas</option><option value="vazia">Mesa vazia</option><option value="dez">Dez personagens</option><option value="recusa">Recusa uma vez</option><option value="invalida">Resposta inválida uma vez</option><option value="atraso">Resposta atrasada da Mesa A</option>
 </select></label><button className="botao-claro" onClick={()=>setGeracao(g=>g+1)}>Reiniciar simulação</button></div><Painel key={geracao} cenario={cenario}/></main>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
