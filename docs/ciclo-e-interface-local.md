# Ciclo da ficha e interface isolada — 24/10/2026

Retomada conferida em 24/10: último checkpoint versionado `f664500`, PR #1 ainda em rascunho, seguido deste incremento local. Resultados anteriores inspecionados antes de continuar; não houve repetição dos ensaios já aprovados na retomada.

## IMPLEMENTADO

Continuação local do [protótipo de ativação](ativacao-sql-local.md), seguindo o Documento Mestre / Planejamento v2.0, especialmente §§3.4, 5.4 e 10.4. Documentos oficiais intactos. Propostas fora de `supabase/migrations`; nenhum SQL desta etapa aplicado remotamente.

[ciclo-ficha-local.sql](../supabase/proposals/ciclo-ficha-local.sql) prepara:

- Saída/remoção apaga somente os rascunhos do jogador naquela Mesa. Completa e itens permanecem ativos até arquivamento explícito pelo Mestre. Readmissão recupera acesso à completa, sem recriar rascunhos apagados.
- Arquivamento pelo Mestre libera a vaga e move as mesmas instâncias comuns carregadas para o Baú. Preserva IDs, quantidades, arma modificada, peças e munição. Característicos, expansão vinculada e itens perdidos permanecem preservados.
- Jogador admitido pode assumir uma arquivada disponível, respeitando dez vagas coletivas. Método, nível, progresso e recursos não são recalculados; equipamento enviado ao Baú não retorna automaticamente.
- Revisões e recibos por pedido em arquivamento/retomada. Revisão antiga é recusada; repetir o mesmo pedido não repete efeitos. Alteração de inventário invalida a conferência anterior.
- Exclusão de rascunho exige confirmação, autoria, vínculo e criação aberta. Exclusão individual de completa/arquivada continua bloqueada, pois P06 não foi decidida. Cascata de exclusão de Mesa preparada somente como integridade local, sem interface ou operação remota.

`metodo_criacao` registra Padrão na ativação validada; legadas sem informação permanecem sem método inventado. Retomada preserva o valor existente. Resumo apresenta Operadora quando o gênero foi explicitamente declarado; a Classe mecânica continua Operador.

Nas instâncias, `personagem_id` identifica a origem; `mesa_id`, `portador_id` e `destino` identificam o local atual. O JSON conserva os dados originais e o equipamento: sua antiga posição não deve ser usada como localização atual na futura integração. Origem/Mesa são imutáveis; portador de outra Mesa é recusado.

[RevisaoAtivacao.tsx](../src/RevisaoAtivacao.tsx) exige conferência e confirmação explícita. [pedidoAtivacao.ts](../src/pedidoAtivacao.ts) conserva o identificador nas novas tentativas, compartilha o pedido em curso e anuncia sucesso somente após verificar o recibo. Resposta incerta mantém a confirmação original para recuperação.

[ResumoOperacional.tsx](../src/ResumoOperacional.tsx) apresenta somente nome, Classe, nível, PV, SA, BI, Defesa, doze Passivas normais e condições informadas. Sem narrativa, inventário ou edição. Consulta recusada remove o resumo anterior. Condições ainda não integradas aparecem como “não informadas”.

Página isolada no servidor de desenvolvimento:
`http://127.0.0.1:4174/ameaca-biologica-webapp/tests/ui/ativacao.html`

Somente memória/dados fictícios, sem Supabase, Auth ou armazenamento. F5, trocar cenário ou Reiniciar zera tudo. Componentes não montados na aplicação conectada. A página demonstra confirmação/apresentação e não executa as propostas SQL.

## TESTADO

- **106 testes automatizados aprovados**, incluindo sete novos casos de ciclo em PostgreSQL em memória e seis de interface/controlador/simulação.
- Arquivamento, retomada, teto, revisão, repetição, rollback tardio, saída voluntária, remoção pelo Mestre autenticado, readmissão e cascata de Mesa fictícia isolada. Cascata conserva quatro contas fictícias e outra Mesa.
- Comandos/tabelas privados negados a clientes anônimos/autenticados, inclusive Mestre. O trigger delimitado de remoção apaga rascunhos sem liberar sua leitura ao Mestre.
- Instâncias e isolamento entre Mesas protegidos. Expansão e item perdido usados nos testes são estados sintéticos; não significam novas operações de jogo disponíveis.
- TypeScript, incluindo cenários isolados, e compilação Vite no modo teste aprovados. Tipos da página isolada incluídos na validação da PR.
- Navegador: confirmação normal, pendências, lotação, revisão antiga/nova conferência, resposta perdida/recuperação sem duplicação, resumo recusado sem dados antigos e recuperação da leitura. F5 reinicia a simulação; nenhum erro de console observado.
- Inspeção visual em desktop e largura emulada de 390 px, sem rolagem horizontal. Capturas locais entregues na conversa. Não substitui aparelho físico, teclado móvel ou teste humano.

A primeira execução do novo teste de isolamento tentou criar ficha com o Mestre da segunda Mesa; a recusa foi correta. Fixture corrigida para jogador admitido; suíte completa reexecutada. Testes anteriores preservados, inclusive os que documentam limitações do comportamento remoto ainda não alterado.

## PENDENTE DE TESTE HUMANO

**T5–T9 aprovados por Gus em 24/10/2026**, com capturas e confirmação explícita. Rodada da simulação encerrada; [resultado e limites](resultado-testes-humanos-2026-10-24.md). Sem repetição de T1–T9 sem mudança relevante; T2 conserva sua ressalva anterior de cobertura. Aplicação conectada mantém funcionalidades anteriormente aprovadas.

Celular físico aguarda preparação posterior de acesso, conforme pedido de Gus. Prévia em 127.0.0.1; sem exposição de rede, abertura de firewall, túnel ou publicação.

## BLOQUEADO

- Aplicação remota e integração de ativação/arquivamento/retomada dependem de revisão e checkpoint específicos. Comandos de ciclo internos, sem EXECUTE para clientes; sem RPC pública ou botões conectados desses comandos.
- Concorrência com conexões realmente sobrepostas exige PostgreSQL de ensaio adequado. Testes locais sequenciais não comprovam corrida real. Futuras operações de inventário devem seguir a ordem Mesa, fichas e instâncias.
- Saída e exclusão de rascunho ainda não têm recibo idempotente; precisam de contrato de consulta de resultado após resposta ambígua antes da exposição pública.
- Catálogo completo, inventário em uso, operações de Baú, condições, gestão/encerramento de Mesa e notas pessoais fora desta integração. Preservar notas pessoais é requisito oficial; nenhuma tabela de notas implementada aqui.
- P06 e exclusão real de Mesa com confirmação/senha não implementadas nem autorizadas nesta etapa. Cascata em fixture não valida esse fluxo humano.

## PRÓXIMO PASSO

Preparar o contrato público de integração antes de solicitar mudanças no TESTE. T5–T9 já encerrados. Avaliar depois acesso pelo celular. Produção, autenticação e dados humanos intactos; sem merge ou publicação.
