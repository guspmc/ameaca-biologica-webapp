import {CartaoResumo} from './ResumoOperacional';
import type {EstadoConsultaResumo} from './consultaResumoLocal';

export default function PainelResumoLocal({estado,aoConsultar}:{estado:EstadoConsultaResumo;aoConsultar:()=>void}){
 return <section className="cartao cartao-padrao" aria-label="Consulta do resumo da Mesa" aria-busy={estado.etapa==='consultando'}>
  <p className="rotulo">RESUMO OPERACIONAL · SOMENTE LEITURA</p>
  <h2>{estado.contexto?.mesaNome??'Selecione uma Mesa'}</h2>
  <p>Recursos atuais e máximos são exibidos como recebidos. Consultar não cura nem altera a ficha.</p>
  <button className="botao-claro" type="button" onClick={aoConsultar} disabled={!estado.contexto||estado.etapa==='consultando'}>{estado.etapa==='consultando'?'Consultando…':'Consultar resumo'}</button>
  {estado.etapa==='erro'?<p className="erro" role="alert">{estado.mensagem}</p>:<p role="status">{estado.mensagem||'Nenhuma consulta enviada nesta seleção.'}</p>}
  {estado.itens.map(p=><CartaoResumo key={p.personagemId} personagem={p}/>)}
 </section>;
}
