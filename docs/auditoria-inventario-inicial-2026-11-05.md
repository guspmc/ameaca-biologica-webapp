# Auditoria do Inventário na Ficha — 05/11/2026

Branch: `feat/offline-first-ficha`

## Escopo e fontes

Esta auditoria verifica o que o código implementa para a criação/prévia do Inventário e registra o ponto de partida para o Inventário ativo. Fontes: Arquivo do Jogador v1.0 (cânone) e Planejamento Mestre v2.1 anexado nesta sessão. O Planejamento v2.1 prevalece sobre o v2.0 nos pontos alterados; o v2.0 é apenas referência histórica quando não houver divergência.

## Implementado no código atual

- Capacidade inicial: `4 + FOR + Mochileiro`.
- Opções A, B e C para Agente, Autodidata e Operador.
- Itens característicos vinculados à Classe, com zero Espaços.
- Planejamento determinístico do kit e das compras iniciais, sem ativar personagem ou alterar recursos atuais.
- Itens comuns de Erva Verde e Lanterna Simples.
- Estados iniciais de armas, munição, coletes, Peças, moedas, consumíveis e ferramentas já reconhecidos pelo planejador.
- Kit C com simulação de orçamento de 3 Moedas, capacidade e moedas restantes em bloco.
- Munição inicial dividida em pilhas de até 30.
- Armas e coletes começam não equipados; Peças não começam instaladas.
- Identificadores distintos para instâncias repetidas.
- Rejeição de Classe/kit/Origem inválidos, compras fora do catálogo, quantidade fora dos limites, orçamento excedido e capacidade excedida.
- A interface permite editar o plano, aplicar ao formulário e gravar o rascunho local/servidor conforme o caminho atual de persistência. A prévia informa expressamente que não equipa, consome nem finaliza personagem.

Arquivos principais:
- `src/equipamento.ts`
- `src/comprasIniciais.ts`
- `src/inventarioCriacao.ts`
- `src/EditorInventarioLocal.tsx`
- `src/PreviaCompras.tsx`
- `src/FichaLocal.tsx`
- `tests/inventario-criacao.test.mjs`

## Cobertura automatizada já presente

A suíte `tests/inventario-criacao.test.mjs` já contém testes para:
- os nove kits (três Classes × três opções);
- itens característicos fora da grade;
- armas carregadas sem reserva extra e não equipadas;
- pilhas de munição de 30;
- compras personalizadas e saldo restante;
- instâncias repetidas e isolamento de estado;
- determinismo em relação à ordem das entradas;
- entradas inválidas, limite de capacidade e bônus de Mochileiro.

A existência desses testes não prova que foram executados no HEAD atual. `pnpm test` e `pnpm build` continuam pendentes de resultado observável.

## Lacunas: Inventário ativo ainda não implementado

A seção da Ficha ainda apresenta uma projeção de criação, não uma grade operacional completa. A auditoria do código não encontrou, nesta etapa, implementação integrada de:
- grade interativa com células vazias e comando Adicionar;
- catálogo universal completo do Jogador e itens personalizados da Mesa;
- operações de Usar, Equipar/Remover, Guardar e Descartar com permissões e efeitos;
- combinação/fabricação transacional, receitas e histórico/Desfazer;
- instalação, remoção e troca de Peças com compatibilidade e bancada;
- expansão permanente Pochete/Bolsa e espaço dedicado;
- estados e disponibilidade da Hatchet após perda/recuperação;
- blocos de moedas operacionais com +/− e teto de três;
- integração com armários/gaiolas e estoque de missão.

Essas lacunas são escopo futuro documentado no Planejamento v2.0, mas a ordem de implementação precisa respeitar as decisões posteriores do usuário e a versão v2.1 ainda não disponível. Não se deve preencher lacunas com comportamentos inventados nem transformar o planejador de criação em inventário ativo por conveniência. **Decisão confirmada em 05/11/2026:** o Baú será implementado somente ao final, quando começar a conexão integrada do projeto ao Laboratório via LAN. Portanto, Baú, transferências e sincronização do Baú ficam fora do ciclo atual do Inventário offline.

## Riscos e próximos passos técnicos

1. Confirmar `pnpm test` e `pnpm build` no HEAD atual.
2. Conferir a gravação e reabertura do plano personalizado em local e servidor, incluindo limpeza do plano ao trocar de kit.
3. Homologar atualização simultânea e restauração entre duas abas antes de ampliar o estado do Inventário.
4. A partir do escopo aprovado mais recente, definir um incremento pequeno do Inventário ativo: modelo persistente, instâncias, grade, limites de capacidade e operações permitidas. Não iniciar Baú, consumo, combate ou fabricação em bloco único.
5. Preservar a distinção entre estado inicial de criação e estado ativo de jogo. A personagem só deve receber operações de jogo quando o fluxo oficial de criação/ativação estiver definido.

## Classificação

- **IMPLEMENTADO:** planejamento e prévia do inventário inicial.
- **TESTES ESCRITOS:** suíte de criação do inventário.
- **AUTOMATED TESTED:** não confirmado no HEAD atual.
- **HUMAN TESTED:** ainda não iniciado.
- **PENDENTE:** Inventário ativo e suas operações; validação completa do ciclo de persistência.
- **ADIADO POR DECISÃO DO USUÁRIO:** Baú compartilhado, a implementar somente ao final, junto à integração do projeto ao Laboratório via LAN.


## Complemento técnico — persistência e limites do próximo incremento

Revisão do caminho atual em `FichaLocal.tsx`, `EditorInventarioLocal.tsx`, `PreviaCompras.tsx` e `FichaOfflineApp.tsx`:

- O planejador de compras aplica o resultado ao formulário em memória; a persistência só ocorre quando o usuário aciona **Salvar planejamento** no editor externo. A interface informa essa dependência e avisa que fechar/recarregar antes descarta o plano ainda não gravado.
- A seleção do kit A/B salva `equipamentoInicial` e limpa `comprasIniciais` e `revisaoCompras`; o kit C exige que um plano válido tenha sido aplicado.
- A seção de prévia é recalculada a partir dos dados da ficha; não há entidade de item ativo persistida, nem operações sobre instâncias depois da criação.
- A chave React do editor inclui Classe, kit, compras, revisão e capacidade, permitindo remontagem quando a ficha recarregada recebe valores diferentes.

**PENDENTE de execução automatizada:** testes específicos do fluxo de interface para kit C → aplicar → salvar → reabrir; kit C → trocar para A/B → salvar → reabrir; e mudança externa dos dados enquanto o editor está aberto. O código e as mensagens da interface indicam o comportamento esperado, mas não substituem esses testes.

## Referência de regras para a etapa futura

O Arquivo do Jogador v1.0 e o Planejamento v2.1 orientam o Inventário ativo:
- Inventário cheio impede carregar novos itens, mas permite examiná-los; itens excedentes em mãos impedem outras Ações até serem resolvidos.
- Itens sem Espaços próprios ocupam 1 Espaço, salvo regra específica.
- Bolsa e Pochete não acumulam; aplica-se o maior benefício. Bolsa concede +3 Espaços e Pochete +2; o Planejamento v2.0 trata a expansão ativa em espaço dedicado, vinculada permanentemente, com upgrade e retorno da expansão anterior como item comum.
- Moedas são organizadas em blocos de até três por Espaço; não há transbordamento, fusão ou reorganização automática.
- O Planejamento v2.0 também descreve comandos contextuais de Usar, Equipar/Remover e instalação de Peças, mas seus efeitos, custos, requisitos e exceções precisam ser conferidos no Arquivo do Jogador e nas decisões posteriores antes da implementação.

A grade ativa não deve ser iniciada como simples extensão do array `ItemCriacao`: o modelo atual representa uma projeção determinística de criação, sem ciclo de vida de item ativo, histórico ou operações transacionais.


## 10. Lógica de expansão e moedas — 05/11/2026

Foi acrescentado o módulo puro src/inventarioExpansao.ts, ainda sem ligação à interface ou à persistência de um Inventário ativo.

- Capacidade ativa: base 4 + FOR + bônus de Mochileiro; Pochete acrescenta +2 ou Bolsa +3, sem acumular os dois benefícios.
- Pochete pode evoluir para Bolsa; ao evoluir, a Pochete retorna como item comum de 1 Espaço.
- A expansão equipada é vinculada: não pode ser removida nem sofrer downgrade de Bolsa para Pochete.
- Bloco de Moedas Antigas aceita de 1 a 3 unidades por Espaço; não há transbordamento automático.
- Testes cobrem capacidade base, Mochileiro, Pochete/Bolsa, não cumulatividade, upgrade, item retornado, bloqueio de remoção/downgrade e limites do bloco de moedas.

**Validação automatizada:** commit 3fbfbc5477f075ea2d7dd5bab6c25bc43a7d5005 — 401/401 testes, TypeScript, build Vite e verificações PostgreSQL aprovados.

**Limite importante:** esta é lógica de domínio isolada. Ainda não existe grade ativa, item ativo persistido, UI de equipar/guardar/descartar, nem ciclo de vida da expansão. Não declarar o Inventário ativo implementado. Nenhum teste humano foi realizado.


## 11. Protótipos existentes que não equivalem ao Inventário ativo integrado

A inspeção do repositório também identificou módulos parciais que devem ser reaproveitados, sem serem confundidos com um Inventário ativo completo:

| Arquivo | Implementação observada | Limite atual |
|---|---|---|
| src/inventarioConsulta.ts | Contrato de consulta e resumo de instâncias | Não persiste nem cria instâncias |
| src/consultaInventarioLocal.ts | Consulta local de um snapshot recebido | Não é fonte transacional persistente |
| src/PainelInventarioLocal.tsx | Painel de consulta, filtros e detalhes por exemplar | Leitura apenas; não executa comandos de item |
| src/organizacaoInventario.ts | Plano puro de movimentação/troca, inclusive entre exemplares de múltiplos Espaços | Não persiste nem integra comandos de jogo à ficha |
| src/PainelOrganizacaoLocal.tsx | Prévia, consentimento e envio por porta de organização | Protótipo de sessão; não está integrado à ficha principal nem à persistência durável |
| src/pendenciaOrganizacao.ts | Contratos de pedido/recibo e recuperação da organização | Não substitui persistência do Inventário ativo |
| supabase/proposals/inventario-instancias.sql | Proposta SQL de materialização transacional de instâncias no Supabase | Não aplicada; não é migration SQLite nem API do cliente local |
| src/EditorInventarioLocal.tsx | Edição do conjunto inicial A/B/C e compras do rascunho | Planejamento inicial, não Inventário ativo |

Os protótipos de consulta e organização têm testes históricos próprios. Não repetir automaticamente rodadas humanas descritas em checkpoints antigos; usar a fila única atual e repetir apenas após integração ou mudança relevante.

### Caminho de integração recomendado

1. Preservar os contratos de consulta e a lógica de organização já testados.
2. Criar o modelo local persistente de instâncias no SQLite/JSON da personagem, com IDs próprios, validação, revisão e isolamento por personagem/Mesa.
3. Adaptar a organização para suportar itens de múltiplos Espaços e o modelo ativo completo, sem reaproveitar silenciosamente a limitação de um Espaço por exemplar.
4. Integrar o painel de consulta e comandos à ficha contínua; só então ligar uso/equipamento/consumo/recarga e operações de itens.
5. Manter a proposta SQL do Supabase como referência histórica; qualquer uso futuro exige decisão e revisão específicas, não aplicação automática.

**Estado corrigido:** existem protótipos de consulta e organização, além de proposta remota; ainda não há Inventário ativo completo, integrado e persistente no fluxo local aprovado.


## 12. Materialização isolada de instâncias — 05/11/2026

Foi criado `src/inventarioAtivo.ts` como etapa intermediária entre o plano determinístico de criação e um futuro snapshot ativo:

- `materializarInventarioInicial()` recebe as escolhas já validadas, gera UUIDs distintos por exemplar e preserva catálogo, nome, quantidade, Espaços, local, posição e estado inicial.
- O snapshot inicia com revisão 1 e é validado pelo contrato compartilhado de consulta.
- `validarInventarioAtivo()` permite validar um snapshot existente sem reconstruir itens a partir do kit ou do catálogo.
- O contrato de personagem aceita UUID local com hífens e identificador hexadecimal compacto de 32 caracteres usado pelo servidor LAN; os IDs das instâncias continuam UUIDs com hífens.
- A validação da grade agora exige posições não sobrepostas e que o fim de cada intervalo não ultrapasse a capacidade total.

Testes novos em `tests/inventario-ativo.test.mjs` cobrem materialização, itens repetidos com IDs próprios, kit C e compras, munição, estado inicial das armas, ID compacto LAN, IDs inválidos/duplicados, adulteração, colisão, extrapolação e revisão inválida.

**Limite:** a função é pura e ainda não está ligada ao ciclo de ativação, à persistência da ficha, ao painel ou a comandos de jogo. Ela não é chamada ao abrir/reabrir uma ficha e não deve ser chamada novamente sobre um inventário já existente. Não declarar Inventário ativo integrado.

**CI desta revisão:** commits `b6c141fdffab6764b843f745c7e3825056f2a401` e `b62ab7d255e1e1805a2da0e7739ccd951bd8f528` estão em validação. A rodada anterior falhou em um teste que alterava a posição de um item característico (fora da grade); o teste foi corrigido para selecionar dois exemplares armazenados. A nova checagem também adiciona a rejeição de intervalos que ultrapassam a capacidade. Até a conclusão dos workflows, classificar como **IMPLEMENTADO / TESTES ESCRITOS / CI PENDENTE**.
