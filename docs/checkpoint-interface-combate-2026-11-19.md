# Checkpoint — Interface de Combate e recursos rápidos — 19/11/2026

## Estado do repositório
- Repositório: `guspmc/ameaca-biologica-webapp`.
- Branch confirmada: `feat/offline-first-ficha`.
- HEAD de código/testes: `070be137dafdbc61590376cef6816733a3b9a4a3`.
- Não houve troca de branch, merge, publicação ou deploy. `main` não foi alterada.

## Objetivo do ciclo
Separar os ajustes manuais de SA das manobras de Combate, fixar a barra compacta PV/SA/BI no topo da Ficha, bloquear manobras cujo custo exceda o SA atual ou o SA máximo e consolidar a interface sem controle de turnos na Ficha.

## Fontes canônicas consultadas
- Arquivo do Jogador v1.0, pp. 77–81.
- SA e Esforço: 1 SA compra Movimento, Ação Bônus ou Reação adicional; 2 SA compram Ação adicional; custos universais listados: Mirar 1 SA, Fuga 1 SA, Contra-Ataque 1 SA + Reação, Finalizar 3 SA e Finalização Dupla 3 SA + Reação.
- Esquivar não tem custo universal de SA no texto consultado: usa a janela de Aparar e depende de Habilidade ou regra que a libere (p. 80). Por isso não foi incluído como botão de gasto de SA.
- A janela canônica de 3 SA permanece regra do jogo. A Ficha não a fiscaliza porque, por decisão expressa do usuário, não controla turnos; o Painel do Mestre acompanha a Iniciativa/turnos e os jogadores podem corrigir o saldo pelos controles rápidos.

## Implementações
- Barra compacta PV/SA/BI posicionada no topo do corpo rolável, com indicadores e valores.
- Botões `−1` e `+1` SA no cartão SA; limites de 0 e SA máximo; feedback de salvamento; proteção contra cliques concorrentes.
- Toque nos indicadores PV/SA/BI abre a seção “Administrar recursos e Integridade Física”.
- Administração de Recursos posicionada antes de Condições.
- Progressão e Registro de Decisões da Mesa reposicionados depois da seção Inventário.
- Painel de Manobras em Combate, sem controles genéricos de SA ou gerenciamento de turnos.
- Botões de gasto bloqueados quando `saAtual < custo` ou `saMaximo < custo`.
- Manobras universais de SA apresentadas: Esforço (1/2 SA conforme recurso adicional), Fuga (1 SA), Contra-Ataque (1 SA), Finalizar (3 SA), Finalização Dupla (3 SA) e Mirar (1 SA).
- Mirar: após confirmar o ataque, a Ficha primeiro persiste a remoção do estado preparado; somente com confirmação do salvamento registra a rolagem. O bônus +2 e a região escolhida permanecem aplicados ao resultado já confirmado. Se a persistência falhar, a rolagem não é registrada.
- Mantidos cartões separados de Ataque Corpo a Corpo e Ataque à Distância; Habilidades/equipamento e Bio-Infecção recolhíveis.
- Texto de Combate atualizado para não sugerir que a Ficha controla recursos de ação ou turnos.

## Limites e dependências preservados
- Seleção de armas equipadas, Aparar com validação de Durabilidade, desgaste, munição, Rajada, Disparo Cadenciado e Recarga continuam dependentes do Inventário ativo e ficam para a Fase 3. Nenhum estado paralelo de equipamento foi criado.
- Contra-Ataque registra o gasto de 1 SA; gatilho, Reação e validade continuam resolvidos com a Mesa, sem contador de turnos na Ficha.
- Esquivar não é gasto universal de SA e depende de Habilidade/regra liberadora; não foi convertido em botão genérico que pudesse ignorar esse requisito.
- A Ficha não decide acerto/erro, não compara Ataque com Defesa e não aplica Dano aos PV.

## Arquivos alterados neste ciclo
- Código: `src/FichaLocal.tsx`, `src/PainelAcoesLocal.tsx`, `src/CalculadoraTesteLocal.tsx`, `src/RecursosFichaLocal.tsx`, `src/styles.css`.
- Testes: `tests/interface-combate-layout.test.mjs`, `tests/ajudar-ficha.test.mjs`, `tests/ataque-oportunidade-ficha.test.mjs`, `tests/ataques-calculadora.test.mjs`, `tests/condicoes-calculadora.test.mjs`, `tests/origem-salvamento-ficha.test.mjs` e testes relacionados à antiga interface de turnos.

## Verificações
- Build TypeScript/Vite no HEAD `070be137dafdbc61590376cef6816733a3b9a4a3`: workflow `44544876587` — SUCCESS.
- Suíte completa de testes offline no mesmo HEAD: workflow `44544876672` — IN_PROGRESS no momento deste checkpoint.
- Runs anteriores de testes falharam por asserts de interface desatualizados após a separação de SA e pelo teste antigo de Mirar; esses asserts foram atualizados. Não declarar a suíte aprovada até consultar o resultado de `44544876672` ou de um run posterior no HEAD atual.
- Validação humana: PENDENTE. Não foi solicitada bateria humana intermediária; o protocolo determina uma única bateria integrada após a conclusão da Fase 1, imediatamente antes do Inventário ativo.

## Estado funcional
- Barra PV/SA/BI e ajustes rápidos: IMPLEMENTADOS; TESTE AUTOMÁTICO PENDENTE.
- Bloqueio por SA atual e SA máximo: IMPLEMENTADO; TESTE AUTOMÁTICO PENDENTE.
- Consumo persistido de Mirar: IMPLEMENTADO; TESTE AUTOMÁTICO PENDENTE.
- Estrutura visual de Combate e recolhíveis: IMPLEMENTADA; TESTE AUTOMÁTICO PENDENTE.
- Integrações dependentes do Inventário: PENDENTES para Fase 3.
- Validação humana de toda a Ficha Offline: PENDENTE.

## Próxima ação exata
1. Consultar a conclusão do workflow `44544876672` no HEAD `070be137dafdbc61590376cef6816733a3b9a4a3`.
2. Se falhar, abrir os logs do job, corrigir somente os asserts/defeitos comprovados e repetir a CI no novo HEAD.
3. Com testes e build aprovados, atualizar este checkpoint e a matriz com os IDs finais e classificar a tarefa D como TESTADA AUTOMATICAMENTE.
4. Prosseguir com as pendências restantes da Fase 1. Não iniciar a bateria humana ainda; não iniciar Inventário ativo antes da Fase 2.
