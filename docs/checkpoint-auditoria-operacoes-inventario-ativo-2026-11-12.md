# Checkpoint — auditoria das operações do Inventário ativo

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Natureza:** auditoria estática; sem implementação.

## Objetivo

Examinar a integração real das operações de equipamento, uso/consumo, munição/recarga, Durabilidade, Peças, Colete Kendo e transferências, distinguindo regra canônica, estado já modelado, interface conectada e persistência LAN.

## Evidências de código

### 1. Ficha ativa e interface

- `src/FichaLocal.tsx` importa `EditorInventarioLocal`, mas não importa `PainelInventarioLocal` nem o módulo de consulta operacional.
- A seção de Inventário para personagem completa exibe resumo dos itens materializados. O próprio texto da interface informa que a movimentação e o gerenciamento contínuo serão liberados no módulo Inventário.
- O texto da seção informa que os itens aparecem inicialmente guardados/não equipados e que operações de Inventário ainda não estão integradas.
- `EditorInventarioLocal` está ligado ao planejamento de equipamento inicial e compras do rascunho, não à mutação do inventário ativo.
- `PainelInventarioLocal.tsx` é explicitamente somente leitura; pesquisa, filtros e detalhes não equipam, usam, recarregam nem transferem itens.
- `inventarioConsulta.ts` valida e projeta estados de arma de fogo, arma corpo a corpo, munição, moedas, colete, peça, consumível, lanterna e ferramenta. Isso é leitura/validação de snapshot, não autorização para mutá-lo.
- `organizacaoInventario.ts` contém planejamento em cópia, confirmação, recibo, persistência injetável e recuperação de pedido; a própria porta é abstrata e não está conectada à Ficha ativa ou a rota LAN dedicada.

### 2. Persistência e transporte LAN

- `server/personagens-local.mjs` lê `inventario_json` no registro SQLite, mas `serializar()` devolve dados da ficha, revisão e metadados — não devolve `inventario_json`.
- A ativação do rascunho materializa o inventário validado no servidor e grava `inventario_json` na mesma transação SQLite da ativação, com revisão, autorização do Jogador, limite de personagens e recibo idempotente.
- As rotas encontradas no roteador cobrem lista, leitura da ficha, conferência, ativação, edição genérica de rascunho e exclusão de rascunho. Não foi identificada rota dedicada para leitura ou operação do Inventário ativo.
- O PUT genérico protege os campos de criação e equipamento inicial após a ativação. Portanto, não é um mecanismo disponível para alterar o snapshot ativo; tampouco seria seguro introduzir mutação genérica de todo o JSON.

### 3. Contraste com o cânone

- **Sacar/guardar arma:** cada ato usa Interação Gratuita com Objeto; guardar uma arma e sacar outra são duas interações.
- **Lanternas:** sacar, equipar, ligar e desligar podem ser interações distintas; a regra específica da lanterna prevalece.
- **Munição:** a reserva é abstrata; não se controlam carregadores parcialmente cheios como unidades independentes. Ao recarregar antes de esvaziar, a munição restante retorna à reserva e a arma é preenchida a partir dela, salvo regra específica.
- **Recarga:** o custo é definido por arma. Pistolas e Magnums do tipo pistola normalmente usam Ação Bônus; Escopetas, Revólveres Magnum e Armas Especiais possuem regras próprias. Não se deve inferir custo universal a partir do tipo genérico.
- **Modos de disparo:** Disparo Cadenciado e Rajada consomem quantidades específicas de cartuchos; a Matilda com Coronha específica é exceção de consumo. A arma só usa modo concedido por sua ficha ou Peça.
- **Spark Shot:** bateria e cargas são recursos distintos; bateria funciona como pente e cargas como cartuchos. A operação precisa de estado próprio, não de uma contagem de munição genérica.
- **Durabilidade:** normalmente diminui ao Aparar, não por ataque ou uso comum. Com Durabilidade 0, não pode Aparar, mas as outras funções permanecem, salvo regra específica. Manutenção de 30 minutos em Sala de Descanso ou com Kit de Ferramentas restaura o máximo.
- **Peças Extras:** exigem compatibilidade e Espaço de Peça; uma mesma peça não pode beneficiar duas armas ao mesmo tempo. Instalar, remover ou trocar normalmente exige 30 minutos e bancada apropriada, sem Teste. Kit de Ferramentas substitui a bancada somente quando regra permitir.
- **Kendo:** o snapshot admite quantidade de placas no estado de colete, mas a interface/servidor não oferece operação de compra/instalação/remoção nem atualização de equipamento.

## Classificação

| Operação | Estado no código | Lacuna |
|---|---|---|
| Equipar/guardar/sacar armas | Estado reconhecido no snapshot | Sem ação persistente ou autorização conectada |
| Equipar colete/lanterna | Estado reconhecido no snapshot | Sem transição operacional |
| Usar/consumir item | Tipos de item reconhecidos | Sem consumo por exemplar nem registro de efeito/resultado |
| Recarregar | Estado de munição carregada e reserva reconhecidos | Sem transferência de reserva, regra por arma ou recibo |
| Disparo Cadenciado/Rajada | Lembretes/procedimentos consultivos em módulos de combate | Sem débito persistente de munição |
| Spark Shot | Catálogo/procedimento consultivo | Sem bateria/cargas operacionais persistentes |
| Durabilidade/manutenção | Campos de estado reconhecidos | Sem perda por Aparar nem restauração transacional |
| Instalar/remover/trocar Peças | Relação `instaladaEm` reconhecida | Sem compatibilidade, bancada, duração ou transação operacional |
| Colete Kendo/placas | Contador de placas reconhecido | Sem operações de placas/equipamento |
| Transferência/Baú | Não localizado nesta fatia | Sem contrato, rota ou autorização comprovados |

## Riscos que impedem implementação apressada

1. Mutar o JSON inteiro pelo PUT genérico poderia conflitar com revisão da ficha e com campos protegidos.
2. Sem resposta durável e recibo idempotente, um timeout após consumo/recarga pode duplicar operação quando o cliente tentar novamente.
3. Sem leitura do snapshot e revisão autoritativa, a UI pode apresentar munição, equipamento ou Peças desatualizados.
4. O custo de ação/interação não deve ser confundido com a transação do inventário: a Ficha registra o gasto apenas após a decisão/ação confirmada pelo jogador, sem jogar por ele.
5. Não automatizar acerto, dano, cura, transformação, morte ou efeitos narrativos; o Inventário registra estado e oferece cálculos/lembretes nos limites do cânone.

## Próxima etapa recomendada

Definir contratos pequenos e independentes para:
1. equipar/guardar/sacar exemplar, incluindo a Interação Gratuita e o estado de mão/arma;
2. consumir um exemplar, com confirmação explícita e regra de custo/efeito específica por item.

Depois de validar esses contratos, avançar para munição/recarga e Peças em incrementos separados. Transferência/Baú fica fora até haver regra e autorização confirmadas no Planejamento aprovado.

## Validação

- **Testes existentes:** há testes para criação, ativação, consulta, organização e validação de snapshot; isso não demonstra teste das operações acima.
- **Testes/build/CI:** não executados nesta etapa.
- **Validação humana:** pendente.
- **Alterações de código:** nenhuma.
- **Banco/schema/API/UI:** nenhuma alteração.
- **Merge/deploy/publicação:** nenhum.
