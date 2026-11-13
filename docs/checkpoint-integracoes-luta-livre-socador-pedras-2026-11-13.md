# Checkpoint — integrações operacionais de Luta Livre e SOCADOR DE PEDRAS

**Data:** 13/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** corrigir duas lacunas da Ficha que não dependem do Inventário ativo.

## 1. Luta Livre — Finalização com custo condicionado

**Fonte canônica:** Arquivo do Jogador v1.0, p. 29. A Manobra Finalizar custa 3 SA (p. 79), mas Luta Livre dispensa esse custo quando o alvo é derrotado pela Manobra.

**Implementado**
- `src/manobrasOperacionais.ts`: novo helper `registrarFinalizarLutaLivre()`. Valida turno ativo e confirmação booleana; registra custo normal de 3 SA quando o alvo não foi derrotado e preserva o saldo quando a Mesa confirma que foi derrotado pela Manobra.
- `src/PainelAcoesLocal.tsx`: personagens com a Habilidade recebem fluxo próprio, em vez do botão genérico. O fluxo exige confirmação de alvo Atordoado e, após a resolução, confirmação da Mesa sobre o desfecho. A confirmação não é inferida nem aplicada narrativamente.
- O texto contextual preserva o deslocamento de até 12 m e o bônus de +1d8 por Nível de Agente (máximo 10d8) quando o alvo não está Vulnerável; a Ficha não executa Ataque, Dano ou efeitos em terceiros.

**Cobertura adicionada**
- `tests/manobras-operacionais.test.mjs`: custo de 3 SA, exceção de 0 SA, turno encerrado e confirmação inválida.
- `tests/ataque-oportunidade-ficha.test.mjs`: presença do fluxo específico e ausência do aviso antigo que instruía evitar o botão genérico.

## 2. SOCADOR DE PEDRAS — Dano base do Ataque Desarmado

**Fonte canônica:** Arquivo do Jogador v1.0, p. 38.

**Implementado**
- `src/CalculadoraTesteLocal.tsx`: com a Habilidade ativa e perfil Ataque Desarmado selecionado, a fórmula base muda para 3d10.
- A fórmula passa pela progressão de categoria já existente depois da substituição, de modo que Casca-Grossa continue aumentando a categoria, conforme a expressão canônica “antes de aumentos de categoria”.
- Lembrete contextual informa o 1d10 da onda de choque para criaturas adjacentes e a possibilidade de usar o resultado do Ataque como DT de Fortitude para Derrubar. A Ficha não aplica dano a terceiros nem resolve a Manobra.

**Cobertura adicionada**
- `tests/ataques-calculadora.test.mjs`: verificação estrutural da seleção da Habilidade, fórmula 3d10, progressão posterior e lembrete da onda de choque.

## 3. Estado de validação e limites

- Alterações restritas à branch `feat/offline-first-ficha`.
- Testes automatizados, build e CI **não executados** nesta etapa. Testes adicionados não equivalem a aprovação.
- Validação humana pendente em Automático, Misto e Manual, especialmente troca de habilidade/perfil, fórmula 3d10, Casca-Grossa e os dois resultados possíveis da Luta Livre.
- Os efeitos de SOCADOR DE PEDRAS ligados a Aparar/Contra-Ataque continuam sujeitos aos controles de Reação e às dependências de equipamento quando aplicáveis.
- Sem alterações em cânone, banco, schema, LAN, Supabase, Inventário, navegação, `main`, merge, deploy ou publicação.

## 4. Próxima continuidade

Retomar a matriz e auditar outras Habilidades/efeitos não dependentes do Inventário, verificando cada uma no domínio, calculadora e Painel de Ações. Depois fechar integração Offline da Ficha e preparar a bateria humana consolidada.
