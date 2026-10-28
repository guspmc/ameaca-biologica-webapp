# Teste manual da ficha offline — ambiente local

Este roteiro usa somente o projeto Supabase de TESTE. Não use credenciais de produção. Não compartilhe nem comite arquivos .env, chaves ou tokens.

## 1. Conferir a conexão de teste

1. Atualize a branch feat/origens-rascunho-alfa04.
2. Confirme que o arquivo local .env.teste aponta para o projeto Supabase de teste (ref elctulggqcokixswusre) e usa apenas a chave pública/anon desse projeto.
3. Não cole o conteúdo do arquivo .env.teste em issues, commits ou conversas.

A configuração de teste falha fechada se a URL estiver ausente, inválida ou apontar para o projeto de produção.

## 2. Criar um build de teste que também tenha service worker

Abra PowerShell na pasta do WebApp e execute:

```powershell
$env:VITE_PWA_TESTE = "true"
pnpm exec tsc --noEmit
pnpm exec vite build --mode teste
Remove-Item Env:VITE_PWA_TESTE
pnpm exec vite preview --host 127.0.0.1 --port 4174 --strictPort
```

O sinalizador é temporário e habilita o service worker apenas para este build de teste. Ele não deve ser adicionado a .env.teste nem ao repositório. O servidor de desenvolvimento padrão continua sem service worker.

Abra no navegador:

```text
http://127.0.0.1:4174/ameaca-biologica-webapp/
```

## 3. Testar o cache

1. Mantenha a conexão online e entre com uma conta de teste.
2. Abra a Mesa de teste e a ficha de um personagem que pertença a essa conta. Aguarde os dados carregarem do servidor.
3. Abra as ferramentas de desenvolvedor do navegador:
   - Application → Service Workers: confirme que o worker está ativo no escopo /ameaca-biologica-webapp/.
   - Application → Cache Storage: deve existir o cache do shell estático.
   - Application → IndexedDB: deve existir o banco ameaca-biologica-offline-v1.
4. Em Network, marque Offline e recarregue a página.
5. Confirme que a aplicação abre a partir do shell local e mostra o aviso de ficha em cache/possivelmente desatualizada.
6. Confirme que PV, SA, BI, criação de personagem, Origem, Perícias, Habilidade, Identidade, Equipamento e revisão não permitem alterações offline.
7. Desmarque Offline ou reconecte. Recarregue e confirme que os dados são consultados novamente e o aviso de cache deixa de aparecer após sucesso.
8. Use Sair da conta. O cache dessa conta deve ser limpo antes de encerrar a sessão. Se a limpeza não puder ocorrer, o aplicativo deve manter a sessão aberta e informar o motivo.

## 4. Limites deste teste

- O cache local persiste apenas personagens cujo jogador_id corresponde à conta autenticada; fichas completas de outros jogadores não são guardadas offline.
- O service worker armazena apenas o shell estático, nunca respostas do Supabase.
- Não há escrita compartilhada offline nem sincronização de notas pessoais nesta etapa.
- O teste de acesso revogado exige uma segunda conta e deve ser feito separadamente; não simule revogação no projeto de produção.
- A aprovação do build não substitui o teste real em Edge/Samsung Browser.