# Auditoria do esquema local da ficha — 04/11/2026

**Repositório:** `guspmc/ameaca-biologica-webapp`  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** documentação do formato efetivamente observado; não altera dados, regras ou validações.

> Este documento descreve o código inspecionado. Não constitui um novo cânone de RPG nem autoriza migração, ativação de personagem ou sincronização com servidor.

## 1. Registro persistido

O IndexedDB usa o banco `ameaca-biologica-ficha`, store `personagens`, versão 1.

Cada registro `PersonagemLocal` possui:

| Campo | Tipo observado | Validação atual |
|---|---|---|
| `id` | string | não vazio após trim |
| `nome` | string | 2 a 80 caracteres após trim |
| `criadoEm` | string | precisa ser interpretável por `Date.parse` |
| `atualizadoEm` | string | precisa ser interpretável por `Date.parse` |
| `dados` | objeto não-array | não há validação interna completa |

A validação estrutural é aplicada ao salvar, listar, obter, substituir e validar backups. A listagem rejeita o conjunto inteiro se algum registro não passar pela validação estrutural; não remove registros inválidos automaticamente.

## 2. Estado inicial observado

A criação local grava inicialmente:

- `dados.versaoModelo = 1`
- `dados.estadoFicha = 'rascunho'`

A interface identifica a ficha como rascunho/não ativa. O código inspecionado não demonstra que a ficha offline seja ativada automaticamente nem que os módulos operacionais de combate estejam implementados.

## 3. Chaves internas observadas

As chaves abaixo são lidas ou gravadas pelos editores da ficha offline.

| Chave em `dados` | Uso observado | Presença no rascunho inicial |
|---|---|---|
| `versaoModelo` | versão do modelo de dados | sim, valor 1 |
| `estadoFicha` | estado inicial do registro | sim, `rascunho` |
| `classe` | Classe escolhida | não |
| `origem` | Origem escolhida | não |
| `armaOperario` | escolha de arma quando aplicável | não |
| `habilidadeBasica` | identificador da Habilidade Básica | não |
| `equipamentoInicial` | identificador do conjunto inicial | não |
| `atributos` | objeto com FOR, AGI, VIG e AST | não |
| `periciaOrigemTreinada` | Perícia concedida pela Origem | não |
| `periciaOrigemExtra` | segunda Perícia, usada no caso Amnésico | não |
| `distribuicaoPericias` | mapa de Perícia para pontos distribuídos | não |
| `identidade` | campos narrativos da personagem | não |
| `comprasIniciais` | mapa de identificador de item para quantidade de compras | não |
| `revisaoCompras` | número de revisão do plano personalizado | não |

As seções são salvas separadamente por patches. O objeto `dados` é mesclado com as chaves do patch, preservando as chaves que não pertencem à seção salva.

## 4. Campos de Identificação observados

O editor de Identificação lê e grava estas chaves dentro de `dados.identidade`:

| Campo | Limite atual no editor |
|---|---:|
| `idade` | 40 |
| `genero` | 40 |
| `ocupacao` | 120 |
| `apelido` | 120 |
| `afiliacao` | 120 |
| `aparencia` | 1.000 |
| `personalidade` | 1.000 |
| `objetivo` | 1.000 |
| `medo` | 1.000 |
| `lacos` | 1.000 |
| `historia` | 4.000 |

O editor trata esses campos narrativos como opcionais. O nome principal da personagem continua sendo o campo externo `PersonagemLocal.nome`.

## 5. Regras de integridade já verificadas no código

- O nome externo deve ter entre 2 e 80 caracteres.
- Os quatro atributos são FOR, AGI, VIG e AST; o editor usa as funções de validação da criação.
- A distribuição de Perícias usa o catálogo de Perícias, Origem e limite de pontos da Classe.
- A validação da seção Características confere Origem contra `ORIGENS`, Habilidade Básica contra a Classe, conjunto inicial contra as opções da Classe e arma quando a Origem é Operário.
- O inventário personalizado exige prévia aplicada e válida antes de salvar o planejamento.
- Alterações posteriores na prévia invalidam a aplicação anterior.
- O planejamento inicial não equipa itens, não consome recursos e não ativa a personagem.

## 6. Limites conhecidos da validação

1. `versaoModelo` não é validada independentemente pela persistência ou pelo backup.
2. `estadoFicha` não tem enumeração validada no armazenamento local.
3. O formato interno de `atributos`, `identidade`, `distribuicaoPericias` e `comprasIniciais` não é validado de ponta a ponta na fronteira IndexedDB/backup.
4. O backup verifica a estrutura externa do registro, mas não valida integralmente o conteúdo interno de `dados`.
5. Campos desconhecidos em `dados` são preservados pela mesclagem e pelo backup; não devem ser descartados sem política explícita de migração.
6. O estado de rascunho é incremental. Exigir todas as chaves da ficha no armazenamento impediria a persistência legítima de um rascunho recém-criado.

## 7. Proposta técnica — ainda não implementada

Antes de endurecer a validação, definir um contrato versionado para os dados internos que:

- aceite o conjunto mínimo de um rascunho recém-criado;
- valide cada seção quando suas chaves estiverem presentes;
- diferencie ausência legítima de valor inválido;
- preserve chaves desconhecidas até existir uma migração aprovada;
- trate `versaoModelo` e futuras migrações explicitamente;
- seja compartilhado por persistência e backup, evitando validadores divergentes;
- tenha testes para rascunho vazio, cada seção isolada, ficha com todas as seções, dados antigos e campos futuros desconhecidos.

**Nenhuma validação nova foi introduzida por este documento.** A proposta depende de revisão e testes antes de qualquer implementação.

## 8. Divergência de escopo a acompanhar

O Planejamento v2.0 descreve rascunhos privados por conta e por Mesa, salvamento automático no servidor e regras de retenção associadas à entrada, saída, remoção e encerramento da Mesa. Também define o offline de segurança como leitura previamente armazenada e escrita de anotações pessoais, sem alteração offline de estados compartilhados.

A implementação observada nesta branch, por sua vez, inicia diretamente em `FichaOfflineApp`, cria fichas locais no IndexedDB sem contexto de conta/Mesa e permite editar localmente as seções da ficha em estado de rascunho.

Isso é uma diferença arquitetural relevante entre o código atual e o produto especificado no Planejamento v2.0. Este registro não decide se a arquitetura local é uma etapa provisória de desenvolvimento ou uma mudança aprovada de produto. Até existir decisão documentada posterior, não se deve apresentar o fluxo local como implementação completa das regras de rascunho, conta, Mesa, autorização ou sincronização previstas no Planejamento v2.0.

A validação e os testes desta branch devem continuar limitados ao comportamento local efetivamente implementado. A integração futura com conta/Mesa, sincronização, retenção e revogação exige projeto próprio e testes de autorização; não pode ser inferida a partir do IndexedDB local.

## 9. Limites da cobertura de ciclo de vida encontrada

A suíte contém `tests/ciclo-ficha.test.mjs`, mas esse arquivo monta PostgreSQL com PGlite, aplica migrations e propostas SQL, e verifica operações de ciclo de ficha no servidor (arquivamento, assunção, saída, exclusão, proveniência de inventário e autorização). Ele não simula o ciclo de vida da interface React nem o IndexedDB usado pela entrada atual `FichaOfflineApp`.

A cobertura da ficha offline está distribuída por testes de persistência, fila, backup, integridade e verificações estáticas de componentes. Isso oferece evidência útil por unidade, mas ainda não comprova uma sequência integrada de interface: criar → editar várias seções → salvar em ordens diferentes → fechar/reabrir → exportar/importar → excluir.

Não há, nesta branch, evidência de teste automatizado com navegador real para essa sequência, nem teste multiaba que detecte sobrescrita de uma ficha editada simultaneamente em duas abas. Esses pontos permanecem pendentes para homologação e/ou desenho técnico específico.

## 10. Correções preventivas adicionadas após a auditoria

- O editor de Identificação agora mescla os campos conhecidos editados ao objeto narrativo existente, em vez de reconstruí-lo do zero. Isso preserva chaves adicionais já armazenadas. Foi acrescentada uma verificação de regressão no teste de pendências.
- A lista local agora desabilita a abertura de fichas e a exportação/seleção de backup enquanto uma operação de gravação, exclusão ou importação está em andamento. Isso evita que uma ficha seja aberta durante sua exclusão ou que a importação substitua a lista enquanto o usuário navega para uma ficha.

Essas mudanças foram commitadas na branch de desenvolvimento e aguardam confirmação do CI. Não houve teste humano nem publicação.

## 11. Concorrência entre abas — risco confirmado pela estratégia de gravação

A fila `criarFilaSerializada()` existe dentro da instância React de cada aba. Ela impede que os patches dessa mesma instância se sobreponham, mas não coordena duas abas ou duas janelas independentes.

O caminho atual de edição lê `selecionadoRef.current`, monta um registro completo com `dados: { ...base.dados, ...patch }` e envia esse objeto para `salvarPersonagem()`, que executa um `put()` completo em uma transação IndexedDB. O IndexedDB serializa transações de escrita concorrentes na mesma store, mas isso, isoladamente, não atualiza o objeto `base` que a segunda aba já tinha em memória.

Cenário possível:
1. Aba A e aba B abrem a mesma ficha, ambas com a revisão R.
2. Aba A altera Identificação e grava o registro completo R+A.
3. Aba B altera Atributos usando sua cópia antiga R e grava o registro completo R+B.
4. O segundo `put` pode substituir o registro R+A por R+B, perdendo a alteração de Identificação, embora ambas as gravações tenham sido confirmadas pelo IndexedDB.

A fila local não evita esse cenário porque as filas são independentes. Também não há, no caminho inspecionado, canal entre abas, revisão otimista ou mesclagem de patch dentro da própria transação IndexedDB.

**Classificação:** risco técnico confirmado pela leitura do fluxo; o cenário ainda não foi reproduzido em navegador real.

**Correção recomendada:** mover a operação de patch para o módulo de persistência. Dentro de uma única transação `readwrite`, buscar a versão mais recente do registro, mesclar apenas as chaves da seção editada e gravar o resultado. Para alterações simultâneas na mesma chave, definir política explícita (detectar conflito usando revisão/base observada ou documentar último salvamento vence); não escolher silenciosamente. A UI deve receber o registro efetivamente gravado e atualizar seu estado.

**Testes necessários antes da implementação:** duas conexões IndexedDB independentes, ambas lendo a mesma ficha; primeiro patch em uma conexão; segundo patch em outra; confirmar que alterações em chaves diferentes sobrevivem. Acrescentar caso de conflito na mesma chave e decidir a resposta esperada. A mudança exige teste de regressão para a fila de gravação da mesma aba.

## 12. Auditoria complementar — exclusão e importação concorrentes

### Exclusão individual

`excluirPersonagem(id)` executa `delete(id)` em uma transação `readwrite`. Se outra aba ainda estiver com a ficha aberta, uma gravação posterior via `salvarPatchPersonagem` consulta o registro dentro da transação e falha quando ele não existe. Portanto, o caminho novo de patch não recria a ficha excluída.

**Limite:** a aba que excluiu não notifica automaticamente as demais. A aba antiga só descobre a exclusão quando tenta salvar; nesse momento a gravação é recusada. Não há teste em navegador real para essa sequência.

### Importação como cópias

`adicionarPersonagens()` usa `add()`, não `put()`. Colisão de ID provoca falha da transação, evitando substituir silenciosamente um registro existente. O lote é uma única transação, portanto não deve deixar importação parcial quando há erro.

### Substituição integral do backup

`substituirPersonagens()` usa uma única transação `readwrite` com `clear()` seguido de `put()` para cada ficha. A atomicidade protege contra conjunto parcialmente restaurado quando a transação aborta.

**Risco multiaba ainda aberto:** outra aba pode permanecer com uma ficha antiga em memória durante a substituição. Se ela tentar salvar depois, o patch verifica as chaves editadas contra o registro substituto. Se alguma chave tiver mudado, recusa o patch. Porém, se as chaves editadas tiverem valores iguais aos da cópia antiga, o patch pode ser aceito e aplicado ao registro restaurado. Isso pode misturar uma edição iniciada antes da restauração com o conjunto novo. A comparação atual não identifica a operação de substituição como uma nova geração do conjunto.

**Classificação:** risco plausível e derivado do fluxo; ainda não reproduzido em navegador real.

**Recomendação:** antes de considerar a substituição segura em múltiplas abas, introduzir um identificador de geração do conjunto local (ou mecanismo equivalente), incrementado atomicamente na substituição e observado pela aba editora. O patch deve recusar a gravação se a geração observada ao abrir a ficha não corresponder à geração vigente. A solução precisa preservar compatibilidade com registros existentes e backups antigos; não implementar sem definir onde o marcador vive e como será inicializado.

### Limite dos testes multiaba adicionados

`tests/persistencia-patch.test.mjs` cobre a lógica de mesclagem e detecção de conflito usando duas importações isoladas do módulo e um mock de IndexedDB compartilhado. Isso não equivale a duas conexões reais do navegador: o mock não reproduz integralmente o agendamento e o bloqueio transacional normativo do IndexedDB. Os testes são regressões unitárias da lógica, não homologação multiaba.


---

## 13. Rechecagem do código após a consolidação — HEAD `cb4542c0`

Esta seção corrige o retrato anterior, que ficou desatualizado após a evolução da persistência. A inspeção foi feita nos arquivos atuais da branch `feat/offline-first-ficha`; não representa execução local dos testes.

### 13.1 Modelo persistido atual

- `VERSAO_BANCO_FICHA = 2`.
- `PersonagemLocal` agora exige `id`, `geracao`, `nome`, `criadoEm`, `atualizadoEm` e `dados`.
- A migração do banco v1 para v2 atribui um token `geracao` aos registros antigos.
- A validação estrutural de `persistenciaFicha.ts` exige `geracao` não vazia.
- A criação local grava `dados.versaoModelo = 1` e `dados.estadoFicha = 'rascunho'`.
- A restauração e a importação como cópias geram novo token `geracao`.

### 13.2 Divergência confirmada entre persistência e backup

A validação de `backupFicha.ts` continua independente e mais permissiva que a persistência: verifica os campos externos básicos, mas não exige `geracao`. Também não valida `dados.versaoModelo`, `dados.estadoFicha` nem as estruturas internas conhecidas.

Consequências:
- `criarBackup()` pode aceitar um objeto que não satisfaz o tipo/contrato atual de `PersonagemLocal`.
- O formato do backup não garante que cada personagem exportado/importado tenha a mesma integridade exigida pelo IndexedDB.
- A restauração substitui a geração de cada registro, mas a validação do backup deve ainda distinguir arquivo legado legítimo de registro malformado.

### 13.3 Fixtures de testes desatualizadas — provável falha automatizada

A inspeção de `tests/persistencia-gravacao.test.mjs` e `tests/persistencia-operacoes.test.mjs` encontrou fixtures de personagem sem `geracao`. Esses testes chamam `salvarPersonagem()`, cuja validação atual exige `geracao` não vazia. Pela leitura direta do código, as fixtures não satisfazem o contrato e devem provocar rejeição antes de testar a transação.

Classificação: incompatibilidade estática confirmada entre os fixtures e a validação atual; a falha efetiva da execução ainda precisa ser confirmada no CI/runner.

### 13.4 Campos de dados e validadores de domínio disponíveis

A inspeção confirmou que já existem validadores e catálogos reutilizáveis:
- `atributosIniciaisValidos()` para FOR, AGI, VIG e AST.
- `distribuicaoPericiasValida()`, `NOMES_PERICIAS`, `PONTOS_CLASSE`, `PERICIAS_CLASSE` e `ORIGENS`.
- `armaOperarioValida()` e `ARMAS_OPERARIO`.
- `HABILIDADES_BASICAS` e `opcoesEquipamento()`.
- `simularCompras()` e `planejarInventarioCriacao()` para validar compras e capacidade do inventário inicial.
- Os campos narrativos de `dados.identidade` têm limites definidos em `IdentidadeLocal.tsx`; são opcionais.

Os validadores existentes não devem ser duplicados dentro da persistência. O contrato comum deverá compô-los, respeitando que um rascunho recém-criado contém apenas `versaoModelo` e `estadoFicha`.

### 13.5 Contrato técnico proposto para implementação

Criar um módulo compartilhado de validação de dados locais, usado tanto por `persistenciaFicha.ts` quanto por `backupFicha.ts`, com opções explícitas para compatibilidade de registros antigos.

Requisitos:
1. Validar a estrutura externa da personagem em um único lugar, com opção explícita para aceitar geração ausente somente durante a leitura/conversão de formatos legados; gravações atuais no IndexedDB exigem geração.
2. Validar `versaoModelo`: aceitar a versão atual conhecida (1); ausência só pode ser aceita como legado documentado, nunca como valor arbitrário. Rejeitar versão desconhecida/futura com mensagem que não provoque descarte automático dos dados.
3. Validar `estadoFicha`: o único estado atualmente implementado neste fluxo é `rascunho`. Não aceitar estado ativo/arquivado sem implementação correspondente e sem regra aprovada.
4. Aceitar rascunho mínimo sem campos de seção.
5. Quando uma seção estiver presente, validar sua estrutura completa:
   - Características: classe, origem, habilidade compatível com a classe, equipamento inicial compatível e arma obrigatória/permitida quando a origem for Operário.
   - Atributos e Perícias: quatro atributos válidos; Perícia treinada da Origem; segunda Perícia para Amnésico; distribuição e limites coerentes com Classe/Origem.
   - Identidade: objeto opcional; campos conhecidos como strings dentro dos limites do editor; preservar propriedades desconhecidas válidas.
   - Inventário de criação: kit, mapa de compras e revisão coerentes; validar compras pelo simulador existente e pela capacidade calculada, sem ativar/equipar/consumir itens.
6. Não exigir que todas as seções estejam presentes simultaneamente: salvamentos são parciais e o rascunho é incremental.
7. Preservar campos desconhecidos de `dados`; validar que o conteúdo seja serializável com segurança em JSON para que o backup não perca ou corrompa silenciosamente valores. Não remover campos desconhecidos.
8. Validar timestamps, identificadores únicos e ausência de IDs duplicados no conjunto do backup.
9. Backup legado: manter leitura compatível somente se houver versão/estrutura conhecida e conversão explícita; a conversão deve atribuir nova geração antes de gravar. Não relaxar o contrato atual de escrita no IndexedDB.
10. Testar rascunho mínimo, cada seção isolada, ficha completa, dados legados, versão futura, enums inválidos, campos desconhecidos, JSON não serializável, IDs duplicados e consistência entre exportação/importação/restauração.

### 13.6 Sequência de implementação

1. Acrescentar testes de contrato compartilhado e corrigir fixtures que não incluem `geracao` quando o teste pretende representar registros atuais.
2. Implementar o validador comum sem alterar os validadores de domínio nem o cânone.
3. Integrar persistência e backup ao mesmo validador, mantendo caminho explícito para dados legados.
4. Executar suíte completa e build no HEAD resultante; corrigir regressões antes de avançar.
5. Só então seguir para testes integrados de ciclo de vida e concorrência, e depois Inventário funcional.

**Estado:** diagnóstico e proposta documentados; correção de código ainda não implementada nesta seção.
