# Consulta de resultado e QA de recuperação — 24/10/2026

## IMPLEMENTADO

Continuação do checkpoint `936f041`. A proposta [consulta-ativacao-local.sql](../supabase/proposals/consulta-ativacao-local.sql) permanece fora das migrações e foi executada somente em PostgreSQL descartável em memória. Não houve consulta ou escrita em Supabase remoto.

RPC proposta `consultar_resultado_ativacao(p_personagem, p_operacao=null)`: função pública SECURITY INVOKER delega leitura a função privada SECURITY DEFINER, com `search_path` vazio e autorização explícita. Clientes não recebem acesso às tabelas privadas ou aos comandos de ativação. O serviço privado, embora executável pelo papel autenticado para a delegação, aplica a mesma autorização em chamada direta.

Somente a autoria atual, ainda admitida como jogador e diferente do Mestre oficial, consulta seu rascunho/completa. Mestre, conta alheia, não membro, removido e anônimo são recusados. Recibo de uma ativação antiga não é entregue ao novo dono após arquivamento/retomada; a conta anterior também perde consulta.

A consulta é STABLE e não altera fichas, revisões, itens, contexto ou recibos. Responde:

- `sem_recibo`, estado atual `rascunho` ou `completa`, pedido/recibo null: ausência observada no snapshot, sem afirmar que não exista pedido em andamento. Completa legada não é apresentada como rascunho, nem ganha recibo fabricado.
- `confirmada`, estado `completa`, pedido original e recibo fechado: recuperável pelo ID da ficha mesmo sem referência local, ou pelo identificador original se conhecido. IDs, revisões e campos necessários são reconstruídos/projetados; não se devolve JSON bruto, autoria, narrativa ou inventário.

Pedido divergente e registro inválido têm erros genéricos tipados, sem dados privados. O recibo representa a confirmação original, não os recursos ou revisão atuais. A leitura não cura, recompõe itens ou reativa ficha.

[servicoAtivacao.ts](../src/servicoAtivacao.ts) valida o envelope de consulta e a tupla do pedido conhecido; o adaptador `consultarPedido` não permite reenvio de uma completa sem recibo. A porta RPC foi explicitada como objeto com `rpc` que retorna `data/error` assíncronos, permitindo transporte simulado sem fingir implementar o query builder do SDK. A ligação real ao cliente Supabase continua pendente de integração; nenhuma dependência foi alterada.

### Página fictícia disponível

`http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/recuperacao.html`

Integra o transporte e os dois controladores anteriores com um servidor fictício. Usa somente `sessionStorage` sob prefixo **ab:qa:recuperacao:v1:**, IDs fictícios fixos e pedidos aleatórios de teste. Não acessa Auth, Supabase, rede de campanha ou chaves reais da aplicação. A inicialização não consulta o servidor fictício; o usuário precisa clicar Consultar resultado antes de confirmar.

O servidor fictício e a referência mínima persistem nesta sessão da aba para permitir F5. Reiniciar/mudar cenário limpa somente os dados desta fixture. Apagar só referência de teste preserva o servidor fictício e permite exercitar consulta por ficha. Nenhum desses botões remove dados humanos. A página anterior `ativacao.html` permanece intacta com seu F5 que reinicia a simulação.

Há cenários Normal, falha antes de gravar e resposta perdida após gravar; falha controlada de preservação do pedido; e entrega controlada de resposta antiga após troca de Mesa, retorno A→B→A ou encerramento de sessão fictícia.

## TESTADO

Suíte completa: **137 testes aprovados**, incluindo onze novos (cinco SQL, dois de transporte e quatro da fixture). TypeScript incluindo os cenários isolados, compilação Vite no modo teste e conferência de diferenças aprovados. A integração real continua desabilitada.

- Cinco testes novos de PostgreSQL em memória: leitura sem efeitos; consulta com/sem ID de operação; projeção fechada mesmo com campo privado injetado no registro; autorização e acesso direto ao serviço; pedido divergente/recibo inválido; completa legada e arquivamento/retomada.
- Dois casos novos de transporte: consulta por ficha/tupla original, resposta ambígua e completa sem recibo impedindo reenvio.
- Quatro testes novos do servidor fictício: persistência entre instâncias, falhas/repetição, divergência e isolamento/reinício.
- Navegador da fixture: recarregar página recupera confirmação sem novo envio; perda da referência recupera pelo ID da ficha; falha anterior permite repetição do mesmo pedido; armazenamento bloqueado impede envio; Normal conclui; respostas antigas são descartadas em troca para B, A→B→A e encerramento fictício.
- Layout inspecionado em desktop e largura emulada de 390 px, sem rolagem horizontal; viewport restaurado. Nenhum erro de console observado. Capturas locais na conversa.

O recarregamento real foi exercitado **somente na fixture**, cujo servidor também é simulado no armazenamento da aba. Isso não certifica persistência, sessão ou recuperação em uma campanha conectada. As falhas não representam corte real de rede; os testes SQL não comprovam conexões simultâneas. O SDK real não foi acionado nesta etapa.

## PENDENTE DE TESTE HUMANO

Chegamos a uma rodada concreta e isolada: **T13.1–T13.6**, detalhada em [teste-humano-recuperacao.md](teste-humano-recuperacao.md). Não repetir T5–T9. T10–T12 continuam condicionados: ativação integrada, privacidade entre contas/Mesas reais de TESTE e celular físico não são encerrados por T13.

## BLOQUEADO

Aplicação remota continua exigindo pacote revisável e checkpoint específico. Faltam gateway público de ativação/conferência e erros tipados, configuração real de contexto, integração com Auth/Mesa, retenção/limpeza de metadados de pedidos e ensaio de concorrência/rede real. A consulta pronta localmente não autoriza ativação remota isolada ou alteração das permissões antigas.

## PRÓXIMO PASSO

Conferência humana T13 e preparação do restante do pacote local antes de checkpoint do TESTE. Produção, RLS/Auth remotos, dados existentes e fontes oficiais preservados; sem merge, publicação ou exposição de rede. Referência técnica consultada: [Supabase — funções e privilégios](https://supabase.com/docs/guides/database/functions).
