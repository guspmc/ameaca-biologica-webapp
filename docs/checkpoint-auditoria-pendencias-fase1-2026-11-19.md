# Checkpoint — auditoria final das pendências da Fase 1 — 19/11/2026

## Identificação e estado Git
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch confirmada: `feat/offline-first-ficha`.
- HEAD de código/testes validado: `bc355a4c1699ddd7d487450317e74877cdfa99a7`.
- HEAD documental no início do registro: `30c682b7a8a65bce2b42c7595004d1f837611d3d`.
- Não houve troca de branch, alteração de `main`, merge, publicação ou deploy.

## Objetivo
Auditar as pendências remanescentes da Fase 1 contra o Documento Mestre v3.0, reconciliar a implementação atual com os checkpoints e preparar uma bateria humana integrada que reflita as funcionalidades efetivamente entregues.

## Fontes consultadas
- Documento Mestre de Planejamento v3.0, §§ 3.2, 6.1, 7 e 17.
- Arquivo do Jogador v1.0 e Arquivo do Mestre v1.0, conforme checkpoints específicos das regras.
- Checkpoints: preparação para homologação (17/11), entrada/persistência Offline (15/11), recursos/Descanso (19/11), Reanimação (19/11), rolagens/ataques (19/11) e Interface de Combate (19/11).
- `docs/matriz-auditoria-funcional-ficha.md`, continuidade e roteiro humano.
- Código atual da branch e testes associados.

## Auditoria estática por critério

### Fase 0 — Preparação Offline
- **Entrada padrão:** `src/main.tsx` seleciona `FichaOfflineApp` sem parâmetro; LAN exige `?servidor=local`.
- **Supabase:** teste de grafo ativo verifica ausência de dependência Supabase no caminho de runtime; SDK permanece apenas em devDependencies.
- **Persistência:** IndexedDB v3, stores de personagens e vínculos LAN separados; gravação por patch compara geração e chaves alteradas, recusando conflito na mesma chave e permitindo mesclagem de chaves independentes.
- **PWA:** `public/sw.js` mantém cache restrito ao shell e assets estáticos, sem API ou dados pessoais; registro condicionado ao build de produção ou build de teste autorizado.
- **Inicialização Windows:** opção 1 do menu executa o inicializador Offline, seleciona porta local disponível, prepara dependências, verifica TypeScript, gera build de teste e inicia preview local.
- **Estado:** mecanismos IMPLEMENTADOS e TESTADOS AUTOMATICAMENTE. Inicialização real, IndexedDB real, Service Worker e modo avião permanecem PENDENTES de validação humana. A Fase 0 não está homologada.

### Fase 1 — Ficha Offline sem Inventário ativo
- **Criação e edição:** fluxo local de rascunho, Características, Classe/Origem, Atributos/Perícias, Identidade e planejamento de Habilidades.
- **Progressão:** fluxo Offline com autorização externa do grupo, solicitação, Descanso Completo, escolha/aplicação de benefícios e registro de Morte; não decide critérios narrativos.
- **Recursos e Condições:** PV, SA, BI, valores derivados, recursos temporários, Condições e bloqueios específicos com decisão narrativa preservada.
- **Descanso e Reanimação:** modalidades Parcial/Completo, restrições por local, Reanimação por 0 PV/Colapso Viral, dados físicos/virtuais, Cobaia, Medicina e estados terminais sem decidir morte/transformação.
- **Combate e rolagens:** testes, ataques, cálculo de Dano, modos Automático/Misto/Manual, dados Físicos/Virtuais/Mistos, Mirar, Duas Armas e manobras/Reações dentro dos limites documentados.
- **Persistência e recuperação:** IndexedDB, migração, conflito, backup JSON, cópias, substituição e validação de arquivo.
- **Interface de Combate:** barra PV/SA/BI, ajustes rápidos de SA, bloqueio por custo, painel de Manobras e ausência deliberada de controle de turnos na Ficha.

## Defeito encontrado e correção desta missão
- A auditoria do ciclo Mirar encontrou que a calculadora de Ataque Corpo a Corpo recebia `aoConsumirMirar`, mas a calculadora de Ataque à Distância não recebia o callback.
- Consequência: Mirar preparado não podia ser consumido/persistido corretamente no ataque à distância; a rolagem era recusada pela proteção da calculadora.
- Correção em `src/FichaLocal.tsx`: callback de persistência conectado também ao cartão Ataque à Distância.
- Teste em `tests/ataques-calculadora.test.mjs`: agora exige exatamente duas conexões do callback, uma para cada cartão de Ataque.
- Commits: código `47410e288d8ba43eadc3ac97de9c2bc980d7f6e7`; teste `bc355a4c1699ddd7d487450317e74877cdfa99a7`.

## CI — evidência final no HEAD de código/testes
- Verificação da Ficha Offline: run `44554731868` — SUCCESS; job `135667603155`.
- A suíte executou **155/155 arquivos de teste**, sem falhas (`# fail 0`).
- Build/TypeScript/Vite: run `44554732144` — SUCCESS; job `135667617760`.
- Ambos os workflows foram executados no mesmo HEAD de código/testes `bc355a4c1699ddd7d487450317e74877cdfa99a7`.
- O commit posterior `30c682b` alterou somente o roteiro Markdown; os resultados acima permanecem aplicáveis ao código/testado.

## Limitações aceitas e fora do bloqueio da Fase 1
- Inventário ativo — equipar/desequipar, uso/consumo, munição, Rajada, Disparo Cadenciado, recarga, Peças, baterias, combustível, Durabilidade e Baú — pertence à Fase 3. O planejamento inicial de equipamento não equivale a operações ativas.
- Aparar universal depende de estado autoritativo de arma empunhada e Durabilidade; decisão expressa de Gus adiou sua implementação junto ao Inventário ativo. Não criar estado paralelo.
- Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se permanecem consulta/manual nos limites registrados, pois dependem de Iniciativa, alvo, testes resistidos ou contexto da Mesa. Não criar motor de turnos nem aplicar efeitos em terceiros na Ficha.
- A Ficha não decide acerto, dano aplicado, morte, transformação ou duração narrativa; essas decisões permanecem com Jogador/Mestre conforme o cânone.
- Integração LAN, progressão LAN, operações compartilhadas e autorização de servidor não são critérios de saída da Ficha Offline nesta fase.

## Roteiro humano
- `docs/roteiro-humano-ficha-offline-local.md` foi ampliado com seção de verificação funcional da Fase 1: recursos iniciais, barra PV/SA/BI, Manobras, Mirar corpo a corpo/à distância, modos/dados, Condições, Descanso, Reanimação e Progressão.
- Mantidos os testes de entrada, persistência, conflito entre abas, backup/restauração, exclusão e modo offline.
- Inventário ativo, LAN, QR Code, Mesa e segundo dispositivo permanecem explicitamente fora desta bateria.
- O relato humano de 18/11 foi realizado no fluxo LAN e não comprova o funcionamento Offline. A bateria Offline desta branch continua PENDENTE.

## Conclusão e classificação
- Auditoria estática da Fase 1: **CONCLUÍDA neste recorte**.
- Defeito de Mirar à distância: **CORRIGIDO e TESTADO AUTOMATICAMENTE**.
- Build e suíte completa: **TESTADOS AUTOMATICAMENTE** no HEAD indicado.
- Pendências bloqueadoras técnicas conhecidas da Fase 1: **nenhuma identificada após a correção**.
- Fase 0: EM ANDAMENTO — validação humana pendente.
- Fase 1: EM ANDAMENTO — critérios técnicos auditados; validação humana pendente.
- Fase 2: PENDENTE — aguarda Gus executar a bateria integrada e registrar APROVADO/FALHOU/NÃO EXECUTADO.
- Fases 3–9: não iniciar antes da aprovação expressa da Fase 2.

## Próxima ação exata
Gus executa o roteiro atualizado `docs/roteiro-humano-ficha-offline-local.md` usando o inicializador **Ficha Offline** (não LAN), registra cada resultado e compartilha o relatório. Corrigir somente falhas observadas e retestar regressões pertinentes. Não iniciar Inventário ativo antes da aprovação humana expressa.
