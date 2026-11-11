# Matriz de auditoria funcional da Ficha

**Data:** 10/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Status:** auditoria documental parcial; não é certificação de completude.

## Como ler esta matriz

- **Implementado no código:** há módulo/fluxo identificado na versão consultada.
- **Cobertura automatizada existente:** há testes dedicados no repositório. Isso não significa que a CI deste HEAD já passou.
- **Integração pendente:** o próprio código ou a arquitetura atual identifica dependência ainda não ligada.
- **Validação manual:** não presumir sem evidência explícita de teste humano registrado.
- Esta matriz separa Offline e LAN. Um fluxo existente Offline não prova que esteja disponível na LAN.

## Matriz por área

| Área | Evidência de implementação | Testes existentes identificados | Limites / pendências |
|---|---|---|---|
| Entrada e navegação | `main.tsx` seleciona Ficha Offline por padrão e modo LAN sob parâmetro explícito; `FichaOfflineApp.tsx` e `ConexaoServidorLocal.tsx` são fluxos separados. | `entrada-aplicacao.test.mjs`, `arquivos-jogador-navegacao.test.mjs`, `recuperacao-contexto.test.mjs` | Não existe ainda fluxo unificado Offline-first com salvamento local + LAN. |
| Identidade | `IdentidadeLocal.tsx` edita nome e dados narrativos na Ficha. | `identidade-local.test.mjs`, verificações em `pendencias-edicao.test.mjs` | Identidade foi excluída da primeira allowlist de sincronização genérica; integração LAN dedicada continua pendente. |
| Características, Classe e Origem | `EditorCaracteristicasLocal.tsx`, catálogo de Classes/Origens e efeitos de Origem participam da Ficha. Mercenário registra o gatilho de hostil oculto, custo de Reação e uso 1/Descanso Completo em uma única gravação Offline; saque e Ataque continuam manuais. Agente de Saúde exibe o bônus de +1d4 ao curar aliado, sem criar cura cruzada ou alterar a ficha de outra personagem. | `classes-ficha.test.mjs`, `efeitos-origens.test.mjs`, `integridade-criacao.test.mjs`, `conferencia-criacao-local.test.mjs` | A conclusão de criação depende de validação e ativação próprias; não inferir que todo o fluxo esteja coberto por testes de navegador. |
| Atributos e Perícias | `EditorAtributosPericiasLocal.tsx`, `atributosCriacao.ts`, `periciasCriacao.ts` e `derivadosCriacao.ts`. | `atributos/perícias`: `pericias-criacao.test.mjs`, `pericias.test.mjs`, `derivados-criacao.test.mjs`, `revisao.test.mjs` | A auditoria atual não certifica todos os casos de distribuição, progressão e atualização de derivados na interface. |
| Habilidades | `PlanejadorHabilidadesCriacaoLocal.tsx`, `habilidades.ts`, `efeitosHabilidades.ts`. | `catalogo-habilidades.test.mjs`, `progressao-habilidades.test.mjs`, `progressao-criacao.test.mjs` | A aplicação dos ganhos deve continuar separada do planejamento; confirmar por caso de uso e contexto LAN antes de declarar conclusão. |
| Recursos (PV, SA, BI) | `RecursosFichaLocal.tsx` e `recursosFicha.ts`. | `recursos-ficha.test.mjs` | Há cobertura de limites, dano, cura, temporários e BI; a CI do HEAD atual ainda precisa concluir. |
| Condições | `CondicoesFichaLocal.tsx` e `condicoesFicha.ts`. | `condicoes-ficha.test.mjs`, `lembretes-condicoes-turno.test.mjs` | A Ficha informa que Condições são informativas e dependem da aplicação das regras pela Mesa; progressões temporais não são atualizadas automaticamente no Descanso Completo. |
| Reanimação | `ReanimacaoFichaLocal.tsx` e `reanimacaoFicha.ts`. | `reanimacao-ficha.test.mjs`, `reanimacao-integracao-ficha.test.mjs` | Há integração explícita com recursos e salvamento; a auditoria não substitui validação manual de todos os cenários narrativos e de Mesa. |
| Descanso | `DescansoFichaLocal.tsx`, `descansoFicha.ts`, `usosDescansoCompleto.ts`. | `descanso-ficha.test.mjs`, `usos-descanso-completo.test.mjs` | Atualização automática de Condições e progressões temporais permanece fora do comportamento descrito no painel. |
| Combate — economia e manobras | `PainelAcoesLocal.tsx`, `estadoTurnoCombate.ts`, `manobrasOperacionais.ts`, `reacoesCombate.ts`. | `estado-turno-combate.test.mjs`, `economia-acoes.test.mjs`, `manobras-operacionais.test.mjs`, `manobras-universais.test.mjs`, `reacoes-combate.test.mjs`, `reacao-defensiva-ficha.test.mjs` | A Ficha registra escolhas/ações sem presumir gatilhos nem resolver efeitos por conta própria. A interface permite avaliar a janela, declarar Esquiva autorizada e solicitar o Teste de Reflexos nos três modos, respeitando Dados Físicos/Virtuais/Mistos e Desvantagem por Condições/Fase da BI. A declaração defensiva passa por transição integrada e persiste marcador de origem no estado do turno; Contra-Ataque Instintivo só reutiliza a Reação quando a Ficha registrou que ela foi consumida na defesa, sem depender de confirmação local volátil. Aparar permanece bloqueado até existir estado confiável de equipamento empunhado e Durabilidade. Iniciativa da Mesa e gestão de Encontros não fazem parte do painel atual. |
| Testes e roladores | `RoladoresBasicosLocal.tsx`, `CalculadoraTesteLocal.tsx`, `rolagemDados.ts`, `testes.ts`. | `roladores-ficha.test.mjs`, `testes.test.mjs`, `ataques-calculadora.test.mjs` | Os testes existentes verificam restrição de roladores ao modo Automático; Misto/Manual não devem ganhar calculadoras por acidente. |
| Iniciativa | A Ficha exibe modificador derivado de AGI e permite rolagem pontual no modo Automático. | `iniciativa-ficha.test.mjs` | A própria suíte confirma que a Ficha não administra ordem de turnos nem Encontros. |
| Progressão e Morte | `ProgressaoFichaLocal.tsx`, `progressaoPersistente.ts`, `progressaoMorte.ts`. | `progressao-persistente.test.mjs`, `progressao-morte.test.mjs`, `progressao-campanha.test.mjs` | Progressão Offline agora usa contrato neutro por padrão: o grupo decide o critério fora do WebApp e a Ficha registra apenas a autorização externa antes de exigir Descanso Completo na Sala de Descanso. Contratos históricos com Marco Narrativo ou Missões continuam válidos e preservados; novos registros não exigem nem armazenam escolha de método. Registro de Morte Offline reverte benefícios do último Nível e exige nova autorização; integração LAN permanece fora deste ciclo. |
| Inventário | `EditorInventarioLocal.tsx` permite planejar equipamento inicial e compras no rascunho. `inventarioCriacao.ts`, `inventarioAtivo.ts`, `inventarioConsulta.ts`, `inventarioExpansao.ts` e `organizacaoInventario.ts` implementam partes importantes do domínio. | `inventario-ativo`, `inventario-consulta-local`, `inventario-criacao`, `inventario-expansao`, `inventario-persistencia`, `organizacao-inventario`, `organizacao-multiespaco`, `organizacao-sessao`, catálogos e QA visual isolado. | Na Ficha ativa, o código mostra resumo de itens materializados e declara que movimentação/gerenciamento contínuo ainda serão liberados. `PainelInventarioLocal` é somente leitura; a fixture visual declara não ter ações de uso, equipamento, transferência ou Baú. O servidor inspecionado expõe lista, ficha, conferência e ativação, mas não uma rota dedicada de operações do Inventário ativo. Munição/recarga e propriedades operacionais das armas também permanecem pendentes. |
| Persistência Offline | `persistenciaFicha.ts`, `FichaOfflineApp.tsx`; IndexedDB v3 com store separado para vínculos LAN. | `persistencia-migracao.test.mjs`, `persistencia-operacoes.test.mjs`, `persistencia-patch.test.mjs`, `persistencia-gravacao.test.mjs`, `vinculos-lan*.test.mjs` | O novo teste CRUD do vínculo usa IndexedDB simulado. Integração em navegador com IndexedDB real permanece pendente. |
| Persistência LAN | `ConexaoServidorLocal.tsx`, `servidorLocal.ts`, servidor local SQLite. | `personagens-local.test.mjs`, `cliente-servidor-local.test.mjs`, `auth-local.test.mjs`, `rascunhos-concorrencia.test.mjs`, entre outros. | LAN e Offline ainda são fluxos separados. Não existe ainda sincronização local-first, endpoint dedicado para allowlist ou UI de conflito multi-dispositivo. |

## Conclusões sustentadas nesta etapa

1. A Ficha tem cobertura automatizada relevante em regras de recursos, Condições, Reanimação, Descanso, economia de Combate, Manobras, Reações, roladores e Progressão.
2. Parte dos testes valida funções de domínio; parte inspeciona integração/estrutura da interface. Os testes de fonte não equivalem a testes E2E em navegador.
3. A arquitetura atual mantém Offline e LAN em entradas e persistências distintas. A meta de sincronização Local-first ainda depende de integração arquitetural.
4. Há pendências explícitas em Combate/Inventário e em integração LAN; não é correto reduzir todas as lacunas a “só falta Inventário”.
5. Esta matriz não declara nenhum módulo como HUMAN-VALIDATED. Testes manuais anteriores da Alfa não cobrem automaticamente os novos fluxos Offline > LAN.

## Próximos passos da auditoria paralela

- Inspecionar a composição da Ficha e os testes de interface para Características, Identidade, Atributos/Perícias e Habilidades.
- Auditar o módulo Inventário por fluxo: criação, ativação, consulta, movimentação, organização, consumo, munição/recarga e salvamento.
- Auditar LAN separadamente: sessão, salvamento, permissões e estado de sincronização.
- Depois, cruzar cada caso com o Arquivo do Jogador e o Planejamento aprovado, sem alterar o cânone.


## Auditoria específica do Inventário — incremento 1

**Evidências consultadas:** `src/FichaLocal.tsx` (seção Inventário), `src/PainelInventarioLocal.tsx`, `tests/ui/inventario.tsx`, `tests/ui/estadoInventario.ts`, `src/organizacaoInventario.ts` e `server/personagens-local.mjs`.

### O que está implementado no código

- Planejamento de equipamento inicial e compras no rascunho, com prévia de ocupação/capacidade.
- Materialização de exemplares com identificadores próprios, posições e estados iniciais.
- Catálogos de armas, munições, coletes, itens de exploração, peças e procedimentos.
- Modelos de consulta e validação de inventário, inclusive pilhas de munição, estados gastos, exemplares distintos e capacidade excedida.
- Modelo de expansão de capacidade e organização por prévia, confirmação explícita, recibos e recuperação de pedidos.
- Persistência do inventário no registro da personagem durante a ativação no servidor, com transação, revisão e recibo.

### O que ainda não está conectado à Ficha ativa

- Para personagem completa, `FichaLocal.tsx` exibe resumo e informa que movimentação e gerenciamento contínuo serão liberados no módulo.
- `PainelInventarioLocal.tsx` está identificado como “SOMENTE LEITURA”; permite consultar, buscar e filtrar exemplares.
- A fixture `tests/ui/inventario.tsx` declara expressamente que é simulação isolada, com dados fictícios em memória, sem login/banco/campanha e sem ações de uso, equipamento, transferência ou Baú.
- As rotas identificadas em `server/personagens-local.mjs` cobrem lista, ficha, conferência e ativação. A ativação materializa `inventario_json`; não foi identificada nesse roteador uma rota de gerenciamento do Inventário ativo.
- A própria Ficha declara que controle de munição/recarga, propriedades operacionais das armas e Iniciativa da Mesa permanecem pendentes.

### Conclusão provisória

A base de domínio e a cobertura automatizada do Inventário são substanciais. A lacuna principal está na integração operacional e persistente do Inventário ativo com a Ficha e com rotas autorizadas do servidor — não na ausência de catálogo ou de lógica de planejamento. A conclusão do módulo deve ser decomposta por operações e validada contra o Arquivo do Jogador antes de qualquer implementação.


## Auditoria de criação — Identidade, Atributos/Perícias e Habilidades

**Evidências consultadas:** `IdentidadeLocal.tsx`, `EditorAtributosPericiasLocal.tsx`, `PlanejadorHabilidadesCriacaoLocal.tsx`, `RevisaoCriacaoLocal.tsx` e testes de identidade, integridade, conferência, ativação e progressão.

### Identidade

- **Implementado:** editor narrativo integrado à Ficha; o teste confirma que nome e identidade são enviados no mesmo salvamento e armazenados nos dados locais sem alterar o esquema do IndexedDB.
- **Cobertura existente:** `identidade-local.test.mjs`, `pendencias-edicao.test.mjs`.
- **Limite:** Identidade não entra na primeira allowlist de sincronização genérica aprovada. A sincronização LAN exige fluxo/validação dedicada.

### Atributos e Perícias

- **Implementado:** editor de criação, regras de distribuição, treinamento gratuito da Origem, segunda Perícia do Amnésico e Tentativa e Erro, com revisão de criação.
- **Cobertura existente:** `pericias-criacao.test.mjs`, `pericias.test.mjs`, `derivados-criacao.test.mjs`, `integridade-criacao.test.mjs`, `revisao.test.mjs`.
- **Limite:** a auditoria identificou testes de domínio e alguns testes de sincronização de props/estado; ainda não equivale a uma rodada E2E manual em navegador para todas as combinações de Classe, Origem e edição concorrente.

### Habilidades e Progressão

- **Implementado:** catálogo por Classe/Ramo/Grau, pré-requisitos, planejamento de Habilidades e aplicação de ganhos por marcos de nível.
- **Cobertura existente:** `catalogo-habilidades.test.mjs`, `progressao-habilidades.test.mjs`, `progressao-criacao.test.mjs`, `progressao-persistente.test.mjs`.
- **Limite:** planejamento e aplicação de ganhos são etapas distintas. A Progressão LAN segue pendente de fluxo dedicado de autorização e gravação, conforme a matriz principal.

### Revisão e ativação

- **Implementado:** revisão resume escolhas, aponta pendências e atalhos; ativação no servidor exige conferência válida, revisão atual, teto de personagens e recibo idempotente.
- **Cobertura existente:** `revisao-render.test.mjs`, `ativacao-interface.test.mjs`, `ativacao-integrada-local.test.mjs`, `validar-criacao-servidor.test.mjs`.
- **Limite:** os testes cobrem contratos e cenários isolados/integrados; validação manual em dois navegadores/contas e em dispositivos reais permanece necessária antes de afirmar conclusão de produção.

### Conclusão provisória

Os blocos de criação da Ficha têm base funcional e testes substanciais. As pendências principais identificadas nesta frente são integração LAN de campos excluídos da allowlist genérica, Progressão e validação manual completa. Não foi encontrada, nesta inspeção parcial, justificativa para reescrever os editores de criação; priorizar lacunas de integração e testes de ponta a ponta.


## Auditoria do transporte LAN para Inventário — incremento 2

### Persistência existente no SQLite

Inspeção de `server/index.mjs`, `server/personagens-local.mjs` e `src/servidorLocal.ts`:

- O servidor local abre SQLite com WAL e `foreign_keys=ON`.
- A leitura da personagem inclui `inventario_json` e `revisao`.
- A rota de ativação do rascunho materializa o snapshot inicial de Inventário a partir da conferência no servidor e o grava em `inventario_json`, incrementando a revisão da ficha na mesma transação.
- A ativação é protegida por `BEGIN IMMEDIATE`, estado de rascunho, autorização do Jogador, revisão esperada e recibo de operação.
- A rota genérica PUT continua bloqueando os campos protegidos de criação/equipamento inicial.
- Não foi identificada rota LAN para consultar e executar operações sobre o Inventário ativo (mover, trocar, usar, equipar, consumir ou recarregar). O painel de organização segue dependente de porta/fixture de QA.

### Consequência para o desenho

A integração deve começar com um contrato dedicado de operações de Inventário ativo, não com PATCH/PUT genérico do snapshot inteiro. O contrato precisa revalidar sessão, vínculo atual de Jogador, personagem/Mesa, estado ativo, revisão esperada, exemplar e requisitos da operação dentro de transação SQLite. Cada pedido deve ser idempotente e produzir recibo durável; Realtime deve apenas sinalizar invalidação, e o cliente deve reler o snapshot autorizado.

A proposta Supabase `supabase/proposals/inventario-instancias.sql` e seus testes de PostgreSQL não constituem implementação SQLite. Não aplicar essa migration nem conceder permissões remotas; usar somente como evidência de invariantes que precisam ser reexpressos no servidor LAN.

### Escopo ainda não especificado

Antes de codificar, cruzar cada operação com o Arquivo do Jogador e definir a matriz de comandos autorizados por modo Automático/Misto/Manual. Baú e transferências continuam fora deste escopo e proibidos offline. Esta auditoria não autoriza efeitos de uso/equipamento, munição, durabilidade ou descarte que não estejam definidos nas fontes canônicas.


## Matriz preliminar de operações — regras canônicas do Inventário

**Fonte consultada:** Arquivo do Jogador v1.0, Capítulo 3 (Arsenal e Equipamentos) e Capítulo 4 (Regras e Combate). Esta matriz transcreve limites funcionais; não cria ações novas.

| Operação / dado | Regra sustentada pelo Arquivo do Jogador | Implicação para o app |
|---|---|---|
| Capacidade | 4 + FOR Espaços; Mochileiro +1; expansão Bolsa +3 ou Pochete +2; Bolsa e Pochete não acumulam. Itens Característicos não ocupam Espaços e não podem ser descartados voluntariamente. | Capacidade deve ser derivada de atributos/origem/expansão; não aceitar capacidade arbitrária enviada pelo cliente. Bloquear descarte voluntário de Característicos. |
| Excesso | Não é possível exceder o limite. Com espaços cheios, a personagem só pode examinar itens; não pode realizar outra Ação enquanto estiver com o item excedente em mãos. | O app precisa distinguir item carregado/excedente em mãos e inventário organizado. A regra não autoriza simplesmente salvar um snapshot com ocupação acima da capacidade. |
| Espaços omitidos | Item sem valor próprio ocupa 1 Espaço, salvo regra específica. | O catálogo deve fornecer Espaços validados; não assumir 0 quando o dado estiver ausente. |
| Organizar | O Livro define capacidade e Espaços, mas não especifica no trecho consultado uma ação/tempo universal para reorganizar posições abstratas na grade. | A grade/posições são uma convenção de interface; não cobrar ação/turno nem inventar custo sem regra aprovada. |
| Sacar/guardar arma | Cada sacar ou guardar arma usa uma Interação Gratuita com Objeto; guardar uma e sacar outra são duas interações. | Equipamento em mãos precisa ser estado separado da mera posição na grade; respeitar limite por turno se o app vier a acompanhar ações. |
| Equipar/lanterna | Cada ato de sacar, equipar, ligar ou desligar é uma interação separada, salvo regra específica. Exemplos específicos podem alterar isso (lanterna sempre equipada etc.). | Comandos separados, definidos por tipo de item; não agrupar ações diferentes num único botão que simule custo único. |
| Durabilidade | Normalmente só perde Durabilidade ao Aparar; ataques e uso comum não gastam. Em 0 não pode Aparar, mas demais funções permanecem, salvo regra específica. Manutenção de 30 minutos em Sala de Descanso ou Kit de Ferramentas restaura máxima. | Não degradar durabilidade ao usar/atacar genericamente. O comando Aparar e as exceções precisam ser integrados ao Combate, não inferidos no Inventário. |
| Munição | Armas possuem capacidade de pente e propriedades próprias; Peças como Pentes Estendidos alteram capacidade máxima. Recarga é definida por arma e varia entre tipos. | Capacidade máxima deve vir da arma + Peças compatíveis; não há uma regra única de custo de recarga. Consumo por disparo/modo depende das regras de combate e da arma. |
| Peças Extras | Cada Peça ocupa Espaço de Peça compatível; uma Peça não beneficia duas armas. Instalar/remover/trocar normalmente leva 30 minutos e exige bancada apropriada, salvo regra que permita Kit de Ferramentas. | Exige vínculo Peça↔arma e compatibilidade/capacidade; operação deve respeitar tempo e requisitos, sem ser confundida com movimentação simples na grade. |
| Baú/transferência | Fora do escopo deste incremento e da operação offline aprovada. | Nenhuma transferência ou mutação de estado compartilhado no modo Offline. |

### Campos de domínio necessários antes da rota ativa

A entidade de Inventário precisa distinguir, no mínimo, exemplar e catálogo, quantidade, Espaços, localização/posição, estado próprio, arma equipada/em mãos, munição atual/máxima, Peças instaladas e vínculo de expansão. Nem todos esses campos estão presentes no snapshot atual de consulta. Não alterar o esquema até confirmar o mapeamento integral dos itens oficiais e as decisões ainda não especificadas.

### Decisões ainda abertas

1. Se a grade representa apenas organização visual ou também posição/alcance para alguma regra da Mesa.
2. Como representar arma sacada/em mãos sem confundir com posição no Inventário.
3. Como o app registra interações gratuitas por turno, dado que a economia de Combate atual não integra diretamente o Inventário.
4. Qual conjunto mínimo de comandos ativos será implementado primeiro (organizar, equipar, sacar/guardar, usar, consumir, recarregar, instalar Peça), e quais ficam fora.
5. Como o modo Manual/Misto deve registrar consumo de munição sem automatizar ações que o grupo decide manualmente.

Nenhum desses pontos deve ser resolvido por inferência durante a implementação.


## Reações defensivas na Ficha — 11/11/2026

**Implementado no código:** `src/PainelAcoesLocal.tsx` agora permite informar o resultado total do Ataque, o d20 natural e as confirmações contextuais de Corpo a Corpo, acerto, possibilidade de Aparar e autorização de Esquiva. A interface usa `avaliarJanelaReacao()` e só apresenta a declaração de Esquiva quando `podeEsquivar` é verdadeiro. O custo é aplicado por `registrarReacaoDefensiva()` dentro de `aplicarReacaoCombate()`, preservando a transição integrada da Economia de Ações.

**Proteção deliberada:** Aparar não pode ser registrado nesta etapa. Embora o gatilho possa indicar que o Ataque seria aparável, a Ficha ainda não dispõe de estado confiável para validar arma empunhada, elegibilidade e Durabilidade. O sistema não presume equipamento.

**Limites:** o cálculo do Teste de Esquiva ocorre somente após solicitação explícita e não aplica Defesa, Dano, BI ou Condições. A autorização de Esquiva é uma confirmação do jogador com a Mesa; não é inferida de uma Habilidade. A interpretação de 20 natural permanece a regra já codificada: fecha as Reações defensivas normais.

**Teste adicionado:** `tests/reacao-defensiva-ficha.test.mjs`. Teste estrutural adicionado; não executado localmente. CI ainda precisa confirmar o resultado.


## Teste de Esquiva integrado — 11/11/2026

**Implementado:** após declarar Esquiva e registrar a Reação, o modo Automático apresenta o Teste de Reflexos contra o resultado total do Ataque recebido. O valor de Reflexos é calculado pela função canônica de Perícias (Atributo + Treinamento, sem duplicação). O cálculo usa `resolverTesteDefensivo()` e `calcularTesteManual()`.

**Dados:** Físicos exigem informar os resultados; Virtuais são sorteados somente após comando explícito; Mistos permitem escolher o método para aquela rolagem. Desvantagem por Condições aplicáveis a Reflexos e pela Fase da BI usa dois d20 e escolhe o pior, com cancelamento normal entre Vantagem e Desvantagem no helper.

**Modos de funcionamento:** a rolagem/cálculo é oferecida após solicitação explícita nos modos Automático, Misto e Manual. O modo de funcionamento governa automações operacionais; a preferência de dados governa como o resultado do dado é obtido. Nenhum efeito ou recurso é aplicado pelo cálculo defensivo.

**Limites:** o resultado não altera recursos, Defesa, Dano, BI ou Condições, não decide efeitos narrativos e não substitui a confirmação da Mesa. Quando o Teste é calculado, o sucesso/falha alimenta a confirmação local usada pelo painel de Retaliação/Contra-Ataque; alterar o gatilho ou declarar nova Esquiva limpa essa confirmação. Retaliação apresenta o Atordoado após defesa bem-sucedida mesmo sem escolher Contra-Ataque; Vantagem e +1 dado aparecem somente na opção de Contra-Ataque. Aparar continua indisponível na interface até integração segura do equipamento e Durabilidade.

**Teste adicionado:** `tests/teste-defensivo-ficha.test.mjs`. Não executado localmente; CI pendente.


## Na Minha Mira — integração contextual — 11/11/2026

**Implementado:** quando a Habilidade `na-minha-mira` está ativa, o Painel de Ações permite confirmar manualmente uso disponível na rodada, inimigo percebido, Alcance Médio, nova Condição penalizante/restritiva, arma de fogo empunhada/carregada e elegibilidade do Ataque de Oportunidade à distância. A avaliação usa `avaliarNaMinhaMira()` e o registro usa `registrarNaMinhaMira()` dentro de `aplicarReacaoCombate()`, consumindo Reação normal ou comprando outra por 1 SA e preservando a transição validada do estado integrado.

**Limites:** não acompanha rodada, percepção, alcance, condições do alvo, arma empunhada ou munição. Os requisitos são confirmados pelo jogador com a Mesa. Não executa a rolagem do Ataque, não aplica Dano ou efeitos. A Ficha não presume arma carregada.

**Teste adicionado:** `tests/na-minha-mira-ficha.test.mjs`; os testes de helper em `tests/reacoes-combate.test.mjs` também cobrem elegibilidade da arma e custo da Reação. Não executados localmente; CI pendente.


### Integridade do contexto após declarar Esquiva — 11/11/2026

**Implementado:** depois que a Reação defensiva é declarada e seu custo salvo, os campos que descrevem o Ataque recebido e o gatilho ficam bloqueados, assim como o botão de reavaliar a janela. Isso impede que uma edição acidental apague o contexto local de uma Reação já consumida e permita uma nova declaração sobre o mesmo evento.

**Teste adicionado:** `tests/reacao-defensiva-ficha.test.mjs`; teste estrutural adicionado, ainda sem execução local. CI deve confirmar.
