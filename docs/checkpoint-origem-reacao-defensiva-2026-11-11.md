# Checkpoint — origem persistente da Reação defensiva

**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Escopo:** integridade da relação entre Reação defensiva, Contra-Ataque Instintivo e Retaliação na Ficha Offline.

## Achado

A interface mantinha em estado React local a confirmação de que a Reação já consumida havia sido usada na defesa. Isso não sobrevivia a recarga da Ficha e permitia ao jogador confirmar manualmente uma relação que o estado persistido da Economia não conseguia provar. O helper de Contra-Ataque Instintivo apenas verificava se alguma Reação havia sido consumida (normal ou comprada), sem identificar sua origem.

## Implementação

- `EstadoTurnoCombate` agora inclui `reacaoDefensivaRegistrada`.
- `aplicarReacaoDefensivaCombate()` executa a transição integrada da Reação e grava o marcador de origem no estado persistido.
- O painel de Esquiva usa essa transição dedicada.
- Contra-Ataque Instintivo só reutiliza a mesma Reação quando a Habilidade está ativa e o marcador persistido confirma que a Reação foi registrada na defesa.
- Se a Reação normal foi gasta por outro gatilho e não há marcador defensivo, o Contra-Ataque compra outra Reação por Esforço, respeitando a janela de 3 SA.
- O marcador é preservado durante o restante do turno e reiniciado ao iniciar o próximo turno próprio.
- Estados compostos históricos sem o novo campo são reconhecidos e migrados em memória com o marcador `false`; registros antigos não são descartados nem tratados como defesa comprovada.
- Retaliação continua dependendo da confirmação de defesa bem-sucedida; esta alteração não aplica Atordoado, Vantagem ou Dano automaticamente.

## Testes adicionados/atualizados

- `tests/estado-turno-combate.test.mjs`: marcador inicial, persistência após recarga, reinício no próximo turno e migração legada.
- `tests/contra-ataque-ficha.test.mjs`: exige origem defensiva persistida e rejeita a antiga confirmação React volátil.
- `tests/reacao-defensiva-ficha.test.mjs`: exige o caminho integrado específico para registrar Esquiva.
- Matriz atualizada em `docs/matriz-auditoria-funcional-ficha.md`.

## Limites preservados

- Aparar continua indisponível na interface até existir estado confiável de equipamento empunhado, elegibilidade e Durabilidade.
- A confirmação de sucesso/falha do Teste de Esquiva e a aplicação de Retaliação ainda não constituem resolução automática do alvo.
- A Ficha não controla Iniciativa nem Encontros.
- O marcador identifica a origem da Reação defensiva; não substitui a confirmação da Mesa sobre o sucesso da defesa ou o gatilho Corpo a Corpo do Contra-Ataque.

## Commits

- `a63c82f` — adiciona marcador persistente ao estado de turno.
- `4159561` — vincula o painel à origem defensiva persistida.
- `c39ce55` — corrige validação/migração dos formatos compostos históricos.
- `e944cc0` — testa persistência, recarga e reinício do marcador.
- `37fc81f` — testa o requisito no Contra-Ataque.
- `a1016b3` — testa o caminho de declaração de Esquiva.
- `09eadb9` — atualiza a matriz funcional.

## Estado da validação

- **Implementado:** alterações registradas na branch.
- **Testes:** adicionados/atualizados; não executados localmente nesta sessão.
- **CI:** verificar os workflows acionados pelo HEAD atual; nenhum resultado deve ser presumido.
- **Validação humana:** adiada até a conclusão da Ficha Offline, exceto Inventário.
- **LAN:** fora do escopo deste ciclo; não foi alterado.
- **main/merge/deploy:** não realizados.

## Próximo ciclo

1. Conferir CI do HEAD e corrigir falhas reais.
2. Em paralelo, mapear pendências Offline em Progressão, recursos/Condições e integração de habilidades de Origem/Classe, sem reabrir o escopo LAN.
3. Continuar as Reações que dependem de equipamento somente quando o estado de equipamento já existente permitir validação segura; manter Aparar bloqueado enquanto isso não existir.
4. Atualizar matriz e checkpoint ao final do próximo incremento.
