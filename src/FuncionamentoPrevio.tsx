import {useState} from 'react';
import {AUTOMACOES,automacoesEfetivas,configuracaoInicial,type ModoFuncionamento} from './funcionamentoFicha';
export default function FuncionamentoPrevio(){
 const [config,setConfig]=useState(configuracaoInicial);
 const efetivas=automacoesEfetivas(config);
 return <details className="funcionamento-previo"><summary>Funcionamento da ficha · prévia não salva</summary>
  <p>Prepare suas preferências para a ficha ativa. Esta prévia fica somente nesta janela e é descartada ao fechar a ficha ou pressionar F5.</p>
  <label>Modo de funcionamento<select value={config.modo} onChange={e=>setConfig(p=>({...p,modo:e.target.value as ModoFuncionamento}))}>
   <option value="automatico">Automático</option><option value="misto">Misto</option><option value="manual">Manual</option>
  </select></label>
  <p>Automático habilita os controles elegíveis; Misto permite escolher cada um; Manual mantém o registro sob seu controle. As opções do Misto são preservadas nesta prévia ao alternar modos.</p>
  <h4>Escolhas do Misto</h4>
  <div className="funcionamento-opcoes">{AUTOMACOES.map(a=><label key={a.id}>{a.nome}
   <select value={config.preferenciasMisto[a.id]===null?'definir':String(config.preferenciasMisto[a.id])} disabled={config.modo!=='misto'} onChange={e=>setConfig(p=>({...p,preferenciasMisto:{...p.preferenciasMisto,[a.id]:e.target.value==='definir'?null:e.target.value==='true'}}))}>
    {a.padrao===null&&<option value="definir">A definir</option>}
    <option value="true">Habilitado</option><option value="false">Desabilitado</option>
   </select><small>{a.detalhe}</small>
  </label>)}</div>
  <div role="status"><strong>Resumo da prévia</strong><ul>{AUTOMACOES.map(a=><li key={a.id}>{a.nome}: {efetivas[a.id]===null?'A definir':efetivas[a.id]?'Habilitado':'Desabilitado'}</li>)}</ul></div>
  <p className="ficha-dica">Dados físicos, virtuais ou mistos são uma preferência separada. O modo de funcionamento preserva as fórmulas obrigatórias da criação Padrão.</p>
  <p className="ficha-dica">Nenhuma operação de jogo é executada aqui. A futura ativação aplicará preferências às próximas operações, preservando registros passados.</p>
  <button type="button" className="botao-claro" onClick={()=>setConfig(configuracaoInicial())}>Restaurar prévia inicial</button>
 </details>;
}
