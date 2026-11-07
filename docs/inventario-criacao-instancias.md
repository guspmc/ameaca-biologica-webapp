# Preparação das instâncias de inventário — 23/10/2026

## IMPLEMENTADO
Planejador local planejarInventarioCriacao em src/inventarioCriacao.ts. Recebe escolhas de equipamento de rascunho nível 1 e produz plano determinístico de novas instâncias. Não é chamado pela aplicação conectada, não grava itens e não ativa personagem.
Reutiliza kits, catálogo parcial de compras e capacidade existentes. Quantidades comuns de uma unidade geram itens separados; duas Facas têm chaves de criação e Durabilidades independentes. Munição 9 mm usa pilhas de até 30; moedas até três em um bloco e nenhum bloco com saldo zero.
Característicos ficam fora da grade, vinculados à Classe, com zero Espaços. Itens comuns ocupam posições consecutivas na grade inicial, sem inventar capacidade. Não se aplica a reorganização de inventário já utilizado.

Estados iniciais conferidos:
- Sentinel Nine 19/19, JMB Hp3 13/13 e LEMI 10/10, guardadas. Não criar cartuchos de reserva adicionais.
- Faca e Bastão: Durabilidade 2/2. Faca Arremessável; Bastão sem essa propriedade. Hatchet Indestrutível e Arremessável, sem falso contador finito.
- Kendo: zero placas, guardado. Demais Coletes também guardados, sem antecipar Defesa.
- Pente Estendido guardado e sem vínculo de instalação; não aumenta o pente da LEMI.
- Erva e ferramentas carregam identidade/quantidade, sem executar Cura, uso ou gasto.

Fontes: Arquivo do Jogador v1.0 J 30/34/38, 48, 50–53, 64–70 e 98; texto local já extraído, inclusive tabela de Durabilidade e propriedades de Faca/Bastão/Hatchet. Planejamento v2.0 §§5.1–5.4, 6.1 e 9.1–9.6. Referências oficiais apenas lidas e não publicadas no repositório.

## TESTADO
72 testes locais aprovados, TypeScript e build de teste aprovados. Cinco novos testes cobrem nove kits, posições/Característicos, armas carregadas, munição 45=30+15, moedas remanescentes, instâncias separadas, peças não instaladas, independência de entrada/saída e validações de classe/kit/FOR/origem/estado/nível/plano/saldo/capacidade.
Ordem de propriedades do plano de compras não muda o resultado. Repetir a preparação produz o mesmo plano. Isso não certifica idempotência de escrita no servidor: transação e materialização persistente continuam pendentes.
Nenhum banco remoto, registro humano, sessão ou permissão alterado nesta rodada. Sem nova dependência ou custo contratado.

## LIMITES PARA PERSISTÊNCIA
Chaves de criação são determinísticas e precisam ser vinculadas à personagem/operação na futura transação. Não são IDs globais de inventário. Estado novo não pode reconstruir itens depois de uso, descarte, transferência ou Reset. A ativação deve registrar que materializou o conjunto uma única vez.
Plano considera compras já salvas, sem consultar disponibilidade atual; bloqueio posterior não remove compra aprovada. Futuro servidor revalida integridade sem apagar essa decisão.
Cobertura atual é de itens dos kits e catálogo inicial parcial; não certifica itens de dois Espaços, expansões equipadas, Peças instaladas, Baú, receitas, consumíveis em uso ou inventário ativo mutável.
A preparação de equipamento não valida a ficha inteira: finalização ainda exige atributos/perícias/habilidade/método/nível/vagas/privacidade e preferências, conforme contrato-ativacao-ficha.md.

## PENDENTE DE TESTE HUMANO
Nenhum teste humano novo necessário para este módulo ainda sem interface. Casos de instâncias e estado ativo serão agrupados depois da integração autorizada. Não pedir confirmação de funcionalidade invisível.
Gus confirmou o roteiro de preferências persistidas: salvar/F5, opções do Misto preservadas e independência entre fichas. Rodada encerrada; não repetir sem mudança relevante.

## BLOQUEADO
Inventário ativo persistente, permissões de leitura/edição, resumo operacional do Mestre e ativação transacional ainda precisam de implementação local e checkpoint específico antes de aplicar ao TESTE. Produção, exclusões, mudanças RLS/Auth, merge e publicação continuam protegidos.

## PRÓXIMO PASSO
Preparar contrato de persistência das instâncias e testes transacionais locais: materialização única, conservação de quantidades, rollback de falha e isolamento por personagem/Mesa. Não habilitar comandos de uso/equipar antes desses contratos. A fila humana permanece única em fila-testes-humanos.md.
