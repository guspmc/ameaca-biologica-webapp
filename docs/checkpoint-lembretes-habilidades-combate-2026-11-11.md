# Checkpoint — lembretes de Habilidades de combate

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Fontes:** Arquivo do Jogador v1.0; catálogo de Habilidades da aplicação.

## Objetivo
Levar Habilidades ativas à Calculadora de Ataques e exibir lembretes para efeitos condicionais que não podem ser aplicados com segurança sem estado de combate/equipamento.

## Alterações
- `src/FichaLocal.tsx`: a chamada de `CalculadoraTesteLocal` com `escopo="ataques"` agora recebe `habilidadesAtivas={habilidadesAtivasIds}`.
- `src/CalculadoraTesteLocal.tsx`: avisos contextuais para:
  - **Quanto Mais Melhor:** Vantagem quando a personagem está na Área de Ameaça de 3 ou mais inimigos. A circunstância é confirmada pela Mesa e a Vantagem é selecionada manualmente.
  - **Armeiro:** +1 no Teste de Ataque por Peça Extra instalada na arma modificada efetivamente empunhada. A pessoa informa o bônus no modificador manual.
  - **Armeira Autodidata:** +1d4 de Dano por Peça Extra instalada em Arma de Fogo modificada; não se aplica a armas Corpo a Corpo. Os dados adicionais permanecem manuais.
- `tests/ataques-calculadora.test.mjs`: teste estático confirma o repasse das Habilidades e os lembretes.

## Limites preservados
- Não conta inimigos, não determina Área de Ameaça nem presume posicionamento.
- Não presume posse, arma empunhada, Peças instaladas ou compatibilidade.
- Não aplica bônus de ataque ou dano automaticamente.
- O catálogo/perfil de arma segue sendo consulta, não Inventário operacional.

## Validação
- **IMPLEMENTADO:** código e teste gravados na branch.
- **TESTES EXECUTADOS:** não localmente neste ambiente.
- **CI:** aguardando conclusão do novo HEAD.
- **VALIDAÇÃO HUMANA:** pendente.
- **MERGE/PUBLICAÇÃO:** não realizados.

## Próxima frente
Auditar Habilidades condicionais restantes e procurar divergências entre descrições canônicas, efeitos apresentados e controles da Ficha, sem inferir estado de combate ou equipamento.
