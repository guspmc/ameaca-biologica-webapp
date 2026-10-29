# Rodada humana — modo offline e anotações pessoais

**Estado: ENFILEIRADO — não executar ainda.** A implementação deve passar pelos testes automatizados e pela revisão de código antes de pedir a rodada humana ao Gus. Este roteiro foi escrito para alguém que não trabalha diariamente com programação; seguir na ordem e não pular para os testes do navegador antes da preparação.

## Decisões aprovadas

- As anotações são pessoais e ficam somente no armazenamento local deste navegador/dispositivo.
- Cada nota é separada por conta, Mesa e personagem. Não é enviada ao Supabase, não aparece para o Mestre e não é compartilhada entre fichas.
- As notas permanecem no dispositivo depois de sair da conta; voltam a aparecer quando a mesma conta e personagem forem abertas novamente. Outra conta no mesmo aparelho não deve conseguir vê-las pela interface.
- O WebApp não permite autenticação nova sem conexão. Para consultar uma cópia offline, a conta deve ter entrado online antes e a sessão local precisa continuar válida.
- Dados compartilhados (recursos, Origem, Perícias, Habilidade, Identidade, Equipamento e demais escolhas salvas no servidor) continuam somente para consulta quando offline.
- Apagar os dados do navegador pode apagar permanentemente as notas locais. Não usar notas locais para senhas, tokens ou outros segredos de acesso.

## Parte A — preparar o computador

### A1. Baixar o código da branch certa

1. No computador Windows, abra esta página: https://github.com/guspmc/ameaca-biologica-webapp/tree/feat/origens-rascunho-alfa04
2. Na página do GitHub, clique no botão verde **Code**.
3. No menu que abrir, clique em **Download ZIP**.
4. Espere o download terminar. Abra o Explorador de Arquivos do Windows e entre na pasta **Downloads**.
5. Localize o arquivo ZIP cujo nome começa com `ameaca-biologica-webapp-feat-origens-rascunho-alfa04`.
6. Clique nele com o botão direito e escolha **Extrair Tudo…**. Confirme em **Extrair**.
7. Abra a pasta extraída. Ela deve conter o arquivo `package.json`, além das pastas `src`, `docs`, `tests` e `supabase`.
8. **Esta pasta extraída é a pasta do WebApp.** Não abra nem edite os arquivos dentro do ZIP sem extraí-lo primeiro.

Se o GitHub mostrar um aviso de que o arquivo está indisponível ou a branch não existir, pare e informe a mensagem; não baixe a branch principal por engano.

### A2. Instalar as ferramentas (uma única vez neste computador)

1. Abra https://nodejs.org/ e instale Node.js versão 22 ou superior. Use uma versão LTS compatível; não precisa instalar ferramentas pagas.
2. Quando a instalação terminar, feche janelas antigas do PowerShell/Terminal e abra uma nova.
3. Instale a versão de pnpm usada pelo projeto. No PowerShell, execute:
   ```powershell
   npm.cmd install --global pnpm@11.25.0
   ```
4. Confira as versões:
   ```powershell
   node --version
   pnpm.cmd --version
   ```
5. O primeiro comando deve mostrar `v22` ou superior; o segundo deve mostrar `11.25.0`. Se aparecer erro, pare e envie somente o texto do erro, nunca senhas ou chaves.

### A3. Abrir o PowerShell dentro da pasta certa

1. No Explorador de Arquivos, abra a pasta extraída do WebApp — a que contém `package.json`.
2. Clique na barra de endereço da janela, onde aparece o caminho da pasta.
3. Apague o texto da barra, digite `powershell` e pressione **Enter**. O PowerShell abrirá já apontando para essa pasta.
4. Confira que está na pasta certa executando:
   ```powershell
   Get-ChildItem package.json
   ```
5. O resultado precisa listar `package.json`. Se disser que o arquivo não existe, você está na pasta errada: volte ao Explorador e repita os passos.

### A4. Preparar a conexão do Supabase de TESTE

1. Na mesma janela do PowerShell, copie o exemplo de configuração:
   ```powershell
   Copy-Item .env.example .env.teste
   notepad .env.teste
   ```
2. O Bloco de Notas abrirá o arquivo. A URL deve ser a do projeto de teste: `https://elctulggqcokixswusre.supabase.co`.
3. No painel Supabase do projeto **ameaca-biologica-rpg-teste**, encontre a chave pública em **Settings → API Keys**. Copie somente a chave pública `sb_publishable_...` (ou a chave pública `anon` legada, se for a opção disponível) para o campo `VITE_SUPABASE_PUBLISHABLE_KEY`, substituindo o texto de exemplo.
4. Não use a chave `service_role`, chave secreta, senha do banco ou token pessoal. Não envie o conteúdo do arquivo ao chat e não faça commit dele.
5. Salve o arquivo no Bloco de Notas e feche-o. O nome precisa ser exatamente `.env.teste`, não `.env.teste.txt`.

O arquivo `.env.teste` é ignorado pelo Git. Se você não tiver acesso ao painel do projeto de teste ou não conseguir identificar a chave pública, pare aqui e informe isso; não tente usar a conexão de produção.

## Parte B — preparar e verificar o projeto

Execute cada comando no PowerShell aberto dentro da pasta do WebApp. Espere o comando terminar antes de executar o próximo.

### B1. Instalar dependências

```powershell
pnpm.cmd install --frozen-lockfile --ignore-scripts
```

Espere o comando terminar. Se houver erro, copie a mensagem de erro sem incluir qualquer arquivo de configuração.

### B2. Rodar os testes automáticos

```powershell
pnpm.cmd test
```

O resultado final esperado é uma linha indicando que todos os testes passaram e **0 falhas**. Guarde o número de testes e o resultado. Se algum teste falhar, não continue para os testes de interface; registre o nome do teste e a mensagem.

### B3. Compilar o aplicativo

```powershell
pnpm.cmd run build
```

Esperado: o TypeScript e a compilação Vite terminam sem erros. Isto valida a compilação, mas não substitui o teste de navegação ou de autenticação.

## Parte C — iniciar a prévia com suporte offline

Este passo cria uma versão de teste que inclui o service worker. O comando usa uma variável temporária; não a grave no arquivo `.env.teste`.

1. Na mesma janela do PowerShell, execute:
   ```powershell
   $env:VITE_PWA_TESTE = "true"
   pnpm.cmd exec tsc --noEmit
   pnpm.cmd exec vite build --mode teste
   Remove-Item Env:VITE_PWA_TESTE
   pnpm.cmd exec vite preview --host 127.0.0.1 --port 4174 --strictPort
   ```
2. Se um dos comandos falhar, pare e registre em qual linha ocorreu. Não execute o comando seguinte como se tivesse dado certo.
3. Se todos terminarem corretamente, mantenha essa janela aberta. Ela está executando o servidor local. Fechá-la interrompe a prévia.
4. Abra o Microsoft Edge e digite exatamente este endereço:
   `http://127.0.0.1:4174/ameaca-biologica-webapp/`
5. Confirme que aparece a faixa **AMBIENTE DE TESTE**. Se aparecer a Alfa normal, se pedir para configurar a conexão de produção ou se a faixa estiver ausente, pare; não faça login.

## Parte D — preparar as contas e as fichas de teste

1. Mantenha o navegador online.
2. Entre com uma conta fictícia já existente no projeto Supabase de TESTE. Se não houver uma, use **Cadastrar** com um e-mail sob seu controle; confirme o e-mail se o Supabase pedir.
3. Use somente uma Mesa e personagens fictícias do ambiente de teste. Não use Claire ou qualquer ficha de campanha real.
4. Tenha duas personagens próprias de teste na conta A. Se possível, tenha também uma segunda conta B no mesmo navegador para verificar o isolamento. Não compartilhe senhas, links de confirmação ou tokens.
5. Abra a ficha A1 e aguarde o carregamento terminar. Só depois comece a conferir o modo offline.

## Parte E — anotações pessoais (local, por conta/Mesa/ficha)

### E1. Salvar e recuperar a nota

1. Na ficha A1, localize **Anotações pessoais**.
2. Digite um texto de teste identificável, por exemplo: `NOTA PRIVADA A1 - teste 01`.
3. Espere o estado abaixo do campo indicar que a nota foi salva neste dispositivo.
4. Feche a ficha usando o botão de voltar à Mesa. Abra novamente a mesma personagem A1.
5. Esperado: a nota A1 reaparece sem precisar salvar novamente.
6. Abra a personagem A2 da mesma conta.
7. Esperado: A2 começa sem a nota de A1. Não copie o texto entre fichas.
8. Volte a A1. Esperado: a nota original continua lá.

### E2. Isolamento entre contas

1. Com a conta A ainda online, anote se a nota A1 está visível.
2. Use **Sair da conta** e entre com a conta B. Use somente uma personagem de teste que pertença à conta B.
3. Esperado: a conta B não vê a nota de A1 nem qualquer anotação pessoal de A.
4. Saia da conta B e entre novamente com a conta A.
5. Abra A1. Esperado: a nota original de A1 continua salva neste dispositivo.
6. O Mestre não deve ver as anotações pessoais de A1, nem na ficha nem em qualquer painel.

### E3. Apagar somente a nota de uma ficha

1. Abra A1, selecione somente o texto da nota e apague-o.
2. Espere a mensagem de estado indicar que a nota foi removida deste dispositivo.
3. Feche e reabra A1. Esperado: A1 fica vazia.
4. Abra A2. Esperado: o conteúdo de A2 permanece inalterado.

## Parte F — modo offline

### F1. Confirmar o cache do aplicativo

1. Com a conta A autenticada e online, pressione **F12** no Edge para abrir as ferramentas de desenvolvedor.
2. Se aparecer uma janela de ferramentas, abra a aba **Application**. Se não estiver visível, procure no menu `>>` das abas.
3. No menu esquerdo, abra **Service Workers**. Esperado: um worker ativo no escopo `/ameaca-biologica-webapp/`.
4. Abra **Cache Storage**. Esperado: um cache com os arquivos estáticos do aplicativo.
5. Abra **IndexedDB**. Esperado: o banco `ameaca-biologica-offline-v1`.
6. Não altere nem apague nada nas ferramentas de desenvolvedor.

### F2. Recarregar sem internet

1. Abra a aba **Network** nas ferramentas de desenvolvedor.
2. Marque a opção **Offline**. Isso simula a perda de conexão apenas nesta aba do navegador.
3. Volte à página do WebApp e pressione **Ctrl+R** para recarregar.
4. Esperado: o shell do aplicativo abre a partir do cache e a interface indica modo offline/cópia local possivelmente desatualizada.
5. A conta A deve continuar sendo a conta já autenticada no navegador, desde que a sessão local ainda esteja válida. Isto não significa que seja permitido entrar em uma conta nova sem internet.
6. Se a página mostrar erro, ficar em branco ou exibir dados de outra conta, tire uma captura sem dados pessoais e registre a mensagem.

### F3. Conferir somente leitura dos dados compartilhados

Com a simulação **Offline** ainda marcada, abra a ficha A1 e confira:

- PV, SA e BI: os controles de alteração devem ficar desabilitados ou não disponíveis.
- Origem e Treinamento: não deve ser possível confirmar alterações.
- Perícias de Classe: não deve ser possível salvar alterações.
- Habilidade Básica: não deve ser possível salvar alterações.
- Identidade: não deve ser possível salvar alterações.
- Equipamento e escolhas de criação: não deve ser possível salvar alterações.
- Preferências da revisão: não deve ser possível salvar alterações.
- Anotações pessoais: devem continuar editáveis, pois são locais e não alteram o estado compartilhado do jogo.

Não tente contornar controles, enviar requisições manualmente ou alterar dados no banco durante este roteiro.

### F4. Nota offline e reconexão

1. Ainda com **Offline** marcado, adicione ao fim da nota A1: ` / alterada offline`.
2. Espere o estado confirmar o salvamento local.
3. Pressione **Ctrl+R**. Esperado: a parte `alterada offline` permanece na nota A1.
4. Volte às ferramentas de desenvolvedor → **Network** e desmarque **Offline**.
5. Recarregue a página. Espere a consulta online terminar.
6. Esperado: o aviso de cache desatualizado desaparece após a consulta bem-sucedida, e a nota local continua presente.
7. Abra A2 e a conta B, se disponível. Esperado: a nota de A1 não aparece nelas.

### F5. Login continua obrigatório

1. Com a conexão restaurada, use **Sair da conta**.
2. Marque **Offline** novamente e recarregue.
3. Esperado: o aplicativo não permite entrar em uma conta nem abrir uma sessão autenticada nova sem conexão. Não deve tratar a simples existência de uma nota local como autorização para entrar.
4. Desmarque **Offline**, entre novamente com a conta A e abra A1.
5. Esperado: a nota continua no dispositivo e volta a aparecer somente depois da autenticação da conta A.

## Parte G — finalizar e relatar

1. Desmarque **Offline** no Edge.
2. Feche as ferramentas de desenvolvedor com F12.
3. Não apague Cache Storage, IndexedDB nem dados do navegador, porque isso pode remover evidências e notas locais.
4. Para encerrar a prévia, volte à janela do PowerShell e pressione **Ctrl+C** uma vez.
5. Relate cada caso como **Funcionou**, **Falhou** ou **Não consegui executar**, indicando a letra e o número (ex.: `E2 — Falhou`). Se falhar, diga o que apareceu e em qual passo. Não precisa diagnosticar o problema.
6. Nunca envie senha, chave do Supabase, token, link de confirmação ou conteúdo pessoal das notas. Capturas devem mostrar apenas contas, personagens e notas fictícias.

## O que este roteiro não comprova

- Não comprova acesso em todos os navegadores ou celulares.
- Não comprova revogação de acesso entre duas contas autenticadas em conexões independentes.
- Não comprova criptografia das notas locais; elas são texto local no armazenamento do navegador.
- Não prova que o aplicativo esteja pronto para publicação. O merge e a publicação continuam condicionados a revisão e autorização próprias.
