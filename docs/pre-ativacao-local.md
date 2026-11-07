# Preparação local das condições de ativação
Incremento de 23/10/2026, sem operação remota ou mudança na interface.

## Implementado
Módulo puro src/preAtivacao.ts reúne condições locais para os cenários do contrato de ativação: autoria admitida como jogador, rascunho, Mesa permitindo criação, método Padrão e nível 1, mudança do contexto revisado, contagens válidas, teto coletivo de dez ativas e dez jogadores, revisões de compras/preferências, configuração estrita, escolhas completas e inventário compatível.

A avaliação recalcula a revisão a partir dos campos e não aceita um indicador Conferido enviado pelo cliente. Misto com BI infectante ou Durabilidade ao Aparar indefinidos produz pendência; Manual/Automático preservam essas preferências inativas sem inventar valores. Isso é uma proposta local para a futura ativação e não altera o salvamento atual: rascunhos continuam podendo salvar opções a definir.

## Testado
Validação do incremento: 83 testes da suíte completa aprovados, verificação de TypeScript e compilação no modo teste aprovadas.

Seis testes automatizados específicos verificam nove/dez ativas, contagens inválidas, papel/autoria/vínculo, método e nível alterados, revisões antigas, escolhas parciais/ilegais, fórmulas divergentes, configuração malformada, opções indefinidas e compras salvas. Entradas e recursos atuais permanecem inalterados.

## Limites explícitos
- O módulo não está importado pela interface; não autoriza acesso, executa SQL, grava itens ou ativa fichas.
- Contagens, vínculo e método são entradas de cenários locais. Não há bloqueio de Mesa nem garantia de concorrência real.
- Revisões consideradas cobrem somente compras e funcionamento, não todas as escolhas da ficha. A futura operação precisa verificar uma versão/snapshot completo sob transação.
- O servidor precisará repetir as verificações com dados confiáveis. Resultado local favorável não é autorização de ativação.
- Política de leitura do Mestre, ciclo ativo/arquivado, catálogo completo e operação idempotente ainda requerem implementação integrada e checkpoint.
- A condição de dez jogadores é verificada no cenário, mas este incremento não implementa o controle de admissão.
- Testes locais e compilação não equivalem a teste humano ou de ativação em banco remoto.

## Roteiro humano
Nenhum teste humano novo foi criado por este módulo isolado. A fila atual foi consolidada em [testes-humanos-pendentes.md](testes-humanos-pendentes.md); o histórico permanece em fila-testes-humanos.md.

## Próximo incremento técnico
Preparar em banco local a operação de ativação com contexto confiável, serialização por Mesa, repetição idempotente e resumo operacional privado. Não aplicar proposta ao TESTE nem alterar RLS sem checkpoint específico. Referência: contrato-ativacao-ficha.md.
