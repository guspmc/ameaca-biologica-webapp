# Matriz preliminar de campos — sincronização Local > LAN

**Data:** 10/11/2026  
**Status:** análise técnica conservadora; proposta para validação, não é allowlist implementada.

## Princípio

A sincronização não deve aceitar um objeto JSON inteiro e confiar que o frontend enviará apenas campos seguros. A rota dedicada deverá receber uma operação versionada, validar cada campo no servidor e aplicar uma allowlist por estado da ficha. Ausência de campo, valor nulo e exclusão de campo devem ter semântica explícita.

## Matriz preliminar

| Campo/grupo | Evidência no código atual | Rascunho | Ficha ativa | Regra proposta |
|---|---|---|---|---|
| Nome | Editor de Identidade envia nome separado; PUT atualiza nome | Candidato, validar tamanho e normalização | Candidato, mesma validação | Operação explícita de identidade |
| identidade | Callback próprio; não foi localizada validação server-side específica no PUT auditado | Pendente de schema | Pendente de schema | Não liberar até validar chaves e limites no servidor |
| configuracaoFuncionamento | Callback próprio; existe configuracaoFuncionamentoValida | Candidato após validação server-side | Candidato após validação server-side | Allowlist somente após validação equivalente no servidor |
| classe, origem, armaOperario, habilidadeBasica | Campos de criação protegidos quando ficha está completa | Fluxo validado de criação | Proibido no sync genérico | Ativa não altera; rascunho sincroniza como conjunto validado |
| atributos, periciaOrigemTreinada, periciaOrigemExtra, periciaTentativaErroTreinada, distribuicaoPericias | Dados de criação protegidos em ficha completa | Conjunto atômico e validado | Proibido no sync genérico | Nunca sincronizar parcialmente |
| planejamentoCriacao | Editor salva pelo callback de Recursos; validador local conhece a estrutura | Candidato no fluxo de criação | Não tratar como edição operacional | Fluxo de criação validado |
| equipamentoInicial, comprasIniciais, revisaoCompras | Plano de inventário inicial; protegido em ficha ativa; ativação materializa inventário | Fluxo de criação validado | Proibido no sync genérico | Não misturar plano inicial e inventário materializado |
| nivel, habilidadesAdquiridas | Campos ligados à criação/Progressão; servidor protege nível e campos de criação | Fluxo próprio | Proibido no sync genérico | Progressão apenas pelo fluxo próprio |
| progressao | PUT atual permite diretamente apenas alterar missoesCompletadas; demais propriedades são protegidas | Operação específica | Não sincronizar objeto inteiro | Operação estreita para o contador permitido |
| pedidoProgressao | Validador local exige vínculo com Progressão | Fluxo próprio | Fluxo próprio | Excluir do snapshot genérico |
| pvAtual, pvTemporarios, biAtual | Campos operacionais; validação local de inteiros não negativos | Candidato após regra server-side | Candidato após regra server-side | Operações explícitas, limites e transições validados |
| saAtual, economiaAcoes, estadoTurnoCombate | Existem invariantes cruzadas entre SA, economia e turno | Agregado atômico | Agregado atômico | Nunca aceitar espelhos inconsistentes |
| reanimacao | Existe validador local reanimacaoValida | Candidato após validação server-side | Candidato após validação server-side | Validar transições, não estado arbitrário |
| condicoes | Existe listaCondicoesValida | Candidato após validação server-side | Candidato após validação server-side | Validar coleção e concorrência |
| usosDescansoCompleto | Existe usosDescansoCompletoValido | Candidato após validação server-side | Candidato após validação server-side | Validar estrutura e operações de descanso |
| estadoFicha, autoria, mesaId, contaId e IDs | Estado e vínculos controlados pelo servidor/ativação | Nunca aceitar do cliente | Nunca aceitar do cliente | Campos exclusivamente server-owned |
| inventario_json / exemplares | Inventário materializado é coluna separada; ativação registra recibo | Fluxo próprio | Fluxos próprios de Inventário | Nunca sobrescrever pelo snapshot geral |
| Baú, transferências e estoque compartilhado | Decisão do projeto: operações compartilhadas LAN-only | Offline proibido | Offline proibido | Fora do cache/sync genérico |

## Distinção por estado

### Rascunho

A edição local dos campos de criação continua possível, mas a sincronização deve aceitar somente conjuntos coerentes e validados pelo servidor. Campos usados na conferência/ativação devem respeitar os fluxos atuais. Sincronizar nunca ativa a personagem automaticamente.

### Ficha ativa

A allowlist deve ser menor. Campos de criação e equipamento inicial protegidos pelo servidor não podem ser alterados pelo sync. Progressão, ativação, inventário materializado, economia de ações e operações de combate devem preservar seus validadores e fluxos especializados. Ser editável na UI não prova que seja seguro substituir o valor integral no servidor.

## Riscos que exigem desenho específico

1. **PV/BI/SA e combate:** um snapshot local pode estar desatualizado enquanto outro dispositivo executa uma ação legítima. A política multi-dispositivo aprovada exige detectar divergência e preservar ambas as versões.
2. **SA e estado de turno:** saAtual, economiaAcoes e estadoTurnoCombate têm invariantes cruzadas. A unidade de conflito deve abranger o agregado.
3. **Progressão:** progressao.missoesCompletadas é a única propriedade explicitamente liberada pelo PUT atual; benefícios, nível, método, marcos e registros de morte permanecem protegidos.
4. **Inventário:** plano de criação e inventário materializado são estados diferentes. Não incluir itens, quantidades, munição, Baú ou transferências no sync genérico.
5. **Identidade:** há editor próprio, mas o trecho auditado não demonstrou schema server-side suficiente.
6. **Ausência e exclusão:** usar patches tipados com operação explícita de remoção; omissão não pode significar apagar campo.

## Proposta de primeira allowlist para discussão

A primeira etapa deve ser deliberadamente estreita:
- nome da personagem, por operação explícita;
- configuracaoFuncionamento, após validação server-side correspondente;
- identidade somente depois de definir e implementar schema server-side;
- demais recursos operacionais somente após mapear transições e invariantes de cada domínio.

Para ficha ativa, não incluir inicialmente: criação, atributos/perícias de criação, equipamento inicial, compras iniciais, nível/habilidades de Progressão, pedido de Progressão, inventário materializado, Baú, transferências, ativação, autoria, Mesa ou estado de ficha. Recursos e combate também ficam pendentes até haver operações tipadas e testes específicos.

Para rascunhos, a sincronização dos campos de criação deve respeitar o fluxo validado de criação e nunca chamar ativação implicitamente.

## Classificação

- **EVIDÊNCIA:** callbacks da UI separam Identidade, Características, Atributos/Perícias, Inventário, Configuração de Funcionamento e Recursos; servidor protege campos de criação em fichas ativas e propriedades sensíveis da Progressão; inventário materializado é separado.
- **PROPOSTA:** allowlist estreita, validação server-side por domínio e operações tipadas em vez de PUT de snapshot completo.
- **NÃO APROVADO:** nenhuma allowlist final foi autorizada ainda.
- **NÃO IMPLEMENTADO:** nenhuma rota ou sincronização usa esta matriz.
- **PENDENTE:** confirmar primeira allowlist e detalhar recursos operacionais, combate, identidade e criação em ciclos separados.
