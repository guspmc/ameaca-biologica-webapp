# Auditoria do Inventário na Ficha — 05/11/2026

Branch: `feat/offline-first-ficha`

## Escopo e fontes

Esta auditoria verifica somente o que o código atual implementa para a criação e a prévia do Inventário. O Planejamento v2.0 anexado descreve também o Inventário ativo, Baú, uso, combinação, equipamento, Peças e estoques de missão. O Planejamento v2.1 mencionado pelo usuário não está anexado nesta sessão; portanto, esta auditoria não o substitui nem presume que todo o detalhamento de v2.0 permaneça inalterado.

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

O Arquivo do Jogador v1.0 e o Planejamento v2.0 anexados descrevem regras que deverão orientar a auditoria do Inventário ativo, sem presumir que a versão v2.1 ausente não as tenha alterado:
- Inventário cheio impede carregar novos itens, mas permite examiná-los; itens excedentes em mãos impedem outras Ações até serem resolvidos.
- Itens sem Espaços próprios ocupam 1 Espaço, salvo regra específica.
- Bolsa e Pochete não acumulam; aplica-se o maior benefício. Bolsa concede +3 Espaços e Pochete +2; o Planejamento v2.0 trata a expansão ativa em espaço dedicado, vinculada permanentemente, com upgrade e retorno da expansão anterior como item comum.
- Moedas são organizadas em blocos de até três por Espaço; não há transbordamento, fusão ou reorganização automática.
- O Planejamento v2.0 também descreve comandos contextuais de Usar, Equipar/Remover e instalação de Peças, mas seus efeitos, custos, requisitos e exceções precisam ser conferidos no Arquivo do Jogador e nas decisões posteriores antes da implementação.

A grade ativa não deve ser iniciada como simples extensão do array `ItemCriacao`: o modelo atual representa uma projeção determinística de criação, sem ciclo de vida de item ativo, histórico ou operações transacionais.
