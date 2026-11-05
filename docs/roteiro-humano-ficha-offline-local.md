# Roteiro humano — Ficha offline local

**Objetivo:** homologar no navegador a ficha pessoal independente de conta, Supabase e servidor LAN.  
**Estado:** roteiro preparado; executar somente depois da confirmação do checkpoint técnico desta rodada.  
**Dados:** usar nomes e conteúdo inteiramente fictícios. Os registros ficam no perfil local do navegador.

## 1. Preparar o ambiente

1. Atualize a branch `feat/offline-first-ficha` para o commit indicado no checkpoint aprovado.
2. No PowerShell, na pasta do projeto, confira `node --version` (Node 22.12 ou superior) e execute:

```powershell
pnpm.cmd install --frozen-lockfile --ignore-scripts
$env:VITE_PWA_TESTE = "true"
pnpm.cmd exec tsc --noEmit
pnpm.cmd exec vite build --mode teste
Remove-Item Env:VITE_PWA_TESTE
pnpm.cmd exec vite preview --host 127.0.0.1 --port 4174 --strictPort
```

3. Abra `http://127.0.0.1:4174/ameaca-biologica-webapp/`.
4. Confirme que o topo identifica **Ficha do Jogador · Modo offline**, sem conta e sem servidor. Não configure `.env`, Supabase ou credenciais.
5. Abra DevTools → Application. O banco `ameaca-biologica-ficha` deve aparecer em IndexedDB; o Service Worker deve controlar o escopo da aplicação depois do primeiro carregamento.

Se a aplicação não abrir, registre a mensagem e pare; não tente corrigir o ambiente durante a rodada.

## 2. Ciclo básico da ficha

1. Criar uma personagem fictícia com nome de 2 a 80 caracteres.
2. Abrir a ficha e percorrer a ficha contínua: Características, Atributos e Perícias, Combate e Inventário.
3. Preencher Características com opções válidas e salvar. Aguardar o estado **Salvo neste dispositivo**.
4. Preencher Atributos e Perícias e salvar. Não alterar valores fora das opções apresentadas.
5. Preencher Identidade com texto fictício e salvar.
6. Fechar a ficha pelo controle da própria ficha. Abrir novamente pela lista.
7. Confirmar que os dados salvos continuam presentes.
8. Em uma seção, fazer uma alteração sem salvar e tentar fechar. Confirmar que a aplicação pergunta se deseja descartar. Cancelar e verificar que a ficha continua aberta; depois descartar intencionalmente e reabrir para confirmar que a alteração não salva não persistiu.

## 3. Persistência, recarga e conflito entre abas

1. Com uma ficha salva, pressionar F5 e abrir novamente. Os dados confirmados devem permanecer.
2. Abrir duas abas no mesmo navegador e perfil, com a mesma ficha.
3. Na aba A, alterar e salvar uma seção.
4. Sem recarregar a aba B, alterar a mesma seção e tentar salvar.
5. Esperado: conflito informado; a gravação antiga não sobrescreve silenciosamente a alteração de A.
6. Recarregar B e confirmar o valor salvo por A.
7. Repetir com seções diferentes: alterações independentes podem ser mescladas quando o contrato permitir.

## 4. Backup e recuperação

1. Na lista, usar **Exportar backup JSON** e guardar o arquivo fora da pasta do projeto.
2. Importar o mesmo arquivo como **Adicionar como cópias**. Esperado: novas fichas, com identificadores próprios, sem substituir as originais.
3. Exportar novamente, se desejar comparar a quantidade.
4. Selecionar o backup e usar **Substituir fichas locais** somente depois de confirmar que não há dados que queira preservar. Esperado: o conjunto local passa a corresponder ao backup.
5. Tentar importar um JSON inválido ou acima de 10 MB. Esperado: erro claro e nenhum dado alterado.

## 5. Exclusão

1. Criar uma ficha descartável e confirmar que aparece na lista.
2. Usar Excluir e cancelar. Esperado: a ficha continua na lista.
3. Repetir e confirmar a exclusão. Esperado: a ficha deixa de aparecer.
4. Recarregar a página e confirmar que ela continua ausente.

## 6. Modo sem internet e PWA

1. Com o app já carregado uma vez, usar DevTools → Network → Offline ou modo avião.
2. Recarregar a aplicação. Esperado: o shell local abre e as fichas IndexedDB continuam disponíveis.
3. Abrir, editar e salvar uma ficha fictícia. Esperado: persistência confirmada neste dispositivo; não deve aparecer qualquer promessa de sincronização com LAN.
4. Voltar à conexão normal, recarregar e confirmar que os dados locais continuam.
5. Se instalar como PWA no Android, repetir abertura, recarga, teclado, rolagem, retrato/paisagem e salvamento.

## 7. Limites que não devem ser confundidos com falhas

- Esta aplicação offline não autentica contas, não cria Mesas compartilhadas e não sincroniza dispositivos.
- Fichas permanecem rascunhos locais. A presença de seções de Combate ou Inventário na ficha não significa que combate operacional, recursos compartilhados, Inventário ativo ou Baú estejam concluídos.
- A bateria não deve testar alterações compartilhadas de PV/SA/BI, iniciativa, Baú, ativação ou autorização de Mestre.
- O modo offline não substitui o teste separado do servidor LAN.
- Não apagar dados do navegador nem desinstalar o PWA antes de exportar um backup.

## 8. Registro do resultado

Para cada seção, anotar **aprovado**, **falhou** ou **não executado**, o passo e a mensagem observada. Capturas devem ocultar dados pessoais. Não marcar um teste como aprovado só porque o build ou os testes automatizados passaram.
