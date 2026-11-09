# Checkpoint — Estabilização da Ficha e correções de compatibilidade, 09/11/2026 (ciclo 4)

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD observado antes deste checkpoint: `22b70d9572c0567a2b9de8fa7f944602b5b20bef`
- Sem merge para `main`, deploy ou alteração em produção.
- Os workflows associados ao SHA `22b70d9572c0567a2b9de8fa7f944602b5b20bef` foram disparados; resultado ainda pendente no momento do registro.
- A CI anterior no SHA `65bd853e5a7fc07a14408adcfa2c36b038de1da8` falhou em um teste de catálogo por regex escapada em excesso. A compilação e os demais testes passaram; o erro foi localizado em `tests/catalogo-procedimentos-equipamentos.test.mjs:19`.
- O teste foi simplificado para verificar a presença literal de `+2 Dados de Dano`, sem alterar o catálogo ou a regra.

## Correção de compatibilidade — registro de Condições
Arquivos:
- `src/condicoesFicha.ts`
- `src/CondicoesFichaLocal.tsx`
- `tests/condicoes-ficha.test.mjs`

O gerador de IDs foi extraído para `gerarIdCondicao`. Agora verifica `typeof randomUUID === 'function'` antes de invocar a API nativa e utiliza fallback UUID quando a API está ausente ou não é funcional.

O painel de Condições utiliza o helper compartilhado. O teste cobre provedor nulo, propriedade não funcional e função nativa funcional.

Relação com incidente anterior: em 08/11, o teste humano relatou `crypto.randomUUID is not a function` ao adicionar Queimadura. A alteração aborda a causa compatível com o erro relatado, mas **não está validada em dispositivo Android/WebView** até a repetição do teste humano.

## Estado da Ficha — pendências funcionais conhecidas
### Progressão
- `progressaoPersistente.ts` valida um contrato versionado e histórico de benefícios.
- Ainda não integrado ao modelo persistido da Ficha, backup JSON, IndexedDB, Descanso Completo, fluxo de Morte ou LAN.
- O nível atual segue campo isolado; a interface não permite ainda concluir progressão com registro completo de escolhas e benefícios.
- A reversão por Morte só planeja; não executa alterações na ficha.

### Combate
- Há estado persistente integrado para economia de ações/manobras e algumas ações já são registradas na interface.
- Iniciativa, Ataques, Dano, Reações defensivas, Contra-Ataque, Ataque de Oportunidade, propriedades de armas e Condições ainda não formam um fluxo completo de combate na ficha.
- Calculadora manual resolve apenas os tipos implementados; não automatiza dano ou efeitos.
- Condições são registradas/encerradas manualmente; o painel oferece lembretes, não resolve testes, dano ou duração automaticamente.

### Identidade e interface
- O editor de Identidade persiste campos narrativos, mas houve relato humano de problema de foco/teclado em Android. Causa ainda não localizada; não declarar corrigido.
- Outros relatos humanos pendentes de reteste: expansão de Atributos, Classes/Habilidades Básicas/Perícias, e fluxos de dano/equipamento.
- Nenhum teste humano foi executado neste ciclo.

## Prioridade seguinte
1. Confirmar CI no SHA do ciclo e corrigir somente falhas comprovadas.
2. Fechar progressão persistente integrada: contrato, validação local/servidor, backup, IndexedDB, Descanso Completo, seleção/registro exato de benefícios e Morte, com migrações estritas.
3. Fechar o fluxo de Combate na Ficha: iniciativa, economia, ações/manobras, Ataque, janela de Reação, defesa ativa, Contra-Ataque, Dano, RD/BI, condições e persistência; respeitar os modos de funcionamento e não presumir rolagens.
4. Concluir regras de habilidades e efeitos aplicáveis à ficha.
5. Auditar todos os catálogos e procedimentos contra o Arquivo do Jogador.
6. Executar a suíte automatizada completa e auditorias antes da bateria humana integrada.
7. Só após validação humana, iniciar o Inventário ativo de Personagem.

## Limite explícito de escopo
Catálogos de armas, peças, munições, proteções, itens e receitas são referência de regras. Não representam posse, equipamento ativo, carregadores, consumo ou transferências. O Inventário ativo continua bloqueado.


## Atualização de continuidade — CI e eficiência do desenvolvimento

### CI do commit de correção
- HEAD confirmado da branch `feat/offline-first-ficha`: `1d1dfb261469eb4b741aa877fb1d95b7e68bced7`.
- Workflow `42555716681` — Verificação da Ficha offline: **success**. Etapas de instalação, testes e build concluídas.
- Workflow `42555716658` — Compilação do WebApp: **success**. Etapas de instalação, testes PostgreSQL locais, compilação e verificação de tipos concluídas.
- A correção da chamada residual de `novoIdCondicao()` para `gerarIdCondicao()` está validada pela CI. A confirmação em Android/WebView permanece pendente para a bateria humana final.

### Diretriz permanente de eficiência e prevenção de retrabalho
A partir deste ciclo, o desenvolvimento deve otimizar o uso do tempo do usuário e reduzir repetição entre conversas:
1. Priorizar tarefas pelo impacto e pelas dependências: resolver primeiro bloqueios que destravam várias partes da Ficha; evitar polimento prematuro de módulos que ainda dependem de contratos incompletos.
2. Agrupar alterações coerentes em ciclos de trabalho, evitando fragmentação excessiva, commits/documentos redundantes e repetição de testes sem mudança relevante.
3. Auditar uma vez com evidência rastreável. Registrar fonte, páginas/trechos, arquivos, testes e conclusão para não reabrir auditorias já encerradas sem nova evidência, alteração de código ou conflito identificado.
4. Automatizar validações, testes de regressão, compatibilidade e verificações repetíveis sempre que possível. Reservar testes manuais do usuário para fluxos integrados que realmente dependam de dispositivo, percepção ou decisão humana.
5. Manter checkpoints objetivos e frequentes, especialmente antes de encerrar uma conversa: estado real, branch/HEAD, commits, arquivos alterados, decisões, testes/CI com IDs e resultados, pendências, riscos e próximo passo exato.
6. Distinguir claramente PLANEJADO, IMPLEMENTADO, TESTADO AUTOMATICAMENTE, VALIDADO HUMANAMENTE e PENDENTE. Nunca promover uma etapa de estado sem evidência.
7. Não refazer descoberta ou implementação já concluída. Antes de iniciar uma tarefa, consultar o checkpoint e os artefatos existentes; continuar de onde parou e atualizar apenas o que mudou.
8. Evitar perfeccionismo sem benefício funcional. Considerar concluído o que estiver fiel ao cânone, integrado ao escopo necessário e coberto por testes adequados; registrar lacunas não definidas sem inventar regras.
9. O usuário não deve ser convocado para testes intermediários repetitivos. A bateria humana integrada da Ficha fica reservada para quando a implementação estiver completa, imediatamente antes da ativação do Inventário ativo de Personagem.
10. Preservar o tempo do usuário: pedir decisões apenas quando houver ambiguidade real de cânone/produto ou risco relevante; executar autonomamente tarefas técnicas seguras e reversíveis.

### Regra de retomada entre conversas
Ao iniciar uma nova conversa, ler o checkpoint mais recente e este protocolo antes de propor trabalho. Confirmar o HEAD da branch ativa e a CI mais recente; identificar o último item efetivamente concluído e seguir do próximo passo, sem repetir etapas já comprovadas. Se o estado remoto divergir do checkpoint, reconciliar a diferença antes de escrever código.

### Próximo passo técnico
Prosseguir com a integração da progressão persistente ao modelo real da Ficha, começando pela inspeção dos contratos de persistência/backup/validação já existentes. Não iniciar o Inventário ativo e não solicitar bateria humana neste estágio.
