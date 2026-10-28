# Pacote integrado de ativação — 27/10/2026

## IMPLEMENTADO

Foi criado `supabase/proposals/ativacao-integrada-local.sql`, um pacote de composição que reúne, nesta ordem, as sete propostas já existentes:

1. `inventario-instancias.sql` — materialização de itens por instância;
2. `ativacao-local.sql` — validação e ativação transacional privada;
3. `resumo-operacional-local.sql` — projeção operacional e ajuste de RLS;
4. `ciclo-ficha-local.sql` — instâncias localizáveis, arquivamento/retomada e saída da Mesa;
5. `consulta-ativacao-local.sql` — consulta autorizada de resultado/recibo;
6. `contexto-criacao-local.sql` — preparação explícita e revisão do contexto da Mesa;
7. `gateway-ativacao-local.sql` — chamadas públicas autenticadas com validação fechada.

O pacote remove os limites de transação individuais das propostas e envolve a composição inteira numa transação, para que o ensaio local detecte problemas de ordem ou dependência sem deixar metade do conjunto instalado.

O pacote **não é uma migration** e não deve ser executado num projeto Supabase. Continua em `supabase/proposals/`, fora da cadeia de migrations.

O fixture `tests/helpers/ciclo-fixture.mjs` aceita agora `setup({integrada:true})`; a preparação padrão dos testes anteriores permanece inalterada. O novo `tests/ativacao-integrada-local.test.mjs` exercita a composição conjunta, não apenas cada proposta isolada.

## TESTADO

O teste integrado foi preparado para verificar:

- criação de rascunho e conferência com resposta fechada;
- ativação por gateway autenticado, geração de instâncias e recibo;
- repetição do mesmo pedido sem duplicar itens ou restaurar PV/SA/BI;
- recuperação do recibo por consulta;
- preparação explícita do contexto;
- resumo do Mestre sem narrativa privada nem acesso à ficha completa;
- negação dos comandos de ativação para `anon`.

**Resultado de CI pendente de confirmação.** Os testes usam PostgreSQL embutido/PGlite e identidades fictícias; mesmo aprovados, não certificam PostgREST/JWT real, concorrência entre conexões independentes, nem o comportamento em aparelhos físicos.

## PENDENTE

- Confirmar a execução da suíte completa, TypeScript, build e tipos das páginas de QA no GitHub Actions.
- Corrigir qualquer regressão encontrada antes de avançar.
- A interface principal ainda não chama os serviços de ativação; não foi habilitado botão de ativação nem gestão de contexto na aplicação conectada.
- Não houve consulta de escrita, aplicação SQL, mudança de Auth/RLS, alteração de dados, merge ou publicação no Supabase.

## BLOQUEADO ANTES DE APLICAR AO TESTE

O conjunto altera políticas de leitura/escrita da ficha, acrescenta estado arquivado, cria triggers para saída/remoção de participantes e amplia o modelo de inventário. Isso exige revisão como pacote, não aplicação isolada de `ativacao-local.sql`.

Também é necessário reconciliar o histórico de migrations remoto com os arquivos versionados: o inventário remoto consultado anteriormente apresenta versões que não coincidem com os timestamps dos arquivos locais. Não usar `db push` nem assumir que a cadeia local corresponde à aplicada no projeto de teste até resolver essa divergência.

## PRÓXIMO PASSO

Depois de confirmar o CI, preparar uma revisão final das permissões e um plano de aplicação ao projeto Supabase **de teste somente**, incluindo ordem, pré-verificações, fixtures novas, testes de autorização/privacidade e procedimento de interrupção. Pedir autorização específica antes de qualquer alteração no banco. Produção, merge e publicação continuam fora do escopo.
