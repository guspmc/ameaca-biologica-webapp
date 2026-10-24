import {createRoot} from 'react-dom/client';
import {useMemo,useRef,useState} from 'react';
import {prepararServicosAtivacao,type ResultadoAtivacaoServidor} from '../../src/servicoAtivacao';
import {prepararRecuperacaoAtivacao} from '../../src/recuperacaoAtivacao';
import {prepararConsultaContextual} from '../../src/consultaContextual';
import {FalhaAtivacao} from '../../src/pedidoAtivacao';
import {prepararServidorRecuperacaoQA,CONTEXTO_QA,PREFIXO_QA,CHAVE_PEDIDO_QA,type CenarioRecuperacao} from './estadoRecuperacao';
import '../../src/styles.css';
import './ativacao.css';

function ContextoFicticio(){
 const c=useMemo(()=>prepararConsultaContextual<string>(),[]),[vista,setVista]=useState(c.estado()),[aviso,setAviso]=useState(''),[podeEntregar,setPodeEntregar]=useState(false);
 const entrega=useRef<(()=>void)|null>(null);
 function iniciar(){c.selecionar('Mesa A');let resolver!:(v:string)=>void;const p=new Promise<string>(ok=>{resolver=ok;});entrega.current=()=>resolver('Dados fictícios da Mesa A');setPodeEntregar(true);setAviso('Consulta A aguardando entrega controlada.');setVista(c.estado());void c.consultar(()=>p).then(r=>{setAviso(r==='descartada'?'Resposta antiga descartada.':'Resposta atual apresentada.');setVista(c.estado());});setVista(c.estado());}
 async function trocar(){c.selecionar('Mesa B');setVista(c.estado());await c.consultar(async()=> 'Dados fictícios da Mesa B');setVista(c.estado());setAviso('Mesa B consultada.');}
 return <section className="cartao cartao-padrao" aria-label="Troca de contexto fictícia"><p className="rotulo">RESPOSTAS ATRASADAS</p><h2>Mesa e sessão fictícias</h2><p>Esta área não acessa contas ou Mesas reais. A entrega é controlada pelos botões.</p>
 <div className="qa-controles"><button className="botao-claro" disabled={podeEntregar} onClick={iniciar}>Consultar Mesa A com atraso</button><button className="botao-claro" onClick={()=>{void trocar();}}>Trocar para Mesa B</button><button className="botao-claro" onClick={()=>{c.selecionar('Mesa A');setVista(c.estado());setAviso('Voltou para A sem reutilizar a consulta antiga.');}}>Voltar para Mesa A</button><button className="botao-claro" onClick={()=>{c.invalidar();setVista(c.estado());setAviso('Sessão fictícia encerrada.');}}>Encerrar sessão fictícia</button><button className="acao" disabled={!podeEntregar} onClick={()=>{setPodeEntregar(false);entrega.current?.();entrega.current=null;}}>Entregar resposta antiga</button></div>
 <p>Contexto selecionado: {vista.contexto??'nenhum'}</p><p>Dados visíveis: {vista.valor??'nenhum'}</p><p role="status">{aviso}</p></section>;
}
function Recuperacao({reiniciar}:{reiniciar:()=>void}){
 const bloqueio=useRef(false),trava=useRef(false);
 const storage=useMemo(()=>({getItem:(k:string)=>sessionStorage.getItem(PREFIXO_QA+k),setItem:(k:string,v:string)=>sessionStorage.setItem(PREFIXO_QA+k,v)}),[]);
 const servidor=useMemo(()=>prepararServidorRecuperacaoQA(storage),[storage]);
 const servico=useMemo(()=>prepararServicosAtivacao(servidor),[servidor]);
 const recuperacao=useMemo(()=>prepararRecuperacaoAtivacao({contexto:CONTEXTO_QA,armazenamento:{getItem:storage.getItem,setItem:(k,v)=>{if(bloqueio.current)throw Error('Gravação fictícia bloqueada');storage.setItem(k,v);}},consultar:servico.consultarPedido,ativar:servico.ativar}),[storage,servico]);
 const [estado,setEstado]=useState(()=>servidor.estado()),[resultado,setResultado]=useState<ResultadoAtivacaoServidor|null>(null),[mensagem,setMensagem]=useState('Consulte o resultado antes de confirmar.'),[ocupado,setOcupado]=useState(false),[pendente,setPendente]=useState(()=>recuperacao.pendente()!==null),[bloqueado,setBloqueado]=useState(false);
 async function executar(fn:()=>Promise<void>){if(trava.current)return;trava.current=true;setOcupado(true);setMensagem('');try{await fn();}catch(e){setResultado(null);setMensagem(e instanceof FalhaAtivacao?e.message:'Não foi possível concluir a operação fictícia.');}finally{setEstado(servidor.estado());setPendente(recuperacao.pendente()!==null);setOcupado(false);trava.current=false;}}
 const consultar=()=>executar(async()=>{const p=recuperacao.pendente();const r=await servico.consultarResultado(CONTEXTO_QA.personagemId,p??undefined);setResultado(r);setMensagem(r.situacao==='confirmada'?'Resultado confirmado por consulta, sem novo envio.':p?'Sem recibo neste momento; o pedido foi preservado.':'Rascunho fictício sem recibo neste momento.');});
 const confirmar=()=>executar(async()=>{const p={personagemId:CONTEXTO_QA.personagemId,operacaoId:crypto.randomUUID(),revisaoFicha:2,revisaoMesa:3};const recibo=await recuperacao.confirmar(p);setResultado({situacao:'confirmada',estadoFicha:'completa',pedido:p,recibo});setMensagem('Confirmação fictícia recebida.');});
 const repetir=()=>executar(async()=>{const recibo=await recuperacao.repetir(),p=recuperacao.pendente()!;setResultado({situacao:'confirmada',estadoFicha:'completa',pedido:p,recibo});setMensagem('Pedido recuperado sem gerar outro identificador.');});
 function reset(cenario:CenarioRecuperacao){recuperacao.invalidar();servidor.reiniciar(cenario);sessionStorage.removeItem(PREFIXO_QA+CHAVE_PEDIDO_QA);reiniciar();}
 return <main className="qa-ciclo"><div className="qa-banner"><strong>SIMULAÇÃO ISOLADA · RECUPERAÇÃO E CONTEXTO</strong><p>Somente dados fictícios nesta aba. F5 conserva esta simulação para testar a recuperação. Reiniciar zera apenas seus dados de teste. Nenhuma conta, banco ou Mesa real é acessada.</p></div><h1>Recuperar uma confirmação</h1>
 <div className="qa-controles"><label>Cenário de recuperação <select value={estado.cenario} disabled={ocupado} onChange={e=>reset(e.target.value as CenarioRecuperacao)}><option value="resposta">Resposta perdida após gravar</option><option value="antes">Falha antes de gravar</option><option value="normal">Normal</option></select></label><button className="botao-claro" disabled={ocupado} onClick={()=>reset(estado.cenario)}>Reiniciar simulação</button></div>
 <p>Envios: {estado.envios} · consultas: {estado.consultas} · conjuntos criados: {estado.conjuntos} · PV 7 · SA 1 · BI 3</p>
 <div className="qa-grade"><section className="cartao cartao-padrao" aria-label="Recuperação fictícia"><p className="rotulo">PEDIDO PRESERVADO</p><h2>Consulta antes de repetir</h2><p>Referência local: {pendente?'preservada':'ausente'}</p><div className="qa-controles"><button className="botao-claro" disabled={ocupado} onClick={()=>{void consultar();}}>Consultar resultado</button><button className="acao" disabled={ocupado||pendente||resultado?.situacao!=='sem_recibo'||resultado.estadoFicha!=='rascunho'} onClick={()=>{void confirmar();}}>Confirmar pedido fictício</button><button className="botao-claro" disabled={ocupado||!pendente||resultado===null} onClick={()=>{void repetir();}}>Repetir pedido preservado</button></div>
 <label className="qa-confirmacao"><input type="checkbox" checked={bloqueado} disabled={ocupado} onChange={e=>{bloqueio.current=e.target.checked;setBloqueado(e.target.checked);}}/>Simular falha ao preservar referência local</label>
 <button className="botao-claro" disabled={ocupado||!pendente} onClick={()=>{sessionStorage.removeItem(PREFIXO_QA+CHAVE_PEDIDO_QA);setPendente(false);setResultado(null);setMensagem('Só a referência fictícia foi removida; o servidor de teste continua igual.');}}>Apagar só referência de teste</button>
 <p role="status">{mensagem}</p>{resultado?.situacao==='confirmada'&&<p className="sucesso">Ficha fictícia completa. Pedido recuperado: {resultado.pedido.operacaoId}. Conjunto único: {estado.conjuntos}.</p>}
 </section><ContextoFicticio/></div></main>;
}
function Fixture(){const [geracao,setGeracao]=useState(0);return <Recuperacao key={geracao} reiniciar={()=>setGeracao(g=>g+1)}/>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
