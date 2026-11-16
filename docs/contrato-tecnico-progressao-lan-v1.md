# Contrato técnico — Progressão da Ficha na LAN

**Status:** ESPECIFICAÇÃO APROVADA CONCEITUALMENTE; implementação PENDENTE  
**Data:** 15/11/2026  
**Branch de referência:** `feat/offline-first-ficha`  
**HEAD de referência na elaboração:** `8a880ac323cc36e661b64dc5e73c71eba7d6193c`

Este documento consolida as decisões de produto para orientar a futura implementação. Não altera regras canônicas, código, banco, migrations, rotas ou interface. Os nomes de operações e estruturas abaixo são contratos propostos; não significam que endpoints ou tabelas já existam.

## 1. Fontes e limites

Hierarquia obrigatória:
1. Arquivo do Jogador v1.0 e Arquivo do Mestre v1.0 — regras canônicas.
2. Decisões de produto registradas nos checkpoints da Progressão neutra.
3. Este contrato — especificação técnica da futura integração LAN.
4. Implementação e testes — evidência do comportamento efetivamente entregue.

O Arquivo do Mestre estabelece Marco Narrativo como método preferencial e contagem de Missões Completadas como opcional. O Arquivo do Jogador estabelece que a subida de Nível só é aplicada durante Descanso Completo em Sala de Descanso. A perda de Nível por Morte não apaga Missões ou Marcos anteriores, mas exige uma nova Missão ou novo Marco após a Morte antes de disponibilizar outra subida.

Decisão de produto já aprovada: o grupo decide fora do WebApp qual critério utiliza. A Ficha não configura método por Mesa, não obriga seleção e não valida a verdade narrativa de Missões ou Marcos. A Progressão neutra usa autorização externa comunicada pelo grupo/Narrador. Contratos legados com `metodo` continuam compatíveis e não devem ser convertidos ou apagados automaticamente.

## 2. Decisões consolidadas por Gus

1. **Contador de Missões — CONTROLLED:** o Jogador pode corrigir o total para cima ou para baixo. A operação é explícita, validada e sujeita a revisão concorrente. A correção não concede Nível por si só, não altera benefícios e não apaga o histórico de Morte. A elegibilidade continua sendo calculada pelas regras de domínio e pelo estado de Progressão persistido.
2. **Morte — PENDING:** o Jogador registra a ocorrência como autodeclaração pendente de confirmação do Mestre. A confirmação é uma operação separada, reservada a uma identidade com autorização atual de Mestre na Mesa. O registro pendente não deve ser apresentado como confirmação do Mestre. O acesso do Mestre não se converte em editor universal da Ficha.
3. **Descanso — ATTESTATION:** a conclusão do Descanso Completo em Sala de Descanso é uma declaração explícita do Jogador enviada ao servidor. O servidor valida identidade, autorização, revisão, estado e transição, e grava atomicamente. O servidor não pode verificar duração real, localização narrativa ou avanço significativo da história; não deve alegar que verificou esses fatos.

## 3. Atores e autorização

- **Jogador proprietário:** pode operar a Progressão da própria personagem enquanto possuir vínculo atual com papel `jogador` na Mesa correspondente.
- **Mestre:** poderá confirmar uma Morte pendente por operação específica quando a superfície autorizada do Painel do Mestre estiver disponível. A autorização deve ser revalidada no momento da operação.
- **Servidor:** é a autoridade para autenticação, autorização atual, leitura do estado persistido, validação técnica das transições, concorrência e gravação. Não decide fatos narrativos.

Toda operação deve reconsultar o vínculo atual entre conta e Mesa. A autoria original do rascunho ou o conhecimento do ID da personagem não substituem autorização atual. Personagem fora do escopo de acesso não deve ser distinguível por respostas que revelem sua existência.

## 4. Envelope comum das operações

Toda mutação dedicada de Progressão deverá transportar:
- `expectedRevision`: inteiro positivo que representa a revisão da ficha lida pelo cliente;
- `operationId`: UUID único da tentativa lógica;
- `type`: tipo de operação;
- `payload`: somente os campos necessários à operação.

O identificador da personagem pertence ao recurso/rota, não deve ser aceito como autorização. Conta e papel são derivados da sessão autenticada, nunca confiados ao payload.

A rota HTTP definitiva e os nomes finais de tipos/funções serão definidos após inspeção dos roteadores e contratos atuais, antes de codificar. Não criar rotas paralelas nem tabelas sem revisar a arquitetura e migrations existentes.

## 5. Operações de domínio propostas

### 5.1 Inicializar Progressão

- Disponível apenas quando a personagem elegível ainda não possui estado de Progressão e está no Nível 1.
- Cria o estado neutro inicial, sem `metodo`, com autorização externa falsa e histórico vazio.
- Não permite substituir, reinicializar ou apagar estado/histórico já existente.
- Contratos legados válidos permanecem intactos.

### 5.2 Registrar autorização externa do grupo

- Registra que o grupo/Narrador autorizou o próximo avanço, sem registrar método ou configuração de Mesa.
- Não concede Nível, não aplica benefícios e não confirma Descanso.
- Rejeita autorização duplicada, personagem no Nível máximo ou estado incompatível.
- Após Morte, uma nova autorização não dispensa o requisito canônico de progresso posterior à Morte. A Ficha não certifica a narrativa; registra a comunicação do grupo e conserva a distinção entre autorização e critério de progressão.

### 5.3 Corrigir contador de Missões (CONTROLLED)

- Aceita novo total inteiro, seguro e não negativo.
- Permite aumentar ou diminuir o contador por correção explícita.
- Não altera automaticamente `nivelAtual`, `pedidoProgressao`, benefícios ou histórico de Morte.
- Não apaga `missoesCompletadasNaUltimaMorte`; o avaliador de domínio permanece responsável por determinar se houve progresso posterior à Morte.
- O valor persistido é sempre substituído sob revisão esperada; não usar incremento cego nem somar deltas de requisições repetidas.
- Registrar recibo/auditoria mínima da operação (ator, personagem, valor anterior/novo, revisão anterior/nova, operationId e instante), sem introduzir dados narrativos secretos ou conteúdo desnecessário.
- A correção é uma declaração do Jogador, não uma validação automática da conclusão narrativa de cada Missão.

### 5.4 Solicitar avanço

- Cria pedido para exatamente o próximo Nível, quando o estado de domínio considerar o requisito disponível.
- Não altera o Nível, não aplica benefícios e não confirma Descanso.
- Rejeita pedido duplicado, Nível máximo, requisito não cumprido ou pedido já existente.
- O critério neutro depende da autorização externa registrada; contratos legados continuam avaliados pelo respectivo método histórico.

### 5.5 Cancelar pedido

- Cancela somente pedido ainda em `aguardando_descanso`.
- Não reverte Descanso já confirmado nem Nível/benefícios aplicados.
- Exige revisão atual e operação idempotente.

### 5.6 Declarar e confirmar Descanso Completo (ATTESTATION)

- O Jogador envia declaração explícita de que concluiu Descanso Completo em Sala de Descanso.
- A operação valida que existe pedido compatível e pendente, que a revisão é atual e que o estado de Progressão é válido.
- A declaração pode atualizar o estado do pedido para `descanso_confirmado`, mas não aplica automaticamente as escolhas de benefícios.
- A gravação do Descanso e da confirmação de Progressão deve ser atômica com os demais dados de Descanso que já pertençam à mesma transição.
- O servidor valida coerência e autorização, mas não verifica duração de uma hora, ausência de inimigos, avanço significativo da história ou localização ficcional real. Esses fatos permanecem sob responsabilidade da Mesa/Jogador conforme as regras.
- Não conceder benefícios por simples passagem de tempo, reconexão, leitura da ficha ou repetição da requisição.

### 5.7 Aplicar benefícios do Nível

- Exige pedido válido em `descanso_confirmado`.
- Aceita somente as escolhas previstas para aquele Nível: Habilidade, Atributo e/ou Perícia conforme o domínio canônico.
- Revalida classe, pré-requisitos, grau, histórico de habilidades, limites e estado anterior no servidor.
- Atualiza, em uma única transação, `nivel`, `progressao.nivelAtual`, `beneficiosPorNivel`, escolhas adquiridas e todos os dados derivados/relacionados exigidos pelo domínio.
- Consome autorização neutra quando aplicável e encerra o pedido.
- Não aceita que o cliente envie um patch arbitrário de ficha como se fosse uma escolha validada.
- A transição deve ser construída por funções de domínio existentes/revisadas, não duplicada na rota HTTP.

### 5.8 Registrar Morte (PENDING)

- O Jogador envia autodeclaração explícita.
- O servidor valida estado e histórico de benefícios e registra a perda conforme as regras existentes, preservando Missões/Marcos anteriores e o histórico necessário para exigir novo progresso após a Morte.
- Reverte somente benefícios registrados do Nível perdido; não inventa nem recalcula benefícios sem registro confiável.
- Cancela pedido pendente e limpa autorização neutra anterior conforme o domínio atual.
- Marca o registro como pendente de confirmação do Mestre (compatível com o estado de domínio `morteLocalNaoConfirmada`, sujeito à revisão de seu significado e nomenclatura antes da implementação).
- Repetir a mesma operação não pode retirar outro Nível.
- Se o histórico necessário estiver incompleto/inválido, rejeitar sem alteração parcial.

### 5.9 Confirmar Morte pelo Mestre

- Operação separada, não disponível ao Jogador.
- Exige papel de Mestre atual na Mesa e autorização específica para confirmar a ocorrência.
- Atua apenas sobre registro pendente e não repete perda de Nível/benefícios.
- Registra confirmação e ator de forma auditável, sem expor detalhes da ficha além do necessário.
- O desenho do endpoint e da superfície de uso deve respeitar a fase futura do Painel do Mestre. Não implementar editor universal nem conceder acesso irrestrito à ficha.

## 6. Transação, revisão e idempotência

- Usar transação SQLite apropriada para serializar a leitura-validacão-gravação de cada mutação (por exemplo, transação imediata, conforme padrão já utilizado no servidor).
- Recarregar a personagem dentro da transação; nunca confiar no objeto recebido do cliente como estado atual.
- Revalidar conta, vínculo com Mesa, papel e revisão dentro da seção crítica.
- Comparar `expectedRevision` à revisão atual antes de aplicar a transição.
- Atualizar todos os campos relacionados e incrementar a revisão exatamente uma vez por operação lógica concluída.
- Persistir recibo de operação/idempotência na mesma transação da mutação. Repetição do mesmo `operationId` para o mesmo recurso e operação retorna o resultado já confirmado, sem reaplicar efeitos. Reutilização do identificador em outra operação/recurso é conflito.
- Em qualquer erro, rollback integral: nenhuma metade de Nível, benefício, Morte, pedido ou Descanso pode permanecer gravada.
- Notificar os dispositivos conectados somente depois do COMMIT.
- Não fazer merge automático de alterações concorrentes nem sobrescrever silenciosamente dados mais recentes.

## 7. Respostas HTTP esperadas

Códigos propostos, sujeitos à convenção existente do servidor:
- `200`: operação concluída ou repetição idempotente reconhecida; devolver personagem/estado e revisão atualizados, além do recibo apropriado.
- `400`: envelope malformado, se essa distinção for adotada pelo servidor.
- `401`: sessão ausente/expirada.
- `404`: recurso fora do escopo autorizado ou inexistente, sem revelar existência indevida.
- `405`: método HTTP não permitido.
- `409`: revisão obsoleta, transição incompatível, pedido duplicado não idempotente ou identificador reutilizado em contexto diferente.
- `422`: payload, estado ou escolhas inválidas.
- `500`: falha interna, sem expor detalhes sensíveis.

O contrato final deve seguir as convenções efetivamente adotadas nas rotas locais; esta lista não autoriza alterar globalmente o tratamento de erros.

## 8. Proteções obrigatórias do salvamento genérico

O `PUT` genérico permanece incapaz de criar/remover Progressão ou alterar:
- Nível e estado de Progressão;
- autorização neutra;
- método legado;
- Marcos e contador de Missões (o contador deverá migrar para a operação dedicada quando o fluxo LAN for ativado);
- pedidos e estado de Descanso da Progressão;
- histórico/estado de Morte e benefícios por Nível.

Até a operação dedicada de contador estar implementada e integrada, não abrir uma brecha temporária no `PUT`. O comportamento atual de proteção permanece.

## 9. Compatibilidade Offline e contratos legados

- O fluxo Offline existente permanece funcional e não depende do servidor.
- O contrato neutro continua sem método obrigatório.
- Estados legados com `metodo: marco_narrativo` ou `metodo: missoes` continuam válidos e seguem suas regras históricas.
- Não migrar silenciosamente estado legado para neutro.
- Não sincronizar automaticamente alterações Offline com LAN.
- Não sobrescrever estado remoto por importação ou backup sem fluxo explícito de conflito e consentimento.
- A confirmação de Morte pelo Mestre não pode ser simulada Offline nem atribuída ao Jogador.

## 10. Matriz mínima de testes antes de considerar implementado

### Autorização e isolamento
- Jogador autorizado opera a própria personagem.
- Conta sem vínculo atual, papel incorreto ou Mesa diferente não lê nem altera o estado.
- Mestre não consegue editar livremente a Progressão do Jogador.
- Confirmação de Morte é exclusiva ao Mestre autorizado.
- Remoção/alteração de papel durante sessão invalida autorização na próxima operação.

### Contador controlado
- Aumentar contador.
- Diminuir contador.
- Zero e limite inteiro válido.
- Rejeitar negativo, decimal, string, NaN/inteiro inseguro.
- Corrigir para valor anterior ao snapshot de Morte não satisfaz progresso pós-Morte.
- Repetição idempotente não soma nem subtrai duas vezes.
- Conflito de revisão não sobrescreve atualização concorrente.

### Progressão e Descanso
- Inicialização única no Nível 1.
- Não reinicializar histórico existente.
- Autorizar avanço sem escolher método.
- Não permitir avanço no Nível 10.
- Solicitar sem requisito deve falhar.
- Cancelar pedido pendente; rejeitar cancelamento após confirmação.
- Declaração de Descanso em local diferente de Sala de Descanso deve falhar.
- Descanso sem pedido válido não concede Progressão.
- Declaração repetida não aplica benefícios duas vezes.
- Aplicar apenas escolhas correspondentes ao Nível e à classe.
- Falha em qualquer benefício deve reverter a transação inteira.

### Morte
- Registro pendente preserva Missões/Marcos anteriores e snapshot pós-Morte.
- Reverte somente benefícios documentados do Nível perdido.
- Pedido pendente é cancelado.
- Autorização anterior é consumida/limpa conforme domínio.
- Repetição não perde segundo Nível.
- Histórico incompleto rejeita sem mutação parcial.
- Jogador não pode confirmar a própria Morte como Mestre.
- Mestre confirma uma vez; repetição não aplica novamente perda de Nível.

### Segurança, revisão e recuperação
- Revisão antiga retorna conflito sem sobrescrita.
- Mesmo operationId e mesmo resultado retorna recibo existente.
- Mesmo operationId em operação/recurso diferente é rejeitado.
- Falha entre gravações relacionadas causa rollback integral.
- Notificação ocorre somente após commit.
- Salvamento genérico continua bloqueando campos protegidos.
- Estados legados e fluxo Offline não sofrem regressão.

## 11. Sequência recomendada de implementação

1. Revisar contrato e helpers de domínio existentes, incluindo semântica de Morte pendente e registro/recibo de operações.
2. Definir esquema mínimo de recibos/idempotência após inspecionar migrations e padrões SQLite existentes; sem criar tabela por suposição.
3. Implementar operações dedicadas de Progressão no servidor e cliente LAN em ciclo pequeno.
4. Integrar primeiro inicialização, autorização, contador controlado, solicitação e cancelamento.
5. Integrar declaração de Descanso e aplicação atômica de benefícios.
6. Integrar autodeclaração pendente de Morte; deixar confirmação do Mestre para superfície autorizada do Painel, respeitando a fase de desenvolvimento.
7. Criar testes unitários, de rota, integração, concorrência, isolamento e idempotência.
8. Executar CI e revisar build/TypeScript.
9. Atualizar matriz e checkpoint com evidências. Não declarar validação humana sem teste de Gus.

## 12. Fora de escopo e proibições

- Nenhuma implementação é autorizada por este documento.
- Nenhuma migration, tabela, rota, interface ou mudança de código foi criada nesta etapa.
- Não alterar regras do Arquivo do Jogador ou do Mestre.
- Não configurar método de Progressão por Mesa.
- Não delegar ao servidor decisão narrativa.
- Não liberar o salvamento genérico.
- Não conceder ao Mestre editor universal.
- Não introduzir sincronização automática Offline↔LAN.
- Não tocar na otimização PGlite enquanto seu CI estiver em validação.
- Não mudar branch, fazer merge, publicar ou implantar sem autorização expressa.

## 13. Evidências de referência consultadas

- `docs/checkpoint-lacuna-progressao-lan-2026-11-13.md`
- `docs/checkpoint-progressao-neutra-2026-11-11.md`
- `docs/checkpoint-revisao-progressao-2026-11-11.md`
- `src/progressaoPersistente.ts`
- `src/progressaoCampanha.ts`
- `src/servidorLocal.ts`
- `server/personagens-local.mjs`
- Arquivo do Jogador v1.0: seção “Progressão e Nível” e seção “Salas de Descanso”.
- Arquivo do Mestre v1.0: seção “Consequências e progressão” e seção “Descanso e fabricação”.

**Classificação ao criar este documento:** contrato técnico DOCUMENTADO; operações LAN PENDENTES; testes PENDENTES; validação humana PENDENTE.
