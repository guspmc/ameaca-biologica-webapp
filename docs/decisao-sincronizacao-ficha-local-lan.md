# Contrato de persistência e sincronização da Ficha — Local > LAN

**Decisão confirmada por Gus em 10/11/2026.** Este documento registra a regra funcional aprovada para a Ficha do Jogador. Ele prevalece sobre propostas anteriores de reconciliação que façam a cópia LAN vencer por revisão, conflito ou atualização mais recente do servidor. Não aprova automaticamente a minuta do Planejamento v2.6 em seu conjunto.

## Regra principal: a Ficha é a fonte de verdade

1. Ao abrir a Ficha, a aplicação verifica se o servidor da Mesa na LAN está acessível.
2. **LAN disponível:** cada salvamento válido é persistido no dispositivo e no servidor LAN. A confirmação local e a confirmação do servidor devem ser apresentadas separadamente; não indicar sincronização concluída antes da resposta persistida do servidor.
3. **LAN indisponível:** a Ficha continua funcionando e salva no próprio dispositivo. O jogador pode exportar um backup quando quiser; exportar é opcional e não é pré-requisito para sincronização futura.
4. **Reconexão:** ao detectar que a LAN voltou a ficar disponível, a aplicação sincroniza automaticamente a última versão válida salva na Ficha para o servidor.
5. **Autoridade:** para os dados da Ficha do próprio jogador, prevalece a última versão válida salva na Ficha/dispositivo. A cópia LAN é atualizada a partir dela. Uma revisão maior, divergência ou conteúdo antigo no servidor não pode, por si só, rejeitar ou substituir a versão válida da Ficha.
6. A sincronização não pode promover uma gravação incompleta, um estado ainda não confirmado localmente ou uma resposta atrasada de contexto/personagem anterior. Deve preservar integridade, identificação da personagem, idempotência e recuperação após resposta ambígua.

## Escopo e limites

- Este contrato trata dos dados da Ficha do próprio jogador.
- Não autoriza mutações offline de estado compartilhado da Mesa.
- **Baú, transferências entre jogadores e demais operações compartilhadas continuam restritos à LAN**, conforme decisões já registradas.
- Exportação/importação de backup permanece disponível como recurso opcional de portabilidade e recuperação; não substitui a sincronização automática ao reconectar.
- O contrato não concede ao Mestre editor universal nem acesso à ficha completa do jogador.
- Não reintroduzir Supabase como backend-alvo. A arquitetura em desenvolvimento é Offline > LAN, com persistência local e servidor LAN.

## Estados de interface

A interface deve distinguir, no mínimo:
- **Salvo neste dispositivo:** transação local confirmada.
- **Sincronizando com a LAN:** envio da última versão local válida em andamento.
- **Sincronizado com a LAN:** servidor confirmou a persistência daquela versão.
- **LAN indisponível:** a Ficha permanece utilizável e salva localmente.
- **Falha de sincronização:** a versão local permanece preservada; a interface não deve sugerir perda ou substituição por dados do servidor.
- **Alterações ainda não salvas:** estado de edição da interface, distinto de salvamento local pendente de sincronização.

Não exibir um único rótulo genérico “Salvo” quando apenas uma das duas persistências foi confirmada.

## Requisitos técnicos para implementação

- O salvamento local deve ser concluído antes de depender de qualquer chamada LAN.
- A fila de gravação deve serializar alterações e impedir que uma resposta antiga atualize o estado visual de uma ficha/personagem que já não está selecionada.
- A sincronização deve enviar um snapshot íntegro e identificado da última versão local válida, com chave de operação/idempotência ou mecanismo equivalente para recuperação de resposta ambígua.
- O contrato do servidor precisa aceitar a atualização autoritativa da Ficha local mesmo quando a revisão armazenada na LAN divergir. Revisão continua útil para integridade, rastreabilidade e ordenação de operações, mas não para dar autoridade automática à cópia LAN.
- Uma falha de rede não pode apagar nem reverter o snapshot local.
- Reconexão deve disparar sincronização automática, sem exigir exportação, importação, F5 ou intervenção manual do jogador.
- A aplicação deve evitar ciclos de eco: uma atualização originada pela própria sincronização não pode ser interpretada como uma edição LAN independente que substitua a fonte local.
- Autorização por conta, Mesa e personagem continua obrigatória no servidor. A regra de autoridade da Ficha não permite sobrescrever personagens de outro jogador.

## Testes obrigatórios antes de declarar implementado

1. Abrir a Ficha com LAN disponível e confirmar persistência local e no servidor.
2. Abrir sem LAN, editar e confirmar que a versão local persiste após recarga.
3. Reconectar e confirmar envio automático da última versão local para LAN.
4. Criar divergência deliberada entre a cópia local válida e uma cópia LAN antiga/de revisão maior; confirmar que a Ficha vence.
5. Interromper a rede durante envio e retomar sem duplicar operações nem perder a versão local.
6. Fechar/reabrir o navegador e confirmar recuperação e sincronização.
7. Manter duas abas/sessões abertas e comprovar que resposta atrasada ou contexto antigo não substitui a personagem atualmente aberta.
8. Testar duas contas distintas e confirmar que um jogador não consegue sobrescrever a Ficha de outro.
9. Confirmar que Baú e transferências continuam bloqueados offline.
10. Confirmar exportação/importação de backup sem torná-las requisito da sincronização.

## Estado atual observado em 10/11/2026

**DECIDIDO:** regra Local > LAN acima, confirmada pelo responsável.

**IMPLEMENTADO (parcial, apenas local):** `src/FichaOfflineApp.tsx` grava alterações por `salvarPatchPersonagem` e apresenta mensagens de persistência no dispositivo. A aplicação tem exportação/importação JSON.

**AINDA NÃO IMPLEMENTADO:** verificação de disponibilidade LAN ao abrir a Ficha; persistência dupla; sincronização automática ao reconectar; contrato servidor para receber a versão autoritativa local; estados de sincronização LAN na interface.

**NÃO TESTADO:** qualquer fluxo integrado Ficha ↔ servidor LAN, pois esse ciclo ainda não está conectado.

A minuta do Planejamento v2.6 contém formulações anteriores sobre reconciliação/conflito que não refletem esta decisão. Como a v2.6 continua minuta não validada, manter este contrato como registro explícito da decisão posterior, sem editar ou declarar aprovada a minuta inteira.


## Acesso à cópia local quando a LAN estiver indisponível — decisão confirmada em 10/11/2026

Gus aprovou que a experiência de jogo continue normalmente quando o servidor LAN cair:

1. No mesmo dispositivo e navegador em que a conta/Mesa já foram utilizadas, a aplicação poderá abrir a última cópia local válida da Ficha vinculada àquela conta e Mesa.
2. A Ficha permanece utilizável e os salvamentos continuam locais enquanto não houver conexão.
3. Não armazenar senha, token de sessão ou outro segredo para viabilizar esse acesso offline.
4. A cópia local e o contexto anteriormente utilizado permitem localizar a Ficha offline, mas não equivalem a uma sessão autenticada no servidor.
5. Quando a conexão retornar, a aplicação deve restabelecer/validar a autenticação no servidor antes de sincronizar. Só então envia a última versão local válida, que será validada e persistida pelo servidor.
6. Se não for possível revalidar a sessão ou a autorização da conta/Mesa/personagem, a cópia local permanece preservada; a sincronização fica pendente e nenhuma operação compartilhada é liberada.

**Precisão de implementação:** o servidor não consegue ler diretamente o IndexedDB do navegador. O cliente envia a versão local mais recente ao servidor após a reconexão e reautenticação. O servidor valida autorização, integridade e escopo e então grava essa versão. A regra Local > LAN continua determinando a precedência dos dados da Ficha, sem dispensar a autorização do servidor.
