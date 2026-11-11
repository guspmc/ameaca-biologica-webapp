# Checkpoint — integração de Saber é Poder (Origem Acadêmico)

**Data:** 11/11/2026  
**Branch:** feat/offline-first-ficha  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 23 (Origem Acadêmico).

## Regra consultada
Saber é Poder: uma vez por Descanso Completo, ao realizar um Teste baseado em AST — Teste puro de AST ou Teste de Perícia associada a AST — a personagem faz o Teste com Vantagem.

## Implementado
- CalculadoraTesteLocal.tsx identifica Testes puros de AST e Testes de Perícia associados a AST.
- Quando a Origem é Acadêmico e o uso ainda está disponível, apresenta a opção explícita de usar Saber é Poder naquele Teste.
- A opção participa da resolução comum de Vantagem/Desvantagem: uma fonte de Desvantagem cancela a Vantagem; fontes de Vantagem não acumulam entre si.
- FichaLocal.tsx valida o registro persistido usosDescansoCompleto e só oferece o benefício enquanto origem:academico não estiver marcado como usado.
- Após usar o benefício, o jogador deve marcar o uso no painel Benefícios limitados a Descanso Completo, já existente. O registro permanece no armazenamento local e é renovado pelo fluxo existente de Descanso Completo.

## Testes
- Criado tests/academico-saber-e-poder.test.mjs para cobrir escopo AST, uso persistido, integração e reset da opção ao mudar o Teste.
- tests/usos-descanso-completo.test.mjs já cobre a fonte Acadêmico e o registro/renovação de uso.
- Não executados localmente neste ambiente. CI do novo HEAD ainda precisa concluir.

## Limites
- A opção de uso e o registro de consumo são confirmações do jogador; a Ficha não consome automaticamente o benefício após a rolagem.
- O benefício não é oferecido em Testes de Ataque nem em Perícias associadas a outro Atributo.
- Sem validação humana isolada, merge, publicação ou alteração da main.
