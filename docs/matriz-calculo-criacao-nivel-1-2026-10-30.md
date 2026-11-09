# Matriz de cálculo da criação — nível 1 — 30/10/2026

**Status:** matriz de conferência documental e estática; pronta para validação de decisões pendentes, não é código nem contrato SQL final.
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`.
**Fontes canônicas:** Arquivo do Jogador v1.0, principalmente páginas impressas 22–30 e seção de Perícias; Planejamento do WebApp v2.0, seção 6.1.
**Fontes de implementação confrontadas:** `src/conferenciaCriacao.ts`, `src/classesFicha.ts`, `src/origens.ts`, `src/habilidades.ts`, `src/pericias.ts`, `src/equipamento.ts` (referenciado pela conferência), migrations de criação e proposta integrada local.
**Escopo:** somente criação Padrão de nível 1. Não cobre evolução, Regra da Casa, condições de combate, efeitos temporários, resolução de Testes ou ativação no banco.

## 1. Regras-base extraídas das fontes

### 1.1 Atributos

O Arquivo do Jogador v1.0, p. 22:
- quatro Atributos: FOR, AGI, VIG e AST;
- começam em 1;
- distribuir +3 pontos;
- pode reduzir um único Atributo de 1 para 0 para receber +1 ponto adicional;
- nenhum Atributo acima de 3 na criação;
- máximo absoluto durante a campanha: 5.

A conferência TypeScript valida inteiros de 0 a 3, soma 7 e no máximo um zero. A migration inicial também usa a regra de soma 7 e limite de um zero.

### 1.2 Classes

| Classe | PV por nível | BI Base | SA base | Pontos de Perícia | Itens característicos |
|---|---:|---:|---|---:|---|
| Agente | 10 + VIG | 8 | AGI + AST | 4 | Gazua Profissional + Hatchet |
| Autodidata | 8 + VIG | 10 | AGI + AST | 5 | Kit de Primeiros Socorros + Pente Estendido 9 mm |
| Operador | 12 + VIG | 6 | AGI + AST | 3 | Colete de Placas Kendo + Kit de Ferramentas |

Fonte: Arquivo do Jogador v1.0, pp. 26 e 29, 33 e 35–37 conforme classe. TypeScript `src/classesFicha.ts` contém os mesmos valores e itens.

### 1.3 Perícias

Atributo associado:
- AGI: Acrobacia, Furtividade, Pontaria, Reflexos.
- AST: Investigação, Medicina, Percepção, Sobrevivência, Vontade.
- FOR: Atletismo, Luta.
- VIG: Fortitude.

Treinamento:
- Não Treinada: +0.
- Treinada: +2.
- Mestre: +3.

Valor permanente da Perícia = Atributo associado + modificador de Treinamento + modificadores permanentes aplicáveis. Teste de Perícia = 1d20 + valor da Perícia + modificadores circunstanciais. Não repetir o Atributo no Teste.

A conferência atual calcula pontos distribuídos e valida limites, mas não materializa um mapa completo de valores finais das Perícias nesta função.

### 1.4 Fórmulas de nível 1

| Derivado | Fórmula canônica | Fontes permanentes consideradas nesta matriz |
|---|---|---|
| PV Máximos | (PV por nível da Classe) × nível + bônus aplicáveis | VIG; Parrudo +5 |
| SA Máximo | AGI + AST + bônus aplicáveis | Universitária +1 |
| BI Máxima | BI Base da Classe + AST + bônus aplicáveis | Cobaia +2; Parrudo +3 |
| Defesa básica | 10 + contribuição de AGI + modificadores aplicáveis | Policial +2; armadura equipada pode alterar contribuição |
| Inventário | 4 + FOR + bônus/expansões ativas | Mochileiro +1; Bolsa/Pochete não acumulam entre si |
| Movimento | Base normal 9 m + modificadores pertinentes | nenhum bônus fixo de Origem/Básica de nível 1 identificado no escopo |

**Cuidado:** o Planejamento v2.0 ressalta que coletes podem limitar ou retirar contribuição de AGI na Defesa. Portanto, “Defesa básica sem colete” e “Defesa efetiva com equipamento” são conceitos distintos.

### 1.5 Separação de efeitos

- Permanentes numéricos: entram no cálculo derivado.
- Condicionais: só são aplicados quando o gatilho ocorre.
- Temporários: têm ativação/duração.
- Circunstanciais: são considerados no Teste.
- Fontes iguais não acumulam consigo mesmas, salvo regra específica.

A função de cálculo de criação não deve transformar efeitos de combate, Vantagem, reações, cura, usos por descanso ou bônus temporários em modificadores permanentes.

## 2. Matriz de bônus numéricos de Origem

| Origem | Derivado afetado na criação | Valor | Tipo | Código atual |
|---|---|---:|---|---|
| Policial | Defesa básica | +2 | permanente | aplicado em `conferenciaCriacao.ts` e migration de Origem |
| Universitária | SA Máximo | +1 | permanente | aplicado em `conferenciaCriacao.ts` e migration de Origem |
| Cobaia | BI Máxima | +2 | permanente | aplicado em `conferenciaCriacao.ts` e migration de Origem |
| Mochileiro | Capacidade de Inventário | +1 | permanente | aplicado em `equipamento.ts`/conferência e proposta local |
| Demais Origens | nenhum máximo/derivado numérico de criação identificado | — | condicional/capacidade/uso | benefícios permanecem descritos em texto no catálogo |

**Não incluir como bônus de criação:** Atleta (+5 situacional por 1 SA), Investigador (+5 situacional por 1 SA), Acadêmico (Vantagem limitada), Agente de Saúde (+1d4 Cura), Desgarrado (PV Temporários ao aumentar BI), etc. Seus gatilhos ocorrem durante jogo.

### Escolhas e dados de Origem

- Origens comuns: escolher uma das duas Perícias para Treinamento gratuito; a outra entra na lista permitida para pontos da Classe.
- Amnésico: escolher duas Perícias distintas; uma recebe Treinamento gratuito e a outra integra a lista permitida.
- Operário: exige escolher uma Arma Corpo a Corpo semelhante a ferramenta. A escolha deve ser persistida para que o bônus +1 no Ataque e a regra de Dano (2 × FOR em vez de FOR) possam ser aplicados à arma certa. O parâmetro da RPC de Origem examinado não inclui essa escolha; não foi localizada no tipo `FichaRevisao` analisado.

## 3. Matriz de bônus numéricos de Habilidade Básica

| Classe | Ramo | Básica | Efeito que altera derivado de criação | Condicional/capacidade |
|---|---|---|---|---|
| Agente | Impiedoso | Anatomia de Combate | nenhum | Ação Bônus, Medicina DT 15; Vantagem no próximo Ataque após sucesso |
| Agente | Oportunista | Não Vai Escapar | nenhum | Reação/Ataque de Oportunidade e movimento até 3 m |
| Agente | Rapina | Rolamento | nenhum | permite Esquivar e reposicionar após sucesso |
| Autodidata | Combatente | Ambidestria | nenhum | ataque adicional com pistolas, 1/turno, Ação Bônus |
| Autodidata | Pau para Toda Obra | Curiosa | nenhum | Vantagem em Percepção/Investigação com tempo; AST DT 12 1/Descanso Completo |
| Autodidata | Socorrista | Herbalista | nenhum valor de ficha no nível 1 | cura de Misturas; bônus de cura por Nível de Autodidata |
| Operador | Brigão | GOLPE SUJO | nenhum | manobras, Pisão e Cabeçada em condições descritas |
| Operador | Especialista em Armamento | Armeiro | nenhum | manipular Peças e +1 Ataque por Peça Extra instalada |
| Operador | Tanque | Parrudo | PV Máximos +5; BI Máxima +3 | Vantagem em Testes de Fortitude |

A lista TypeScript `HABILIDADES_BASICAS` contém essas nove Básicas. A conferência de criação aplica os bônus numéricos de Parrudo a PV e BI. As demais Básicas não alteram os seis derivados estruturais no nível 1, conforme o texto consultado.

## 4. Fórmulas detalhadas por Classe

Considere:
- (F) = FOR;
- (A) = AGI;
- (V) = VIG;
- (S) = AST;
- (P) = indicador de Parrudo (1 se escolhido; 0 caso contrário);
- (C) = indicador de Cobaia;
- (U) = indicador de Universitária;
- (L) = indicador de Policial;
- (M) = indicador de Mochileiro;
- (N) = nível, igual a 1 nesta matriz.

| Classe | PV Máximos | SA Máximo | BI Máxima |
|---|---|---|---|
| Agente | (10+V+5P) | (A+S+U) | (8+S+2C+3P) |
| Autodidata | (8+V+5P) | (A+S+U) | (10+S+2C+3P) |
| Operador | (12+V+5P) | (A+S+U) | (6+S+2C+3P) |

Defesa básica antes de armadura: (10+A+2L).

Capacidade de Inventário: (4+F+M+	ext{expansão ativa válida}). Mochileiro é bônus de Origem. Bolsa/Pochete não acumulam entre si, conforme Planejamento v2.0.

**Não aplicar N multiplicando o bônus de Parrudo como se ele fosse PV por nível.** O texto de Parrudo diz +5 PV Máximos; a fórmula deve somar esse bônus uma única vez. No nível 1, o resultado numérico coincide com a fórmula simples, mas a distinção é essencial para progressão futura.

## 5. Perícias: algoritmo de conferência

Para cada Perícia (p):
1. determinar seu Atributo associado;
2. obter grau investido pela Classe (0, 1 ou 2 pontos);
3. adicionar Treinamento gratuito da Origem, quando for essa Perícia;
4. converter grau total: 0 = Não Treinada (+0), 1 = Treinada (+2), 2 = Mestre (+3);
5. somar Atributo associado;
6. somar somente modificadores permanentes válidos daquela Perícia;
7. manter bônus condicionais e circunstanciais fora do valor permanente.

A validação atual no frontend:
- usa lista de Perícias da Classe mais Perícia extra da Origem;
- exige pontos inteiros não negativos;
- impede grau final acima de Mestre;
- permite distribuir até o limite da Classe enquanto rascunho está incompleto;
- considera conferido quando todos os pontos foram distribuídos.

**Observação de compatibilidade:** a RPC de Perícias e a validação SQL precisam ser comparadas campo a campo com esta lógica. A função de conferência atual não expõe todos os totais de Perícia como resultado tipado; ela valida escolhas e distribuição.

## 6. Equipamento e Defesa: limites do cálculo

A criação entrega 1 Erva Verde, 1 Lanterna Simples, itens característicos e uma opção de equipamento da Classe. Armas de fogo de equipamento inicial começam carregadas. O conjunto C permite gastar até 3 Moedas Antigas em itens acessíveis; moedas não gastas são mantidas.

A conferência TypeScript calcula capacidade e espaços, mas mostra Defesa como “Defesa básica” e explicita “sem Colete equipado”. O Planejamento v2.0 diz que coletes podem limitar ou retirar AGI na Defesa. O Operador tem Colete de Placas Kendo característico, que começa com 0 placas e pode ser ajustado em Sala de Descanso ou com ferramentas adequadas.

**Não inferir:** esta matriz não assume que todo colete altera Defesa pelo mesmo valor, nem que um item no Inventário está automaticamente equipado. A regra exata de cada colete e o estado de equipamento precisam ser consumidos de catálogo/estado próprios.

## 7. Casos de teste numéricos de referência

Os casos abaixo são exemplos matemáticos de conferência, não personagens oficiais nem resultados já testados no sistema.

### Caso A — Agente sem bônus numérico especial
Atributos FOR 2, AGI 2, VIG 2, AST 1; Origem sem bônus numérico; Básica Anatomia de Combate.
- PV = 10 + 2 = 12.
- SA = 2 + 1 = 3.
- BI = 8 + 1 = 9.
- Defesa básica = 10 + 2 = 12.
- Inventário = 4 + 2 = 6.

### Caso B — Autodidata com Universitária
Atributos FOR 1, AGI 2, VIG 1, AST 3; Origem Universitária; Básica Curiosa.
- PV = 8 + 1 = 9.
- SA = 2 + 3 + 1 = 6.
- BI = 10 + 3 = 13.
- Defesa básica = 10 + 2 = 12.
- Inventário = 4 + 1 = 5.

### Caso C — Operador Parrudo + Cobaia
Atributos FOR 3, AGI 1, VIG 2, AST 1; Origem Cobaia; Básica Parrudo.
- PV = 12 + 2 + 5 = 19.
- SA = 1 + 1 = 2.
- BI = 6 + 1 + 2 + 3 = 12.
- Defesa básica = 10 + 1 = 11.
- Inventário = 4 + 3 = 7.

### Caso D — Policial + Operário
Atributos FOR 2, AGI 2, VIG 1, AST 2; Origem Policial; qualquer Básica válida da Classe.
- PV = 12 + 1 = 13.
- SA = 2 + 2 = 4.
- BI = 6 + 2 = 8.
- Defesa básica = 10 + 2 + 2 = 14, antes de efeitos do equipamento.
- Inventário = 4 + 2 = 6.
- Operário ainda exige persistir a arma escolhida; não há bônus numérico geral em Defesa/PV/SA/BI/Inventário.

### Caso E — Mochileiro
Atributos FOR 2, AGI 1, VIG 2, AST 2; Operador; Básica Armeiro.
- PV = 12 + 2 = 14.
- SA = 1 + 2 = 3.
- BI = 6 + 2 = 8.
- Defesa básica = 10 + 1 = 11.
- Inventário = 4 + 2 + 1 = 7, antes de expansão equipada.

## 8. Comparação estática com o código

### Encontrado e coincidente
- `src/classesFicha.ts`: PV por nível, BI Base, SA base, pontos de Perícia, itens característicos e ramos coincidem com o livro nas Classes examinadas.
- `src/origens.ts`: lista de 17 Origens e pares de Perícias coincide com o livro consultado; benefícios estão armazenados como texto simples.
- `src/habilidades.ts`: contém as nove Habilidades Básicas (três por Classe); efeitos são texto simples.
- `src/pericias.ts`: limites de pontos e listas de criação por Classe coincidem com a tabela da p. 26.
- `src/conferenciaCriacao.ts`: valida Atributos, Origem/Treinamento, pontos, Básica, equipamento e derivados. Aplica Policial, Universitária, Cobaia, Mochileiro e Parrudo nos cálculos pertinentes.
- `src/conferenciaCriacao.ts` chama `capacidadeInventario`, `equipamentoInicial`, `espacosOcupados` e `simularCompras`; os contratos internos dessas funções precisam ser auditados antes de fechar equivalência completa com SQL.

### Lacunas e divergências observadas
1. **Operário:** não há escolha de arma em `FichaRevisao` nem na RPC de Origem inspecionada. A habilidade do benefício não pode ser aplicada corretamente sem persistir essa escolha.
2. **Defesa e coletes:** a conferência calcula Defesa básica sem colete. O Planejamento v2.0 pede que modificadores de colete sejam considerados na Defesa efetiva. Separar derivado básico, armadura equipada e total final.
3. **Efeitos não estruturados:** benefícios de Origem e Habilidade são strings; não há catálogo de efeitos tipado nesta camada. Não transformar texto em bônus automático sem mapear gatilhos e alvos.
4. **Passivos:** a proposta SQL possui cálculo separado de Passivos normais. Comparar com o conjunto completo de Perícias e treinamento antes de integrá-lo.
5. **Expansões de Inventário:** fórmula prevê bônus/expansões ativas e não acumular Bolsa/Pochete. Conferir estado de equipamento e compatibilidade de expansões.
6. **Regra da Casa:** fora do escopo desta matriz; seus campos personalizados e prévias precisam de contrato separado.
7. **Nível > 1:** fora do escopo. Não extrapolar estes exemplos para evolução.

## 9. Decisão P-01 — arma da Origem Operário

**Respondido pelo responsável pelo projeto em 30/10/2026:** a arma corpo a corpo semelhante a ferramenta deve ser escolhida obrigatoriamente durante a criação do personagem.

Consequências para a implementação:
- a escolha integra os dados estruturais da criação e precisa ser persistida na ficha;
- a validação da criação de Operário deve impedir a conclusão enquanto a escolha estiver ausente ou inválida;
- a ativação deve preservar a arma escolhida e vinculá-la ao benefício da Origem;
- a escolha não pode ser adiada para o primeiro uso.

**Pendente de especificação técnica:** catálogo/valores válidos da escolha, formato de persistência e validação correspondente ainda precisam ser confrontados com o texto integral do benefício e o catálogo de armas. Não inventar opções nem aplicar o bônus genericamente a qualquer arma.

## 10. Decisões técnicas propostas para validação

1. A função pura recebe escolhas estruturais validadas (Classe, nível, Atributos, Origem e escolhas, distribuição de Perícias, Habilidade, equipamento e método).
2. Retorna derivados com memória de cálculo e fonte de cada parcela: PV Máximos, SA Máximo, BI Máxima, Defesa básica, Inventário e mapa de valores de Perícia/Passivos.
3. Não recebe nem modifica PV/SA/BI atuais como parte do cálculo de máximos.
4. Não resolve Vantagem, reações, cura, bônus por gasto de SA, efeitos por turno/rodada/descanso ou outros efeitos contextuais.
5. Não trata item apenas carregado no Inventário como equipamento vestido/empunhado.
6. É determinística e pura: mesmas entradas e mesma versão de regras produzem a mesma saída; não grava banco, não gera rolagem e não aplica efeitos de jogo.
7. Servidor permanece autoridade; função no cliente pode ser usada para prévia e conferência, nunca como fonte confiável de valores persistidos.

## 11. Próximos passos

1. Auditar `src/equipamento.ts`, `src/comprasIniciais.ts`, `src/inventarioCriacao.ts` e as migrations correspondentes, especialmente armaduras, estado equipado, capacidade e espaços.
2. Especificar a persistência obrigatória da arma escolhida pelo Operário após conferir o catálogo canônico.
3. Conferir os 4 Passivos e todos os valores de Perícia contra o livro e o cálculo SQL.
4. Fechar a matriz com os casos positivos/negativos e decisões pendentes.
5. Só então propor a assinatura e os tipos da função pura, sem substituir RPCs nessa etapa.

**Nenhum código, migration ou banco remoto foi alterado. Nenhum teste automatizado foi executado.**
