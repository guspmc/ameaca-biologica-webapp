# Contratos propostos — operações de equipamento e consumo do Inventário

**Data:** 12/11/2026  
**Branch:** `feat/offline-first-ficha`  
**Natureza:** especificação técnica preliminar; sem implementação.

## Objetivo

Definir contratos pequenos e independentes para (1) equipar, desequipar, sacar e guardar exemplares e (2) registrar uso/consumo de itens. A Ficha calcula, auxilia e registra; o Jogador declara a ação e confirma eventos; o Mestre decide resultados narrativos e adjudicações.

## Evidências atuais do código

- `inventarioConsulta.ts` já reconhece estado `equipada` para arma de fogo, arma corpo a corpo, colete e lanterna, mas não representa posição de mão nem a quantidade de mãos empregadas.
- `catalogoArmas.ts` e `catalogoArmasFogo.ts` já contêm dados de mãos permitidas/exigidas, capacidades, propriedades e custos de recarga; esses catálogos devem ser fonte da validação, não valores enviados livremente pela UI.
- `economiaAcoes.ts` possui `consumirInteracaoGratuita`, que valida turno próprio e uso único. `PainelAcoesLocal.tsx` atualmente registra essa interação em uma gravação de ficha separada.
- `organizacaoInventario.ts` fornece padrão útil: consulta antes de preparar, pedido com UUID, revisão esperada, confirmação estrita, recibo, persistência de pendência e recuperação sem novo envio. A porta é abstrata e não é integração LAN real.
- `server/personagens-local.mjs` autentica conta, revalida vínculo de Jogador na Mesa, usa transação SQLite e revisão de personagem para ativação; `inventario_json` é persistido na ativação, mas não é exposto no serializador da ficha ativa nem possui rota operacional dedicada.
- A ativação existente rejeita identificador de operação já usado. Para operações do Inventário, recomenda-se recibo consultável e replay idempotente do mesmo pedido, em vez de rejeição opaca após timeout.

## Contrato A — equipamento

### Operações e vocabulário

Não usar um único toggle genérico. A intenção deve ser explícita:
- `sacar_arma` / `guardar_arma`
- `equipar_colete` / `guardar_colete`
- `equipar_lanterna` / `guardar_lanterna`
- `ligar_lanterna` / `desligar_lanterna` (estado de iluminação separado de estar equipada, se e quando o modelo persistir iluminação)

Ações que não alteram o mesmo estado não devem ser fundidas. Lanterna de Bolso é sempre equipada e apenas liga/desliga; Lanterna de Cabeça separa equipar e ligar; demais lanternas seguem seus textos específicos.

### Pedido lógico

```ts
type PedidoEquipamento = {
  operationId: string;             // UUID
  personagemId: string;
  expectedCharacterRevision: number;
  expectedInventoryRevision: number;
  instanciaId: string;
  acao: 'sacar_arma' | 'guardar_arma'
      | 'equipar_colete' | 'guardar_colete'
      | 'equipar_lanterna' | 'guardar_lanterna'
      | 'ligar_lanterna' | 'desligar_lanterna';
  maosEmpregadas?: 1 | 2;           // só quando o perfil permitir escolha
  interacaoTurno?: 'consumir' | 'nao_aplicavel';
};
```

Os nomes são proposta de contrato interno, não nomes de rota ou funções já existentes.

### Validações obrigatórias

1. Exemplar pertence ao snapshot da personagem, está íntegro e tem tipo compatível com a ação.
2. Perfil canônico define mãos permitidas/exigidas, propriedades e exceções. O cliente não pode declarar uma arma de duas mãos como uma mão.
3. Estado resultante respeita limites de mãos/empunhadura e equipamento incompatível. Não presumir que duas armas podem ser sacadas juntas: Ambidestria e outras exceções devem ser avaliadas por regra/habilidade confirmada.
4. Colete: apenas equipamento permitido pela regra pode ser ativado; o efeito de Defesa é calculado a partir do estado equipado e do perfil do colete.
5. Lanterna: separar presença/equipamento de iluminação ligada. Respeitar exceções da Lanterna Simples, Grande, de Bolso e de Cabeça; não converter todas em booleano único.
6. Rejeitar estado já igual ao solicitado como operação sem efeito, sem consumir interação nem criar nova revisão, ou retornar resultado explícito `no_op`.
7. Revalidar no servidor conta autenticada, vínculo atual à Mesa, papel Jogador, autoria/controle da personagem e estado ativa. Mestre não recebe editor geral da ficha.

### Economia de ações e atomicidade

A regra concede uma Interação Gratuita com Objeto por turno; guardar uma arma e sacar outra são duas interações. O painel atual salva economia de ações separadamente da coluna `inventario_json`. Para não registrar o equipamento sem registrar o custo (ou vice-versa), a operação LAN que consome a interação deve atualizar, na mesma transação SQLite, o snapshot do Inventário e o estado `economiaAcoes` em `dados_json`, sob revisão esperada da ficha. No modo local, a alteração equivalente deve ser atômica no agregado IndexedDB.

A operação deve receber a intenção de consumir a interação, mas o servidor valida o estado persistido da economia. Não aceitar do cliente um estado de economia completo substituindo o estado do servidor. Se não houver turno próprio ativo, a UI deve indicar que o custo de combate não está sendo registrado; não inventar turno.

### Resultado e recibo

Retornar `{ operationId, characterRevision, inventory, receipt }`, contendo snapshot validado e revisões novas. Recibo deve registrar ação, exemplar, autor, data do servidor e revisões anterior/nova. Não incluir dados secretos ou de outras personagens.

## Contrato B — uso/consumo

### Separar intenção, efeito e gatilho de consumo

Não existe operação universal que "usa qualquer item". Definir procedimento canônico por tipo de item e registrar somente o estado de Inventário que efetivamente muda.

Exemplos que impedem consumo genérico:
- Spray de Primeiros Socorros: Ação Bônus; recupera 3d8 PV. O consumo do exemplar e a alteração de PV são duas mudanças que precisam de confirmação e persistência coordenadas; a Ficha não rola nem decide o valor recuperado.
- Erva Verde: recuperação de 2d8 PV; o jogador rola ou informa o resultado conforme o modo da Mesa.
- Neurotoxina: aplicação como Ação; a dose só é consumida na primeira vez em que causar contato efetivo. O mero ato de declarar aplicação não prova contato efetivo.
- Granada: Ação para arremessar; consumo vinculado ao arremesso declarado, não ao dano causado.
- Injetor: carrega uma dose compatível e é descartado após aplicação.
- Kit de Primeiros Socorros: ferramenta reutilizável; realizar primeiros socorros não o consome.
- Fluido Estéril e Sangue Contaminado: ingredientes sem efeito isolado definido; não oferecer botão de uso independente.

### Pedido lógico

```ts
type PedidoUsoItem = {
  operationId: string;             // UUID
  personagemId: string;
  expectedCharacterRevision: number;
  expectedInventoryRevision: number;
  instanciaId: string;
  procedimentoId: string;          // catálogo/receita/procedimento autorizado
  quantidade: number;              // inteiro positivo e limitado ao exemplar
  gatilhoConsumo:
    | 'uso_declarado'
    | 'aplicacao_confirmada'
    | 'primeiro_contato_efetivo'
    | 'arremesso_declarado';
  confirmacaoJogador: true;
  resultadoExterno?: Record<string, unknown>; // apenas valores declarados, tipados e validados
};
```

O campo `resultadoExterno` não é fonte de verdade para rolagens automáticas: deve ser substituído por campos tipados conforme cada procedimento e só será usado quando a regra exigir registrar PV/condição/resultado. Nunca aceitar patch arbitrário de ficha.

### Validações obrigatórias

1. Catálogo de procedimentos define se o item pode executar o procedimento, consumo, custo de ação, gatilho e quantidade.
2. Validar existência, quantidade, estado, compatibilidade e vínculo de dose/recipiente (ex.: Injetor).
3. Não consumir ingrediente sem receita válida nem ferramenta reutilizável por procedimento que não a descarte.
4. Para efeitos que alteram PV/BI/condições, obter confirmação explícita do jogador com valor/resultado já resolvido conforme o modo da Mesa; não rolar silenciosamente nem inferir sucesso.
5. Gatilhos posteriores (ex.: primeiro contato efetivo da Neurotoxina) precisam de ação separada de confirmação do evento. O inventário não decide acerto nem contato.
6. Se consumo e atualização de recurso da ficha forem uma única consequência confirmada, persistir ambos atomicamente para evitar item consumido sem efeito registrado ou efeito registrado sem consumo.
7. Revalidar autenticação, vínculo atual à Mesa, papel Jogador, personagem ativa, revisões e autorização do dono.

### Resultado e recibo

Retornar snapshot validado, revisões novas e recibo com item, procedimento, quantidade consumida, gatilho confirmado, autor e data do servidor. A UI só mostra sucesso depois da confirmação. Em timeout, consultar recibo pelo mesmo `operationId`; nunca repetir com ID novo antes de reconciliar.

## Persistência: LAN e Offline

- **LAN:** rota dedicada de operação, sem PUT genérico do JSON. Transação SQLite atualiza snapshot, dados da ficha quando necessário, revisão da personagem e recibo. A rota consulta recibo antes de processar pedido; mesmo ID + mesmo payload retorna o resultado já confirmado; mesmo ID + payload diferente retorna conflito.
- **Offline:** operação no repositório IndexedDB local com transação atômica, revisão local e recibo local. A UI diferencia `Salvo neste dispositivo` de `Confirmado pelo servidor`. Esta especificação não cria sincronização automática entre IndexedDB e LAN nem autoriza sobrescrita ao reconectar.
- **Concorrência:** conflito de revisão exige consulta e reconciliação; não mesclar nem sobrescrever silenciosamente estados de equipamento, consumo ou recursos.

## Sequência de implementação sugerida

1. Primeiro, criar funções puras de domínio e testes para transições de equipamento e validação de estados, sem UI nem servidor.
2. Integrar custo da Interação Gratuita de forma atômica ao estado de turno e Inventário; testar uso único, turno encerrado e exceções explícitas.
3. Criar rota LAN dedicada, tabela/registro de recibos e resposta de leitura do Inventário ativo.
4. Integrar repositório IndexedDB com contrato equivalente, sem presumir sincronização.
5. Implementar UI com confirmação, estado pendente, conflito e recuperação por recibo.
6. Implementar consumo por procedimentos em pequenos lotes, começando pelos itens de comportamento simples. Neurotoxina, Injetor e itens com efeitos condicionais devem ter testes específicos.

## Pendências que exigem decisão antes da implementação

1. **Mãos e empunhadura:** o modelo atual só tem `equipada:boolean`; a implementação deve evoluir para slots/mãos. Proposta: duas mãos explícitas e um mapa de ocupação, sem presumir que o estado de uma arma equivale a "mão direita". A exceção Ambidestria deve ser validada pelo estado de habilidade ativa.
2. **Ação econômica fora do turno:** a regra descreve interação por turno; a UI não deve criar turno artificial. Fora de combate, o custo/tempo segue a ficção e a decisão do Mestre, sem registrar uma interação de combate.
3. **PV/BI e rolagens de consumíveis:** decidir quais procedimentos terão campo para o jogador informar resultado rolado e quais apenas registrarão consumo. A regra já estabelece modos Automático/Misto/Manual, mas a implementação deve preservar essa escolha.
4. **Estados de iluminação:** decidir se o estado ligado/desligado será persistido agora ou em incremento separado; o snapshot atual de lanterna só guarda `equipada:boolean`.

## Validação

- Especificação baseada em inspeção estática do código e no Arquivo do Jogador v1.0.
- Nenhum código, banco, schema, rota, UI ou sincronização foi alterado.
- Testes/build/CI e validação humana não executados.
- Não houve merge, deploy ou publicação.
