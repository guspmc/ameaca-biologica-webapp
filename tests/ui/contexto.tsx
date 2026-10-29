import {createRoot} from 'react-dom/client';
import {useMemo,useRef,useState} from 'react';
import {prepararServicoContextoCriacao,type ContextoCriacao} from '../../src/contextoCriacao';
import {prepararContextoQA,MESA_CONTEXTO_QA,type CenarioContexto} from './estadoContexto';
import '../../src/styles.css';import './ativacao.css';
function Painel({cenario}:{cenario:CenarioContexto}){
 const servidor=useMemo(()=>prepararContextoQA(cenario),[cenario]),servico=useMemo(()=>prepararServicoContextoCriacao(servidor),[servidor]);
 const [lido,setLido]=useState<ContextoCriacao|null>(null),[permitir,setPermitir]=useState(false),[confirma,setConfirma]=useState(false),[estado,setEstado]=useState(servidor.estado()),[aviso,setAviso]=useState('Consulte o contexto antes de preparar ou salvar.'),[ocupado,setOcupado]=useState(false);const trava=useRef(false);
 async function executar(salvar:boolean){if(trava.current)return;trava.current=true;setOcupado(true);try{
  const r=salvar?await servico.salvar(MESA_CONTEXTO_QA,permitir,lido!.revisao):await servico.consultar(MESA_CONTEXTO_QA);
  setLido(r);setPermitir(r.permiteFinalizar);setConfirma(false);setAviso(salvar?'Configuração confirmada. Nenhuma ficha foi alterada.':'Contexto consultado. Confira o estado antes de salvar.');
 }catch(e){setLido(null);setConfirma(false);setAviso(e instanceof Error?e.message:'Operação não confirmada. Consulte novamente.');}finally{setEstado(servidor.estado());setOcupado(false);trava.current=false;}}
 return <section className="cartao cartao-padrao"><p className="rotulo">MESTRE FICTÍCIO</p><h2>Finalização de novas personagens</h2><p>Esta configuração não encerra a campanha e não congela nem apaga rascunhos. Padrão, nível 1; outros métodos e níveis seguem fluxos próprios.</p>
 <p>Estado consultado: {lido===null?'não consultado ou precisa atualizar':lido.preparado?`preparado · revisão ${lido.revisao} · ${lido.permiteFinalizar?'finalizações permitidas':'finalizações pausadas'}`:'contexto ainda não preparado'}</p>
 <button className="botao-claro" disabled={ocupado} onClick={()=>{void executar(false);}}>Consultar contexto</button>
 <label className="qa-confirmacao"><input type="checkbox" checked={permitir} disabled={ocupado||lido===null} onChange={e=>setPermitir(e.target.checked)}/>Permitir novas finalizações</label>
 {lido&&!lido.preparado&&<label className="qa-confirmacao"><input type="checkbox" checked={confirma} disabled={ocupado} onChange={e=>setConfirma(e.target.checked)}/>Confirmo preparar esta Mesa vazia com criação Padrão de nível 1</label>}
 <button className="acao" disabled={ocupado||lido===null||(!lido.preparado&&!confirma)} onClick={()=>{void executar(true);}}>Salvar contexto fictício</button>
 <p>Escolha local: {permitir?'permitir':'pausar'} finalizações</p><p role="status">{aviso}</p>
 <p>Servidor fictício: {estado.contexto.preparado?`revisão ${estado.contexto.revisao} · ${estado.contexto.permiteFinalizar?'permitidas':'pausadas'}`:'sem contexto'} · Envios: {estado.envios}</p><p>Personagens preservadas: {estado.personagens} · PV {estado.pv} · SA {estado.sa} · BI {estado.bi}</p></section>;
}
function Fixture(){const [cenario,setCenario]=useState<CenarioContexto>('normal'),[geracao,setGeracao]=useState(0);return <main className="qa-ciclo"><div className="qa-banner"><strong>SIMULAÇÃO ISOLADA · CONTEXTO DE CRIAÇÃO</strong><p>Somente dados fictícios em memória. Não há login, banco ou Mesa real. F5, trocar cenário ou Reiniciar zera esta página.</p></div><h1>Preparar a criação da Mesa</h1><div className="qa-controles"><label>Cenário <select value={cenario} onChange={e=>{setCenario(e.target.value as CenarioContexto);setGeracao(g=>g+1);}}><option value="normal">Mesa vazia</option><option value="legado">Mesa existente sem contexto</option><option value="conflito">Contexto mudou antes de salvar</option><option value="resposta">Resposta perdida após salvar</option></select></label><button className="botao-claro" onClick={()=>setGeracao(g=>g+1)}>Reiniciar simulação</button></div><Painel key={geracao} cenario={cenario}/></main>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
