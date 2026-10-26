import {createRoot} from 'react-dom/client';import {useEffect,useMemo,useState} from 'react';
import {prepararOrganizacaoLocal} from '../../src/organizacaoInventario';import {prepararRepositorioOrganizacao,chavePendenciaOrganizacao} from '../../src/pendenciaOrganizacao';import Painel from '../../src/PainelOrganizacaoLocal';
import {prepararServidorOrganizacaoSessao,PREFIXO_ORG_QA,FICHAS_SESSAO as F,type CenarioSessao} from './estadoOrganizacaoSessao';
import '../../src/styles.css';import './ativacao.css';import './inventario.css';import './organizacao.css';
type Servidor=Awaited<ReturnType<typeof prepararServidorOrganizacaoSessao>>;
const a={getItem:(k:string)=>sessionStorage.getItem(k),setItem:(k:string,v:string)=>sessionStorage.setItem(k,v),removeItem:(k:string)=>sessionStorage.removeItem(k)};
function Ativa({s,recarregar}:{s:Servidor;recarregar:()=>void}){
 const [bloqueio,setBloqueio]=useState(s.estado().cenario==='gravar'||s.estado().cenario==='ler'||s.estado().cenario==='limpar');
 const flags=useMemo(()=>({ativo:bloqueio}),[]);flags.ativo=bloqueio;
 const controle=useMemo(()=>prepararOrganizacaoLocal(s.porta,()=>`f7000000-0000-4000-8000-${String(s.estado().envios+1).padStart(12,'0')}`,prepararRepositorioOrganizacao({
  getItem:k=>{if(flags.ativo&&s.estado().cenario==='ler')throw Error();return a.getItem(PREFIXO_ORG_QA+k);},
  setItem:(k,v)=>{if(flags.ativo&&s.estado().cenario==='gravar')throw Error();a.setItem(PREFIXO_ORG_QA+k,v);},
  removeItem:k=>{if(flags.ativo&&s.estado().cenario==='limpar')throw Error();a.removeItem(PREFIXO_ORG_QA+k);}
 })),[s,flags]);
 const [vista,setVista]=useState(controle.estado()),[dados,setDados]=useState(s.estado()),[aviso,setAviso]=useState('');
 const atualizar=()=>{setVista(controle.estado());setDados(s.estado());};
 async function op(f:()=>Promise<void>){const p=f();atualizar();await p;atualizar();}
 function reset(c:CenarioSessao){controle.encerrar();for(const f of Object.values(F))a.removeItem(PREFIXO_ORG_QA+chavePendenciaOrganizacao(f));s.reiniciar(c);recarregar();}
 return <><div className="qa-controles"><label>Cenário <select value={dados.cenario} onChange={e=>reset(e.target.value as CenarioSessao)}>{[['normal','Normal'],['depois','Resposta perdida após gravar'],['antes','Falha antes de gravar'],['gravar','Falha ao preservar pedido'],['ler','Leitura local indisponível'],['corrompida','Referência inválida'],['limpar','Falha ao limpar referência'],['conflito','Revisão diferente'],['recusa','Consulta recusada uma vez'],['pilhas','Pilhas de munição']].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><button className="botao-claro" onClick={()=>reset(dados.cenario)}>Reiniciar somente esta simulação</button></div>
 <div className="qa-controles"><button className="botao-claro" onClick={()=>{controle.selecionar(F.A);atualizar();}}>Selecionar A fictícia</button><button className="botao-claro" onClick={()=>{controle.selecionar(F.B);atualizar();}}>Selecionar B fictícia</button><button className="botao-claro" onClick={()=>{controle.encerrar();atualizar();}}>Encerrar seleção fictícia</button></div>
 <label className="qa-confirmacao"><input type="checkbox" checked={bloqueio} onChange={e=>setBloqueio(e.target.checked)}/>Simular indisponibilidade local do cenário</label>
 <button className="botao-claro" disabled={dados.cenario!=='corrompida'} onClick={()=>{a.setItem(PREFIXO_ORG_QA+chavePendenciaOrganizacao(F.A),'REFERENCIA FICTICIA INVALIDA');controle.selecionar(F.A);atualizar();setAviso('Somente referência fictícia A foi invalidada. O servidor fictício permanece.');}}>Invalidar referência fictícia A</button>
 <p role="status">{aviso}</p><p>Consultas: {dados.consultas} · Envios: {dados.envios} · Alterações: {dados.alteracoes}</p>
 <Painel estado={vista} aoConsultar={()=>void op(controle.consultar)} aoRepetir={()=>void op(controle.repetir)} aoPreparar={(id,d)=>{try{controle.preparar(id,d);}finally{atualizar();}}} aoCancelar={()=>{controle.cancelar();atualizar();}} aoConfirmar={sim=>void op(()=>controle.confirmar(sim))}/></>;
}
function Fixture(){const [s,setS]=useState<Servidor|null>(null),[erro,setErro]=useState(''),[geracao,setG]=useState(0);useEffect(()=>{let atual=true;setS(null);void prepararServidorOrganizacaoSessao(a).then(v=>{if(atual)setS(v);},()=>{if(atual)setErro('Armazenamento desta simulação indisponível ou inválido. Nenhuma operação foi enviada.');});return()=>{atual=false;};},[geracao]);return <main className="qa-ciclo"><div className="qa-banner"><strong>SIMULAÇÃO ISOLADA · ORGANIZAÇÃO APÓS ATUALIZAR</strong><p>Somente dados fictícios nesta aba. Atualizar conserva servidor e pedidos fictícios na sessão; fechar a aba pode apagá-los. Reiniciar ou trocar cenário zera somente esta simulação. Sem login, banco ou campanha. Nada é enviado automaticamente após atualizar: selecione e consulte.</p></div><h1>Retomar a organização</h1>{erro&&<p role="alert">{erro}</p>}{s&&<Ativa key={geracao} s={s} recarregar={()=>{setS(null);setG(n=>n+1);}}/>}</main>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
