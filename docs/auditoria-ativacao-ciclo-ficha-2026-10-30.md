# Auditoria das propostas locais de ativação e ciclo de ficha — 30/10/2026

**Status:** leitura estática de propostas locais; nenhum SQL foi executado.
**Arquivos:** `supabase/proposals/ativacao-integrada-local.sql` e `supabase/proposals/ciclo-ficha-local.sql`.
**Dependências declaradas:** propostas locais de inventário por instância, ativação, resumo operacional e ciclo de ficha.
**Aviso:** os próprios arquivos proíbem aplicação remota isolada. Não são migrations instaladas no Supabase.

## 1. Objetivo e limites

Esta auditoria aprofunda a etapa posterior ao preenchimento do rascunho: validação final, materialização do Inventário, ativação, resumo operacional do Mestre, arquivamento e retomada de personagem. Registra dependências, ordem de bloqueios, revisões, recibos, alterações de propriedade e riscos encontrados.

A leitura é estática. Não comprova compilação SQL, execução em PostgreSQL, políticas efetivas do ambiente, concorrência real nem comportamento da interface.

## 2. Componentes encontrados

### 2.1 Inventário por instância — pacote integrado

Tabelas privadas:
- `app_private.materializacoes_inventario`: uma linha por personagem; guarda fonte JSON e quantidade de instâncias materializadas.
- `app_private.inventario_instancias`: instâncias individualizadas, com chave de criação única por personagem e dados JSON.

Ambas têm RLS habilitada e acesso direto revogado para `public`, `anon` e `authenticated`.

Funções:
- `app_private.catalogo_inventario_criacao(text)`: catálogo fechado de dados iniciais para os itens previstos.
- `app_private.persistir_inventario_criacao(uuid)`: materializa itens iniciais do rascunho.

**Contrato observado de materialização:**
1. exige usuário autenticado, dono da ficha e jogador participante da Mesa;
2. bloqueia a linha da ficha;
3. exige rascunho de nível 1, Classe e kit válidos;
4. valida FOR entre 0 e 3 e Origem dentro da lista fechada;
5. monta uma fonte JSON com Classe, kit, FOR, Origem, nível e compras;
6. se já existe materialização, compara a fonte: se igual, retorna a quantidade anterior; se diferente, rejeita;
7. calcula capacidade como 4 + FOR + 1 se Mochileiro;
8. inclui itens característicos da Classe, Erva Verde e Lanterna;
9. adiciona itens do kit A/B ou compra personalizada do kit C;
10. divide munição e moedas em pilhas de acordo com limites;
11. insere instâncias com chave de criação determinística e dados de estado;
12. rejeita se os espaços ocupados excederem a capacidade;
13. atualiza a quantidade total materializada.

**Efeito importante:** a operação é protegida contra duplicação por uma linha de materialização única e pela comparação da fonte. A transação precisa garantir rollback completo se qualquer inserção ou validação falhar.

**Pontos pendentes:**
- confirmar todos os valores de estado do catálogo contra o Arquivo do Jogador;
- verificar se itens característicos ocupam zero espaços por regra e se o inventário considera corretamente itens vinculados;
- conferir equivalência exata de compras, saldo e capacidade entre TypeScript, RPC de compra e materialização;
- auditar todos os triggers que alteram instâncias e revisões.

### 2.2 Contexto de criação por Mesa

Tabela `app_private.contextos_criacao_mesa`:
- `mesa_id` (PK/FK);
- `metodo` (`padrao` ou `casa`);
- `nivel_inicial` (1 a 10);
- `permite_criacao`;
- `revisao`;
- `sequencia_ativacao`.

RLS habilitada e acesso direto revogado.

Trigger `versionar_contexto_criacao`:
- impede mudar `mesa_id`;
- incrementa `revisao` quando método, nível inicial ou permissão de criação mudam;
- não incrementa quando somente outros campos mudam.

**Distinção:** `revisao` representa alterações de configuração da Mesa; `sequencia_ativacao` é incrementada para serializar operações de ativação/ciclo. Não são o mesmo contador.

### 2.3 Revisão estrutural da ficha

A proposta adiciona:
- `personagens.revisao_criacao`;
- `personagens.metodo_criacao`.

O trigger atual `versionar_criacao` compara a linha inteira, exceto `revisao_criacao`, e incrementa quando qualquer outro campo muda.

**Defeito já identificado e decisão aprovada:** essa comparação ampla também incrementa a revisão estrutural quando campos operacionais, como `revisao_inventario`, mudam. Gus aprovou a Solução A: substituir a comparação ampla por allowlist explícita de campos estruturais. O documento `docs/proposta-allowlist-revisao-ficha-2026-10-30.md` registra a direção.

**Não confundir:** a proposta de trigger existente ainda contém a comparação ampla. A decisão aprovada ainda não significa que o SQL foi corrigido.

### 2.4 Recibos de ativação

Tabela privada `app_private.ativacoes_ficha`:
- chave primária `personagem_id`;
- `operacao_id` único;
- Mesa e usuário;
- revisão da ficha e revisão da Mesa solicitadas;
- resposta JSON.

RLS habilitada; acesso direto revogado.

**Semântica observada:** uma ficha pode ter um recibo de ativação. Repetir exatamente a mesma operação pelo mesmo usuário e com as mesmas revisões retorna a resposta gravada. Uma operação diferente para personagem já ativado é rejeitada. O identificador de operação também não pode ser reutilizado em outro recibo.

Isso é proteção de idempotência, não autorização para repetir uma operação com dados/revisões diferentes.

## 3. Validação final da criação nível 1

Função `app_private.validar_criacao_nivel_um(personagens)` confere, entre outros pontos:
- nível 1 e Classe conhecida;
- nome e identidade;
- distribuição inicial de Atributos;
- Origem e Perícia Treinada;
- escolhas distintas de Amnésico;
- JSON de pontos de Perícia, Perícias permitidas e soma exata dos pontos da Classe;
- Habilidade Básica compatível com a Classe;
- PV, SA, BI máximos e Defesa iguais aos derivados recalculados;
- recursos atuais não nulos e dentro dos máximos;
- configuração Automático/Misto/Manual e preferências;
- plano de compras e revisão coerentes.

A função calcula novamente PV/SA/BI/Defesa e rejeita valores armazenados divergentes. Ela não corrige silenciosamente o rascunho; solicita revisão.

**Importante:** esta validação final é uma segunda barreira de servidor. Não substitui a validação das RPCs de edição e não demonstra que o cliente exibe a mesma regra.

**Ponto de atenção identificado:** a validação exige que todos os pontos de Perícia da Classe estejam distribuídos (`total = limite`), enquanto a RPC de rascunho permite salvar distribuição parcial (`total <= limite`). Isso parece intencional para permitir preenchimento progressivo, mas deve ser confirmado no fluxo e na interface.

## 4. Ativação transacional

Função proposta `app_private.ativar_ficha_local` recebe personagem, ID de operação, revisão esperada da ficha e revisão esperada da Mesa.

### 4.1 Ordem de autorização e locks observada

1. autenticação e validação dos parâmetros;
2. identifica Mesa somente se personagem pertence ao usuário, jogador está aprovado e Mestre não é o próprio usuário;
3. bloqueia a Mesa com `FOR NO KEY UPDATE`;
4. bloqueia o vínculo do jogador com `FOR SHARE`;
5. bloqueia a ficha com `FOR UPDATE`;
6. verifica recibo anterior;
7. bloqueia o contexto de criação com `FOR SHARE`.

O comentário do SQL documenta a intenção da ordem Mesa → vínculo → ficha → contexto. A criação inicial do rascunho tem estratégia de lock diferente, registrada na auditoria das operações; qualquer integração precisa testar a compatibilidade dessas ordens para evitar deadlock.

### 4.2 Condições de ativação

- rascunho pertence ao usuário e permanece na Mesa;
- usuário continua jogador aprovado;
- contexto da Mesa existe;
- método é Padrão;
- nível inicial e ficha estão no nível 1;
- criação está permitida;
- revisão estrutural da ficha e revisão do contexto correspondem às esperadas;
- Mesa não excede 10 jogadores;
- personagens completas na Mesa são menos de 10;
- validação integral do rascunho passa.

Rascunhos não ocupam vaga de personagem ativa; personagens completas legadas contam para o teto.

### 4.3 Efeitos atômicos

- incrementa `sequencia_ativacao` do contexto;
- valida a ficha;
- materializa o Inventário;
- muda `estado_ficha` para completa e `metodo_criacao` para Padrão;
- captura a revisão estrutural resultante;
- grava recibo com IDs, estado, quantidade de instâncias e revisão.

A intenção é que falha em qualquer etapa reverta todo o conjunto. Isso precisa de teste transacional local.

### 4.4 Limitações explícitas

A ativação local só contempla criação Padrão de nível 1. Embora o contexto comporte método Casa e nível inicial até 10, a função rejeita qualquer configuração diferente. Portanto, esses campos não indicam que Regra da Casa ou criação em níveis superiores estejam implementadas.

## 5. Resumo operacional do Mestre e privacidade

A proposta define funções auxiliares para:
- verificar jogador admitido;
- verificar se o jogador possui personagem ativa;
- calcular Passivos normais;
- gerar resumo operacional da Mesa para o Mestre.

O resumo é uma projeção fechada: nome, Classe, nível, PV/SA/BI atuais e máximos, Defesa, Passivos e campo de Condições nulo. A função verifica que o solicitante é Mestre da Mesa.

A política proposta não dá ao Mestre leitura da ficha completa. Para visualizar personagens de outros jogadores, exige que o usuário seja jogador admitido e tenha personagem ativa na mesma Mesa; o Mestre fica fora dessa condição de leitura geral.

**Pontos pendentes de segurança:**
- revisar a política RLS anterior completa e a combinação de permissões permissivas/restritivas;
- conferir se a função SECURITY DEFINER acessa somente dados necessários e se a projeção não pode ser ampliada por parâmetros;
- confirmar se `passivos_normais` cobre somente os Passivos canônicos e se o mapeamento Atributo/Perícia está correto;
- verificar acesso direto às tabelas privadas e todas as grants efetivas;
- testar duas contas reais distintas e uma conta Mestre, incluindo tentativas de acesso cruzado.

## 6. Ciclo de ficha: arquivar e assumir

A proposta `ciclo-ficha-local.sql`:
- amplia estado permitido para rascunho/completa/arquivada;
- adiciona `revisao_inventario`;
- dá às instâncias Inventário Mesa, portador, destino e vínculo;
- preserva `personagem_id` como proveniência original da instância;
- impede alterar ID, personagem de origem, Mesa e chave de criação da instância;
- incrementa revisão de Inventário quando instâncias são inseridas, atualizadas ou removidas;
- impede exclusão individual de ficha completa/arquivada;
- apaga rascunhos do jogador quando sua participação é removida;
- cria recibos para operações de arquivar/assumir.

### 6.1 Arquivar

Prévia `prever_arquivamento_local`:
- só Mestre da Mesa pode consultar personagem completa;
- lista itens comuns carregados pelo personagem, destinados ao personagem;
- não inclui itens característicos.

Execução `executar_ciclo_ficha_local`:
- somente Mestre pode arquivar;
- valida ID da operação, revisão e tipo;
- bloqueia Mesa, ficha e contexto serializador;
- confere revisão estrutural esperada e estado completo;
- move as mesmas instâncias comuns para destino Baú e remove o portador;
- altera estado para arquivada e remove `jogador_id`;
- grava recibo.

**Não cria cópias:** o SQL declara mover as mesmas linhas/IDs, preservando dados de arma, peças e munição.

### 6.2 Assumir

- somente jogador aprovado, não Mestre, pode assumir;
- ficha precisa estar arquivada;
- bloqueia Mesa, vínculo e ficha;
- verifica revisão e estado;
- incrementa sequência do contexto;
- respeita limite de 10 personagens completas;
- altera estado para completa e atribui `jogador_id` ao jogador;
- grava recibo.

O trecho examinado não move automaticamente itens do Baú para o personagem ao assumir. Isso deve ser entendido como operação distinta e precisa ser confirmado no desenho de Inventário/Baú, sem inferir transferência automática.

### 6.3 Idempotência do ciclo

A tabela `operacoes_ciclo_ficha` usa `operacao_id` como chave primária e guarda personagem, Mesa, usuário, tipo, revisão pedida e resposta. Repetição retorna a resposta anterior somente se os dados e a situação atual forem compatíveis; caso contrário, rejeita.

### 6.4 Saída e remoção

- `excluir_rascunho_local` exige confirmação explícita, jogador admitido, contexto permitindo criação e revisão correta; apaga somente rascunho.
- `sair_mesa_local` exige confirmação explícita, bloqueia Mesa e vínculo, e remove a participação do jogador.
- trigger `apagar_rascunhos_na_saida_local` exclui rascunhos do jogador quando o vínculo é removido.
- trigger de proteção impede exclusão individual de fichas não rascunho enquanto a Mesa existe.

Esses comportamentos são propostas locais e precisam de testes específicos de remoção pelo Mestre, saída voluntária e exclusão de Mesa.

## 7. Revisões: mapa e separação

| Revisão/contador | Escopo | Gatilho ou operação observada |
|---|---|---|
| `revisao_criacao` | escolhas estruturais da ficha | trigger amplo atual; deve virar allowlist aprovada |
| `contextos_criacao_mesa.revisao` | método, nível inicial, permissão de criação | trigger de contexto |
| `sequencia_ativacao` | serialização de ativação/ciclo | incremento dentro das operações |
| `revisao_compras` | plano de compra | RPC de compras |
| `revisao_funcionamento` | preferências de funcionamento | RPC de funcionamento |
| `revisao_inventario` | estado das instâncias | trigger de instâncias |
| `operacao_id` | idempotência de ativação/ciclo | tabelas de recibos |

**Regra arquitetural:** não fundir esses contadores. Cada um protege uma dimensão distinta. Recursos atuais PV/SA/BI também não devem incrementar revisão estrutural apenas por serem alterados.

## 8. Riscos e decisões necessárias antes de implementação

1. **Trigger estrutural amplo:** corrigir para allowlist explícita antes de integrar novas operações. A allowlist proposta precisa ser conferida com todos os campos e com `metodo_criacao`.
2. **Locks e deadlocks:** documentar uma ordem global para Mesa, vínculo, ficha, contexto e instâncias; testar operações concorrentes e remoção de participante.
3. **Inventário idempotente:** testar falha no meio da materialização, repetição da mesma ativação e tentativa com fonte alterada.
4. **Revisão do Inventário:** confirmar se atualizações feitas por triggers causam somente revisão especializada e não revisão estrutural após correção da allowlist.
5. **Regra da Casa:** contexto aceita Casa, mas ativação rejeita; persistência de overrides ainda não está demonstrada. Não implementar Casa como se estivesse pronta.
6. **Operário:** escolha da arma especial não aparece na fonte JSON de materialização; localizar/definir antes de fechar a criação.
7. **Baú:** arquivamento move itens comuns, mas a retomada não apresenta transferência automática no trecho analisado. Definir fluxo de retirada conforme Planejamento v2.0 antes de implementar.
8. **Privacidade:** testar políticas e funções com Mestre, dono, outro jogador ativo, jogador sem personagem ativa, participante removido e usuário de outra Mesa.
9. **Limites:** validar simultaneidade de criação/ativação/assunção e teto de jogadores/personagens com duas sessões.
10. **Exclusão:** política de apagar rascunho ao sair/remover precisa ser confrontada com o comportamento aprovado e com preservação de fichas completas/arquivadas.

## 9. Matriz mínima de testes a preparar

| Cenário | Resultado esperado |
|---|---|
| Ativar com revisão exata | uma ficha completa, um conjunto de instâncias, um recibo |
| Repetir mesmo ID e mesmas revisões | mesma resposta; sem duplicar instâncias |
| Repetir com outro ID para ficha ativada | rejeição |
| Ativar com revisão de ficha desatualizada | conflito; rascunho preservado |
| Ativar com revisão da Mesa desatualizada | conflito; rascunho preservado |
| Falhar validação de ficha | nenhuma materialização nem mudança de estado |
| Falhar capacidade durante materialização | rollback integral |
| Duas ativações concorrentes na mesma Mesa | teto respeitado; sem dupla ativação |
| Arquivar com revisão correta | itens comuns movidos ao Baú; ficha arquivada |
| Assumir ficha arquivada | jogador passa a dono; teto respeitado |
| Repetir operação de ciclo | resposta anterior sem repetir efeito |
| Alterar instância do Inventário | revisão de Inventário incrementa |
| Alterar somente Inventário | revisão estrutural não deve incrementar após correção |
| Remover jogador | rascunhos removidos conforme política; ficha completa preservada |
| Conta de outra Mesa consulta resumo | negado |
| Mestre tenta consultar ficha completa | negado; somente resumo operacional |

## 10. Próxima etapa

Com os contratos de criação e as propostas de ativação/ciclo inventariados, o próximo artefato deve ser a **matriz de cálculo de nível 1 e seus casos de teste**, contendo:
- cada combinação válida de Classe, Origem e Habilidade Básica;
- parcelas e fontes de PV/SA/BI/Defesa/Inventário;
- Perícias e Passivos;
- política explícita para recursos atuais;
- casos negativos e de compatibilidade;
- comparação entre conferência TypeScript, validação SQL e cânone.

Só depois da aprovação dessa matriz faz sentido implementar uma função pura em TypeScript, ainda sem substituir RPCs.

**Nenhuma migration, SQL, alteração de frontend, teste automatizado, operação no Supabase ou publicação foi executada nesta auditoria.**
