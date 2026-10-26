import {createRoot} from 'react-dom/client';import {useMemo,useState} from 'react';
import {prepararFluxoAtivacaoLocal} from '../../src/fluxoAtivacaoLocal';
import {prepararFluxoQA,CONTEXTO_FLUXO_QA,type CenarioFluxo} from './estadoFluxo';
import '../../src/styles.css';import './ativacao.css';
function Painel({cenario}:{cenario:CenarioFluxo}){
 const servidor=useMemo(()=>prepararFluxoQA(cenario),[cenario]);
 const fluxo=useMemo(()=>prepararFluxoAtivacaoLocal({cliente:servidor,armazenamento:servidor.armazenamento}),[servidor]);
 const [vista,setVista]=useState(fluxo.estado()),[dados,setDados]=useState(servidor.estado()),[ocupado,setOcupado]=useState(false),[aviso,setAviso]=useState('');
 function atualizar(){setVista(fluxo.estado());setDados(servidor.estado());}
 async function executar(fn:()=>Promise<unknown>){setOcupado(true);setAviso('');try{await fn();}catch{setAviso('Ação indisponível neste estado. Consulte novamente.');}finally{atualizar();setOcupado(false);}}
 return <section className="cartao cartao-padrao"><h2>Conferir, confirmar e recuperar</h2><p>Etapa: <strong>{vista.etapa}</strong></p><div className="qa-controles">
 <button className="botao-claro" disabled={ocupado} onClick={()=>{fluxo.selecionar(CONTEXTO_FLUXO_QA);setAviso('Ficha reaberta; nenhuma consulta ou ativação foi enviada.');atualizar();}}>Abrir ou reabrir ficha fictícia</button>
 <button className="botao-claro" disabled={ocupado||vista.etapa==='sem_contexto'} onClick={()=>{void executar(fluxo.conferir);}}>Consultar e conferir</button>
 <button className="botao-claro" disabled={ocupado||vista.etapa==='sem_contexto'} onClick={()=>{fluxo.encerrar();setAviso('Seleção encerrada; referência preservada. Não é logout real.');atualizar();}}>Encerrar seleção fictícia</button></div>
 {vista.criacao&&<p>Contexto: {vista.criacao.preparado?`Padrão · nível ${vista.criacao.nivelInicial} · revisão ${vista.criacao.revisao} · ${vista.criacao.permiteFinalizar?'permitido':'pausado'}`:'não preparado'}</p>}
 {vista.conferencia&&<p>Conferência: {vista.conferencia.nome} · revisão da ficha {vista.conferencia.revisaoFicha} · {vista.conferencia.ativas}/10 vagas ocupadas.</p>}
 <label className="qa-confirmacao"><input type="checkbox" checked={vista.conferida} disabled={ocupado||vista.etapa!=='pronta'} onChange={e=>{fluxo.consentir(e.target.checked);atualizar();}}/>Conferi as escolhas e quero ativar a personagem fictícia</label>
 <div className="qa-controles"><button className="acao" disabled={ocupado||vista.etapa!=='pronta'||!vista.conferida} onClick={()=>{void executar(fluxo.confirmar);}}>Confirmar ativação fictícia</button><button className="botao-claro" disabled={ocupado||vista.etapa!=='pendente'} onClick={()=>{void executar(fluxo.repetir);}}>Repetir pedido preservado</button></div>
 <p role="status">{aviso||vista.mensagem}</p><p>Referência local: {dados.referencias?'preservada':'ausente'} · Envios: {dados.envios} · conjuntos: {dados.conjuntos} · PV {dados.pv} · SA {dados.sa} · BI {dados.bi}</p>
 {vista.recibo&&<p className="sucesso">Pedido confirmado: {vista.recibo.operacaoId}. Itens iniciais: {vista.recibo.quantidadeInstancias}.</p>}</section>;
}
function Fixture(){const [cenario,setCenario]=useState<CenarioFluxo>('normal'),[geracao,setGeracao]=useState(0);return <main className="qa-ciclo"><div className="qa-banner"><strong>SIMULAÇÃO ISOLADA · FLUXO DE ATIVAÇÃO</strong><p>Somente dados fictícios em memória. Sem login, campanha ou banco real. F5, trocar cenário ou Reiniciar zera tudo. Reabrir a ficha conserva a referência durante esta simulação.</p></div><h1>Prévia do fluxo combinado</h1><div className="qa-controles"><label>Cenário <select value={cenario} onChange={e=>{setCenario(e.target.value as CenarioFluxo);setGeracao(g=>g+1);}}><option value="normal">Fluxo normal</option><option value="pausado">Finalizações pausadas</option><option value="resposta">Resposta perdida após ativar</option></select></label><button className="botao-claro" onClick={()=>setGeracao(g=>g+1)}>Reiniciar simulação</button></div><Painel key={geracao} cenario={cenario}/></main>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
