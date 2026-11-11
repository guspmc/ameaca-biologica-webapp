# Checkpoint — benefício de busca da Origem Criminoso

**Data:** 11/11/2026  
**Branch:** feat/offline-first-ficha  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 24 (Origem Criminoso).

## Regra consultada
Uma vez por Descanso Completo, a personagem recebe Vantagem em Investigação ao procurar itens ou recursos.

## Implementado
- CalculadoraTesteLocal.tsx oferece a finalidade específica "Procurar itens ou recursos" somente quando a personagem tem Origem Criminoso e seleciona Investigação.
- O jogador escolhe explicitamente usar ou não o benefício no Teste elegível.
- O benefício entra na resolução comum de Vantagem/Desvantagem e não acumula com outra fonte de Vantagem.
- FichaLocal.tsx valida usosDescansoCompleto e só oferece o benefício enquanto origem:criminoso não estiver marcado.
- Após usar, o jogador marca o consumo no painel Benefícios limitados a Descanso Completo, já existente.

## Testes
- Criado tests/criminoso-investigacao.test.mjs para verificar a finalidade elegível, o limite de uso persistido e a integração.
- tests/usos-descanso-completo.test.mjs já cobre a fonte Criminoso e a renovação do uso.
- Não executados localmente neste ambiente. CI do novo HEAD ainda precisa concluir.

## Limites
- A Ficha não procura itens, não determina se há recurso disponível nem resolve a exploração; apenas aplica Vantagem ao Teste de Investigação declarado para essa finalidade.
- O consumo continua sendo marcado pelo jogador após usar o benefício.
- Sem validação humana isolada, merge, publicação ou alteração da main.
