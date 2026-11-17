# Checkpoint — preparação para homologação da Ficha Offline — 17/11/2026

## Identificação
- Projeto: Ameaça Biológica RPG — Ficha Offline PWA.
- Branch: `feat/offline-first-ficha`.
- HEAD documental atual: `ea7a5d2f6e0bbcb3e4d9412f9bd2887b610c0a63`.
- Último código funcional submetido à CI: `a98bdc324df32d5e23708a2c8c88f4b471fde92e`.
- Alterações posteriores a esse código: somente documentação; nenhum arquivo de produção/teste foi modificado depois da CI aprovada.

## Objetivo deste ciclo
Acelerar a entrega jogável, mantendo a ordem de fases e priorizando a Ficha Offline confiável. Não antecipar Inventário ativo, Painel do Mestre ou Laboratório.

## Evidências confirmadas
- Build de produção: **TESTADO AUTOMATICAMENTE / APROVADO**, workflow `Validar compilação do WebApp`, run `44133790936`, job `134217691717`, no código `a98bdc3`.
- TypeScript da interface: **TESTADO AUTOMATICAMENTE / APROVADO**, `pnpm exec tsc --noEmit -p tsconfig.ui.json`, no mesmo workflow.
- Suíte automatizada: **TESTADO AUTOMATICAMENTE / APROVADO**, workflow `Verificação da ficha offline`, run `44133791005`, job `134217692288`; 154 arquivos `tests/*.test.mjs` concluídos, sem falhas nem timeout.
- O build mantém aviso não bloqueante de chunk JavaScript acima de 500 kB e avisos de depreciação do runner. Sem ação nesta etapa.
- Entradas ativas: `src/main.tsx` seleciona `FichaOfflineApp` por padrão e `ConexaoServidorLocal` somente com `?servidor=local`. O teste `entradas-offline-sem-supabase.test.mjs` percorre o grafo das entradas e garante ausência de import Supabase; SDK permanece apenas em devDependencies.
- Persistência Offline: IndexedDB v3, store de personagens separado de vínculos LAN; leitura, gravação, patch, migração e concorrência possuem testes automatizados.
- Service Worker: registra somente no build de produção ou no build de teste com `VITE_PWA_TESTE=true`; cache restrito ao shell/estáticos do mesmo escopo, sem API ou dados pessoais. Manifest standalone e escopo relativo.
- Inicializador Windows: `Menu_Testes.bat` → opção 1 chama `Iniciar_Ficha_Offline.bat`, verifica ambiente/porta, prepara dependências com lockfile congelado, valida TypeScript, cria build de teste e inicia preview local em `127.0.0.1:4176`.

## Auditoria funcional — estado observado
- Criação/rascunho Offline: fluxo de criação local e edição contínua identificados; Características, Atributos/Perícias, Identidade e planejamento de Habilidades possuem persistência local.
- Revisão de criação lê apenas dados salvos e não altera/ativa a personagem.
- Ativação com materialização de inventário inicial é um fluxo LAN separado, protegido por revisão/recibo/idempotência; não confundir com a Ficha Offline local.
- Recursos PV/SA/BI, Condições, Descanso, Reanimação, Progressão Offline, testes/roladores e economia de ações possuem módulos e testes identificados. Isso ainda não substitui validação de navegador.
- Quatro Manobras continuam sem controle operacional: Adiar Ação, Agarrar, Empurrar/Derrubar e Esconder-se. A decisão é manter consulta/manual até haver fluxo seguro; não implementar motor de turnos nem aplicar efeitos de alvo automaticamente.
- Inventário ativo continua fora da Fase 1 por decisão do planejamento; somente criação/rascunho e consulta existentes não significam que uso, equipamento, munição, recarga, consumo ou Baú estejam prontos.

## Fases
- Fase 0 — Preparação Offline: **EM ANDAMENTO**. A auditoria estática e CI são favoráveis; falta validar inicialização real, IndexedDB real, Service Worker e comportamento offline em navegador.
- Fase 1 — Ficha Offline: **EM ANDAMENTO**. Cobertura automatizada aprovada; falta concluir auditoria funcional de todos os requisitos e decidir/implementar apenas lacunas necessárias para uma sessão jogável.
- Fase 2 — Testes humanos: **PENDENTE**. Não declarar executada. O roteiro é `docs/roteiro-humano-ficha-offline-local.md`.
- Fases 3–9: **NÃO INICIADAS**.

## Escopo de prazo
Objetivo operacional informado por Gus em 17/11/2026: ter uma versão jogável para usar no próximo mês. Prioridade:
1. Fechar auditoria dos recursos indispensáveis à sessão (criação/edição, rolagens, combate essencial, recursos, condições, descanso, reanimação e progressão).
2. Corrigir somente defeitos ou lacunas que bloqueiem esses fluxos.
3. Fechar Fase 0 com evidência de teste real em navegador.
4. Fechar Fase 1 e preparar/acompanhar a bateria humana documentada.
5. Não antecipar Inventário ativo, Painel, Laboratório, integração LAN ampliada, temas ou redesign.

## Arquivos alterados neste ciclo
- `docs/matriz-auditoria-funcional-ficha.md`: resumo da validação alinhado à CI aprovada.
- `docs/linha-de-trabalho-e-continuidade-2026-11-12.md`: continuidade atualizada no ciclo anterior.
- Este checkpoint.

## Testes executados neste ciclo
- Nenhum teste novo executado após os commits documentais. A CI citada testa o código funcional `a98bdc3`; os commits documentais não alteraram código.

## Riscos e pendências
- Nenhum teste humano informado.
- Testes automatizados estruturais não exercitam navegador real, IndexedDB real, instalação do Service Worker nem modo avião.
- O prazo depende de ciclos curtos e de Gus executar os testes reais assim que a Fase 1 estiver pronta; não é correto prometer homologação antes disso.

## Próxima ação exata
Continuar a auditoria dos fluxos indispensáveis de combate/rolagem e dos estados de recursos/condições/descanso/reanimação/progressão, cruzando a implementação com o Arquivo do Jogador v1.0. Registrar apenas lacunas reais, implementar a menor correção segura quando necessária e executar CI novamente. Depois da conclusão da Fase 1, Gus executará o roteiro humano para fechar a Fase 2.
