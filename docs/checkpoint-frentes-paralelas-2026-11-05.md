# Checkpoint técnico — Ficha, Mesa e Painel do Mestre — 05/11/2026

**Branch:** `feat/offline-first-ficha`  
**HEAD de referência antes deste registro:** `3e0ed3232ff7374eaa676e777adcddd7606320f6`  
**Objetivo:** registrar a rechecagem pós-CI e as dependências reais encontradas antes de integrar o Painel do Mestre ao servidor LAN.

## 1. CI rechecado

Os dois workflows do HEAD de referência concluíram com sucesso:
- Compilação geral — run [42115703892](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42115703892).
- Ficha offline — run [42115703853](https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/42115703853).

Isso confirma os testes e builds executados no runner; não comprova o comportamento do Chrome, Windows ou de dispositivos na rede real.

## 2. Painel do Mestre — dependência identificada

Arquivos inspecionados:
- `src/PainelResumoLocal.tsx`
- `src/ResumoOperacional.tsx`
- `src/consultaResumoLocal.ts`
- `src/servicoAtivacao.ts`
- `src/fluxoAtivacaoLocal.ts`
- `tests/consulta-resumo-local.test.mjs`

O componente de resumo e sua apresentação já existem. A consulta é somente leitura, valida estritamente a resposta, limita a dez personagens, distingue condição não informada de lista vazia e não recalcula nem altera recursos. Os testes cobrem isolamento de resposta atrasada, erro, duplicação de consulta, valores desconhecidos e ausência de editor.

**Bloqueio de integração:** `consultaResumoLocal.ts` delega a `prepararServicosAtivacao()`, cujo contrato atual é um cliente RPC compatível com Supabase. A aplicação LAN usa API HTTP Node/SQLite e não possui um endpoint LAN equivalente para o resumo operacional. Não é correto conectar o painel LAN diretamente a um adaptador fictício nem reutilizar a consulta Supabase no fluxo offline/LAN.

**Estado:** componente e serviço de consulta implementados em contexto RPC; integração ao servidor LAN pendente. Nenhum dado demonstrativo deve ser apresentado como personagem real.

## 3. Mesa — autenticação

A inspeção confirmou que `server/auth-local.mjs`, `src/servidorLocal.ts` e `src/ConexaoServidorLocal.tsx` ainda usam e-mail como identificador e exigem senha mínima de 12 caracteres. O Planejamento v2.1, §24, aprova usuário/nickname sem e-mail e senha mínima de quatro caracteres.

A migração não é uma simples troca de rótulo: o esquema atual possui `contas_locais.email NOT NULL UNIQUE`; autenticação, sessões, tickets WebSocket, solicitações de ingresso e respostas administrativas também expõem e-mail. A alteração precisa de migração SQLite que preserve contas, sessões, vínculos e solicitações existentes, defina normalização/colisões de nickname e atualize os contratos de ponta a ponta. Não foi aplicada alteração parcial que deixasse a UI e o banco em estados incompatíveis.

**Estado:** decisão aprovada; implementação pendente. Recuperação de conta/senha sem e-mail continua como questão separada não especificada.

## 4. Ficha e prioridade de salvamento

A revisão anterior do caminho de salvamento permanece válida: cliente envia PUT com revisão esperada; servidor persiste no SQLite e incrementa a revisão; conflito retorna sem sobrescrever a versão mais recente. A falha original ainda depende do teste H1 em Chrome real, com origem HTTPS, Local Network Access, IP LAN do host e duas sessões.

Não se declarou a falha resolvida. O teste humano continua pendente.

## 5. Próximos incrementos sem dependência de teste humano

1. Preparar contrato e migração versionada de autenticação por nickname, incluindo testes de preservação de contas e sessões legadas, antes de alterar a interface.
2. Criar endpoint LAN somente leitura para resumo operacional, derivado exclusivamente de personagens efetivamente ativadas e dados autorizados; validar papel de Mestre no servidor, isolamento entre Mesas, esquema fechado e teto de dez.
3. Integrar o componente existente do Painel do Mestre ao endpoint LAN, mantendo a identidade visual do protótipo congelado e sem editor de ficha.
4. QR Codes: usar geração local, sem serviço externo, somente depois de estabilizar formato do convite e URL efetiva do host.

## 6. Limites

Este checkpoint registra inspeção e decisões técnicas; não declara as etapas acima implementadas. Nenhuma publicação, merge, alteração em `main`, mudança no Supabase legado ou mudança no cânone do RPG foi realizada.
