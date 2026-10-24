# Recuperação de ativação e isolamento de contexto — 24/10/2026

## IMPLEMENTADO

Continuação local do checkpoint `dc361c5`, sem mudança na aplicação ou simulação T5–T9. Os dois novos módulos não são importados por componentes conectados e não executam RPCs ou acesso a armazenamento na criação.

### Pedido preservado antes do envio

[recuperacaoAtivacao.ts](../src/recuperacaoAtivacao.ts) recebe explicitamente um contexto, armazenamento e callbacks de consulta/ativação. O armazenamento implementa somente `getItem`/`setItem`; não há uso de `window`, `localStorage`, `sessionStorage` ou Auth globais. Uma futura integração poderá fornecer armazenamento apropriado, mas nenhum navegador real recebeu dados nesta etapa.

Chave: `ab:ativacao:1:<usuarioId>:<mesaId>:<personagemId>`. Conteúdo fechado: versão 1, IDs de usuário/Mesa e pedido com ID da personagem, ID da operação e duas revisões. Sem nome, narrativa, recursos, itens, recibo, token, credenciais ou papel. Contexto e pedido são copiados e validados; o módulo não gera identificadores.

Antes de enviar a primeira confirmação, grava e relê exatamente o registro. Se não conseguir preservá-lo, não envia. Registro corrompido ou incompatível impede nova confirmação e não é sobrescrito. Um pedido já preservado impede outro identificador na mesma ficha. Duplo clique na mesma instância compartilha a promessa em andamento.

Um novo controlador pode ler esse mesmo registro e consultar o resultado autorizado por callback:

- `sem_pedido`: não existe metadado local. **Não comprova** ausência de ativação no servidor; nenhuma consulta ou ativação é feita automaticamente.
- `sem_recibo`: a consulta não apresentou recibo confirmado. Conserva o pedido e não envia, apaga ou gera identificador automaticamente. Não significa que o pedido original não possa estar em andamento.
- `confirmada` com recibo: valida a correspondência dos IDs, revisão e formato, retorna cópia e não reenvia ativação.

O comando explícito `repetir` consulta primeiro. Se obtiver recibo, retorna-o. Se obtiver `sem_recibo`, pode reenviar **o pedido original**, dependendo da idempotência e autorização transacionais do servidor. Erro/ambiguidade mantém o registro e não anuncia sucesso. Recibo de outra operação, dados extras ou revisão incompatível são recusados.

O registro mínimo continua preservado mesmo após confirmação ou invalidação. Isso permite nova consulta quando o mesmo contexto for selecionado. IDs diferentes selecionam outra chave, evitando mistura acidental; o módulo não autentica a seleção. Não há limpeza cega na troca de sessão nem método para descartar pedido incerto. A futura política de retenção/limpeza e consulta sem metadado local ainda precisa ser definida com o servidor. A chave local não é controle de autorização nem exclusão mútua entre abas.

`invalidar` inutiliza o controlador, inclusive para a mesma conta em uma nova sessão. Se a consulta ainda não terminou, não inicia envio posterior. Se o envio já começou, não desfaz a operação: descarta a entrega da resposta antiga e preserva metadados para consulta futura.

### Respostas pertencem ao contexto que as iniciou

[consultaContextual.ts](../src/consultaContextual.ts) mantém gerações de consulta. A integração futura precisa chamar selecionar/invalidar em toda troca de conta, sessão, Mesa ou ficha, inclusive ao voltar ao mesmo ID. Selecionar limpa dados/erro/carregamento anteriores imediatamente. Apenas a consulta mais recente da geração atual pode preencher os dados ou o erro.

Respostas e falhas antigas são descartadas; não apagam dados atuais nem alteram seu indicador de carregamento. Invalidar elimina o contexto e impede consulta sem seleção. Estado e resultado são cópias independentes. Uma falha atual remove dados antigos e usa mensagem genérica, sem expor erro privado.

O controlador protege o estado que ele próprio mantém. Ainda falta ligá-lo aos eventos reais de Auth/Mesa, componentes e assinaturas de atualização; não há certificação desse fluxo conectado.

## TESTADO

Suíte completa: **126 testes aprovados**, incluindo os doze novos e os 114 anteriores. TypeScript com `tsconfig.ui.json`, compilação Vite no modo teste e conferência das diferenças aprovados. Nenhuma mudança na interface aprovada exigiu nova rodada de navegador.

Doze testes novos em [recuperacao-contexto.test.mjs](../tests/recuperacao-contexto.test.mjs):

1. Criação sem efeitos, gravação anterior ao envio e preservação após falha.
2. Novo controlador com o mesmo armazenamento simulado recupera recibo sem novo conjunto.
3. `sem_recibo` não apaga nem envia; repetição explícita conserva o pedido.
4. Duplo clique compartilha envio; outro controlador não sobrescreve o pedido.
5. Falhas de leitura, escrita, escrita silenciosa e conteúdo inválido impedem efeitos.
6. Recibos ambiguamente formatados ou de outra operação não confirmam nem limpam registro.
7. Invalidação durante consulta impede envio; resposta de envio antigo não é entregue.
8. Contexto copiado e separado por conta/Mesa/ficha; ausência de pedido não consulta.
9. Resposta de Mesa anterior não preenche a Mesa nova.
10. Consulta mais recente vence, inclusive quando a antiga falha depois.
11. A→B→A e encerramento de sessão invalidam respostas anteriores.
12. Cópias independentes e erro atual sem texto privado.

Esses testes recriam o controlador com Map em memória e callbacks simulados. Não são F5 real, armazenamento de navegador, RPC remota, sessão real ou ensaio de conexões/abas sobrepostas. Não houve operação no banco.

## PENDENTE DE TESTE HUMANO

T10–T12 continuam condicionados e indisponíveis, conforme [roteiro](testes-humanos-pendentes.md). Nenhum teste novo solicitado agora; T5–T9 permanecem encerrados. Após integração, T10 inclui recuperação de resultado após F5 e falha de armazenamento controlada; T11 inclui respostas atrasadas em troca de conta/Mesa/sessão. Celular físico aguarda acesso posterior.

## BLOQUEADO

Falta consulta autorizada de resultado no servidor, inclusive recuperação quando não há registro local; transporte dessa consulta; gateway/erros tipados; integração dos controladores a Auth/Mesa/UI; definição de retenção/limpeza e testes reais de concorrência. O módulo não permite descartar um pedido incerto para iniciar outro por conveniência. O armazenamento local não substitui locks/idempotência do banco.

Não liberar este módulo na aplicação enquanto não houver caminho de consulta de resultado e política de contexto completos. SQL, RLS, autenticação, dados humanos, fontes oficiais e rede local não foram alterados. Sem merge ou publicação.

## PRÓXIMO PASSO

Preparar e testar localmente a consulta autorizada de recibo/estado, incluindo perda do registro local, e só depois ligar a recuperação ao transporte e à interface isolada. Apresentar checkpoint específico antes de aplicar qualquer conjunto de banco/permissões ao TESTE.
