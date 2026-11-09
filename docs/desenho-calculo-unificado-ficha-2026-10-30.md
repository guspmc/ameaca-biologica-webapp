# Desenho técnico — cálculo unificado da ficha — 30/10/2026

**Status:** proposta técnica para revisão; não é implementação aprovada.  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Base examinada:** código TypeScript e migrations/propostas citadas na auditoria de Origens; proposta de allowlist de revisão; Arquivo do Jogador v1.0 e Planejamento v2.0.  
**Sem execução:** nenhuma migration, SQL, alteração de frontend, teste, operação no Supabase ou publicação foi realizada.

## 1. Objetivo

Evitar que cada operação (Origem, Habilidade, Atributo, nível, equipamento) mantenha uma cópia própria das fórmulas e, ao atualizar um campo, apague bônus calculados por outra operação.

O cálculo unificado deve:
1. receber um estado persistido e validado da ficha;
2. calcular valores derivados de maneira determinística;
3. devolver resultados e uma lista explicável de fontes;
4. ser executado/validado no servidor, dentro da mesma transação que salva a escolha;
5. não alterar recursos atuais como se fossem máximos;
6. não resolver efeitos condicionais sem o contexto de jogo necessário.

A interface pode apresentar prévias, mas a prévia do cliente não substitui o resultado autoritativo do servidor.

## 2. Evidência do estado atual

### 2.1 Frontend

- `src/conferenciaCriacao.ts` calcula PV, SA, BI, Defesa e capacidade de Inventário para conferir uma ficha de nível 1.
- O cálculo já inclui bônus específicos de Origem (Policial, Universitária, Cobaia, Mochileiro) e Habilidade Básica (Parrudo).
- `src/origens.ts` guarda benefícios como texto; não existe ali um modelo estruturado genérico de efeitos.
- `src/habilidades.ts` cataloga apenas as Habilidades Básicas iniciais.
- `src/classesFicha.ts` mantém dados de Classe, mas fórmulas de recursos também aparecem em outros arquivos.
- A conferência de criação declara expressamente que cobre nível 1; não é um mecanismo de evolução.

### 2.2 Banco e propostas

- A migration Alfa 0.4 estabelece colunas básicas de ficha e criação inicial; seu comentário informa que Origem, Treinamento, Equipamento, Habilidades e Inventário seriam implementados progressivamente.
- A migration `20261022000600_origens_rascunhos.sql` declara-se proposta/rascunho e contém RPC que calcula SA, BI e Defesa ao definir Origem.
- A migration `20261023042414_habilidade_basica_rascunhos.sql` contém cálculo de Parrudo para PV/BI.
- A migration de compatibilidade `20261023043912_habilidade_origem_compatibilidade.sql` precisou considerar Parrudo no cálculo de BI, para que a troca de Origem não perdesse o bônus da Habilidade.
- O protótipo local `supabase/proposals/ativacao-integrada-local.sql` recalcula capacidade de Inventário a partir de FOR e Mochileiro, mas é proposta local, não migration ativa.

**Limite da evidência:** a presença desses arquivos no Git não comprova que tenham sido aplicados ao banco remoto. Este documento não afirma o estado remoto das migrations.

## 3. Separação obrigatória de dados

O modelo deve distinguir cinco grupos, sem os misturar numa coluna genérica de “bônus”.

### A. Escolhas estruturais

Dados escolhidos e persistidos pelo jogador, sujeitos à autorização e validação:
- Classe e Origem;
- Atributos;
- Perícia da Origem que recebe Treinamento e eventual Perícia adicional;
- Habilidades adquiridas, ramo e nível de aquisição;
- escolhas internas exigidas por uma Habilidade/Origem (ex.: arma do Operário);
- equipamento e escolhas de compras;
- método Padrão ou Regra da Casa.

Esses dados devem ter validação canônica no servidor. Não aceitar do cliente um total de bônus calculado.

### B. Valores derivados permanentes

Calculados exclusivamente a partir das escolhas válidas e do método de criação:
- PV Máximos;
- SA Máxima;
- BI Máxima;
- Defesa básica e Defesa final conforme equipamento/modificadores aplicáveis;
- capacidade de Inventário;
- valores de Perícia e Passivos, quando aplicável;
- categorias-base de Dano ou parâmetros derivados de arma quando a regra os determinar.

O cálculo deve retornar também a origem de cada parcela (Classe, Atributo, Origem, Habilidade, equipamento ou outra fonte canônica), para permitir explicação, auditoria e reversão.

### C. Recursos atuais

Estado de jogo, não fórmula de ficha:
- PV atual;
- SA atual;
- BI atual.

O cálculo de máximos não deve restaurar, gastar, curar ou reduzir recursos atuais implicitamente. A operação que altera máximo precisa declarar a política para o atual e validar limites na mesma transação.

Exceções já definidas no cânone:
- na criação, valores iniciais são preenchidos conforme as regras da ficha;
- ao evoluir durante Descanso Completo elegível, PV atual termina no novo máximo e SA é recuperada integralmente;
- Descanso Completo não reduz BI automaticamente;
- alterações de máximo durante jogo não autorizam apagar recursos acumulados silenciosamente.

A política exata para alterações de Origem/Habilidade durante um rascunho deve continuar explícita na RPC de operação; não inferir que toda mudança de máximo deva preservar atual pela mesma fórmula.

### D. Efeitos de resolução/contextuais

Não entram nos valores permanentes:
- Vantagem/Desvantagem em um Teste;
- +5 de Atleta/Investigador em Teste elegível mediante gasto de SA;
- cura adicional de Agente de Saúde;
- bônus de Ajudar de Servidor Público;
- gatilhos de Reação/Surpresa;
- dano adicional condicionado, manobras, interrupções e efeitos de armas;
- efeitos condicionais de Habilidades de Classe.

São avaliados no módulo/serviço que resolve o evento, recebendo contexto suficiente (ação, alvo, arma, estado, distância, turno, rodada, recurso disponível etc.).

### E. Estados temporários e usos limitados

Exigem registro de estado com origem e validade:
- Vantagem no próximo Teste/Ataque;
- Atordoado e outras Condições;
- PV Temporários;
- benefícios até fim do turno/próximo turno;
- usos por Descanso Completo ou sessão;
- efeitos ativados e não consumidos.

O estado precisa identificar a fonte para evitar duplicação e permitir expiração/consumo. A política de concorrência (duas sessões consumindo o mesmo uso) deve ser transacional.

## 4. Contrato proposto do cálculo

Nome conceitual, ainda não nome de função SQL aprovado:

`calcular_estado_derivado_ficha(estado_validado, regras_versionadas)`

Entrada lógica:
- identificador e revisão da ficha;
- método de criação;
- Classe, nível, Atributos, Origem e escolhas;
- Habilidades e nível de aquisição;
- Perícias/Treinamento;
- equipamento relevante;
- parâmetros canônicos da versão do livro/regra.

Saída lógica:
- valores derivados;
- parcelas/fontes que compõem cada valor;
- avisos de incompatibilidade ou dados ausentes;
- versão do conjunto de regras utilizado.

A função não deve receber do cliente os totais derivados como fonte de verdade. Se o cliente enviar valores para exibir uma prévia, o servidor recalcula e compara.

### Propriedades obrigatórias

1. **Determinística:** mesmo estado validado + mesma versão de regras = mesmo resultado.
2. **Idempotente:** executar novamente não soma bônus outra vez.
3. **Composição:** Origem, Habilidades, Classe, Atributos e equipamento contribuem para a mesma avaliação; nenhum RPC parcial pode esquecer outra fonte.
4. **Rastreabilidade:** cada parcela tem uma fonte identificável.
5. **Validação:** rejeitar escolha/pré-requisito inválido antes de persistir.
6. **Transacional:** salvar escolha, atualizar revisão e persistir derivados na mesma transação.
7. **Concorrência:** exigir revisão esperada; conflito não sobrescreve escolhas concorrentes.
8. **Regra da Casa:** não sobrescrever valores manualmente personalizados; retornar prévia e exigir confirmação ao voltar para Padrão, conforme Planejamento v2.0.

## 5. Fórmulas e contribuições conhecidas

As expressões abaixo são transcritas/organizadas a partir das regras já localizadas. A lista não substitui a conferência de todas as fontes e exceções do livro.

| Derivado | Fórmula-base | Fontes/observações |
|---|---|---|
| PV Máximos | (PV da Classe + VIG) × Nível + bônus aplicáveis | Parrudo concede +5 PV Máximos; demais bônus permanentes devem vir do catálogo canônico. |
| SA Máxima | AGI + AST + bônus aplicáveis | Universitária +1. |
| BI Máxima | BI base da Classe + AST + bônus aplicáveis | Cobaia +2; Parrudo +3. |
| Defesa | 10 + contribuição de AGI + modificadores aplicáveis | Policial +2; equipamento e outros modificadores conforme regra. |
| Inventário | 4 + FOR + modificadores/expansões aplicáveis | Mochileiro +1; Bolsa/Pochete não acumulam conforme regra localizada. |
| Perícia | Atributo associado + Treinamento + modificadores permanentes | Vantagem e bônus contextuais não alteram o total-base. |
| Passivo | 10 + total da Perícia | Não incorporar bônus condicionais ao Passivo sem regra expressa. |

### Observação sobre nível

A conferência atual só aceita nível 1 e calcula PV como base da Classe + VIG. A fórmula geral do livro multiplica por Nível. O futuro cálculo deve usar a fórmula geral e também preservar a regra de criação/evolução e os efeitos específicos por nível. Não alterar a conferência atual para níveis maiores sem implementar a sequência de progressão autorizada.

## 6. Fluxo transacional proposto

1. Receber operação e revisão esperada da ficha/contexto.
2. Carregar e bloquear a ficha e o contexto de Mesa necessários.
3. Validar jogador, vínculo, estado, método, nível máximo autorizado e revisão.
4. Validar a escolha específica (Origem, Habilidade, Atributo, Perícia etc.).
5. Montar estado completo a partir do banco, nunca de totais fornecidos pelo cliente.
6. Calcular todos os derivados pela mesma função/composição.
7. Aplicar política explícita de recursos atuais para aquela operação.
8. Persistir escolhas, derivados, revisão e recibo na mesma transação.
9. Responder com resultado confirmado e fontes dos valores.

O detalhe de locks, ordem de bloqueio e tabelas de estado deve ser definido junto à auditoria de concorrência e RLS; não copiar automaticamente a ordem de locks do protótipo local sem revisar todas as RPCs relacionadas.

## 7. Revisões e operações

Manter conceitos independentes:
- revisão estrutural da criação/ficha (allowlist aprovada como direção);
- revisão específica de compras;
- revisão específica de funcionamento;
- revisão de inventário;
- revisão/contexto de progressão;
- estado de efeitos temporários/usos.

Uma alteração operacional de PV/SA/BI não deve incrementar a revisão estrutural. Alteração de Inventário não deve incrementar a revisão estrutural por tabela. Entretanto, mudanças de propriedade/estado de ciclo (arquivar, assumir, perder nível) precisam invalidar pedidos incompatíveis por revisão/recibo próprio, mesmo não sendo escolhas estruturais.

## 8. Regra da Casa

O modo Regra da Casa não deve ser tratado como uma lista de exceções espalhadas no código.
- Guardar quais derivados foram personalizados e seus valores.
- Não sobrescrever esses valores quando atributos, nível ou equipamento mudarem, segundo o comportamento aprovado no Planejamento v2.0.
- Ao retornar para Padrão, calcular prévia oficial com todas as fontes válidas.
- Exibir diferenças e pedir confirmação explícita antes de substituir valores manuais.
- Preservar histórico/revisão da confirmação.

O formato exato de persistência desses overrides ainda precisa ser confrontado com o schema/propostas existentes antes de qualquer migration.

## 9. Lacunas antes da implementação

1. Conferir todas as fórmulas e exceções do Arquivo do Jogador v1.0, incluindo Defesa, Perícias, Passivos, equipamento, PV/SA/BI e Inventário.
2. Catalogar efeitos permanentes de todas as Habilidades e Origens com referência precisa.
3. Identificar todas as operações RPC existentes, suas permissões, colunas gravadas e revisões.
4. Conferir como Regra da Casa persiste os valores personalizados.
5. Definir política de recurso atual para cada operação (criação, alteração de Origem no rascunho, evolução, perda de nível, equipamento).
6. Definir modelo de progressão por etapa e autorização do Mestre, incluindo escolhas e efeitos automáticos.
7. Definir armazenamento e consumo concorrente de efeitos temporários/usos.
8. Validar com testes PostgreSQL locais/transacionais e testes entre duas contas antes de qualquer aplicação remota.

## 10. Sequência mínima de implementação sugerida

**Etapa 1 — inventário de contratos:** listar cada RPC, tabela/campo, permissão, revisão e efeito colateral. Sem alterar schema.

**Etapa 2 — função pura de cálculo:** implementar cálculo completo e testável para criação nível 1, comparando com os resultados atuais. Ainda sem substituir RPCs.

**Etapa 3 — integração transacional:** substituir progressivamente cálculos parciais por chamada única, começando pelo fluxo de rascunho/criação; manter compatibilidade e rollback.

**Etapa 4 — progressão:** aplicar nível por nível, validando autorização, descanso elegível, escolhas e recálculo. Não conceder níveis em lote.

**Etapa 5 — efeitos de jogo:** integrar condicionais e temporários aos serviços de resolução correspondentes quando esses módulos existirem.

Cada etapa exige revisão do usuário e evidência de testes antes da próxima. Nenhuma publicação deve ser inferida da conclusão documental.

**Este desenho não autoriza migration, execução SQL, alteração do banco remoto, publicação ou mudança no cânone.**
