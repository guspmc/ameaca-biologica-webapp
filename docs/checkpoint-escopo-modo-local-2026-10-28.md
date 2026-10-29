# Checkpoint — escopo congelado até lançamento do modo local

**Data:** 28/10/2026  
**Branch de trabalho:** `feat/origens-rascunho-alfa04`  
**Estado:** prévia local acessível; login e primeira verificação de persistência das notas concluídos com sucesso. Testes offline ainda pendentes.  
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

## Bloqueio resolvido — `Invalid API key`

O login inicialmente retornava `Invalid API key` porque a chave pública no `.env.teste` tinha o prefixo `sb` duplicado. Gus corrigiu o valor localmente; não foi necessário alterar o código. O login agora funciona no projeto de teste.

A configuração é carregada do arquivo local `.env.teste` com estas variáveis:
- `VITE_AMBIENTE=teste`
- `VITE_SUPABASE_URL=https://elctulggqcokixswusre.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=` uma chave pública real do projeto **ameaca-biologica-rpg-teste**.

O arquivo de exemplo contém intencionalmente o marcador `sb_publishable_SUBSTITUA_PELA_CHAVE_PUBLICA`; esse marcador não é uma chave utilizável. Verificar no computador local se foi substituído por uma chave pública válida do projeto de teste. Nunca enviar a chave ao chat, não usar `service_role`/secret key e não usar a chave de produção. Se não houver acesso ao projeto de teste, interromper aqui e pedir acesso; não contornar a proteção.

## Próximo passo concluído e sequência

1. A chave pública do projeto de teste foi corrigida localmente, recompilada e a autenticação foi confirmada.
2. A Mesa de teste e a ficha da Claire abriram normalmente na conta de Jogador.
3. A primeira nota pessoal foi salva, a ficha foi fechada/reaberta e a nota reapareceu corretamente.
4. Próximos passos: validar isolamento da nota na interface do Mestre e após nova sessão; depois concluir os testes de isolamento por ficha/conta e comportamento offline.

## Evidências já observadas

- Instalação de dependências: concluída.
- Testes automatizados locais: **258 passaram, 0 falharam**.
- Build normal: TypeScript e Vite concluídos.
- Build em modo `teste`: TypeScript e Vite concluídos.
- Prévia local: abriu e mostrou `AMBIENTE DE TESTE`.
- Autenticação no projeto de teste: **confirmada** após corrigir o prefixo `sb` duplicado na chave pública local.
- Mesa `Teste` e ficha da Claire: abriram normalmente na conta de Jogador.
- Nota pessoal: texto de teste salvo e recuperado após fechar/reabrir a ficha (**E1 aprovado por relato do Gus**).
- Isolamento entre personagens/contas, logout/login, cache PWA e comportamento offline: **pendentes**.

## Adiado até depois do lançamento e aprovação do modo local

- Novos módulos e funcionalidades que não sejam necessários para a rodada local/offline.
- Refatorações amplas, polimento visual não bloqueante e mudanças de arquitetura.
- Diagnóstico isolado do logout involuntário relatado anteriormente na Alfa 0.4 de produção, **a menos que** o mesmo problema seja reproduzido no ambiente local e bloqueie a validação da sessão necessária ao modo offline.
- Revisões ou alterações de produção, migrations/RLS sem relação direta com um bloqueio comprovado do modo local, merge e publicação.

Um risco de segurança que afete diretamente o modo local deve ser documentado e interromper a etapa pertinente; não deve ser contornado para cumprir o cronograma.

## Critério para encerrar este checkpoint

Gus concluiu a rodada manual consolidada, os resultados e limitações foram registrados, os defeitos bloqueadores do modo local foram corrigidos e retestados, e Gus aprovou explicitamente o lançamento. Até lá, não iniciar o trabalho adiado.
