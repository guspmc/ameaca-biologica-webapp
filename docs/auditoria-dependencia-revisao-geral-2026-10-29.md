# Checkpoint — dependência da revisão geral no cliente e na ativação

**Data:** 29/10/2026  
**Branch:** `fix/lan-websocket-reconnect-2026-10-29`  
**Base:** `343402bec5d96f6821ad1bc7c48210a9baa208d8`  
**Escopo:** leitura estática de `src/conferenciaCriacao.ts`, `src/preAtivacao.ts`, `src/servicoAtivacao.ts`, `src/pedidoAtivacao.ts` e testes do pacote integrado. Sem execução.

## Achado

O cliente não calcula nem incrementa `revisao_criacao`. O contrato de transporte recebe a revisão geral do servidor em `revisaoFicha`, guarda esse número no pedido e o envia de volta à RPC de ativação.

O controlador conserva o mesmo pedido/identificador em tentativas e o recibo exige que `revisaoCriacao` seja maior que a revisão pedida. O teste integrado verifica essa progressão depois da ativação.

A avaliação local `preAtivacao.ts` compara explicitamente apenas as revisões especializadas `revisao_compras` e `revisao_funcionamento`, além de reavaliar os dados salvos. A revisão geral não é usada como estado local da interface.

## Implicação

A revisão geral é parte do protocolo servidor-conferência-ativação proposto, mas não é uma exigência da interface de QA nem um contador mantido pelo cliente.

O servidor precisa de uma forma confiável de detectar que algum dado relevante mudou entre conferência e ativação. Isso pode ser atendido por:
- contador geral incrementado por uma allowlist de campos;
- snapshot/hash dos dados relevantes comparado sob lock;
- composição explícita de revisões especializadas mais revisão dos campos sem contador próprio.

A interface não exige que mudanças de inventário, recursos ou ciclo incrementem a revisão geral. O contrato do recibo só exige que a revisão devolvida avance após ativação; a proposta atual satisfaz isso incidentalmente porque o trigger genérico conta a mudança de estado/metadado.

## Recomendação para a próxima rodada

Não manter o gatilho genérico apenas para fazer o recibo avançar. Se a arquitetura mantiver `revisao_criacao`, a ativação deve avançar a revisão de maneira explícita e semanticamente definida; a conferência deve detectar alterações dos campos que realmente compõem a entrada de ativação. A revisão de inventário e as revisões especializadas devem continuar separadas.

Antes de escolher entre allowlist e snapshot/hash, revisar se a conferência inclui todos os dados que podem mudar e se as RPCs existentes bloqueiam/serializam corretamente cada alteração.

Nenhuma alteração de SQL, migration, interface ou banco foi feita. Nenhum teste executado nesta etapa.
