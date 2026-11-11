# Checkpoint — Origem Lutador e progressão de Dano com Casca-Grossa

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Implementação principal:** `a50db296f7e49c17f8c7bf315ad64f3df69078a4`  
**Testes:** `d256aaad7866d89cfd0bfc5f46417678ad36ed2e`  
**Matriz:** `40e7f68a78ac5d11703ae6ad5789cf1fbfb2ca74`

## Objetivo

Implementar na calculadora de Ataques os aumentos de categoria de Dano previstos para a Origem Lutador e a Habilidade Casca-Grossa, sem automatizar rolagens, equipamento ou aplicação de Dano à ficha.

## Fonte canônica consultada

- Arquivo do Jogador v1.0, p. 24: Lutador aumenta uma categoria o Dano de Ataque Desarmado e Arma Improvisada; acumula com Casca-Grossa; não afeta Coronhada.
- Arquivo do Jogador v1.0, p. 37: Casca-Grossa aumenta uma categoria o Dano Desarmado ou de Coronhada.
- Arquivo do Jogador v1.0, p. 52: Ataque Desarmado base 1d4 + FOR; Arma Improvisada base 1d6 + FOR.
- A sequência canônica de categorias é aplicada aos Dados antes do multiplicador de Acerto Crítico.

## Alterações

### Novo `src/progressaoDano.ts`

- Centraliza a sequência de categorias de Dano.
- `aumentarCategoriaDano()` valida fórmula e quantidade de passos.
- `categoriasAtaqueUniversal()` calcula os bônus específicos de Lutador e Casca-Grossa:
  - Lutador + Ataque Desarmado: +1 categoria.
  - Lutador + Arma Improvisada: +1 categoria.
  - Casca-Grossa + Ataque Desarmado: +1 categoria.
  - Lutador + Casca-Grossa + Ataque Desarmado: +2 categorias.
  - Casca-Grossa não aumenta Arma Improvisada.
  - Lutador não aumenta Coronhada.

### `src/CalculadoraTesteLocal.tsx`

- O campo de Dano passa a mostrar a fórmula ajustada.
- O benefício só se aplica no escopo de Ataques e aos perfis universais elegíveis.
- A calculadora não rola os Dados, não presume posse/equipamento, não consome recursos e não altera PV.
- Casca-Grossa em Coronhada permanece manual porque o perfil não confirma arma de fogo de duas mãos com coronha resistente e autorizada.
- Cabeçada/Pisão e limite de uso por turno continuam sendo lembretes manuais.

### Testes

- Novo `tests/progressao-dano.test.mjs`: sequência, benefícios de Lutador, acumulação com Casca-Grossa, exclusões e entradas inválidas.
- `tests/ataques-calculadora.test.mjs`: integração de UI e separação de Coronhada manual.

## Estado de validação

- Código e testes adicionados à branch.
- Testes locais não executados neste ambiente.
- CI ainda precisa concluir para o HEAD do checkpoint; não declarar build ou testes aprovados até haver resultado.
- Nenhuma validação humana solicitada.

## Limites e pendências preservados

- Coronhada não foi adicionada como perfil de arma/equipamento.
- Não há controle de arma efetivamente empunhada.
- Não há execução de Ataque/Dano nem alteração de PV.
- Inventário ativo continua bloqueado até a Ficha completa e a sessão integrada de validação humana.
- Progressão de Nível permanece sem novas alterações enquanto se desenha uma solução neutra, sem seleção obrigatória de método no WebApp.

## Segurança e publicação

- Nenhuma alteração em `main`, merge, deploy ou publicação.
- Nenhuma alteração em Supabase ou banco de produção.
