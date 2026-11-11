# Checkpoint — lembrete contextual de Ambidestria

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fonte canônica:** Arquivo do Jogador v1.0, p. 33 (Autodidata, Combatente — Ambidestria).

## Regra consultada
Quando empunha uma Pistola 9 mm em cada mão, ao usar a Ação Atacar com uma delas, a personagem pode realizar um Ataque adicional com a outra como Ação Bônus, uma vez por turno. Esse Ataque adiciona AGI ao Dano normalmente. Sacar simultaneamente as duas armas usa uma única Interação Gratuita com Objeto. A Habilidade não exige que as Pistolas sejam de Grau Comum.

## Implementado
- `src/CalculadoraTesteLocal.tsx` apresenta lembrete de Ambidestria no escopo de Ataques à distância quando a Habilidade está ativa.
- O texto preserva a condição de duas Pistolas 9 mm efetivamente empunhadas, o uso da Ação Bônus, o limite de uma vez por turno, o bônus de AGI no Dano e a interação para sacar as duas.
- Não altera rolagens, não presume equipamento e não controla o limite de uso por turno.

## Testes
- Verificação estática adicionada em `tests/ataques-calculadora.test.mjs`.
- Não executados localmente. CI pendente no HEAD.

## Limites
- A Ficha ainda não possui estado de armas empunhadas nem controle operacional de Combate com Duas Armas.
- Arsenal Improvável e sua ampliação para Magnums dependem da Habilidade correspondente e não foram inferidos como ativos.
- CODE VERONICA pode permitir Submetralhadoras sem coronha com Ambidestria, mas esse caso requer tratamento específico de arma/equipamento e não foi ampliado aqui.
- Sem validação humana isolada, merge, publicação ou alteração da `main`.
