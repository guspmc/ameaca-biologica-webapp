# Contrato de integração de ativação e resumo — 24/10/2026

## IMPLEMENTADO NESTA ETAPA

Base: checkpoint `5edd1e5`, posterior à aprovação humana T5–T9 da simulação. O contrato complementa [contrato-ativacao-ficha.md](contrato-ativacao-ficha.md) e [ciclo-e-interface-local.md](ciclo-e-interface-local.md), sem modificar fontes oficiais, SQL, permissões ou registros remotos.

[servicoAtivacao.ts](../src/servicoAtivacao.ts) prepara um transporte com cliente RPC injetado. Criá-lo não consulta nada; ele não é importado pela aplicação, nem pela simulação T5–T9. Não há chave especial, renovação de sessão, fallback para UPDATE direto, tentativa automática ou configuração que habilite a integração. A validação dos dados recebidos não substitui a autorização/projeção no servidor: rejeitar campos privados no cliente não desfaz sua eventual transmissão.

## Contrato de chamadas proposto

| Operação | RPC | Argumentos enviados | Resposta aceita |
| --- | --- | --- | --- |
| Conferir criação salva | `conferir_ativacao_personagem` — ainda não implementada no banco | `p_personagem` | `personagemId`, `nome`, `revisaoFicha`, `revisaoMesa`, `ativas`, `pendencias` |
| Confirmar ativação | `ativar_personagem` — ainda não implementada no banco | `p_personagem`, `p_operacao`, `p_revisao_ficha`, `p_revisao_mesa` | Recibo fechado de ativação |
| Consultar resumo | `resumo_operacional_mesa` — existe somente na proposta SQL local | `p_mesa` | Lista fechada de resumos operacionais |

IDs devem ser UUIDs canônicos minúsculos. Revisões/contagens são inteiros seguros não negativos no JavaScript; revisão fora dessa faixa impede a integração, em vez de perder precisão. A conferência aceita contagem acima de dez para representar um eventual legado excedente; o controle de confirmação continua impedindo ativação com dez ou mais.

O recibo contém exatamente `personagemId`, `operacaoId`, `estado: completa`, `quantidadeInstancias` e `revisaoCriacao`. IDs precisam corresponder ao pedido; a revisão do recibo precisa avançar em relação à conferência original. Recibo repetido preserva os mesmos números originais; não precisa ser a revisão mais recente da ficha. Resposta ausente, ambígua, de outra operação ou com campos extras não anuncia sucesso.

O resumo contém exatamente os dez campos da proposta SQL: `personagemId`, `nome`, `classe`, `nivel`, `pv`, `sa`, `bi`, `defesa`, `passivos`, `condicoes`. Recursos contêm apenas `atual` e `maximo`; Passivas contêm as doze chaves oficiais e valores inteiros ou null. Condições null significam integração ausente; lista vazia significa nenhuma registrada. IDs duplicados, mais de dez registros, perícia ausente, campo privado ou formato inválido recusam a resposta inteira, sem truncar ou apresentar lista parcial.

O transporte copia recursos, listas, recibo e pedido. Não recalcula fórmula, não muda gênero/Classe, não cura e não acrescenta Vantagem às Passivas. Apenas verifica o formato dos valores: não introduz novas regras de limite de recursos durante o jogo.

## Erros e repetição

| Resposta do servidor | Classificação local | Comportamento esperado |
| --- | --- | --- |
| `PT409`, details `AB_REVISAO` | revisão | Nova conferência antes de um novo pedido |
| `PT422`, details `AB_REGRA` | regra | Conferir impedimentos salvos |
| `42501` ou JWT inválido/ausente (`PGRST301/302/303`) | regra | Mensagem genérica de acesso; não tentar outra conta nem ampliar permissões |
| Função ausente (`PGRST202` ou `42883`) | regra | Integração indisponível; não usar UPDATE ou comando privado como alternativa |
| Rede, resposta sem formato, código desconhecido, `P0001` genérico | incerto | Preservar pedido; recuperação explícita com o mesmo identificador |

Não inferir domínio pelo texto da mensagem. `message`, `hint` e texto livre de `details` não são mostrados ao jogador. O servidor futuro deverá emitir os marcadores tipados acima somente após rollback/recusa; o SQL atual ainda usa exceções genéricas e não satisfaz esse contrato por si só. Não usar `40001` para representar um conflito de revisão de negócio; esse código continua desconhecido para o cliente, sem repetição automática.

O controlador [pedidoAtivacao.ts](../src/pedidoAtivacao.ts) gera um identificador por confirmação e o conserva entre tentativas. O transporte não gera outro identificador. A transação futura precisa conservar a repetição idempotente já ensaiada no protótipo SQL. Uma resposta com erro prevalece mesmo se também trouxer `data` aparentemente válida.

## Obrigações do servidor antes de expor as chamadas

1. Conferência somente para a autoria ainda admitida como jogador, sem acesso do Mestre a rascunhos; resumo somente para o Mestre oficial. Verificar participação atual no banco, não em papel fornecido pelo cliente ou metadados editáveis.
2. Conferência é leitura: usa dados salvos/contexto vigente e não reserva vaga, materializa itens, restaura recursos ou autoriza ativação posterior. Pendências informativas não substituem a revalidação transacional.
3. Ativação revalida autoria, estado, método Padrão/nível 1, escolhas, capacidade, revisões e contexto sob bloqueio. Mesa, vínculo, ficha e contexto seguem a ordem já proposta. Itens, estado e recibo são atômicos.
4. Não receber do cliente usuário, papel, preços, inventário, máximos, permissões, método ou status Conferido como fatos. Mesa da ativação é derivada da ficha autorizada.
5. Preparar gateway público SECURITY INVOKER com serviço privilegiado delimitado em schema não exposto, autenticação explícita, `search_path` vazio, grants mínimos e testes de acesso direto ao serviço. Não conceder acesso dos clientes aos comandos internos atuais para contornar permissões.
6. Migrar as políticas de privacidade junto com a ativação, sem janela em que o Mestre possa ler ficha completa. Remover inscrições/cache da Mesa anterior ao trocar Mesa, sair ou perder vínculo; uma consulta antiga não pode preencher a nova Mesa. Esta proteção de contexto ainda não está implementada no componente isolado.
7. Contexto de criação precisa ser explicitamente gerenciado. Não inicializar silenciosamente Mesas existentes nem inventar método de legadas. Encerramento/saída/readmissão e notas seguem o ciclo oficial.

## Recuperação depois de F5 ou reinício — ainda não implementada

O controlador atual é em memória. F5 na simulação zera tudo por desenho; sua aprovação não certifica recuperação de uma ativação real interrompida. Antes de conectar, definir consulta autorizada de resultado por ficha/pedido, sem repetir materialização. A consulta não pode criar nem alterar a ficha, nem divulgar operação alheia.

A retomada deve distinguir recibo confirmado, operação ainda sem resultado conhecido e rascunho atual. Não anunciar “não aconteceu” apenas porque não recebeu resposta; não gerar uma nova confirmação às cegas. Se futuramente houver armazenamento mínimo de pedido pendente, delimitá-lo por conta/Mesa/ficha, sem narrativa, inventário, tokens ou credenciais, e limpá-lo corretamente na troca de sessão. Essa decisão e implementação ficam pendentes; nenhum armazenamento foi adicionado nesta etapa.

## TESTADO

Oito novos ensaios de transporte com cliente RPC simulado: entradas inválidas sem chamada; conferência fechada; cópia/argumentos mínimos; erros tipados sem texto privado/fallback; recuperação com mesmo pedido; recibos ambíguos; cópia do resumo; recusa integral de duplicados/campos extras/formatos inválidos. Não são chamadas reais de Supabase ou PostgREST e não testam RLS, JWT real, latência ou concorrência.

Suíte completa: **114 testes aprovados**, incluindo os oito novos e os 106 anteriores. TypeScript com `tsconfig.ui.json`, compilação Vite no modo teste e conferência de diferenças aprovados. A interface aprovada não foi alterada; não houve nova certificação de navegador ou celular por estes ensaios.

## PENDENTE / BLOQUEADO

Não é um pacote pronto para aplicação. Faltam conferência/gateway SQL público, códigos tipados no servidor, consulta de resultado após reinício, proteção contra respostas antigas ao trocar contexto, revisão do conjunto de permissões e ensaio com conexões sobrepostas. A aplicação remota exige checkpoint específico. Produção, Auth e registros humanos não foram acessados.

Nenhum teste humano novo executável foi criado; T5–T9 permanecem encerrados e não precisam ser repetidos. O roteiro futuro condicionado à integração está na [fila consolidada](testes-humanos-pendentes.md). Celular físico continua aguardando acesso posterior.

## Referências técnicas consultadas em 24/10/2026

- [Supabase — Database functions](https://supabase.com/docs/guides/database/functions): chamada RPC, privilégios e isolamento do trabalho privilegiado.
- [Supabase — PostgREST error codes](https://supabase.com/docs/guides/api/rest/postgrest-error-codes): envelope `data/error` e códigos de API.
- [Supabase — uso indevido de SQLSTATE 40001](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b): não representar conflito de negócio com falha de serialização.
- [Changelog](https://supabase.com/changelog) consultado em HTML após o leitor não aceitar o índice Markdown. Não foi introduzida dependência ou alteração de infraestrutura nesta etapa.
