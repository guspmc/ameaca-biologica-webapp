# Checkpoint — ciclo de auditoria de Condições, Descanso e estado de Combate

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**HEAD de código inspecionado:** `8cbc1731665970fc6fb8e2be4ba1f79c75302db1`  
**Escopo deste ciclo:** reinspeção dirigida dos componentes atuais de Condições, Descanso Parcial/Completo, integração de Progressão no Descanso e estado/economia de turno.  
**Método:** leitura estática dos arquivos e testes existentes pela API do GitHub. Nenhum teste foi executado nesta sessão.

## 1. Condições

### Evidências atuais

- `src/condicoesFicha.ts` mantém catálogo das Condições canônicas, valida registros com chaves estritas, preserva compatibilidade com registros legados e suporta múltiplas instâncias com fontes/durações independentes.
- `src/CondicoesFichaLocal.tsx` deriva Vulnerável dos PV, Desacordado dos PV em 0 ou Colapso Viral, e Colapso Viral da BI igual/superior à BI Máxima. Essas três condições derivadas não podem ser ativadas/encerradas manualmente.
- Condições registradas podem ser encerradas preservando histórico. A interface informa que Offline não possui contador de rodadas e que, na LAN, a duração em rodadas é acompanhada separadamente pelo Mestre.
- `src/condicoesCalculadora.ts` concentra os modificadores próprios de rolagem e Defesa, além de lembretes de restrições; não tenta inferir contexto do alvo, percepção da fonte ou duração.
- `tests/condicoes-ficha.test.mjs`, `tests/condicoes-calculadora.test.mjs` e `tests/condicoes-historico-invalido.test.mjs` cobrem catálogo, validação, histórico, limites de Vulnerável e efeitos calculáveis.

### Classificação

**IMPLEMENTADO; coerente com o escopo de caderno/calculadora na inspeção estática.** Duração por turno, Dano contínuo, remoção por Teste e efeitos dependentes de narrativa permanecem sob controle da Mesa. Não foi identificado defeito concreto nesta leitura.

## 2. Descanso Parcial e Completo

### Evidências atuais

- `src/descansoFicha.ts` valida recursos e resultados; Descanso Parcial exige um Dado de Vida por Nível (d8 Autodidata, d10 Agente, d12 Operador) e aplica a soma como cura de PV, sem restaurar SA ou alterar BI.
- Descanso Completo restaura PV e SA aos máximos, encerra PV Temporários e preserva BI.
- `localPermiteDescanso` permite Parcial na Sala de Descanso ou Sala Segura; Completo somente na Sala de Descanso.
- `src/DescansoFichaLocal.tsx` respeita modos de funcionamento e preferência de dados: rolagem virtual somente no Automático; em Misto permite escolher físico/virtual; nos modos Misto/Manual de funcionamento não oferece rolador virtual integrado e recebe resultados físicos externos.
- A conclusão somente exibe confirmação após `aoSalvar` retornar sucesso. Descanso Completo renova os usos limitados na mesma gravação.
- `src/FichaLocal.tsx` bloqueia Descanso enquanto há edições pendentes ou Reanimação em curso; valida o registro de usos limitados e prepara a confirmação de Progressão elegível na Sala de Descanso no mesmo patch do Descanso Completo.
- Testes identificados: `tests/descanso-ficha.test.mjs`, `tests/descanso-usos-invalidos.test.mjs`, `tests/usos-descanso-completo.test.mjs`, além de cobertura de integração na Ficha.

### Classificação

**IMPLEMENTADO; coerência estática nos fluxos inspecionados.** Não foi identificado defeito concreto. O teste real de persistência, repetição de clique, atualização concorrente e recuperação após falha de armazenamento continua reservado à bateria humana integrada.

## 3. Progressão — decisão neutra preservada

- `src/ProgressaoFichaLocal.tsx` já apresenta critério de avanço como decisão do grupo fora do WebApp; o fluxo de nível 1 inicializa Progressão sem exigir seleção de método.
- `src/progressaoPersistente.ts` aceita tanto o contrato neutro atual (`avancoAutorizado`) quanto contratos históricos com `metodo`, preservando compatibilidade.
- A Progressão na LAN permanece explicitamente indisponível nesta etapa; a UI informa que exige fluxo próprio de autorização e gravação.
- O Descanso Completo só confirma pedido de Progressão se o pedido e o histórico forem válidos e o local for Sala de Descanso.

**Classificação:** a decisão de produto neutra está refletida no fluxo novo; compatibilidade histórica permanece. Não foi alterado o contrato nem realizada migração. A integração LAN continua **INCOMPLETA**.

## 4. Estado de turno, Economia de Ações e Reações

### Evidências atuais

- `src/estadoTurnoCombate.ts` valida estado composto versionado e reconhece formatos legados específicos; migra em memória sem corrigir silenciosamente registros inválidos.
- `src/manobrasOperacionais.ts` registra custos e marcadores de Disparada, Fuga, Mirar, Atacar, Ajudar, Usar Objeto, Combate com Duas Armas e Finalizar. O módulo não executa deslocamento, Ataque ou Dano.
- `src/economiaAcoes.ts` valida recursos normais, compras por Esforço e teto de 3 SA por janela; Reação fora do próprio turno só pode ser comprada quando autorizada.
- `src/reacoesCombate.ts` calcula janela defensiva, Aparar/Esquivar e Contra-Ataque sem resolver Dano ou consequência narrativa.
- Os checkpoints recentes registram integrações parciais na interface: Esquiva está integrada; Aparar continua bloqueado por falta de estado confiável de arma empunhada/elegibilidade/Durabilidade. Reações específicas dependentes de gatilhos confirmados permanecem condicionadas à informação expressa do jogador/Mesa.
- Testes identificados: `tests/estado-turno-combate.test.mjs`, `tests/reacoes-combate.test.mjs`, `tests/reacao-defensiva-ficha.test.mjs`, `tests/teste-defensivo-ficha.test.mjs`, `tests/manobras-operacionais.test.mjs`, `tests/manobras-universais.test.mjs`.

### Limites e pendências

- A leitura deste ciclo não constitui auditoria exaustiva de todas as Manobras, Habilidades de Reação, armas, gatilhos excepcionais ou integração UI.
- O estado de turno é um registro de apoio, não um motor que avança rodadas automaticamente.
- Não inferir equipamento, arma empunhada, munição carregada, alvo, acerto, Defesa, Dano, BI ou PV.
- A integração de Reações na interface permanece parcial; especialmente Aparar depende do futuro estado confiável de equipamento, sem antecipar Inventário ativo.

## 5. Validação e alterações

- Nenhum arquivo de código foi alterado neste ciclo.
- Nenhum teste foi executado localmente; o ambiente atual permite inspeção remota do repositório, não execução do projeto.
- A presença de testes não equivale a teste aprovado. Não foi consultado resultado de CI nesta rodada.
- Nenhum teste humano executado.
- Sem alteração visual, mudança no servidor LAN, Supabase, banco remoto, merge, deploy ou publicação.
- Nenhum módulo futuro foi iniciado.

## 6. Próximo ciclo

1. Continuar a auditoria de Combate na interface e nos cálculos já integrados, separando claramente IMPLEMENTADO, INCOMPLETO e PENDENTE DE TESTE.
2. Confrontar as regras de Ações/Manobras e Reações com os arquivos canônicos, identificando exceções ainda sem suporte sem expandir o escopo automaticamente.
3. Auditar persistência do estado de turno e sua integração com salvamento/recuperação, sem implementar gestão automática de rodada.
4. Atualizar a matriz geral e o checkpoint de continuidade ao final do próximo ciclo.
5. Após concluir a auditoria integral da Ficha, preparar a bateria humana progressiva. Inventário ativo permanece bloqueado até validação humana da Ficha Offline e aprovação expressa.

**Restrições preservadas:** uma única branch; foco na Ficha; nenhuma limpeza especulativa; identidade visual congelada; servidor LAN intocado.
