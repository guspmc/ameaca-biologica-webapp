# Checkpoint — vínculos estruturados entre decisões da Mesa, retificações e Reanimação

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`

## Objetivo

Fechar duas lacunas do Registro de Decisões da Mesa: identificar explicitamente o registro corrigido por uma Retificação e permitir relacionar uma decisão à instância de Reanimação cujo desfecho estava pendente.

## Implementado

- `RegistroDecisaoMesa` aceita os campos opcionais `retificaRegistroId` e `reanimacaoId`.
- Uma nova Retificação exige selecionar um registro anterior existente. A validação confirma que o alvo está antes dela na ordem append-only, não pelo relógio do dispositivo.
- Registros antigos do tipo Retificação sem referência estruturada continuam válidos como legado. Eles não são reescritos nem recebem alvo inventado.
- A interface mostra o registro anterior selecionado e informa o vínculo no histórico.
- Ao retificar um registro já associado a uma Reanimação, o vínculo `reanimacaoId` é propagado à Retificação.
- Cada nova instância de Reanimação recebe ID estável. O ID é preservado em alterações posteriores.
- Reanimações antigas sem ID continuam válidas. Quando chegam a um desfecho pendente, a interface oferece uma ação explícita para preparar o vínculo, salvando apenas o identificador e preservando os demais dados.
- O Registro de Decisões permite associar um evento à instância de Reanimação pendente.
- O painel de Reanimação passa a distinguir “decisão da Mesa pendente” de “decisão da Mesa registrada” e lista os eventos vinculados.
- A Ficha continua sem declarar morte, transformar personagem ou executar consequências narrativas.

## Compatibilidade e persistência

- Sem alteração de versão do IndexedDB, SQLite ou formato geral do backup.
- A validação de ficha e o endpoint LAN já utilizam `listaDecisoesMesaValida`; portanto, passam a validar os novos campos sem ampliar permissões.
- O backup JSON preserva os campos adicionais e valida referências de Retificação.
- Identificadores de Reanimação são opcionais na validação para preservar fichas antigas.
- Nenhum registro antigo é editado ou apagado.

## Testes adicionados/atualizados

- `tests/registro-decisoes-mesa.test.mjs`: referência obrigatória em novas Retificações, rejeição de alvos inexistentes/futuros, compatibilidade com Retificações legadas e vínculo com Reanimação.
- `tests/reanimacao-ficha.test.mjs`: ID estável e compatibilidade com instâncias legadas sem ID.
- `tests/reanimacao-integracao-ficha.test.mjs`: apresentação de decisão vinculada e preparação de vínculo legado.
- `tests/backup-ficha.test.mjs`: ida/volta de registros vinculados e rejeição de referência inválida.

**Execução:** testes automatizados e build não foram executados nesta etapa. Os testes foram escritos/atualizados, não aprovados por execução. Validação humana também pendente.

## Restrições preservadas

Sem alteração de regras, contadores, DT, rolagens, PV, BI, Condições, efeitos de Transformação, CSS/layout geral, navegação, LAN além da validação já existente, banco, Supabase, Inventário ativo, `main`, merge, deploy ou publicação.

## Validação humana proposta

1. Criar uma Reanimação e chegar a três falhas.
2. Registrar decisão da Mesa vinculada àquela instância e confirmar que o painel deixa de exibir pendência, sem alterar PV/BI/Condições.
3. Retificar o registro e confirmar que original e retificação permanecem no histórico e aparecem vinculados à mesma Reanimação.
4. Atualizar a página e exportar/restaurar backup, conferindo todos os vínculos.
5. Abrir uma ficha antiga com Retificação sem referência e confirmar que o histórico continua legível/editável; criar uma nova Retificação com referência.

