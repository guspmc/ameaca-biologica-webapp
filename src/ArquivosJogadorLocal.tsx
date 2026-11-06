import { useState } from 'react';

type AbaArquivosJogador = 'documentos' | 'mapa' | 'anotacoes';

/** Estrutura navegável do Arquivos do Jogador; ainda sem leitura/sincronização de conteúdo. */
export default function ArquivosJogadorLocal({ mesaNome }: { mesaNome: string }) {
  const [aba, setAba] = useState<AbaArquivosJogador>('documentos');
  const titulo = aba === 'documentos' ? 'Documentos da Mesa' : aba === 'mapa' ? 'Mapa da operação' : 'Minhas anotações';
  return <section className="arquivos-jogador" aria-label={'Arquivos do Jogador — ' + mesaNome}>
    <header className="arquivos-jogador-topo">
      <div><small>ARQUIVO DO JOGADOR · {mesaNome}</small><h3>Arquivos</h3><p>Consulte materiais disponibilizados à Mesa e mantenha seus registros particulares.</p></div>
      <span>ACESSO DO JOGADOR</span>
    </header>
    <nav className="arquivos-jogador-nav" aria-label="Categorias de Arquivos">
      {([['documentos','Documentos'],['mapa','Mapa'],['anotacoes','Minhas anotações']] as [AbaArquivosJogador,string][]).map(([id,label]) =>
        <button key={id} type="button" className={aba===id?'ativo':''} aria-pressed={aba===id} onClick={()=>setAba(id)}>{label}</button>
      )}
    </nav>
    <div className="arquivos-jogador-conteudo" role="region" aria-live="polite" aria-label={titulo}>
      {aba === 'documentos' && <>
        <small>DOCUMENTOS REVELADOS</small><h4>Documentos da Mesa</h4>
        <p>Somente documentos que o Mestre publicar para toda a Mesa aparecerão aqui. Abrir ou consultar um documento não o publica nem altera sua visibilidade.</p>
        <div className="arquivos-jogador-vazio"><strong>Nenhum documento disponível</strong><span>Quando houver documentos revelados, eles poderão ser consultados nesta área.</span></div>
      </>}
      {aba === 'mapa' && <>
        <small>MAPA COMPARTILHADO</small><h4>Mapa da operação</h4>
        <p>Mapas e áreas reveladas pelo Mestre serão exibidos aqui. A visualização ampliada e as marcações pertinentes serão conectadas em etapa posterior.</p>
        <div className="arquivos-jogador-mapa" role="img" aria-label="Área reservada à visualização do mapa da Mesa"><span>MAPA DA MESA</span><strong>Nenhum mapa revelado</strong></div>
      </>}
      {aba === 'anotacoes' && <>
        <small>ESPAÇO PESSOAL · PRIVADO</small><h4>Minhas anotações</h4>
        <p>Suas anotações pertencem à sua conta e a esta Mesa, não à personagem. Outros jogadores e o Mestre não podem consultá-las. Elas não são transferidas quando a função de Mestre muda de titular.</p>
        <div className="arquivos-jogador-vazio"><strong>Editor pessoal ainda não conectado</strong><span>A criação de páginas, edição offline e sincronização com preservação de conflitos aguardam implementação. Nenhum texto será aceito nesta prévia.</span></div>
      </>}
    </div>
    <p className="arquivos-jogador-aviso">ESTRUTURA DE INTERFACE · CONSULTA, PUBLICAÇÃO E SINCRONIZAÇÃO AINDA NÃO INTEGRADAS</p>
  </section>;
}
