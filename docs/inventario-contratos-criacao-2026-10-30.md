# Inventário de contratos da criação de personagem — 30/10/2026

**Status:** auditoria documental estática; não é especificação final nem implementação.
**Branch examinada:** `fix/lan-websocket-reconnect-2026-10-29`.
**Objetivo:** registrar, operação por operação, o contrato atualmente encontrado nos arquivos do repositório, incluindo entradas, campos, validações, autorização, bloqueios, revisões e efeitos colaterais. Servirá de base para o desenho do cálculo unificado.
**Limite importante:** migrations e arquivos SQL com comentários como “PROPOSTA”, “rascunho” ou “somente TESTE” não comprovam aplicação no banco remoto. Este inventário não consultou nem alterou o banco Supabase.

## 1. Convenções de leitura

- **Encontrado no código:** comportamento diretamente observado no arquivo indicado.
- **Declarado no comentário:** intenção escrita pelo autor da migration/proposta; não equivale a comportamento testado.
- **Não verificado:** informação que exige inspeção adicional, execução local ou confirmação do ambiente.
- **Risco:** possibilidade identificada pela leitura estática; não afirmar que já ocorreu em produção.
- As funções SQL abaixo são descritas por sua definição encontrada no histórico de migrations. Quando há `CREATE OR REPLACE`, a definição posterior substitui a anterior na ordem de aplicação, caso ambas tenham sido aplicadas nessa ordem.
- “Permissão de execução authenticated” não significa, por si só, autorização de negócio. As funções precisam validar usuário, papel, propriedade, estado e Mesa internamente.

## 2. Mapa das operações encontradas

| Etapa | Operação/RPC | Arquivo de origem | Dados principais |
|---|---|---|---|
| Criar rascunho | `criar_personagem_rascunho` | `20261022000500_fichas_personagem_alfa04.sql`, redefinida em `20261022224633_privacidade_e_limite_rascunhos.sql` | Mesa, dono, nome, Classe, nível 1, Atributos e recursos iniciais |
| Identidade | `definir_identidade_rascunho` | `20261023050653_identidade_rascunhos.sql` | nome e JSON de identidade |
| Origem | `definir_origem_rascunho` | `20261022000600_origens_rascunhos.sql`, substituída em `20261023043912_habilidade_origem_compatibilidade.sql` | Origem, Perícia Treinada, escolha extra do Amnésico e derivados |
| Perícias de Classe | `definir_pericias_rascunho` | `20261023035943_pericias_criacao_rascunhos.sql` | mapa JSON de pontos por Perícia |
| Habilidade Básica | `definir_habilidade_rascunho` | `20261023042414_habilidade_basica_rascunhos.sql` | Habilidade e recálculo de PV/BI para Parrudo |
| Equipamento inicial | `definir_equipamento_rascunho` | `20261023045501_equipamento_inicial_rascunhos.sql` | conjunto A/B/C |
| Compras | `salvar_compras_rascunho` | `20261023134639_compras_iniciais_rascunhos.sql` | plano JSON, disponibilidade por Mesa e revisão de compras |
| Disponibilidade | `listar_disponibilidade_inicial`, `definir_disponibilidade_inicial` | `20261023160814_disponibilidade_mestre.sql` | lista de itens liberados pelo Mestre |
| Funcionamento | `salvar_funcionamento_rascunho` | `20261023173853_funcionamento_rascunho.sql` | modo Automático/Misto/Manual e preferências |
| Ativação | `ativar_ficha_local` (proposta local) | `supabase/proposals/ativacao-integrada-local.sql` | validação consolidada, materialização do inventário e ciclo de vida |
| Ciclo da ficha | `executar_ciclo_ficha_local` (proposta local) | `supabase/proposals/ciclo-ficha-local.sql` | arquivar/assumir, propriedade e revisão |

**Atenção:** as duas últimas operações são propostas locais, não migrations ativas. Não devem ser tratadas como RPC disponível no projeto remoto.

## 3. Contrato por operação

### 3.1 Criar rascunho — `criar_personagem_rascunho`

**Arquivos:** migration Alfa 0.4 e redefinição em `20261022224633_privacidade_e_limite_rascunhos.sql`.

**Entrada:** `p_mesa`, `p_nome`, `p_classe`, `p_for`, `p_agi`, `p_vig`, `p_ast`.

**Validações encontradas:**
- usuário autenticado;
- nome aparado entre 2 e 60 caracteres;
- Classe em Agente, Autodidata ou Operador;
- Atributos inteiros entre 0 e 3, soma 7, no máximo um Atributo igual a zero;
- jogador aprovado na Mesa;
- a primeira versão bloqueia a linha da Mesa e conta até 10 personagens da Mesa;
- a redefinição posterior bloqueia a linha do participante e limita a 3 rascunhos do usuário naquela Mesa.

**Campos inseridos:** `mesa_id`, `jogador_id`, `nome`, `classe`, `nivel=1`, quatro Atributos, `pv_maximo/pv_atual`, `sa_maximo/sa_atual`, `bi_maximo/bi_atual`, `defesa`, `estado_ficha='rascunho'`.

**Cálculo encontrado na criação:** PV = base da Classe + VIG; SA = AGI + AST; BI = base de BI da Classe + AST; Defesa = 10 + AGI; BI atual inicial = 0. Não há Origem nem Parrudo nesse ponto inicial.

**Revisões:** nenhuma revisão estrutural explícita é criada nessa definição examinada.

**Riscos/pontos de atenção:**
1. Há duas versões com estratégias diferentes de lock e limites diferentes. A versão efetiva depende da ordem real de aplicação no ambiente.
2. O limite de 10 personagens da primeira definição e o limite de 3 rascunhos por jogador da redefinição não são a mesma regra. A política completa de personagens ativas precisa ser conferida com a ativação/ciclo e o cânone do produto.
3. O cálculo inicial é duplicado em outros RPCs; isso é uma das causas arquiteturais para centralizar os derivados.
4. A criação inicial não recebe revisão esperada; concorrência de criação é controlada por lock de Mesa/participante, conforme a versão aplicada.

### 3.2 Identidade — `definir_identidade_rascunho`

**Entrada:** ID do personagem, nome, objeto JSON de identidade.

**Autorização/lock:** usuário autenticado; personagem deve pertencer ao usuário, estar em rascunho e o usuário deve ser jogador da Mesa; bloqueia a linha do personagem.

**Validações:**
- nome aparado de 2 a 60 caracteres;
- identidade deve ser objeto JSON;
- chaves permitidas e limites:
  - `idade`, `genero`: 40;
  - `ocupacao`, `apelido`, `afiliacao`: 120;
  - `aparencia`, `personalidade`, `objetivo`, `medo`, `lacos`: 1000;
  - `historia`: 4000;
- valores devem ser strings; valores vazios são omitidos após aparar espaços.

**Campos gravados:** `nome`, `identidade`.

**Derivados/recursos:** não recalcula PV/SA/BI/Defesa.

**Revisões:** não há contador explícito nessa RPC.

**Ponto de atenção:** o campo `genero` participa da forma textual de tratamento em `conferenciaCriacao.ts`, mas não altera fórmula mecânica. Confirmar se o contrato de identidade está alinhado ao Planejamento v2.0 e à interface atual antes de mudar.

### 3.3 Origem — `definir_origem_rascunho`

**Definição relevante:** a migration `20261023043912_habilidade_origem_compatibilidade.sql` substitui a primeira versão, acrescentando a preservação do bônus de Parrudo no cálculo de BI.

**Entrada:** personagem, Origem, Perícia Treinada, Perícia extra opcional.

**Autorização/lock:** usuário autenticado; dono da ficha; estado rascunho; participante com papel jogador; bloqueia a linha da ficha.

**Validações:**
- Classe válida já definida;
- Origem deve ser uma das opções catalogadas;
- para Origens comuns, Perícia Treinada deve ser uma das duas Perícias oferecidas e `p_extra` deve ser nulo;
- Amnésico exige duas Perícias distintas, ambas dentro da lista geral, uma Treinada e uma extra.

**Campos gravados:** `origem`, `pericia_origem_treinada`, `pericia_origem_extra`, `defesa`, `sa_maximo`, `sa_atual`, `bi_maximo`, `bi_atual`.

**Derivados recalculados nessa RPC:**
- SA máxima = AGI + AST + 1 se Universitária;
- Defesa = 10 + AGI + 2 se Policial;
- BI máxima = base da Classe + AST + 2 se Cobaia + 3 se Parrudo.

**Política de recursos encontrada:**
- SA atual recebe a diferença entre SA máxima nova e anterior, limitada entre zero e a nova máxima; comentário diz preservar SA já gasta e ajustar apenas a diferença do bônus.
- BI atual é preservada; se exceder a nova BI máxima, a operação é rejeitada.
- PV não é recalculado.

**Revisões:** não há contador explícito nessa RPC.

**Riscos/pontos de atenção:**
1. O cálculo de SA/Defesa/BI é parcial e não consulta um contrato unificado de todas as fontes.
2. A política de SA atual é específica desta operação e não pode ser copiada automaticamente para Habilidade, Atributo ou evolução.
3. A versão inicial da RPC não considerava Parrudo; a migration de compatibilidade corrige esse ponto. Ordem de aplicação é essencial.
4. Efeitos condicionais das Origens não são resolvidos por esta RPC.
5. A escolha de arma do Operário não aparece nos parâmetros desta RPC; persistência dessa escolha precisa ser localizada/definida antes de considerar a Origem completa.

### 3.4 Perícias de Classe — `definir_pericias_rascunho`

**Entrada:** personagem e JSON com pontos por Perícia.

**Autorização/lock:** usuário autenticado; dono, rascunho, jogador aprovado; bloqueia linha do personagem.

**Validações:**
- somente nível 1;
- limite de pontos: Agente 4, Autodidata 5, Operador 3;
- lista permitida por Classe, acrescida da Perícia extra da Origem;
- Origem e Treinamento precisam estar definidos;
- Amnésico exige duas Perícias válidas e distintas;
- cada valor deve ser inteiro de 0 a 2;
- Perícia Treinada recebe +1 grau gratuito; o grau total não pode exceder 2 (Mestre);
- total de pontos distribuídos não pode exceder o limite da Classe;
- JSON deve ser objeto; apenas valores positivos são normalizados e persistidos.

**Campo gravado:** `pontos_pericia_classe` JSONB.

**Trigger:** `proteger_pericias_na_troca_origem` impede trocar Origem/Perícias gratuitas enquanto houver distribuição de pontos não vazia; é necessário primeiro salvar a distribuição vazia.

**Revisões:** não há contador explícito nessa RPC.

**Pontos de atenção:**
1. A proteção depende do valor persistido e do trigger; verificar em testes locais que qualquer caminho de atualização respeita o trigger.
2. A lista de Perícias permitidas e os limites também existem no TypeScript; divergência entre frontend e SQL é possível.
3. Esta RPC grava escolhas, mas não materializa totais de Perícia/Passivos como derivados.

### 3.5 Habilidade Básica — `definir_habilidade_rascunho`

**Entrada:** personagem e ID da Habilidade (nulo permite limpar a escolha).

**Autorização/lock:** usuário autenticado; dono, rascunho, jogador aprovado; bloqueia linha da ficha.

**Validações:** nível 1; Habilidade deve pertencer à Classe; se a Habilidade for nula, a validação permite limpar a escolha.

**Campos gravados:** `habilidade_basica`, `pv_maximo`, `pv_atual`, `bi_maximo`.

**Derivados recalculados:** PV máxima = base da Classe + VIG + 5 se Parrudo; BI máxima = base da Classe + AST + bônus da Origem Cobaia (+2) + Parrudo (+3).

**Política de recursos:** PV atual é ajustado pela diferença entre PV máximo novo e anterior, limitado entre zero e o novo máximo; BI atual não é alterada e a operação é rejeitada se BI atual exceder o novo máximo. SA e Defesa não são recalculadas.

**Revisões:** não há contador explícito nessa RPC.

**Pontos de atenção:**
1. É outro cálculo parcial de BI, repetindo regra que também está na RPC de Origem.
2. O cálculo de PV depende de valores previamente gravados; exige `pv_maximo` não nulo.
3. A função permite limpar Habilidade; validar se a interface e o fluxo de criação tratam a escolha pendente de forma coerente.
4. A migration de compatibilidade concede execução authenticated para esta função; a migration original revoga permissões, mas não concede. A ordem de aplicação é importante.

### 3.6 Equipamento inicial — `definir_equipamento_rascunho`

**Entrada:** personagem e opção A/B/C ou nulo.

**Autorização/lock:** usuário autenticado; dono, rascunho, jogador aprovado; bloqueia a linha da ficha.

**Validações:** nível 1, Classe definida, opção A/B/C ou nula; estima espaços ocupados e compara com 4 + FOR + 1 se Mochileiro.

**Campo gravado:** `equipamento_inicial`.

**Efeitos:** não cria itens, não altera recursos e não materializa Inventário ativo; comentário declara tratar apenas da escolha de criação.

**Revisões:** não há contador explícito nessa RPC.

**Pontos de atenção:**
1. A estimativa de espaços é codificada em SQL separadamente do catálogo TypeScript.
2. O SQL estima A como 5 espaços para Classes diferentes de Agente e 4 para Agente; B como 4; C como 3. Confirmar equivalência com os itens reais e com a regra de moedas restantes.
3. A capacidade depende da Origem Mochileiro e FOR, mas não há revisão esperada; concorrência entre alteração de Atributo/Origem e escolha do kit precisa de política comum.
4. A função não consulta disponibilidade de compras, porque não é a etapa de compras do conjunto C.

### 3.7 Compras iniciais — `salvar_compras_rascunho`

**Entrada:** personagem, plano JSON, revisão esperada.

**Autorização/lock:** usuário autenticado; dono, rascunho, jogador aprovado; bloqueia linha da ficha.

**Pré-condições:** nível 1, Classe definida, conjunto C (Personalizado).

**Validações:**
- revisão esperada não nula e não negativa;
- plano JSON objeto;
- catálogo SQL limitado a bastão, faca, colete acolchoado, colete leve, lanterna simples e munição 9 mm;
- quantidades numéricas inteiras de 0 a 3;
- cada item comprado deve estar liberado em `app_private.disponibilidade_compra_inicial` para a Mesa;
- orçamento total máximo de 3 Moedas;
- capacidade = 4 + FOR + 1 se Mochileiro;
- cálculo de espaços parte de 2 (Erva Verde e Lanterna), soma unidades/empilhamento e reserva 1 espaço se sobrar moeda.

**Campos gravados:** `compras_iniciais`, `revisao_compras`.

**Revisão/idempotência encontrada:**
- se plano normalizado for igual ao atual e revisão recebida for a atual ou atual - 1, retorna revisão atual sem duplicar;
- caso contrário, exige revisão recebida igual à atual;
- em mudança, incrementa revisão de compras em 1.

**Trigger:** `proteger_kit_com_compras` impede trocar o conjunto inicial se houver compras não vazias; deve-se salvar compras vazias antes.

**Pontos de atenção:**
1. Esta RPC persiste plano de compra, não materializa itens no Inventário.
2. Disponibilidade é consultada no momento do salvamento; bloqueios posteriores não removem automaticamente itens salvos, conforme observação na conferência frontend.
3. Revisão especializada não deve incrementar revisão estrutural.
4. A regra de moedas restantes e espaços precisa ser comparada com o Arquivo do Jogador e com `simularCompras`; SQL e TypeScript repetem o cálculo.
5. A verificação de idempotência com revisão atual - 1 é uma regra específica e precisa de testes de repetição/replay.

### 3.8 Disponibilidade de compras — Mestre

**RPCs:** `listar_disponibilidade_inicial` e `definir_disponibilidade_inicial`.

**Autorização:** `auth.uid()` deve corresponder a `mesas.mestre_id`; listagem consulta itens liberados; alteração bloqueia a linha da Mesa.

**Validações:** item pertence à lista fechada; parâmetros booleanos não nulos; a alteração compara o estado atual com o estado esperado enviado pelo cliente.

**Persistência:** tabela privada `app_private.disponibilidade_compra_inicial`, chave Mesa + item. RLS habilitada e acesso direto revogado na migration de compras.

**Revisões:** sem contador numérico; controle otimista usa estado booleano esperado.

**Pontos de atenção:**
1. A lista é por Mesa, não global.
2. A disponibilidade não é ativada automaticamente para Mesas existentes.
3. Confirmar que a tabela privada, funções e permissões foram instaladas no ambiente de teste antes de tratar o fluxo como funcional.
4. Remover disponibilidade não apaga compras já salvas; isso é intencionalmente distinto de editar o plano do personagem.

### 3.9 Funcionamento — `salvar_funcionamento_rascunho`

**Entrada:** personagem, configuração JSON, revisão esperada.

**Autorização/lock:** usuário autenticado; dono, rascunho, jogador aprovado; bloqueia linha da ficha.

**Pré-condições:** nível 1.

**Validações:**
- revisão não nula e não negativa;
- JSON objeto com exatamente `modo` e `preferenciasMisto`;
- modo em `automatico`, `misto`, `manual`;
- preferências exigidas: `municao`, `inventario`, `duracaoEfeitos`, `biInfectante`, `durabilidadeAparar`;
- as três primeiras e as duas últimas devem ser booleanas, com nulo permitido apenas nas duas últimas.

**Campos gravados:** `configuracao_funcionamento`, `revisao_funcionamento`.

**Revisão/idempotência:** configuração igual à atual e revisão atual ou atual - 1 retorna a revisão atual; mudança exige revisão atual e incrementa contador específico.

**Efeitos:** preferências de configuração; migration comenta expressamente que não executa automações de jogo.

### 3.10 Ativação e ciclo de vida — propostas locais

**Arquivos:** `supabase/proposals/ativacao-integrada-local.sql` e `supabase/proposals/ciclo-ficha-local.sql`.

**Status:** protótipos/propostas locais, não migration ativa.

**Comportamento já identificado na leitura anterior:**
- ativação valida ficha de nível 1, revisões esperadas, escolhas e contexto;
- materializa Inventário inicial a partir de Classe, equipamento, FOR, Origem e compras;
- ciclo de arquivar/assumir trata estado e propriedade da ficha;
- há locks de contexto e ficha, e comparações de revisões;
- alterações de propriedade/estado devem invalidar requisições antigas mesmo que não componham a revisão estrutural.

**Pendente:** inventário linha a linha das funções, ordem exata de locks, tabelas/colunas tocadas, condições de recibo/idempotência e dependências de triggers. Não integrar com base apenas neste resumo.

## 4. Matriz de campos e responsabilidade observada

| Campo/Grupo | Quem grava nos arquivos examinados | Tipo de dado | Revisão identificada |
|---|---|---|---|
| nome | criação e Identidade | estrutural/narrativo | sem contador explícito nas RPCs |
| classe, nível, FOR/AGI/VIG/AST | criação inicial | estrutural | sem contador explícito nas RPCs |
| identidade | Identidade | narrativo | sem contador explícito |
| origem, perícias gratuitas | Origem | estrutural | sem contador explícito |
| pontos_pericia_classe | Perícias | estrutural | sem contador explícito |
| habilidade_basica | Habilidade | estrutural | sem contador explícito |
| equipamento_inicial | Equipamento | escolha estrutural | sem contador explícito |
| compras_iniciais | Compras | plano de compra | `revisao_compras` |
| configuracao_funcionamento | Funcionamento | preferência de automação | `revisao_funcionamento` |
| PV/SA/BI atuais | criação e RPCs específicas; demais operações não mapeadas aqui | recurso atual | não deve ser confundido com revisão estrutural |
| PV/SA/BI máximos e Defesa | criação, Origem e Habilidade | derivados parcialmente duplicados | sem contador explícito nas RPCs examinadas |
| Inventário materializado | proposta de ativação local | estado operacional | revisão de inventário aparece na proposta local |
| estado_ficha/jogador_id | criação e ciclo local | ciclo de vida/propriedade | requer invalidação própria |

## 5. Divergências e riscos transversais

1. **Cálculos duplicados:** criação, Origem e Habilidade calculam subconjuntos de PV/SA/BI/Defesa em momentos diferentes. A compatibilidade Parrudo/Cobaia precisou de migration posterior.
2. **Políticas diferentes para recursos atuais:** Origem ajusta SA por diferença e preserva BI; Habilidade ajusta PV por diferença e preserva BI. Isso não constitui uma política geral aprovada para todas as operações.
3. **Revisão incompleta:** Compras e Funcionamento possuem revisões especializadas; as demais RPCs examinadas não recebem revisão esperada nem incrementam revisão estrutural.
4. **Locks por personagem:** várias RPCs bloqueiam a ficha, mas isso não serializa automaticamente operações que leem ou alteram contexto compartilhado da Mesa. A ordem global de locks deve ser auditada.
5. **Duplicação SQL/TypeScript:** listas de Origens, Perícias, Classes, equipamentos, compras, limites e fórmulas aparecem em mais de uma camada.
6. **Efeitos condicionais não são derivados permanentes:** benefícios como Vantagem, Reação, cura, bônus situacionais e PV Temporários exigem serviços/contexto de jogo e não devem ser somados a PV/SA/BI/Defesa como se fossem bônus permanentes.
7. **Migrations históricas e estado remoto:** não foi verificado quais migrations estão aplicadas no Supabase remoto. O repositório contém comentários de proposta/teste e versões substituídas.
8. **Segurança além de GRANT:** é necessário conferir RLS, grants de tabela/coluna, SECURITY DEFINER, search_path, triggers e chamadas indiretas em conjunto.

## 6. Decisões já registradas que este inventário respeita

- Solução A aprovada como direção: revisão estrutural por allowlist explícita; recursos atuais e revisões especializadas ficam fora dela.
- PV/SA/BI atuais não devem ser recalculados como máximos.
- Regra da Casa mantém derivados personalizados; retorno a Padrão exige prévia e confirmação.
- Progressão é aplicada nível a nível, com autorização, elegibilidade e escolhas de cada etapa.
- Descanso Completo elegível durante evolução restaura PV ao novo máximo e SA integralmente; BI não é reduzida automaticamente.
- O cálculo unificado deve ser determinístico, idempotente, rastreável, transacional e validado no servidor.

## 7. Lacunas que impedem implementação segura

Antes de alterar qualquer RPC, ainda precisamos:
1. inspecionar por inteiro as duas propostas locais de ativação/ciclo e todos os triggers associados;
2. mapear as políticas RLS e privilégios das tabelas relevantes, incluindo funções auxiliares e ownership;
3. confirmar o contrato real de `revisao_criacao`, `revisao_inventario`, `revisao_compras`, `revisao_funcionamento` e recibos na proposta local;
4. conferir se `metodo_criacao` e os overrides da Regra da Casa já existem em schema/propostas e quais operações os alteram;
5. localizar persistência da escolha de arma do Operário;
6. comparar limites de kit e compras com as regras integrais do Arquivo do Jogador;
7. construir testes de repetição, revisão desatualizada, duas sessões, troca de Origem/Habilidade e falha parcial;
8. verificar o estado do ambiente de teste por evidência própria, sem inferir a partir do Git.

## 8. Próxima etapa documental

A próxima auditoria deve ser dedicada às propostas locais de ativação e ciclo de vida, pois elas concentram materialização de Inventário, revisão estrutural, revisão de Inventário, recibos e transferência de propriedade. Depois disso, consolidaremos uma matriz de cálculo de nível 1 com casos de teste esperados antes de escrever a função pura em TypeScript.

**Nenhuma alteração de código, migration, banco remoto, teste automatizado ou publicação foi realizada por este documento.**
