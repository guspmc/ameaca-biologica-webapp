# Checkpoint — preparação para homologação da Ficha Offline — 17/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Branch: `feat/offline-first-ficha`.
- HEAD documental atual: `ea7a5d2f6e0bbcb3e4d9412f9bd2887b610c0a63`.
- Último código funcional submetido à CI: `a98bdc324df32d5e23708a2c8c88f4b471fde92e`.
- Alterações posteriores a esse código: somente documentação; nenhum arquivo de produção/teste foi modificado depois da CI aprovada.

## Objetivo deste ciclo
Acelerar a entrega jogável, mantendo a ordem de fases e priorizando a Ficha Offline confiável. Não antecipar Inventário ativo, Painel do Mestre ou Laboratório.

## Evidências confirmadas
- Build de produção: **TESTADO AUTOMATICAMENTE / APROVADO**, workflow `Validar compilação do WebApp`, run `44133790936`, job `134217691717`, no código `a98bdc3`.
- TypeScript da interface: **TESTADO AUTOMATICAMENTE / APROVADO**, `pnpm exec tsc --noEmit -p tsconfig.ui.json`, no mesmo workflow.
- Suíte automatizada: **TESTADO AUTOMATICAMENTE / APROVADO**, workflow `Verificação da ficha offline`, run `44133791005`, job `134217692288`; 154 arquivos `tests/*.test.mjs` concluídos, sem falhas nem timeout.
- O build mantém aviso não bloqueante de chunk JavaScript acima de 500 kB e avisos de depreciação do runner. Sem ação nesta etapa.
- Entradas ativas: `src/main.tsx` seleciona `FichaOfflineApp` por padrão e `ConexaoServidorLocal` somente com `?servidor=local`. O teste `entradas-offline-sem-supabase.test.mjs` percorre o grafo das entradas e garante ausência de import Supabase; SDK permanece apenas em devDependencies.
- Persistência Offline: IndexedDB v3, store de personagens separado de vínculos LAN; leitura, gravação, patch, migração e concorrência possuem testes automatizados.
- Service Worker: registra somente no build de produção ou no build de teste com `VITE_PWA_TESTE=true`; cache restrito ao shell/estáticos do mesmo escopo, sem API ou dados pessoais. Manifest standalone e escopo relativo.
- Inicializador Windows: `Menu_Testes.bat` → opção 1 chama `Iniciar_Ficha_Offline.bat`, verifica ambiente/porta, prepara dependências com lockfile congelado, valida TypeScript, cria build de teste e inicia preview local em `127.0.0.1:4176`.

## Auditoria funcional — estado observado
- Criação/rascunho Offline: fluxo de criação local e edição contínua identificados; Características, Atributos/Perícias, Identidade e planejamento de Habilidades possuem persistência local.
- Revisão de criação lê apenas dados salvos e não altera/ativa a personagem.
- Ativação com materialização de inventário inicial é um fluxo LAN separado, protegido por revisão/recibo/idempotência; não confundir com a Ficha Offline local.
- Recursos PV/SA/BI, Condições, Descanso, Reanimação, Progressão Offline, testes/roladores e economia de ações possuem módulos e testes identificados. Isso ainda não substitui validação de navegador.
- Quatro Manobras continuam sem controle operacional: Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se. A decisão é manter consulta/manual até haver fluxo seguro; não implementar motor de turnos nem aplicar efeitos de alvo automaticamente.
- Inventário ativo continua fora da Fase 1 por decisão do planejamento; somente criação/rascunho e consulta existentes não significam que uso, equipamento, munição, recarga, consumo ou Baú estejam prontos.

## Fases
- Fase 0 — Preparação Offline: **EM ANDAMENTO**. A auditoria estática e CI são favoráveis; falta validar inicialização real, IndexedDB real, Service Worker e comportamento offline em navegador.
- Fase 1 — Ficha Offline: **EM ANDAMENTO**. Cobertura automatizada aprovada; falta concluir auditoria funcional de todos os requisitos e decidir/implementar apenas lacunas necessárias para uma sessão jogável.
- Fase 2 — Testes humanos: **PENDENTE**. Não declarar executada. O roteiro é `docs/roteiro-humano-ficha-offline-local.md`.
- Fases 3–9: **NÃO INICIADAS**.

## Escopo de prazo
Objetivo operacional informado por Gus em 17/11/2026: ter uma versão jogável para usar no próximo mês. Prioridade:
1. Fechar auditoria dos recursos indispensáveis à sessão (criação/edição, rolagens, combate essencial, recursos, condições, descanso, reanimação e progressão).
2. Corrigir somente defeitos ou lacunas que bloqueiem esses fluxos.
3. Fechar Fase 0 com evidência de teste real em navegador.
4. Fechar Fase 1 e preparar/acompanhar a bateria humana documentada.
5. Não antecipar Inventário ativo, Painel, Laboratório, integração LAN ampliada, temas ou redesign.

## Arquivos alterados neste ciclo
- `docs/matriz-auditoria-funcional-ficha.md`: resumo da validação alinhado à CI aprovada.
- `docs/linha-de-trabalho-e-continuidade-2026-11-12.md`: continuidade atualizada no ciclo anterior.
- Este checkpoint.

## Testes executados neste ciclo
- Nenhum teste novo executado após os commits documentais. A CI citada testa o código funcional `a98bdc3`; os commits documentais não alteraram código.

## Riscos e pendências
- Nenhum teste humano informado.
- Testes automatizados estruturais não exercitam navegador real, IndexedDB real, instalação do Service Worker nem modo avião.
- O prazo depende de ciclos curtos e de Gus executar os testes reais assim que a Fase 1 estiver pronta; não é correto prometer homologação antes disso.

## Próxima ação exata
Continuar a auditoria dos fluxos indispensáveis de combate/rolagem e dos estados de recursos/condições/descanso/reanimação/progressão, cruzando a implementação com o Arquivo do Jogador v1.0. Registrar apenas lacunas reais, implementar a menor correção segura quando necessária e executar CI novamente. Depois da conclusão da Fase 1, Gus executará o roteiro humano para fechar a Fase 2.


## Atualização de checkpoint — decisão de bloqueios e countdown — 17/11/2026

- Branch: `feat/offline-first-ficha`.
- HEAD de código consultado: `244308fc30577d811fdbc00e98757a55ade7d31e` (antes desta atualização documental).
- Decisão de Gus: implementar bloqueios operacionais por Condições, mantendo o Jogador como único responsável por adicionar/encerrar/remover Condições na própria Ficha; o Mestre não edita a Ficha.
- Regras de bloqueio precisam respeitar categorias de recursos e temporalidade. Em especial, Surpreendido restringe Movimento/Ações no primeiro turno e Reações/gasto de SA enquanto durar. O painel não controla Iniciativa do Encontro; não inferir o primeiro turno apenas pela presença da instância.
- Arquivos de código/teste alterados neste ciclo: nenhum.
- Testes/build/CI executados neste ciclo: nenhum. A última CI verde permanece vinculada ao código `a98bdc3`; não atribuir essa aprovação ao HEAD atual.
- Documentação atualizada: matriz de auditoria e registro de continuidade receberam a decisão e o countdown; este checkpoint registra o mesmo estado.

### Countdown até a bateria humana
1. Implementar bloqueios por categoria, respeitando a autonomia do Jogador e os limites da Ficha.
2. Testar combinações, temporalidade de Surpreendido e remoção de Condições.
3. Continuar auditoria funcional paralela e corrigir apenas divergências comprovadas.
4. Executar CI completa, TypeScript e build após as alterações.
5. Atualizar roteiro/matriz/continuidade/checkpoint e preparar instruções finais.

Com os cinco itens técnicos concluídos, Gus executará a bateria real no navegador: inicialização, persistência IndexedDB, recarga, concorrência entre abas, backup/restauração, Service Worker e modo offline. A validação humana permanece PENDENTE.

### Próxima ação exata
Implementar primeiro a função pura de avaliação de bloqueios por Condição/categoria, depois integrar os controles da calculadora e do painel sem alterar a administração de Condições. Antes de bloquear Movimento/Ações por Surpreendido, verificar se existe sinal de primeiro turno confiável; caso contrário, bloquear apenas Reações e gasto de SA enquanto a Condição estiver ativa e manter o lembrete temporal explícito. Adicionar testes antes de executar CI.

## Checkpoint — implementação inicial dos bloqueios por Condições — 17/11/2026

- Branch: `feat/offline-first-ficha`.
- HEAD antes deste checkpoint documental: `03503bf0d22fe7cad5e9cec53a98d440180ebd8d`.
- Arquivos de código alterados: `src/condicoesCalculadora.ts`, `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`.
- Testes alterados: `tests/condicoes-calculadora.test.mjs`.
- Implementação: avaliador puro com bloqueios separados para Ação, Movimento, Reação, gasto de SA e Ataque; integração em recursos/manobras e calculadora; Ação Bônus/Interação Gratuita mantidas distintas.
- Surpreendido: Reação e gasto de SA bloqueados enquanto ativo; Ação/Movimento permanecem sem bloqueio automático porque não existe sinal confiável de primeiro turno no painel. Lembrete temporal mantido.
- Auditoria paralela: `src/CondicoesFichaLocal.tsx` mantém registro/encerramento pelo Jogador via salvamento confirmado; condições derivadas não podem ser editadas manualmente; nenhum controle de Mestre foi introduzido.
- Testes específicos adicionados para categorias, combinações, Surpreendido, Movimento 0 e autonomia do Jogador.
- CI do HEAD mais recente: workflow de testes e build foram disparados; estavam em andamento no momento do checkpoint. Resultado ainda NÃO confirmado.
- Validação humana: não realizada. Fase 0 continua aguardando a bateria real de navegador.

### Countdown
1. Bloqueios por categoria: IMPLEMENTADO, aguardando CI.
2. Testes automatizados: IMPLEMENTADOS, aguardando CI.
3. Auditoria paralela: EM ANDAMENTO; autonomia das Condições conferida.
4. CI/TypeScript/build: EM ANDAMENTO.
5. Roteiro e documentação final: PARCIAL; depende do resultado de CI.

### Próxima ação exata
Aguardar/consultar os workflows associados ao HEAD `03503bf`. Se falharem, corrigir a regressão mais localizada e repetir CI. Se aprovarem, revisar a cobertura de cada controle que consome Ação, Movimento, Reação ou SA, concluir o registro documental e preparar o pacote de testes humanos. Não declarar validação humana nem reduzir o countdown antes das evidências.

## Checkpoint incremental — correção de Usar um Objeto — 17/11/2026

- Branch: `feat/offline-first-ficha`.
- HEAD após código/teste: `88c347539e62bfe8665d88264e93cd9ff7a2d029` (antes desta atualização documental).
- Auditoria encontrou omissão: Usar um Objeto consome Ação, mas não consultava bloqueio por Condições. Corrigido em `src/PainelAcoesLocal.tsx` (commit `f5f13447e1e3e2de4f7d9927363479115602452e`).
- Teste de regressão acrescentado em `tests/condicoes-calculadora.test.mjs` (commit `88c347539e62bfe8665d88264e93cd9ff7a2d029`).
- CI: testes e build do commit `bbb7a6d` concluíram SUCCESS. Workflows da correção `f5f1344` ainda estavam IN_PROGRESS; o teste adicional `88c3475` ainda não tinha execução confirmada. Não atribuir os resultados antigos ao HEAD atual.
- Validação humana: PENDENTE.

### Próxima ação exata
Consultar workflows associados ao HEAD atualizado. Se aprovados, continuar auditoria de todos os controles que consomem Ação/Movimento/Reação/SA, mantendo um registro de cada divergência corrigida. Não reduzir o countdown técnico até que a cobertura e os critérios de CI estejam comprovados.

## Checkpoint incremental — cobertura de combinações e encerramento de Condições — 17/11/2026

- Branch: `feat/offline-first-ficha`.
- Commit de testes: `16aaed95aa691750459f8946aa823034c9879963`.
- Arquivo alterado: `tests/condicoes-calculadora.test.mjs`.
- Novas verificações: condições simultâneas acumulam bloqueios; remover Atordoado preservando Surpreendido libera Ação/Movimento/Ataque mas mantém Reação/gasto de SA; encerrar todas libera todas as categorias.
- Workflow de verificação da Ficha associado ao commit foi enfileirado; resultado ainda não confirmado. Não declarar cobertura aprovada antes da CI.
- Build do checkpoint anterior `204f7d4` concluiu SUCCESS; suíte desse checkpoint ainda estava em andamento. Validação humana PENDENTE.

### Próxima ação exata
Acompanhar o workflow `44190904552` do commit `16aaed9`. Se passar, considerar a cobertura automatizada de combinações/remoção confirmada e continuar auditoria de controles restantes. Se falhar, corrigir apenas a causa demonstrada e repetir CI.

## Checkpoint incremental — bloqueio de bônus que exige SA durante Surpreendido — 17/11/2026

- Branch: `feat/offline-first-ficha`.
- Código: `e23d2a0d0320f10c66daf413f46b41d24bc7efd6`, arquivo `src/CalculadoraTesteLocal.tsx`.
- Teste: `adf9adc644747332e834474b9d7897945c42ce43`, arquivo `tests/condicoes-calculadora.test.mjs`.
- Causa: o Painel bloqueava gastar SA sob Surpreendido, mas a Calculadora ainda permitia confirmar o gasto prévio de 1 SA para os bônus de Origem Atleta/Investigador.
- Correção: a confirmação agora fica desabilitada também por `bloqueiosCondicao.gastarSA`; nenhuma SA é consumida ou inferida pela Calculadora.
- CI deste novo código/teste ainda pendente; não declarar validado até workflows verdes.
- Último checkpoint completo anterior: `c6164fd540aa897c93e10c4c68cbf11070c3213e`, com 154 arquivos de teste e build aprovados.

### Próxima ação exata
Acompanhar CI do commit `adf9adc`. Se passar, continuar auditoria de condições que exigem SA e de ações/reacões; se falhar, corrigir apenas a causa comprovada. Validação humana permanece pendente.



## Atualização de evidências — CI verde no HEAD — 18/11/2026

- Branch: `feat/offline-first-ficha`.
- HEAD validado: `9c4951c5f47c8a65a8a1d81eddcd4d898e1cf4fc`.
- Workflow **Verificação da ficha offline**: run `44214943091`, conclusão SUCCESS.
- Workflow **Validar compilação do WebApp**: run `44214943645`, conclusão SUCCESS.
- Os dois workflows foram executados sobre o mesmo HEAD acima. A correção de bloqueio do bônus de Origem sob Surpreendido e seus testes estruturais estão, portanto, cobertos por CI verde neste estado do código.
- **Countdown:** **4/5 pendências**. Nesta rodada foi encerrada a pendência de CI (testes, TypeScript e build no HEAD atualizado). As demais pendências permanecem abertas até serem concluídas com evidência; a implementação e os testes automatizados de bloqueios passaram pela CI.
- **Validação humana:** PENDENTE. CI verde não substitui os testes reais de navegador por Gus.
- Próxima ação: continuar auditoria funcional independente dos controles de gasto de SA, reações e manobras; registrar somente divergências comprovadas. Depois fechar o roteiro e as instruções da bateria humana.


## Auditoria funcional incremental — Ações, Movimento, Reações e SA — 18/11/2026

- Branch: `feat/offline-first-ficha`; HEAD de referência da inspeção: `58fe7a74da6dc3467b7115b90922671b2dc12ab3`.
- Revisados `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`, `src/condicoesCalculadora.ts`, `src/reacoesCombate.ts`, `src/economiaAcoes.ts`, `src/estadoTurnoCombate.ts`, `src/manobrasOperacionais.ts` e `tests/condicoes-calculadora.test.mjs`.
- Reações verificadas: Aparar com punhos (Socador de Pedras), Esquiva, Contra-Ataque, Na Minha Mira, Não Vai Escapar, resposta do Mercenário, Ataque de Oportunidade e Finalização Dupla. Os controles verificam bloqueio de Reação; caminhos que também gastam SA verificam o bloqueio de gasto de SA e limites de custo.
- Ações/Movimento verificados: Ajudar, Ação Completa, Interação Gratuita, Desengajar, Usar um Objeto, Disparada, Ataque, Combate com Duas Armas e recursos normais/comprados. Os controles correspondentes consultam as categorias de bloqueio aplicáveis.
- Manobras com SA verificadas: Mirar, Fuga, Finalizar, Luta Livre e gastos genéricos de 1/3 SA. Luta Livre dispensa o custo de 3 SA quando a Manobra derrotou o alvo; essa exceção foi preservada e não deve ser bloqueada como gasto de SA nesse ramo.
- Resultado: nenhuma divergência operacional adicional comprovada nesta amostra; nenhum código/teste foi alterado neste incremento. A revisão é estática e não substitui testes de interface nem a bateria humana.
- **Countdown:** a auditoria funcional paralela desta frente foi concluída. Restam **3 pendências técnicas** até a bateria humana. A validação humana permanece PENDENTE.
- Próxima ação: concluir a consolidação do roteiro humano de navegador e conferir a matriz de critérios da Fase 0/1; não iniciar fases posteriores antes do checkpoint e dos testes humanos exigidos.


## Consolidação do roteiro humano — 18/11/2026

- Conferidos o fluxo real em `src/FichaOfflineApp.tsx` e `src/FichaLocal.tsx`, os editores de Características, Atributos/Perícias, Identificação e Inventário, além de `Menu_Testes.bat`, `Iniciar_Ficha_Offline.bat`, `Preparar_Dependencias.bat` e `Verificar_Ambiente.bat`.
- O roteiro corresponde à navegação contínua atual: Características, Atributos e Perícias, Combate e Inventário. A Identificação é um editor próprio na ficha; os salvamentos manuais exibem confirmação local. O fluxo de fechar com alterações não salvas é mediado pela aplicação offline e pede confirmação de descarte.
- Correção documental: esclarecido que a opção 1 do menu abre o inicializador e, depois, uma janela separada intitulada “Ameaca Biologica - Ficha Offline (4176)”, que mantém o processo `vite preview`. É essa janela que deve permanecer aberta e receber Ctrl+C ao fim. Também documentada a versão declarada de pnpm (11.25.0), conferida em `package.json`.
- Roteiro atualizado em `docs/roteiro-humano-ficha-offline-local.md`, commit `8f6d8d38780be6ad8c9640de981bda5620637cb1`. Nenhum código ou teste foi alterado.
- CI de referência concluída com sucesso nos runs `44226668841` (verificação da ficha offline, incluindo build) e `44226668798` (TypeScript/Vite), ambos para o estado documental anterior a este ajuste. O commit atual altera somente Markdown; não há execução de CI reportada para ele.
- **Validação humana:** PENDENTE. Nenhum navegador foi iniciado nesta rodada; IndexedDB, Service Worker, concorrência entre abas, backup e modo offline ainda dependem da execução por Gus.
- **Countdown:** roteiro reconciliado e instrução de inicialização esclarecida; permanecem **2 pendências técnicas** antes da bateria humana. Não considerar a Fase 0/1 homologada.
- Próxima ação: conferir formalmente a matriz de critérios das Fases 0 e 1 contra o Documento Mestre e os checkpoints mais recentes; resolver qualquer critério técnico ainda sem evidência antes de liberar a bateria humana.


## Auditoria cruzada dos critérios de saída — Fases 0 e 1 — 18/11/2026

- Documento normativo consultado: Documento Mestre de Planejamento v3.0, §§ 3.2, 3.5, 6.1, 7, 17 e 19. Branch confirmada: `feat/offline-first-ficha`; HEAD antes desta atualização documental: `c995d276cb2d4666285015de73e1f9e4666242a1` (matriz já atualizada).
- Fase 0: confirmados no código o caminho Offline padrão e LAN explícita (`src/main.tsx`), ausência de Supabase no grafo ativo (teste dedicado), IndexedDB v3 com stores separados e testes de operações/migração/concorrência, Service Worker limitado ao shell/estáticos e testes que excluem API LAN/métodos de escrita, além do inicializador Windows com preview local. **Continua pendente** a execução real no navegador para inicialização, IndexedDB, Service Worker e recarga offline. Fase 0 permanece EM ANDAMENTO.
- Fase 1: cruzados criação/Identidade/Características/Classe/Origem/Atributos/Perícias, Habilidades/Progressão, PV/SA/BI/Defesa, Condições, Descanso, Reanimação, Ataques/Testes/Dano, Mirar/Duas Armas, Reações, modos de funcionamento, tipos de dados, roladores e backup. Confirmado que calculadoras de Perícia/Atributo e Ataque, incluindo cálculo/rolagem de Dano, são montadas apenas em Automático; dados Físicos/Virtuais/Mistos seguem a preferência e exigem ação expressa. A matriz detalha arquivos e testes por critério.
- Limites deliberados e registrados: Inventário ativo é Fase 3; Aparar universal aguarda equipamento/Durabilidade do Inventário; Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se permanecem consulta/manual conforme limites de Iniciativa e contexto da Mesa. Não são motivo para antecipar Inventário nem criar motor de turnos.
- Resultado da auditoria: nenhum novo bloqueador funcional identificado dentro do escopo aprovado da Fase 1. Fase 1 permanece EM ANDAMENTO até a sequência de saída da Fase 0 e a bateria humana; não se declara homologação.
- CI no HEAD de código/documentos anterior à consolidação da matriz (`3c12d6808cf4a4e4d8e58db34e2a52f3feefcf97`): `Verificação da ficha offline`, run `44228378857`, SUCCESS; `Validar compilação do WebApp`, run `44228378922`, SUCCESS. A auditoria não alterou código nem testes.
- Arquivo atualizado: `docs/matriz-auditoria-funcional-ficha.md`, commit `c995d276cb2d4666285015de73e1f9e4666242a1`.
- **Countdown:** auditoria cruzada concluída; resta **1 pendência técnica**: confirmar CI no HEAD documental consolidado e executar a checagem final de prontidão do pacote humano. Depois disso, liberar a bateria para Gus. A validação humana continua PENDENTE.
- Próxima ação exata: aguardar os workflows do HEAD documental final, confirmar sucesso de testes/TypeScript/build e então fornecer o roteiro para execução humana, sem avançar para Inventário ativo ou fases posteriores.


## Liberação da bateria humana — 18/11/2026

- Branch de trabalho: `feat/offline-first-ficha`. Último commit conhecido antes deste registro: `16be0c2fce50a94a5381136037314116d54d3753`.
- Verificação da CI: os dois workflows do commit de código `3c12d6808cf4a4e4d8e58db34e2a52f3feefcf97` concluíram com sucesso: Verificação da Ficha Offline (run `44228378857`) e TypeScript/Vite (run `44228378922`). Jobs e etapas foram consultados e todos estão concluídos com `success`.
- Comparação entre `3c12d68` e `16be0c2`: três commits à frente, todos limitados a alterações em Markdown nos documentos de checkpoint, continuidade e matriz; nenhum arquivo de código, teste, configuração ou workflow foi alterado. Portanto, os resultados de CI permanecem aplicáveis ao conteúdo executável da branch. Não afirmar que houve execução de CI no commit documental `16be0c2`.
- Prontidão do pacote humano: roteiro existe e foi reconciliado com a navegação contínua da Ficha, os editores, o fluxo de salvamento/descartar alterações, os scripts Windows e a porta local `4176`. O pacote instrui uso de dados fictícios e separa explicitamente os testes Offline dos recursos LAN.
- Verificação de ferramenta: `package.json` declara `pnpm@11.25.0`; o roteiro usa instalação com lockfile congelado, TypeScript, build de teste e preview local.
- **Countdown técnico: 0.** Critérios de auditoria e prontidão documental concluídos; bateria humana liberada.
- **Validação humana: PENDENTE.** Não declarar Fase 0 ou Fase 1 homologadas até Gus executar os passos e registrar os resultados. Fase 2 inicia somente com essa execução; nenhum avanço para Inventário ativo ou fases posteriores.
- Próxima ação exata: Gus executar `docs/roteiro-humano-ficha-offline-local.md` em Windows/navegador, registrar aprovado/falhou/não executado e compartilhar os resultados. Se a aplicação não abrir, parar e registrar a mensagem sem improvisar correções.
