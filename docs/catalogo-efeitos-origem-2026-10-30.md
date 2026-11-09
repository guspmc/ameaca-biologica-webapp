# Catálogo de efeitos das Origens — 30/10/2026

**Status:** levantamento documental; não é implementação nem alteração de cânone.  
**Fonte principal:** Arquivo do Jogador v1.0, Capítulo 1 — Criação de Personagem, páginas impressas 23–25.  
**Objetivo:** registrar benefícios, escolhas e efeitos de Origem para subsidiar validação da criação, progressão e recálculo da ficha.

## 1. Regra geral de Origem

A Origem representa a vida da personagem antes do incidente. Cada Origem indica duas Perícias:
- O jogador escolhe uma para receber Treinamento gratuitamente.
- A outra entra na lista de Perícias permitidas pela Classe para a criação.
- A Origem concede também seu benefício exclusivo.

**Exceção — Amnésico:** o jogador escolhe duas Perícias distintas, em vez de usar um par fixo. Entre elas, escolhe uma para receber Treinamento gratuitamente; a outra entra na lista permitida pela Classe durante a criação, conforme a regra geral de Origens.

O benefício da Origem pode ser numérico, condicional, limitado por descanso/sessão, alterar uma resolução ou conceder capacidade. Não tratar todos como bônus permanentes.

## 2. Classificação

| Código | Categoria | Tratamento técnico preliminar |
|---|---|---|
| PERM | Modificador permanente | Entra no cálculo derivado enquanto a Origem estiver válida. |
| COND | Condicional | Aplicado apenas quando o gatilho descrito ocorrer. |
| TEMP | Temporário | Possui duração ou janela de validade. |
| RECURSO | Recurso/máximo | Altera valor máximo ou capacidade; atual e máximo são distintos. |
| USO | Uso limitado | Controlar por Descanso Completo, sessão ou outra unidade expressa. |
| ESCOLHA | Escolha do jogador | Persistir a opção escolhida e validar sua elegibilidade. |
| PERM-ESP | Permissão/capacidade | Habilita ação, opção ou interação; não é bônus numérico. |

## 3. Catálogo de Origens

| Origem | Perícias indicadas | Benefício conforme o livro | Classificação | Dados/condições que precisam ser considerados |
|---|---|---|---|---|
| Acadêmico | Investigação / Medicina | **Saber é Poder:** 1/Descanso Completo, ao realizar Teste baseado em AST — puro ou de Perícia associada a AST — faz o Teste com Vantagem. | COND + USO | Atributo-base AST, tipo de Teste, contador por Descanso Completo. |
| Agente de Saúde | Medicina / Sobrevivência | Ao curar um aliado com item/efeito, adiciona +1d4 aos Dados de Cura. Não se aplica a si. | COND | Alvo aliado, cura por item/efeito, dados de cura; excluir autocura. |
| Amnésico | Escolha duas Perícias distintas | **Vislumbres do Passado:** 1/sessão, em local conhecido antes da amnésia, Teste de AST DT 10; obtendo informação útil, recebe Vantagem no próximo Teste relacionado de Sobrevivência. | ESCOLHA + COND + USO + TEMP | Duas perícias escolhidas; uma recebe Treinamento e a outra integra a lista permitida da Classe; local conhecido antes da amnésia; AST DT 10; informação útil; próximo Teste relacionado de Sobrevivência; contador por sessão. |
| Atleta | Acrobacia / Atletismo | Ao realizar Teste de Perícia baseado em FOR ou AGI, exceto Luta ou Pontaria, pode gastar 1 SA para receber +5 nesse Teste. O bônus não altera valor permanente da Perícia nem valores derivados. | COND | Atributo associado FOR/AGI, exclusão de Luta/Pontaria, gasto explícito de 1 SA, bônus apenas no Teste. |
| Chef | Fortitude / Sobrevivência | Em Sala de Descanso, ao criar item, pode escolher 10 no d20. | COND + PERM-ESP | Sala de Descanso, operação de criação de item, escolha explícita de escolher 10 no d20. O benefício não afirma que o resultado seja sucesso automático; aplicar DT e demais regras normais. |
| Cobaia | Reflexos / Vontade | +2 BI Máxima. Durante Colapso Viral, cada Teste de Reanimação é feito com Vantagem: rola 2d20 e usa o melhor resultado. | RECURSO + COND | Acréscimo permanente ao máximo de BI; condição Colapso Viral; Teste de Reanimação; Vantagem. |
| Criminoso | Investigação / Furtividade | 1/Descanso Completo: Vantagem em Investigação ao procurar itens/recursos. | COND + USO | Perícia Investigação, finalidade procurar itens/recursos, contador por Descanso Completo. |
| Desgarrado | Fortitude / Sobrevivência | Ao aumentar BI, recebe PV Temporários iguais à metade da BI atual, arredondada para baixo. | COND + TEMP | Evento de aumento de BI; valor de BI atual no momento; divisão por 2 com arredondamento para baixo; PV Temporários. Não confundir com aumento do máximo de BI ou cura de PV. |
| Investigador | Investigação / Percepção | Ao realizar Teste de Investigação para procurar uma pista, pode gastar 1 SA para receber +5 nesse Teste. O bônus não altera valor permanente da Perícia nem valores derivados. | COND | Investigação, finalidade procurar pista, gasto explícito de 1 SA, bônus apenas no Teste. |
| Lutador | Luta / Reflexos | Ataque Desarmado e Arma Improvisada sobem uma categoria de dado; acumula com Casca-Grossa. Não afeta Coronhada. | PERM + COND | Categoria-base do dado; aplicar aumento de categoria; acumula expressamente com Casca-Grossa; excluir Coronhada. |
| Mercenário | Pontaria / Fortitude | 1/Descanso Completo, quando um hostil oculto fosse Surpreendê-lo, pode usar uma Reação para sacar uma arma de fogo carregada e realizar um Ataque contra esse hostil. Ao fazer isso, percebe a ameaça a tempo e não fica Surpreendido. | COND + USO + PERM-ESP | Hostil oculto; gatilho de Surpresa; arma de fogo carregada; Reação; Ataque; contador por Descanso Completo; não aplicar Surpreendido quando o benefício for usado. |
| Militar | Pontaria / Percepção | Após matar inimigo com arma de fogo, recebe Vantagem no primeiro Ataque com arma de fogo no próximo turno. | COND + TEMP | Morte de inimigo causada com arma de fogo; próximo turno; primeiro Ataque com arma de fogo; consumir o benefício após uso ou expiração no turno. |
| Mochileiro | Sobrevivência / Atletismo | +1 Inventário. | PERM | Modificador permanente do limite/capacidade de Inventário, sujeito às regras de cálculo e expansão aplicáveis. |
| Operário | Fortitude / Atletismo | Escolha uma Arma Corpo a Corpo semelhante a uma ferramenta. Ao atacar com a arma escolhida, recebe +1 no Teste de Ataque. O Dano dessa arma adiciona 2 × FOR em vez de FOR. O FOR adicional não é multiplicado em Acerto Crítico. | ESCOLHA + COND | Modelo de arma elegível escolhido; +1 somente nos Testes de Ataque com ela; substituir FOR por 2 × FOR no dano, não somar ambos; parcela adicional de FOR não multiplica no crítico. |
| Policial | Percepção / Pontaria | +2 Defesa. | PERM | Modificador permanente de Defesa, somado uma única vez à fórmula aplicável. |
| Servidor Público | Investigação / Vontade | Ao usar Ajudar em Teste de Perícia na qual seja Treinado ou Mestre, o aliado recebe a Vantagem normal de Ajudar e +2 no Teste. | COND | Ação Ajudar; perícia em que personagem é Treinado ou Mestre; aliado beneficiado; +2 e Vantagem aplicados ao Teste do aliado. |
| Universitária | Medicina / Investigação | +1 SA Máxima. | RECURSO | Acréscimo permanente ao máximo de SA; não confundir com SA atual ou recuperação. |

## 4. Implicações para criação e persistência

### 4.1 Escolhas que precisam ser persistidas

- Origem selecionada.
- Perícia escolhida para receber Treinamento gratuito entre as duas indicadas.
- Para Amnésico, as duas Perícias distintas escolhidas e qual delas recebeu Treinamento.
- Para Operário, a Arma Corpo a Corpo semelhante a ferramenta escolhida.

A validação deve impedir escolhas fora das opções permitidas, sem transformar o benefício da Origem em campo de bônus editável.

### 4.2 Efeitos permanentes e valores derivados

- **Cobaia:** +2 BI Máxima.
- **Lutador:** aumento de categoria de dado para Ataque Desarmado e Arma Improvisada, com acúmulo expresso com Casca-Grossa e exclusão de Coronhada.
- **Mochileiro:** +1 Inventário.
- **Policial:** +2 Defesa.
- **Universitária:** +1 SA Máxima.
- **Operário:** efeito condicionado à arma escolhida; não é bônus universal de Ataque ou Dano.

Os valores máximos e derivados devem ser recalculados a partir das fontes válidas, sem somar repetidamente o mesmo benefício. O efeito do Operário precisa ser resolvido no cálculo do ataque/dano da arma escolhida, não incorporado a todos os ataques da personagem.

### 4.3 Efeitos condicionais e temporários

- **Acadêmico, Criminoso e Amnésico:** controlar uso por Descanso Completo ou sessão conforme o texto.
- **Agente de Saúde, Atleta, Chef, Investigador, Mercenário, Militar e Servidor Público:** verificar gatilho e aplicar somente à resolução pertinente.
- **Desgarrado:** evento de aumento de BI gera PV Temporários; não é um bônus permanente de PV Máximos.
- **Cobaia:** Vantagem apenas durante Colapso Viral nos Testes de Reanimação.
- **Lutador:** aplicar aumento de categoria somente aos ataques abrangidos.
- **Operário:** arma escolhida precisa acompanhar a ficha e a resolução de ataques.

## 5. Pontos que exigem integração com regras gerais

1. Ajudar e os estados Treinado/Mestre.
2. Testes de Perícia, Testes puros de Atributo, Vantagem e Desvantagem.
3. Descanso Completo e renovação de usos.
4. Sessão e reinício/controle de usos por sessão.
5. SA atual, gasto de SA e limites de recursos.
6. BI atual, aumento de BI e Colapso Viral.
7. PV Temporários e sua duração/absorção segundo as regras gerais.
8. Criação de itens em Sala de Descanso e escolha de 10 no d20.
9. Ataques, categorias de Dano, Acerto Crítico e exceções de dano.
10. Surpresa, Reação, armas carregadas e ataques.
11. Inventário e modificadores de capacidade.

O catálogo não redefine essas regras; apenas identifica quais dados cada benefício de Origem necessita.

## 6. Pendências e limites do levantamento

- O livro indica o benefício de Chef como “escolher 10 no d20”; não detalha, nesse trecho, uma exceção às DTs ou aos requisitos de criação. Não interpretar como sucesso automático.
- O benefício de Desgarrado é acionado “ao aumentar BI”; o momento exato de concessão e a interação com aumentos de BI por diferentes fontes devem seguir a regra geral de aumento de BI, sem presumir gatilhos adicionais.
- O texto de Operário exige uma arma semelhante a ferramenta, mas não fornece uma lista fechada no trecho de Origem. A elegibilidade precisa ser validada por catálogo de equipamentos/regra apropriada, não por texto livre irrestrito.
- O texto de Amnésico define a escolha de duas Perícias distintas e a distribuição Treinada/lista permitida. A interface deve preservar essa distinção.
- Não inferir que usos por Descanso Completo sejam automaticamente restaurados em qualquer tipo de descanso.
- Este levantamento cobre as Origens descritas nas páginas 23–25 do Arquivo do Jogador v1.0. Se outra versão ou errata oficial alterar esses textos, o catálogo deverá ser revisado.

## 7. Diretriz técnica preliminar (não é esquema aprovado)

A persistência e a resolução devem separar:
- Origem escolhida;
- opções internas escolhidas pelo jogador;
- benefício canônico da Origem;
- modificadores permanentes derivados;
- usos limitados e seus contadores;
- estados temporários e gatilhos;
- contexto de cada Teste, ataque, cura ou operação que possa receber o benefício.

O servidor deve validar Origem, Perícias, escolhas internas e elegibilidade da arma do Operário. Os efeitos derivados devem ser calculados de forma idempotente. Benefícios condicionais devem ser avaliados no evento correspondente, sem contaminar valores-base permanentes.

**Nenhuma migration, SQL, alteração de frontend, teste, publicação ou mudança no banco foi realizada por este documento.**
