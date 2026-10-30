# Auditoria das Origens — código e persistência — 30/10/2026

**Branch:** fix/lan-websocket-reconnect-2026-10-29  
**Status:** auditoria estática de arquivos do repositório. Não foram executados testes nem SQL.  
**Fontes canônicas:** Arquivo do Jogador v1.0, páginas impressas 23–25.  
**Escopo:** comparar o catálogo canônico de Origens com o código TypeScript e as propostas/migrations encontradas no repositório.

## 1. Arquivos inspecionados

- `src/origens.ts`
- `src/conferenciaCriacao.ts`
- `src/pericias.ts`
- `supabase/migrations/20261022000500_fichas_personagem_alfa04.sql`
- `supabase/migrations/20261022000600_origens_rascunhos.sql`
- `supabase/migrations/20261023035943_pericias_criacao_rascunhos.sql`
- `supabase/migrations/20261023043912_habilidade_origem_compatibilidade.sql`
- `supabase/migrations/20261023042414_habilidade_basica_rascunhos.sql`
- `supabase/proposals/ativacao-integrada-local.sql`

Os arquivos SQL de Origens/Perícias/Habilidades consultados contêm comentários explícitos de proposta/rascunho ou dependência de checkpoint. O pacote em `supabase/proposals` declara expressamente que é protótipo local e não deve ser aplicado ao projeto Supabase. Esta auditoria não confirma quais migrations foram aplicadas remotamente.

## 2. Estado observado no frontend

### 2.1 Catálogo de Origens

`src/origens.ts` contém 17 Origens e seus pares de Perícias. Os benefícios são representados por strings descritivas. A estrutura não separa, por enquanto, benefício numérico permanente, escolha interna, condição, uso limitado, duração ou capacidade.

Diferenças de precisão em relação ao livro:
- Acadêmico: a descrição resumida não explicita que o Teste pode ser puro de AST ou Perícia associada a AST.
- Cobaia: a descrição diz Vantagem em Reanimação durante Colapso Viral, mas não explicita rolar 2d20 e usar o melhor.
- Desgarrado: a string está próxima do cânone, mas o cálculo do PV Temporário depende do valor de BI atual no evento de aumento.
- Chef, Criminoso, Amnésico, Mercenário e Militar exigem gatilhos/limites que não cabem em um bônus textual genérico.
- Operário exige persistir a arma escolhida; o catálogo atual não apresenta essa escolha como dado estruturado.
- Amnésico aparece com lista de Perícias vazia, o que é coerente com escolha livre, mas a validação e a interface precisam garantir duas Perícias distintas e registrar qual recebeu Treinamento.
- Mochileiro está descrito como +1 Espaço de Inventário, enquanto o cânone o define como +1 Inventário. A terminologia precisa ser uniformizada com a unidade usada no sistema e no livro.

### 2.2 Conferência da criação

`src/conferenciaCriacao.ts` já calcula e compara alguns valores:
- SA Máxima: AGI + AST + 1 se Universitária.
- BI Máxima: base da Classe + AST + 2 se Cobaia + 3 se Parrudo.
- Defesa básica: 10 + AGI + 2 se Policial, antes de colete.
- Capacidade de Inventário: 4 + FOR + 1 se Mochileiro.
- PV Máximos: base da Classe + VIG + 5 se Parrudo.

A conferência valida a Origem, a Perícia gratuita e a distribuição de pontos da Classe. Para Amnésico, valida duas Perícias distintas. Entretanto, não confere os efeitos condicionais/temporários das Origens em jogo; isso não é necessariamente defeito da revisão de criação, mas significa que tais benefícios ainda dependem de integração com os módulos de resolução correspondentes.

Não foi encontrada, nos arquivos inspecionados, uma escolha estruturada de arma para Operário dentro do tipo `FichaRevisao`. O código da revisão não pode, portanto, confirmar qual arma recebeu o benefício.

## 3. Estado observado no SQL/propostas

### 3.1 Estrutura inicial de personagem

A migration `20261022000500_fichas_personagem_alfa04.sql` cria os campos básicos de Origem, Classe, nível, Atributos e recursos, mas não define o catálogo completo nem os efeitos das Origens.

### 3.2 Proposta de Origem

`20261022000600_origens_rascunhos.sql`:
- adiciona `pericia_origem_treinada` e `pericia_origem_extra`;
- implementa `definir_origem_rascunho`;
- valida pares de Perícias e escolha livre de Amnésico;
- aplica numericamente Policial (+2 Defesa), Universitária (+1 SA Máxima) e Cobaia (+2 BI Máxima);
- não aplica os demais benefícios condicionais;
- não registra escolha de arma do Operário;
- preserva BI atual e ajusta SA atual ao trocar Origem, com regra de segurança para BI acima do novo máximo.

A versão de compatibilidade em `20261023043912_habilidade_origem_compatibilidade.sql` também preserva o bônus de Parrudo ao recalcular BI. Isso evidencia dependência entre cálculo de Origem e Habilidade básica, que hoje está implementada em funções SQL separadas.

### 3.3 Perícias

`20261023035943_pericias_criacao_rascunhos.sql` persiste pontos de Perícia em JSONB e valida as Perícias permitidas pela Classe e a Perícia adicional da Origem. O treinamento gratuito é separado dos pontos distribuídos pela Classe. O trigger protege a distribuição de pontos quando Origem ou escolhas gratuitas são alteradas.

### 3.4 Habilidade básica

`20261023042414_habilidade_basica_rascunhos.sql` recalcula PV Máximos e BI Máxima para Parrudo, além de aceitar uma Habilidade Básica compatível com a Classe. A versão de compatibilidade de Origem inclui os +3 BI de Parrudo no recálculo. Não existe, nos trechos inspecionados, um mecanismo genérico de efeitos para todos os benefícios de Origem e Habilidade.

### 3.5 Protótipo local integrado

`supabase/proposals/ativacao-integrada-local.sql` usa Origem em cálculos de Inventário e deriva capacidade com Mochileiro. O próprio arquivo se identifica como pacote local de testes, não migration, sem API pública e sem aplicação remota autorizada. Não deve ser tratado como implementação em produção.

## 4. Matriz de cobertura preliminar

| Benefício | Catálogo TS | Conferência/cálculo frontend | SQL/proposta observada | Situação |
|---|---|---|---|---|
| Acadêmico | Texto resumido | Não aplica uso/Vantagem | Não localizado | Pendente de integração |
| Agente de Saúde | Texto resumido | Não aplica dados de cura | Não localizado | Pendente de integração |
| Amnésico | Sem par fixo; texto | Valida duas perícias distintas | Valida escolhas de perícia | Parcial: benefício 1/sessão não integrado |
| Atleta | Texto resumido | Não aplica gasto SA/+5 | Não localizado | Pendente de integração |
| Chef | Texto resumido | Não aplica escolha de 10 | Não localizado | Pendente de integração |
| Cobaia | Texto resumido | +2 BI Máxima | +2 BI Máxima | Parcial: Vantagem em Reanimação não integrada |
| Criminoso | Texto resumido | Não aplica uso/Vantagem | Não localizado | Pendente de integração |
| Desgarrado | Texto | Não aplica PV Temporários | Não localizado | Pendente de integração |
| Investigador | Texto resumido | Não aplica gasto SA/+5 | Não localizado | Pendente de integração |
| Lutador | Texto | Não altera categoria de Dano | Não localizado | Pendente de integração |
| Mercenário | Texto resumido | Não aplica Reação/Surpresa | Não localizado | Pendente de integração |
| Militar | Texto resumido | Não aplica Vantagem no próximo turno | Não localizado | Pendente de integração |
| Mochileiro | Texto resumido | +1 capacidade de Inventário | Protótipo local considera +1 | Parcial; confirmar terminologia e fluxo ativo |
| Operário | Texto resumido | Não persiste/valida arma escolhida | Não localizado | Pendente de escolha estruturada e resolução |
| Policial | Texto | +2 Defesa | +2 Defesa | Parcialmente implementado no fluxo de rascunho |
| Servidor Público | Texto resumido | Não aplica benefício de Ajudar | Não localizado | Pendente de integração |
| Universitária | Texto | +1 SA Máxima | +1 SA Máxima | Parcialmente implementado no fluxo de rascunho |

“Não localizado” significa que não apareceu nos arquivos específicos inspecionados; não é prova de inexistência em todo o repositório ou no banco remoto.

## 5. Riscos de arquitetura identificados

1. **Cálculos duplicados em funções separadas:** Origem e Habilidade Básica recalculam recursos em RPCs diferentes. A compatibilidade precisou ser adicionada para não perder o bônus de Parrudo ao alterar Origem. Com mais efeitos, esse padrão tende a gerar divergências.
2. **Benefícios condicionais sem estado estruturado:** usos por sessão/descanso, gatilhos, alvos e duração não podem ser tratados como simples texto de Origem.
3. **Escolha do Operário ausente no contrato observado:** sem persistência estruturada, não há como validar o bônus de arma no servidor nem aplicá-lo somente à arma escolhida.
4. **Bônus de Origem não são todos valores da ficha:** vários pertencem à resolução de cura, testes, ações, surpresa ou fabricação. Não devem ser somados aos valores derivados permanentes.
5. **Unidade de Inventário:** alinhar “Inventário”, “Espaço de Inventário” e “capacidade” com o termo canônico e com a regra efetivamente usada pelo sistema.

## 6. Próxima decisão técnica recomendada

Antes de criar mais RPCs independentes, mapear os contratos atuais de criação e a proposta de allowlist/revisões, então desenhar um único serviço de cálculo/validação de efeitos derivados no servidor, ou uma composição transacional que garanta que todos os efeitos sejam recalculados a partir das escolhas persistidas.

O desenho deve manter separados:
- escolhas da ficha;
- catálogo canônico versionado;
- valores permanentes derivados;
- efeitos condicionais/temporários e seus usos;
- contexto de resolução (Teste, cura, ataque, descanso, sessão etc.).

A implementação deve ser incremental. Primeiro consolidar os cálculos permanentes e as escolhas estruturais; depois integrar os efeitos condicionais conforme os módulos de jogo forem implementados. Não simular benefícios de combate ainda inexistentes com campos fictícios na ficha.

**Nenhuma alteração de código, migration, SQL, banco remoto, teste ou publicação foi realizada por esta auditoria.**
