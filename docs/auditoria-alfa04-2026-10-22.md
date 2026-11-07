# Auditoria do PR #1 — 22/10/2026

Checkpoint: manter rascunho. Sem merge, publicação ou alterações adicionais de produção sem aprovação específica do Gus.

## Evidências e limites

Base examinada: `a8214260e3f2277442cb45f9b1020c6ae695409a`, branch `feat/origens-rascunho-alfa04`.
Consultas de produção somente de leitura: catálogos, permissões, políticas, definição de funções, histórico e contagens agregadas. Não foram lidos nomes, IDs, e-mails, fichas individuais, convites, tokens ou registros de autenticação. Logs brutos não foram consultados para evitar exposição de dados pessoais.

Referências: texto extraído do Arquivo do Jogador v1.0, pp. 21–27 e 42–43; PDF original local com SHA-256 confirmado `79c4ee39cef19dfcf9f757841e0732a2f188fd21165f83a8ad33399e8e3ef365`. Planejamento WebApp v2.0, texto local consolidado de 21/10/2026, capítulos 3–6 e critérios T04/T13. Os livros não foram copiados para o repositório.

## Banco após a execução manual

- Projeto verificado: `pftuhqioutvwnmvlbtrt`.
- `pericia_origem_treinada` e `pericia_origem_extra`: text, anuláveis, sem valor padrão.
- Uma única assinatura de `definir_origem_rascunho(uuid,text,text,text)`, retorno void, último argumento padrão null, proprietário postgres, SECURITY DEFINER e search_path vazio.
- Corpo da função igual ao arquivo 006 da branch, normalizando CRLF: MD5 `f0eb0e46d9c323325bf01f9cd5d268e4`. Comparação de integridade, não mecanismo criptográfico de segurança.
- EXECUTE efetivo: anon=false, authenticated=true. ACL sem grant a PUBLIC.
- Histórico do Supabase registra 001–005; 006 ausente. Objetos presentes não equivalem a migração registrada. Não reaplicar o arquivo: usa CREATE FUNCTION, sem OR REPLACE, e não é integralmente idempotente. Reconciliação do histórico fica para aprovação específica, após conferir o SQL exato; não inserir registro manualmente nesta auditoria.
- Contagens no momento da consulta: 1 personagem, 1 rascunho, 0 com Origem, 0 com treinamento/extra, 0 sem Classe, 0 com BI acima do máximo. Isso não prova execução funcional da RPC nem ausência de alterações históricas em dados.

## Regras e segurança

As 17 Origens e seus pares de Perícias coincidem com J 23–25. Amnésico exige duas distintas e só uma Treinada gratuitamente. Treinamento +2 e associações de Atributos conferem. Policial +2 Defesa, Universitária +1 SA máxima, Cobaia +2 BI máxima e Mochileiro +1 Espaço conferem. Demais benefícios são referência textual; Perícias da Classe, equipamentos, Habilidades e finalização continuam incompletos.

A RPC exige auth.uid(), propriedade, participação como jogador e estado rascunho; rejeita Classe inválida, Origem/Perícia inválidas, extra indevida e troca que descartaria BI acumulada. Trava a ficha, recalcula derivados sem acumular bônus, preserva PV e BI atual e ajusta SA pela diferença do bônus. Isso foi auditado por leitura do SQL, não exercitado com duas sessões reais.

RLS ativa nas quatro tabelas públicas. As permissões de coluna permitem ao autenticado atualizar somente PV/SA/BI atuais em personagens; não permitem INSERT direto nem edição direta de Origem, treinamento, Classe, máximos, proprietário ou estado. A política UPDATE exige proprietário ainda na Mesa em USING e WITH CHECK. As funções auxiliares em app_private têm search_path vazio e acesso restrito. Não foi identificado bypass direto das validações da 006 pelos grants examinados.

Personagens estão na publicação Realtime, incluindo as novas colunas. O cliente assina eventos e tem atualização alternativa a cada 30 segundos. Isso não comprova entrega ou isolamento de eventos em sessões reais.

## Divergências anteriores ao incremento — bloqueiam considerar a Alfa conforme v2.0

1. A política SELECT permite ao Mestre consultar rascunhos alheios. O Planejamento v2.0, capítulo 4, reserva rascunhos ao autor. Consulta integral do Mestre não está conforme, mesmo sendo somente leitura.
2. A RPC 005 limita dez fichas totais por Mesa. O planejamento limita dez personagens ativas e três rascunhos por conta/Mesa. Não existe a separação exigida.
3. A remoção de membro não elimina rascunhos como exige o planejamento; a RLS restringe acesso, mas os registros podem voltar a ser acessíveis após readmissão. Corrigir exige decisão e aprovação de mudança de produção, especialmente por envolver exclusão.

Esses pontos foram registrados, sem mudar políticas, limites ou dados existentes.

## Alertas observados

- SECURITY DEFINER executável por authenticated: cinco RPCs do aplicativo e rls_auto_enable. As RPCs têm verificações explícitas de autorização; o alerta, sozinho, não comprova vulnerabilidade.
- rls_auto_enable também aparece executável por anon. Retorna event_trigger e usa pg_event_trigger_ddl_commands: não tratar o alerta como prova de exploração REST. Revisar/restringir os grants em mudança separada aprovada.
- Proteção contra senhas vazadas desativada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Referência para alertas de funções: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable e https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Performance: FK personagens_jogador_id_fkey sem índice de cobertura; dois índices ainda sem uso observado. Não removidos nem criados índices. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys e https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index
- Alertas Dependabot/code scanning do GitHub não consultados: o conector disponível não oferece essas operações. Não declarar o repositório livre de vulnerabilidades.

## Correções pequenas desta revisão

- Limpar escolhas/mensagens/aba da ficha anterior ao abrir um rascunho recém-criado. Antes, criar uma segunda ficha podia reaproveitar o formulário de Origem da primeira no estado local.
- Explicar o bônus já aplicado de Policial na Defesa e indicar corretamente onde escolher Origem após criar.
- Completar referências: local conhecido antes da amnésia; Lutador acumula com Casca-Grossa; Mercenário exige arma de fogo carregada (J 23–24).
- Nenhuma alteração na migração 006 já executada.

## Validação executada e pendente

TypeScript (`tsc --noEmit`) e Vite passaram localmente. Instalação local com scripts de dependências desabilitados. Build anterior da base também passou no GitHub Actions: https://github.com/guspmc/ameaca-biologica-webapp/actions/runs/39831876684 . O projeto não possui suíte automatizada de comportamento ou banco; compilação e comparação de SQL não a substituem. Sem lockfile no repositório: instalação local resolveu versões atuais dentro dos intervalos, sem garantir reprodução das dependências da execução anterior.

Nenhum teste de escrita foi executado em produção, nem mesmo com rollback. Não foram criadas contas, fichas ou sessões para teste nesta auditoria.

### Roteiro de duas contas em ambiente de teste com dados fictícios

| Caso | Resultado esperado / situação |
| --- | --- |
| Jogador admitido salva cada Origem e recarrega | Persistência, bônus e +2 só na Perícia escolhida; pendente |
| Amnésico: duas iguais, inexistente, null e extra em outra Origem | Rejeição; duas distintas válidas aceitas; pendente |
| Trocar Policial/Cobaia/Universitária/Mochileiro e repetir a mesma escolha | Não acumular bônus; preservar PV/BI e gastos de SA; pendente |
| Sair de Cobaia com BI acima do novo máximo | Rejeição sem alteração parcial; pendente |
| Segunda ficha após editar a primeira | Formulário vazio para nova ficha, sem escolhas anteriores; pendente |
| Conta B tenta RPC na ficha de A e escrita direta em colunas protegidas | Negação; usar IDs só das fixtures de teste; pendente |
| Mestre consulta rascunho de outro autor | Deve ser negado pelo v2.0; política atual permite: divergência conhecida |
| Jogador removido / conta fora da Mesa / sessão encerrada | Acesso negado em consulta, RPC e Realtime; testar também readmissão; pendente |
| Conta A altera recurso e B acompanha | Eventos somente onde autorizado; diferenciar Realtime de polling de 30s; pendente |
| Três rascunhos e tentativa do quarto / dez ativas | Limites separados; implementação atual diverge |
| Requisições concorrentes e troca de Origem durante ajuste de SA/BI | Sem perda silenciosa de atualização; pendente |

Próximo passo: Gus revisar este checkpoint e definir o ambiente de teste. Antes da liberação, aprovar especificamente o ajuste de privacidade/limites e a reconciliação do histórico; preparar mudanças revisáveis antes de qualquer aplicação de produção. Merge e publicação dependem de checkpoint explícito posterior.
