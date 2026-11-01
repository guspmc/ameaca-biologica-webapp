import {useState} from 'react';
import {AUTOMACOES,automacoesEfetivas,configuracaoInicial,type ModoFuncionamento,type ConfiguracaoFuncionamento} from './funcionamentoFicha';
type Props={inicial?:ConfiguracaoFuncionamento;revisaoInicial?:number;aoSalvar?:(config:ConfiguracaoFuncionamento,revisao:number)=>Promise<number>};
export default function FuncionamentoPrevio({inicial=configuracaoInicial(),revisaoInicial=0,aoSalvar}:Props){
 const [config,setConfig]=useState(()=>({...inicial,preferenciasMisto:{...inicial.preferenciasMisto}}));
 const [revisao,setRevisao]=useState(revisaoInicial);
 const [salvando,setSalvando]=useState(false);
 const [erro,setErro]=useState('');
 const [aviso,setAviso]=useState('');
 const efetivas=automacoesEfetivas(config);
 function limparMensagens(){setErro('');setAviso('');}
 async function salvar(){
  if(!aoSalvar||salvando)return;
  setSalvando(true);limparMensagens();
  try{
   const nova=await aoSalvar({...config,preferenciasMisto:{...config.preferenciasMisto}},revisao);
   if(!Number.isInteger(nova)||nova<0)throw Error('Resposta inesperada ao salvar funcionamento.');
   setRevisao(nova);setAviso('Preferências aplicadas ao formulário. Elas serão gravadas junto com o rascunho quando você salvar o personagem; nenhuma operação de jogo foi executada.');
  }catch(e){setErro((e instanceof Error?e.message:'Falha ao salvar.')+' Suas escolhas locais foram preservadas. Em caso de conflito de versão, anote-as antes de recarregar.');}
  finally{setSalvando(false);}
 }
 return <details className="funcionamento-previo"><summary>{aoSalvar?'Funcionamento da ficha · preferências do rascunho':'Funcionamento da ficha · prévia não salva'}</summary>
  <p>{aoSalvar?'As escolhas são aplicadas ao formulário. Para persistir, salve o rascunho do personagem; fechar ou pressionar F5 antes disso descarta as alterações.':'Prepare suas preferências para a ficha. Esta prévia fica somente nesta janela.'}</p>
  <label>Modo de funcionamento<select value={config.modo} disabled={salvando} onChange={e=>{setConfig(p=>({...p,modo:e.target.value as ModoFuncionamento}));limparMensagens();}}>
   <option value="automatico">Automático</option><option value="misto">Misto</option><option value="manual">Manual</option>
  </select></label>
  <p>Automático habilita os controles elegíveis; Misto permite escolher cada um; Manual mantém o registro sob seu controle. As opções do Misto são preservadas ao alternar modos.</p>
  <h4>Escolhas do Misto</h4>
  <div className="funcionamento-opcoes">{AUTOMACOES.map(a=><label key={a.id}>{a.nome}
   <select value={config.preferenciasMisto[a.id]===null?'definir':String(config.preferenciasMisto[a.id])} disabled={salvando||config.modo!=='misto'} onChange={e=>{setConfig(p=>({...p,preferenciasMisto:{...p.preferenciasMisto,[a.id]:e.target.value==='definir'?null:e.target.value==='true'}}));limparMensagens();}}>
    {a.padrao===null&&<option value="definir">A definir</option>}
    <option value="true">Habilitado</option><option value="false">Desabilitado</option>
   </select><small>{a.detalhe}</small>
  </label>)}</div>
  <div role="status"><strong>Resumo {aoSalvar?'das escolhas locais':'da prévia'}</strong><ul>{AUTOMACOES.map(a=><li key={a.id}>{a.nome}: {efetivas[a.id]===null?'A definir':efetivas[a.id]?'Habilitado':'Desabilitado'}</li>)}</ul></div>
  <p className="ficha-dica">Dados físicos, virtuais ou mistos são uma preferência separada. O modo de funcionamento preserva as fórmulas obrigatórias da criação Padrão.</p>
  <p className="ficha-dica">Nenhuma operação de jogo é executada aqui. A futura ativação aplicará preferências às próximas operações, preservando registros passados.</p>
  {erro&&<p role="alert" className="erro">{erro}</p>}
  {aviso&&<p role="status" className="sucesso">{aviso}</p>}
  <button type="button" className="botao-claro" disabled={salvando} onClick={()=>{setConfig(configuracaoInicial());setErro('');setAviso(aoSalvar?'Preferências reiniciadas localmente. Salve para gravar esta escolha.':'');}}>Restaurar prévia inicial</button>
  {aoSalvar&&<><p className="ficha-dica">Revisão local do formulário: {revisao}. As opções a definir são preservadas; a finalização continua indisponível.</p><button type="button" className="acao" disabled={salvando} onClick={()=>{void salvar();}}>{salvando?'Aplicando...':'Aplicar ao rascunho'}</button></>}
 </details>;
}
