# Checkpoint — Reflexos de Sobrevivente e Rolamento

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Auditoria do cânone
Consulta direta ao Arquivo do Jogador v1.0, p. 30 (Rolamento) e p. 34 (Reflexos de Sobrevivente).

## Alterações
- `src/FichaLocal.tsx`: complemento do lembrete de Reflexos de Sobrevivente: uma Esquiva por rodada sem Reação, próxima Ação Bônus comprometida e passagem por espaços ocupados por personagens/inimigos Médios e menores sem Ataque de Oportunidade.
- `src/FichaLocal.tsx`: lembrete de Rolamento para reposicionar até 3 m após Esquiva bem-sucedida, sem provocar Ataques de Oportunidade.
- `tests/condicoes-calculadora.test.mjs`: teste estático para presença dos benefícios.
- Matriz de estado atualizada.

## Limites
- Sem rastreamento de rodada, uso, posição, tamanho ou geometria.
- Nenhum recurso é consumido automaticamente.
- Teste adicionado, não executado localmente; CI pendente. Sem validação humana, merge ou publicação.
