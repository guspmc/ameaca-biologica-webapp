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
