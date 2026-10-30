# Catálogo de efeitos das Habilidades de Classe — 30/10/2026

**Status:** levantamento documental inicial; não é implementação nem alteração de cânone.  
**Fontes:** Arquivo do Jogador v1.0, capítulo 1, páginas impressas 29–38 (Agente, Autodidata e Operador).  
**Objetivo:** subsidiar o modelo de progressão e recálculo automático, distinguindo escolhas do jogador de efeitos calculados pelo sistema.

## 1. Regras gerais confirmadas

- A personagem recebe Habilidades de Classe conforme a progressão: nível 1 Básica; nível 2 Básica (pode iniciar outro ramo); nível 4 Avançada + 1 Ponto de Perícia; nível 6 Avançada; nível 8 Superior + 1 Ponto de Perícia; nível 10 Habilidade Avassaladora.
- Habilidades Avançadas exigem a Básica do mesmo ramo; Superiores exigem a progressão anterior do mesmo ramo.
- Nos níveis 3, 5, 7 e 9, recebe +1 Atributo, respeitando máximo absoluto 5.
- Os pontos adicionais de Perícia são concedidos apenas nos níveis 4 e 8, dentro das Perícias da Classe.
- A escolha de Habilidade é do jogador, dentro das opções liberadas. Os efeitos descritos abaixo são consequências automáticas/condicionais dessa escolha; não devem ser digitados como bônus livres.
- Bônus e efeitos devem ser aplicados uma única vez por fonte, salvo regra expressa em contrário. Efeitos condicionais não devem ser incorporados permanentemente ao valor-base.
- Este catálogo descreve efeitos de Habilidades de Classe. Benefícios de Origem, equipamento, condições, consumíveis e efeitos temporários precisam de catálogos/regras próprios.

## 2. Classificação usada

| Código | Categoria | Tratamento proposto |
|---|---|---|
| PERM | Permanente/derivado | Entra no cálculo enquanto a Habilidade estiver válida. |
| COND | Condicional | Aplicado somente quando o gatilho descrito ocorrer. |
| TEMP | Temporário | Exige duração/estado e expiração conforme a regra. |
| PERM-ESP | Permissão/capacidade | Desbloqueia uma ação, opção ou interação; não é bônus numérico. |
| ESCOLHA | Dado escolhido pelo jogador | A escolha precisa ser persistida como parte da Habilidade. |
| RECURSO | Recurso/valor máximo | Modifica máximo ou regra de recuperação; atual e máximo permanecem separados. |

## 3. Agente

Características da Classe: PV por Nível = 10 + VIG; BI Base = 8; SA Máxima = AGI + AST; 4 Pontos de Perícia; itens característicos Gazua Profissional + Hatchet. Ramos: Impiedoso, Oportunista e Rapina.

### 3.1 Impiedoso

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Anatomia de Combate | Básica | Ação Bônus; Medicina DT 15. Em sucesso, identifica se o alvo está Vulnerável e recebe Vantagem no próximo Ataque contra ele, até o fim do próximo turno do Agente. | COND + TEMP | Resultado do Teste, alvo, validade até fim do próximo turno. |
| Finalização à Distância | Avançada | Permite Manobra Finalizar com arma de fogo contra alvo no alcance da arma e no máximo até Alcance Médio; custo normal de SA; mantém Dano/Teste de Fortitude e Atordoamento quando não houver Morte Instantânea. Não amplia alcance nem remove penalidades. | PERM-ESP | Arma, alcance, custo SA, resolução da Finalização. |
| Luta Livre | Superior | Contra alvo Atordoado, permite Finalização e deslocamento em linha reta até 12 m sem provocar Ataques de Oportunidade. Se alvo não estiver Vulnerável, adiciona +1d8 de Dano por Nível de Agente, até 10d8. Se derrotado pela Manobra, não há custo de SA. | PERM-ESP + COND | Estado Atordoado/Vulnerável, nível, movimento, resultado e custo SA. |

### 3.2 Oportunista

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Não Vai Escapar | Básica | Quando criatura provocar Ataque de Oportunidade contra você ou aliado em combate Corpo a Corpo, pode usar Reação para atacar a criatura; imediatamente antes, pode mover até 3 m e terminar adjacente, sem provocar Ataques de Oportunidade. | PERM-ESP + COND | Gatilho, posição, Reação disponível, alvo e alcance. |
| Na Minha Mira | Avançada | Uma vez por rodada, quando inimigo perceptível a até Alcance Médio adquirir Condição que imponha penalidade/restrição, pode usar Reação para Ataque de Oportunidade à distância com arma de fogo. Não ativa se a Condição já existia e foi apenas reaplicada. | COND | Rodada, percepção, distância, evento de aquisição da Condição, Reação, arma. |
| Brecha Tática | Superior | Amplia gatilhos de Ataque de Oportunidade para ações vulneráveis durante Movimento/Ação (exemplos: sacar arma, Usar Objeto, interagir, atacar outro alvo). Se causar Dano, interrompe a ação provocadora. Concede Vantagem em Ataques de Oportunidade. | PERM-ESP + COND | Evento/gatilho, alvo, dano, interrupção e vantagem. |

### 3.3 Rapina

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Rolamento | Básica | Permite Esquivar. Após Esquiva bem-sucedida, pode reposicionar-se até 3 m sem provocar Ataques de Oportunidade. | PERM-ESP + COND | Regras de Esquiva, sucesso, posição e movimento. |
| Contra-Ataque Instintivo | Avançada | Após Aparar ou Esquivar com sucesso, permite Contra-Ataque como parte da mesma Reação; continua consumindo 1 SA normalmente. | PERM-ESP + COND | Defesa bem-sucedida, Reação e SA. |
| Retaliação | Superior | Após Aparar ou Esquivar bem-sucedido, inimigo fica Atordoado até início do próximo turno dele. Contra-Ataque recebe Vantagem e, se acertar, causa +1 Dado de Dano da arma. | COND + TEMP | Resultado da defesa, alvo, duração da Condição, Contra-Ataque e dado da arma. |

### 3.4 Habilidade Avassaladora do Agente

**VOCÊ APAROU UM MÍSSIL!?**

- Pode Aparar qualquer Ataque quando a narrativa permitir a interceptação.
- Com Faca de Combate ou Hatchet, uma vez durante seu próprio turno, quando houver gatilho válido para Aparar, pode realizar Aparar como Ação Livre em vez de Reação.
- Em Aparar Corpo a Corpo bem-sucedido com uma dessas armas, causa 2d4 de Dano.
- Pode usar Finalizar sem custo de SA durante uma Reação declarada de Contra-Ataque.
- Contra-Ataques causam +2d4.

Classificação: PERM-ESP + COND. Requer controle de arma usada, turno, gatilho, categoria de ação, sucesso de Aparar e contexto de Contra-Ataque. Os bônus de dano não devem ser somados fora dos respectivos gatilhos.

## 4. Autodidata

Características da Classe: PV por Nível = 8 + VIG; BI Base = 10; SA Máxima = AGI + AST; 5 Pontos de Perícia; itens característicos Kit de Primeiros Socorros + Pente Estendido 9 mm. Ramos: Combatente, Pau para Toda Obra e Socorrista.

### 4.1 Combatente

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Ambidestria | Básica | Com uma Pistola 9 mm em cada mão, ao Atacar com uma, uma vez por turno pode fazer Ataque adicional com a outra como Ação Bônus; esse ataque adiciona AGI ao Dano normalmente. Sacar simultaneamente ambas usa uma Interação Gratuita com Objeto. | PERM-ESP + COND | Duas pistolas 9 mm, mãos ocupadas, turno, ação bônus. |
| Armeira Autodidata | Avançada | Armas de Fogo modificadas causam +1d4 de Dano por Peça Extra instalada. Não se aplica a armas Corpo a Corpo. Permite usar uma Pistola em cada mão para Aparar Ataques Corpo a Corpo. | COND + PERM-ESP | Arma de Fogo, peças extras instaladas, arma modificada; pistolas empunhadas para Aparar. |
| Arsenal Improvável | Superior | Concede Proficiência com Magnums e estende Ambidestria a elas, permitindo empunhadura apropriada definida pela Habilidade. | PERM-ESP | Classe, Habilidade Ambidestria, tipo de arma e empunhadura. |
| Reﬂexos de Sobrevivente | Superior (ramo Pau para Toda Obra no texto) | Uma vez por rodada, pode Esquivar sem gastar Reação; a próxima Ação Bônus fica comprometida. Pode atravessar espaços ocupados por jogadores ou inimigos Médios e menores sem provocar Ataque de Oportunidade. Ataques contra si podem usar Defesa ou 10 + Acrobacia, o que for maior. | PERM-ESP + COND | Rodada, Esquiva, Ação Bônus, tamanho/ocupação dos espaços, Defesa e Acrobacia. **Atenção:** o layout do PDF posiciona esta Habilidade junto à transição entre ramos; confirmar visualmente a associação exata antes de cadastrar no catálogo definitivo. |

### 4.2 Pau para Toda Obra

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Curiosa | Básica | Com tempo para observar/investigar sem Pressão Imediata, Vantagem em Percepção e Investigação, mesmo sem Treinamento. Não vale em combate, perseguições, fugas ou quando não houver tempo. Uma vez por Descanso Completo, Teste de AST DT 12 pode pedir indicação simples de direção ou pista curta dedutível. | COND + PERM-ESP | Pressão/tempo, perícias, Descanso Completo, uso por descanso. |
| Tentativa e Erro | Avançada | Permite Testes com Perícias não Treinadas, inclusive aplicações normalmente restritas a Treinamento, salvo requisito adicional expresso. Recebe +1 nesses Testes e escolhe uma Perícia adicional para Treinar. | PERM-ESP + PERM + ESCOLHA | Treinamento, aplicação, bônus +1 e perícia escolhida. |
| Reﬂexos de Sobrevivente | Superior | Ver nota acima; texto aparece na página de transição entre ramos. | PENDENTE | Associação do ramo precisa ser confirmada na arte/página original. |

### 4.3 Socorrista

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Herbalista | Básica | Misturas de Ervas produzidas pela personagem curam o valor máximo possível. Ao usar Mistura de Ervas em si, recebe +1 de cura por Nível de Autodidata. | COND | Tipo de item/receita, produtor/usuário, nível e alvo. |
| Farmácia de Campo | Avançada | Permite criar Misturas de Ervas como Ação fora de Sala de Descanso e durante deslocamento, desde que tenha Receita e ingredientes. | PERM-ESP | Receita, ingredientes, contexto e categoria de ação. |
| Primeiros Socorros | Superior | Itens de cura usados pela personagem concedem PV Temporários por 1 hora iguais à Medicina. Aliados até 3 m que recebam cura também recebem o efeito; ao curar aliado, personagem recebe metade da Cura, sem PV Temporários. Também permite fabricar Neurotoxinas, Bombas de Fumaça, Esteroides e Estabilizadores quando conhecer Receita e possuir ingredientes/ferramentas. | COND + TEMP + PERM-ESP | Medicina, cura, distância, PV temporários/duração, receita, ingredientes e ferramentas. |

### 4.4 Habilidade Avassaladora do Autodidata

**CODE VERONICA**

- Conhece automaticamente senhas, códigos e combinações, sem substituir chaves, cartões ou itens físicos.
- Testes de Perícia têm Vantagem; resultados naturais de 2 a 9 contam como 10; 1 natural continua Falha Crítica.
- Ao Combinar Ervas, tem 50% de chance de produzir em dobro.
- Pode usar Submetralhadoras sem coronha com Ambidestria.

Classificação: PERM-ESP + COND. Exige tratamento específico para resultados naturais, exceção de Falha Crítica, fabricação/combinação e compatibilidade de arma. Não reduzir a Habilidade a um bônus fixo de perícia.

## 5. Operador

Características da Classe: PV por Nível = 12 + VIG; BI Base = 6; SA Máxima = AGI + AST; 3 Pontos de Perícia; itens característicos Colete de Placas Kendo + Kit de Ferramentas. Ramos: Brigão, Especialista em Armamento e Tanque.

### 5.1 Brigão

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| GOLPE SUJO | Básica | Oferece Derrubar após causar Dano Corpo a Corpo (gasta Movimento); Pisão contra alvo Caído com aumento de dado e condições adicionais; Cabeçada como Ataque Desarmado, com Fortitude DT 10 + FOR e Atordoamento em falha. | PERM-ESP + COND | Opção de manobra, dano, Movimento, estado Caído/Vulnerável, tamanho, FOR, Fortitude. |
| Casca-Grossa | Avançada | Dano Desarmado ou de Coronhada sobe uma categoria de Dado. Uma vez por turno, pode executar Cabeçada ou Pisão com Desvantagem após Ataque bem-sucedido. | PERM + PERM-ESP | Tipo de ataque, categoria do dado, turno e ataque anterior. |
| Briga de Gente Grande | Superior | Manobras de GOLPE SUJO funcionam contra criaturas maiores se anatomia física compatível/humanoide; Vantagem em Derrubar ou Cabeçada contra criatura maior. | PERM-ESP + COND | Tamanho, anatomia, manobra e comparação de tamanho. |

### 5.2 Especialista em Armamento

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Armeiro | Básica | Como Ação, acopla, desacopla ou troca Peças Extras da arma empunhada. Ao atacar com arma modificada, +1 no Teste de Ataque por Peça Extra instalada. | PERM-ESP + COND | Ação, arma empunhada, peças instaladas e Teste de Ataque. |
| Armamento Especial | Avançada | Proficiência com Magnums e Armas Especiais. Reduz em uma categoria de Ação os custos de Recarga, Bombear/Manejar e Coice, nunca abaixo de Interação Gratuita com Objeto. | PERM-ESP + COND | Tipo de arma, ação/custo original e piso de custo. |
| Controle de Fogo | Superior | Ao usar Rajada, pode substituir Cone por até 6 espaços conectados entre si e dentro do alcance permitido. Cada espaço precisa de linha de efeito. Mantém consumo de munição, Dano, DT e restrições. | PERM-ESP + COND | Rajada, geometria/alcance, conectividade, linha de efeito, munição e DT. |

### 5.3 Tanque

| Habilidade | Grau | Efeito canônico resumido | Classe | Dados/condições necessários |
|---|---|---|---|---|
| Parrudo | Básica | Imediatamente concede +5 PV Máximos, +3 BI Máxima e Vantagem em Testes de Fortitude. | PERM + RECURSO | Fonte única da Habilidade; PV/BI máximos recalculados; Fortitude. |
| Quanto Mais Melhor | Avançada | Quando estiver na Área de Ameaça de 3 ou mais inimigos, recebe Vantagem em Ataques. | COND | Número de inimigos na Área de Ameaça e Ataque. |
| Parede Humana | Superior | Ao fim do turno, se não gastou o recurso Movimento, adiciona VIG à Defesa e recebe Redução de Dano igual a 1 + metade do Nível de Operador, arredondada para baixo, máximo 6. Dura até início do próximo turno. Não gastar Movimento refere-se ao recurso, não a deslocar 0 m. | COND + TEMP | Movimento gasto, VIG, nível, Defesa, redução, início/fim de turno. |

### 5.4 Habilidade Avassaladora do Operador

**SOCADOR DE PEDRAS**

- Dano base dos Ataques Desarmados passa a 3d10, antes de aumentos de categoria.
- Punhos tratados como Indestrutíveis para Aparar Ataques Corpo a Corpo aparáveis.
- Pode Contra-Atacar desarmado sem largar arma de duas mãos.
- Alvo principal sofre Ataque normal; demais criaturas adjacentes sofrem 1d10 da onda de choque.
- Ao acertar, resultado do Ataque pode ser usado como DT de Fortitude para Derrubar.

Classificação: PERM-ESP + COND. Requer regras específicas de dano base, aparar, Contra-Ataque, alvos adjacentes e DT derivada do resultado do Ataque.

## 6. Pendências de interpretação e integridade do catálogo

1. **Reﬂexos de Sobrevivente:** a extração textual coloca a Habilidade na página de transição entre Combatente e Pau para Toda Obra; a associação do ramo deve ser conferida visualmente no PDF antes de cadastrar como dado definitivo. Não presumir ramo.
2. **Autodidata — Superior:** a sequência visual e a progressão de níveis devem ser confrontadas com a paginação/arte original para garantir que Reﬂexos de Sobrevivente não seja contado como habilidade extra ou duplicado.
3. **Efeitos de regras gerais:** várias Habilidades remetem a Aparar, Esquivar, Finalizar, Ataque de Oportunidade, Rajada, Ajudar, Combinar Ervas e Fabricação. A implementação precisa integrar essas regras, não duplicar sua resolução dentro do catálogo.
4. **Efeitos de Origem:** não fazem parte deste levantamento. Exemplo conhecido no livro: Policial +2 Defesa; Servidor Público concede benefício condicional ao Ajudar; Universitária +1 SA Máxima; Operário modifica ataque/dano com arma escolhida. Precisam de catálogo separado com suas próprias escolhas e gatilhos.
5. **Evolução e perda de nível:** ao perder nível, retirar somente escolhas/benefícios cuja validade dependa do nível perdido e recalcular derivados. A reversão exata deve respeitar o registro de escolhas por nível; não apagar decisões válidas de níveis anteriores.
6. **Regra da Casa:** o planejamento prevê valores derivados manualmente personalizados que não são sobrescritos automaticamente. O catálogo de efeitos precisa alimentar a prévia de retorno ao método Padrão, sem apagar valores personalizados silenciosamente.

## 7. Diretriz técnica preliminar (não é esquema aprovado)

A persistência deve separar:
- escolha feita pelo jogador (Habilidade, ramo, nível de aquisição e escolhas internas);
- definição canônica da Habilidade (catálogo versionado);
- efeito derivado calculado pelo sistema;
- evento/estado temporário (gatilho, alvo, início, expiração, usos por turno/rodada/descanso);
- modificadores contextuais calculados no momento da resolução.

Não armazenar bônus agregados como se fossem escolhas manuais. O servidor deve validar pré-requisitos, nível autorizado, sequência de progressão e limites; recalcular efeitos derivados de forma idempotente (repetir o cálculo não duplica bônus). Efeitos condicionais devem ser avaliados no evento pertinente, não incorporados à ficha como bônus permanente.

**Nenhuma migration, SQL, alteração de frontend, teste, publicação ou mudança no banco foi realizada por este documento.**
