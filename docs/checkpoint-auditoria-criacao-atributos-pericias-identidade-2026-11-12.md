# Checkpoint de auditoria — criação: Atributos, Perícias e Identidade

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Natureza:** revisão estática do código e cruzamento com o Arquivo do Jogador v1.0. Não é homologação em navegador.

## Fontes canônicas

- Arquivo do Jogador v1.0, p. 21: sequência de criação e fórmulas derivadas.
- Arquivo do Jogador v1.0, p. 22–25: Origens e listas de Perícias.
- Arquivo do Jogador v1.0, p. 25: Pontos de Perícia por Classe e custo por grau.
- Arquivo do Jogador v1.0, seção de Perícias (p. 41 na paginação do PDF): atributo associado, bônus de Treinamento e fórmula do valor da Perícia.

## Atributos

**Implementado e coerente na inspeção:**
- Quatro Atributos começam em 1; +3 pontos; opcionalmente um único Atributo pode cair de 1 para 0 para conceder +1 ponto.
- Criação limita cada Atributo a 0–3, exige soma 7 e no máximo um zero.
- Editor impede exceder os limites durante a edição; validador de personagem e revisão final conferem a distribuição.
- Derivados são calculados em função da Classe, Origem, Habilidade e Atributos, sem incorporar efeitos condicionais como bônus permanentes.

## Perícias

**Implementado e coerente na inspeção:**
- Pontos de criação: Agente 4, Autodidata 5, Operador 3.
- Um ponto eleva Não Treinada a Treinada; outro eleva a Mestre; máximo Mestre.
- Treinamento gratuito da Origem não consome pontos; a outra Perícia da Origem amplia as opções permitidas pela Classe.
- Amnésico escolhe duas Perícias distintas; uma recebe Treinamento gratuito e a outra amplia as opções, sem conceder Treinamento.
- Valor exibido soma Atributo associado e Treinamento uma única vez; valor Passivo é 10 + valor da Perícia.
- Tentativa e Erro permanece como escolha adicional separada, limitada a uma Perícia que não tenha Treinamento da Origem nem a segunda escolha do Amnésico. Sua implementação é validada em campo próprio e aplicada ao cálculo.

## Identidade e Características

**Implementado na inspeção:**
- Identidade é narrativa/opcional; não altera Atributos ou recursos. Nome e identidade são enviados no mesmo salvamento.
- Gênero declarado é usado apenas para flexões de texto; não altera Classe mecânica.
- Mudanças de Classe/Origem preservam escolhas dependentes, apresentam incompatibilidades e deixam a revisão/validação impedir a ativação enquanto houver pendências.
- A UI usa limites de caracteres menores que alguns limites do validador para idade, ocupação e apelido. Não há regra canônica para esses campos; registrar como diferença de UX, não como divergência mecânica.

## Resultado

- Não foi identificada nesta revisão estática uma divergência mecânica que justifique alterar as fórmulas ou os validadores de Atributos/Perícias.
- Os testes dedicados existem: criação de Perícias, valores de Perícia, derivados, integridade, revisão, identidade e Classes.
- **Testes não executados nesta sessão.** A existência de testes não comprova que a CI do HEAD passou.
- **Validação humana pendente:** editar e salvar combinações de Classe/Origem, conferir Amnésico e Tentativa e Erro, atualizar a página e verificar os valores derivados em navegador.
- Nenhuma regra canônica foi alterada; nenhum arquivo de execução foi modificado neste checkpoint.
