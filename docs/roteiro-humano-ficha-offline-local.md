# Roteiro humano — Ficha offline local

**Objetivo:** homologar no navegador a ficha pessoal independente de conta, Supabase e servidor LAN.  
**Estado:** roteiro preparado; executar somente depois da confirmação do checkpoint técnico desta rodada.  
**Dados:** usar nomes e conteúdo inteiramente fictícios. Os registros ficam no perfil local do navegador.

## 1. Preparar o ambiente

1. Baixe/atualize o ZIP da branch `feat/offline-first-ficha` indicada no checkpoint aprovado. Extraia o conteúdo para uma pasta local.
2. No Windows, execute `scripts\\windows\\Menu_Testes.bat` com duplo clique. Escolha **1 — Iniciar Ficha Offline**. Não escolha a opção 3: ela inicia também a Mesa LAN, que não faz parte desta bateria.
3. A opção 1 abre uma janela própria para preparar e iniciar a Ficha. O inicializador prefere a porta 4176; se ela estiver ocupada, seleciona uma porta local alternativa sem encerrar o processo existente. A janela do servidor mostra o número da porta no título e o endereço completo. **Mantenha aberta a janela “Ameaca Biologica - Ficha Offline (PORTA)”** durante todos os testes. Encerre-a com Ctrl+C somente ao terminar.
4. Use exatamente o endereço exibido pelo inicializador. O endereço tem o formato `http://127.0.0.1:PORTA/ameaca-biologica-webapp/`.
5. Se preferir preparar manualmente, no PowerShell, na pasta do projeto, confira `node --version` (Node 22.12 ou superior) e `pnpm.cmd --version` (versão declarada pelo projeto: 11.25.0). Depois execute:

```powershell
pnpm.cmd install --frozen-lockfile --ignore-scripts
$env:VITE_PWA_TESTE = "true"
pnpm.cmd exec tsc --noEmit
pnpm.cmd exec vite build --mode teste
Remove-Item Env:VITE_PWA_TESTE
pnpm.cmd exec vite preview --host 127.0.0.1 --port 4176
```

6. Abra o endereço informado no terminal.
7. Confirme que o topo identifica **Ficha do Jogador · Modo offline**, sem conta e sem servidor. Não configure `.env`, Supabase ou credenciais.
8. Abra DevTools → Application. O banco `ameaca-biologica-ficha` deve aparecer em IndexedDB; o Service Worker deve controlar o escopo da aplicação depois do primeiro carregamento.

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
5. **Android/PWA:** este roteiro local em `localhost` valida o shell e o IndexedDB no computador. Para instalar/testar no Android, use uma origem HTTPS confiável com o mesmo commit já publicado. O IP privado HTTP usado no teste LAN não é contexto seguro para Service Worker; não tente contornar isso expondo o servidor de desenvolvimento. Como esta branch ainda não foi publicada, o teste Android do código desta branch permanece pendente até uma publicação aprovada.

## 7. Verificação funcional da Fase 1

Faça estes testes com uma personagem descartável. Não use uma personagem de campanha. Quando um resultado depender de uma decisão narrativa, use somente uma situação fictícia e não invente consequências.

### 7.1 Criação e recursos iniciais

1. Depois de selecionar uma Classe válida, confira PV Atual = PV Máximos, SA Atual = SA Máxima e BI = 0. Antes da escolha da Classe, os valores derivados ainda podem estar indefinidos; não avalie o rascunho incompleto como personagem pronta.
2. Salve Características, Atributos/Perícias e Identidade. Feche e reabra a ficha para confirmar que continuam presentes.
3. Confira os valores derivados de Defesa e os resumos de Classe/Origem. Não altere manualmente valores que a Ficha calcula.

### 7.2 Barra de recursos e Manobras

1. Role a Ficha para baixo e confirme que a barra compacta PV/SA/BI permanece visível no topo do corpo da Ficha.
2. Toque em PV, SA e BI separadamente. Cada indicador deve abrir “Administrar recursos e Integridade Física”.
3. Use −1 SA e +1 SA na barra. Aguarde a confirmação de salvamento e confira o valor atualizado. −1 não pode passar de 0; +1 não pode ultrapassar SA Máxima.
4. No painel Manobras, confirme que não há contador de turno nem bloqueio por janela de turno.
5. Com SA atual abaixo de 3 e SA Máxima igual ou superior a 3, Finalizar deve ficar inativo. Depois de ajustar SA atual para 3, deve ficar disponível. Se houver uma Classe com SA Máxima inferior a 3, confirme também que Finalizar permanece inativo mesmo com SA no máximo.
6. Teste um gasto de 1 SA e um de 2 SA (Esforço), conferindo o desconto após a confirmação. Use apenas ações fictícias; não tente reproduzir gatilhos narrativos reais.
7. Prepare Mirar e confirme o gasto de 1 SA. Na calculadora de Ataque Corpo a Corpo, escolha uma região, registre a rolagem e confira o bônus +2 no resultado. A preparação deve ser consumida somente depois do salvamento confirmado.
8. Repita Mirar na calculadora de Ataque à Distância. O mesmo bônus +2 e o consumo persistido devem funcionar. Se o salvamento falhar, a rolagem não deve ser registrada.
9. Prepare Mirar e use Cancelar Mirar. A preparação deve ser removida, mas o SA não é devolvido automaticamente; se necessário, ajuste-o pelos controles do topo.

### 7.3 Modos de funcionamento e dados

1. Em Automático + dados Virtuais, abra a calculadora de Testes e de Ataque. Abrir a seção não deve gerar rolagem; somente o comando explícito deve fazê-lo.
2. Em Automático + dados Físicos, informe resultados válidos e confira o cálculo. Em dados Mistos, escolha o método da rolagem quando a interface solicitar.
3. Mude o modo para Misto e depois Manual. Os roladores integrados de Testes/Ataques/Dano não devem aparecer nesses modos.
4. Salve as preferências, feche e reabra a ficha. Confirme que modo e preferência de dados permanecem salvos.
5. Quando disponível, confira que o cálculo de Dano apresenta o resultado, mas não altera PV automaticamente.

### 7.4 Condições, Descanso e Reanimação

1. Registre uma Condição fictícia com fonte identificável, salve, feche e reabra. Encerre-a expressamente e confirme o histórico. A Ficha não deve inventar duração nem remover Condições por passagem automática de tempo.
2. Na Sala de Descanso, confira que Descanso Parcial e Completo estão disponíveis. Na Sala Segura, somente Descanso Parcial deve ser permitido.
3. Faça um Descanso Parcial com resultados físicos ou virtuais conforme o modo. Confira PV recuperados e que SA não foi recuperado.
4. Em uma ficha descartável, faça Descanso Completo na Sala de Descanso e confira restauração de PV/SA. Não use o mesmo teste para alegar que Condições ou infecções foram removidas automaticamente.
5. Em outra ficha descartável, teste Reanimação por 0 PV. Registre um resultado físico de sucesso/falha ou use a rolagem virtual no modo Automático. Feche e reabra para conferir a persistência do estado e da contagem.
6. Se estiver testando uma personagem Cobaia em Colapso Viral, confira a Vantagem (2d20, melhor resultado). O teste de Medicina bem-sucedido deve conceder Vantagem ao próximo Teste. Não é necessário forçar um desfecho de morte/transformação: a decisão final permanece com a Mesa.

### 7.5 Progressão

1. Em uma personagem descartável de Nível 1, abra Progressão e confira que o critério neutro aparece como decidido pelo grupo, sem exigir escolha de Missões ou Marco Narrativo.
2. Registre a autorização externa do grupo/Narrador e solicite o avanço. O Nível não deve mudar imediatamente.
3. Cancele a solicitação e confirme que o Nível continua igual. Se desejar testar o fluxo completo, repita a autorização/solicitação, conclua Descanso Completo na Sala de Descanso, escolha os benefícios exigidos e confirme o salvamento.
4. Confira que o Nível e o histórico de benefícios só mudam depois da confirmação de persistência.

**Importante:** o Inventário ativo continua fora desta bateria. Não teste equipar/desequipar, uso/consumo, munição, recarga, Peças, Durabilidade, Aparar universal, Baú ou transferências. A seção Inventário nesta fase serve apenas para consultar o planejamento/equipamento inicial.

## 8. Limites que não devem ser confundidos com falhas

- Esta aplicação offline não autentica contas, não cria Mesas compartilhadas e não sincroniza dispositivos.
- Fichas permanecem rascunhos locais. A presença de seções de Combate ou Inventário na ficha não significa que combate operacional, recursos compartilhados, Inventário ativo ou Baú estejam concluídos.
- A bateria não deve testar alterações compartilhadas de PV/SA/BI, iniciativa, Baú, ativação ou autorização de Mestre.
- O modo offline não substitui o teste separado do servidor LAN.
- Não apagar dados do navegador nem desinstalar o PWA antes de exportar um backup.

## 9. Registro do resultado

Para cada seção, anotar **aprovado**, **falhou** ou **não executado**, o passo e a mensagem observada. Capturas devem ocultar dados pessoais. Não marcar um teste como aprovado só porque o build ou os testes automatizados passaram.
