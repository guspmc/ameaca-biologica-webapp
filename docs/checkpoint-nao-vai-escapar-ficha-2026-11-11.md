# Checkpoint — Integração de Não Vai Escapar na Ficha
**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Fonte canônica
Arquivo do Jogador v1.0, p. 29:
- Quando uma criatura provocar Ataque de Oportunidade para você ou para um aliado em combate Corpo a Corpo, pode usar sua Reação para realizar Ataque de Oportunidade contra ela.
- Imediatamente antes do Ataque, pode deslocar-se até 3 m, terminando adjacente ao alvo; esse deslocamento não provoca Ataques de Oportunidade.

## Implementação
- `src/reacoesCombate.ts`: novo helper `registrarNaoVaiEscapar()`, com validação estrita da avaliação e consumo da Reação.
- `src/PainelAcoesLocal.tsx`: seção exibida somente quando `nao-vai-escapar` consta entre as Habilidades ativas.
- O jogador confirma que a criatura provocou Ataque de Oportunidade para si ou para aliado e que o gatilho ocorreu em combate Corpo a Corpo.
- Reação normal disponível: consome sem SA. Reação normal já usada: compra outra por 1 SA, respeitando a janela de 3 SA.
- Interface informa deslocamento permitido de até 3 m e término adjacente; esclarece que deslocamento e Ataque são manuais.

## Limites deliberados
- Não detecta gatilhos espaciais, não valida se a criatura provocou o Ataque de Oportunidade e não calcula distância/adjacência.
- Não executa deslocamento nem Ataque; não rola, não verifica Defesa e não aplica Dano/efeitos.
- Não coordena o gatilho com outra ficha ou Encontro compartilhado.

## Testes e validação
- `tests/reacoes-combate.test.mjs`: novos testes para elegibilidade, registro da Reação, compra adicional e rejeição de avaliação inválida.
- `tests/estado-turno-combate.test.mjs`: persistência no estado composto.
- Novo `tests/nao-vai-escapar-ficha.test.mjs`: exibição condicional, confirmações contextuais e limites da interface.
- Testes não executados localmente neste ambiente.
- CI do novo HEAD precisa ser consultado; nenhuma aprovação presumida.
- Nenhuma validação humana solicitada.

## Escopo preservado
- Nenhuma alteração em `main`, merge, deploy, publicação, Supabase ou banco de produção.
- Inventário ativo permanece bloqueado até conclusão da Ficha, auditoria e sessão integrada de validação humana.
