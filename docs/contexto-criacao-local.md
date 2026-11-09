# Gestão do contexto de criação — 25/10/2026

## IMPLEMENTADO

Base conferida: checkpoint `76788a3`, árvore limpa. Proposta `supabase/proposals/contexto-criacao-local.sql`, transporte `src/contextoCriacao.ts` e simulação `tests/ui/contexto.html`. Nada foi ligado à aplicação conectada.

Leitura autenticada limitada ao Mestre oficial e jogadores admitidos da Mesa; retorna apenas ID da Mesa, preparado, método, nível inicial, disponibilidade de finalização e revisão. Contexto ausente continua ausente após consulta. Não devolve fichas, contagem de rascunhos ou dados pessoais.

Escrita somente pelo Mestre oficial, inclusive na chamada direta ao serviço privado. Preparação explícita inicial apenas em Mesa sem contexto e sem qualquer personagem, fixa Padrão nível 1; Mesas legadas com personagens exigem preparação específica. Depois, esta API só altera a disponibilidade de **novas finalizações**, mantendo método/nível. Revisão esperada impede sobrescrita; alteração real incrementa revisão e a repetição sem alteração não incrementa. Pausar e voltar a permitir invalida uma conferência anterior.

Não confundir essa disponibilidade com encerramento da Mesa. Encerrar/reabrir campanha, senha e congelamento global continuam fora do escopo. Não se oferece troca de método com personagens sem votação nem suporte fictício a Casa/nível experiente. Esses limites decorrem dos capítulos 5.4, 5.5 e 13.2 do Planejamento v2.0, consultado sem edição.

O comando bloqueia a Mesa antes do contexto; FOR UPDATE também serializa inserções com FK para evitar preparar enquanto uma primeira personagem está entrando. Não altera ficha, inventário, recursos, método individual ou histórico. Não inicializa Mesas existentes por migração ou leitura. Funções públicas INVOKER, serviços privados delimitados, search_path vazio e grants mínimos somente no banco fictício/proposta.

Transporte sem efeitos na preparação, parâmetros mínimos e resposta fechada validada; não mostra erros internos ou reenvia automaticamente. A página isolada usa apenas memória e reinicia com F5. Em erro preserva a escolha local, mas exige consultar antes de salvar novamente. Ela usa o transporte com servidor fictício, sem SDK/Auth. A futura integração de sessão e a gestão de campanha encerrada ainda são necessárias.

## TESTADO

Cinco novos testes SQL locais: leitura sem inicialização; autoria e serviços diretos; pausa sem alterar ficha/recursos e invalidação de conferência; conflito/preparação de legadas; proteção de método Casa e nível superior. Seis testes de transporte/fixture cobrem formato fechado, cópias, entradas inválidas sem envio, erros sem vazamento, configuração normal e recuperação por consulta após resposta perdida.

Suíte completa **164 testes aprovados**. O ensaio SQL foi repetido após reforçar o bloqueio de Mesa, aprovado. TypeScript da aplicação/UI e compilação aprovados. A existência de bloqueios não certifica concorrência entre conexões reais; PGlite usa o ensaio embutido.

No navegador foram verificados os quatro cenários: confirmação explícita e ciclos de pausa, recusa de legado, conflito mantendo escolha e resposta perdida recuperada sem outro envio. Console sem erros nos fluxos. Evidência fora do Git: `../output/qa_contexto_2026-10-25/contexto-recuperado.png`. Não é teste humano nem teste em celular físico.

## PENDENTE DE TESTE HUMANO

**Fila nova 4/10: T14.1–T14.4**, com [roteiro detalhado](teste-humano-contexto.md). Enfileirados para a rodada posterior; não dependem de login, banco remoto ou autorização complementar. T13 continua encerrado. Celular não entra na contagem.

## BLOQUEADO

Aplicação no TESTE exige pacote revisável e checkpoint específico. Ainda faltam contexto de Mesa encerrada e autenticação proporcional ao encerramento, integração de sessão/UI, retenção de pedidos, catálogo e inventário ativo completos e concorrência real. Nenhum advisor ou alteração remota foi realizado. Fontes oficiais e permissões remotas preservadas; sem publicação/merge.

## PRÓXIMO PASSO

Preparar o adaptador de integração local para agrupar conferência, pedido, recuperação e contexto, mantendo callbacks injetados e a aplicação conectada protegida até aprovação do pacote. Continuar acumulando casos humanos independentes até dez, sem repetir T13.

Referências técnicas consultadas em 25/10: [Database functions](https://supabase.com/docs/guides/database/functions) e [changelog](https://supabase.com/changelog); sem nova dependência ou mudança na configuração do serviço remoto.
