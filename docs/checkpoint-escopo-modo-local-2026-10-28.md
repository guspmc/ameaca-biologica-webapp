# Checkpoint — escopo congelado até lançamento do modo local

**Data:** 28/10/2026  
**Branch de trabalho:** `feat/origens-rascunho-alfa04`  
**Estado:** preparação local avançada; autenticação de teste bloqueada por configuração da chave pública.  
**Regra de governança:** não fazer merge, publicar, alterar produção ou ampliar escopo sem aprovação explícita do Gus.

## Decisão de escopo

Até a versão local/offline ser testada, lançada e aprovada, trabalhar somente no que for necessário para concluir e validar esse modo. Funcionalidades não essenciais ficam registradas aqui e aguardam a aprovação do lançamento local.

## Dentro do escopo atual

1. Corrigir a configuração do **ambiente de teste local** sem recorrer à conexão de produção.
2. Confirmar que a prévia mostra `AMBIENTE DE TESTE` e registra o service worker/cache para a PWA.
3. Usar somente contas, Mesas e personagens fictícias no projeto Supabase de teste.
4. Validar notas pessoais locais separadas por conta/Mesa/personagem, persistência e ausência de exposição na interface do Mestre/outras contas.
5. Validar a abertura offline do shell, a sessão previamente autenticada enquanto ainda válida, notas editáveis offline, dados compartilhados somente para consulta e comportamento após reconexão.
6. Registrar resultados humanos e corrigir apenas defeitos que bloqueiem ou invalidem esses testes.

## Bloqueio atual — `Invalid API key`

A interface local abre e mostra a faixa de teste, mas o login retorna `Invalid API key`. Isso significa que a autenticação e os testes de ficha/notas ainda não foram validados.

A configuração é carregada do arquivo local `.env.teste` com estas variáveis:
- `VITE_AMBIENTE=teste`
- `VITE_SUPABASE_URL=https://elctulggqcokixswusre.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=` uma chave pública real do projeto **ameaca-biologica-rpg-teste**.

O arquivo de exemplo contém intencionalmente o marcador `sb_publishable_SUBSTITUA_PELA_CHAVE_PUBLICA`; esse marcador não é uma chave utilizável. Verificar no computador local se foi substituído por uma chave pública válida do projeto de teste. Nunca enviar a chave ao chat, não usar `service_role`/secret key e não usar a chave de produção. Se não houver acesso ao projeto de teste, interromper aqui e pedir acesso; não contornar a proteção.

## Próximo passo mínimo

1. Parar a prévia com `Ctrl+C` na janela do PowerShell.
2. Abrir `notepad .env.teste` e conferir a URL e se a chave deixou de ser o marcador de exemplo, sem copiar a chave para mensagens.
3. Salvar o arquivo e refazer a compilação especial da PWA com `$env:VITE_PWA_TESTE = "true"`, `pnpm.cmd exec tsc --noEmit` e `pnpm.cmd exec vite build --mode teste`.
4. Remover a variável temporária, iniciar `pnpm.cmd exec vite preview --host 127.0.0.1 --port 4174 --strictPort` e repetir o acesso local.
5. Somente após o login conectar ao projeto de teste, continuar as partes D, E e F do roteiro humano.

## Evidências já observadas

- Instalação de dependências: concluída.
- Testes automatizados locais: **258 passaram, 0 falharam**.
- Build normal: TypeScript e Vite concluídos.
- Build em modo `teste`: TypeScript e Vite concluídos.
- Prévia local: abriu e mostrou `AMBIENTE DE TESTE`.
- Autenticação de teste: **pendente**, por `Invalid API key`.
- Testes humanos de notas e comportamento offline: **ainda não executados**.

## Adiado até depois do lançamento e aprovação do modo local

- Novos módulos e funcionalidades que não sejam necessários para a rodada local/offline.
- Refatorações amplas, polimento visual não bloqueante e mudanças de arquitetura.
- Diagnóstico isolado do logout involuntário relatado anteriormente na Alfa 0.4 de produção, **a menos que** o mesmo problema seja reproduzido no ambiente local e bloqueie a validação da sessão necessária ao modo offline.
- Revisões ou alterações de produção, migrations/RLS sem relação direta com um bloqueio comprovado do modo local, merge e publicação.

Um risco de segurança que afete diretamente o modo local deve ser documentado e interromper a etapa pertinente; não deve ser contornado para cumprir o cronograma.

## Critério para encerrar este checkpoint

Gus concluiu a rodada manual consolidada, os resultados e limitações foram registrados, os defeitos bloqueadores do modo local foram corrigidos e retestados, e Gus aprovou explicitamente o lançamento. Até lá, não iniciar o trabalho adiado.
