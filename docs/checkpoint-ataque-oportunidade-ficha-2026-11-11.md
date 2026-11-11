# Checkpoint — Integração do registro de Ataque de Oportunidade na Ficha
**Data:** 11/11/2026  
**Branch:** `feat/offline-first-ficha`

## Fonte canônica
Arquivo do Jogador v1.0, p. 81:
- Quando uma criatura sai voluntariamente de um quadrado ameaçado pela personagem, sem proteção contra esse gatilho, a personagem pode usar sua Reação para realizar um Ataque contra ela.
- Acertar não interrompe o Movimento do alvo, salvo regra específica.

## Implementação
- `src/PainelAcoesLocal.tsx` agora oferece o registro de Ataque de Oportunidade com três confirmações contextuais explícitas: saída voluntária, saída de quadrado ameaçado e ausência de proteção contra o gatilho.
- O painel chama os helpers de domínio já existentes: `avaliarAtaqueOportunidade()` e `registrarAtaqueOportunidade()`.
- A transição passa por `aplicarReacaoCombate()`, preservando os marcadores de Manobras e persistindo a Economia de Ações pelo fluxo já existente.
- Reação normal disponível: consome a Reação sem SA.
- Reação normal já usada: compra uma Reação adicional por 1 SA, respeitando o limite de 3 SA na janela. O texto e o estado desabilitado do botão deixam esse custo explícito.
- O controle pode ser usado fora do turno próprio, como exige o caráter de Reação.

## Limites deliberados
- A Ficha não acompanha mapa, posições, área ameaçada, voluntariedade ou proteções; a Mesa/jogador confirma o contexto.
- Não executa rolagem, não verifica Defesa, não aplica Dano, BI ou Condições, e não registra resultado do Ataque.
- Não interrompe o Movimento do alvo.
- Não coordena o evento com outra ficha nem com Encontro compartilhado.

## Testes e validação
- `tests/reacoes-combate.test.mjs` já continha testes dos helpers de domínio para o gatilho, consumo da Reação, compra por Esforço e não interrupção do Movimento.
- `tests/estado-turno-combate.test.mjs`: adicionados testes da integração persistente, recarga e compra da Reação adicional depois de a normal ter sido usada.
- Novo `tests/ataque-oportunidade-ficha.test.mjs`: verifica a presença dos controles contextuais e a integração da interface sem simular execução do Ataque.
- Testes não executados localmente neste ambiente.
- CI do novo HEAD ainda precisa ser consultado; não presumir aprovação.
- Nenhum teste humano solicitado.

## Escopo preservado
- Nenhuma alteração em `main`, merge, deploy, publicação, Supabase ou banco de produção.
- Inventário ativo permanece bloqueado até a conclusão de toda a Ficha, auditoria e sessão integrada de validação humana.
- Próxima prioridade: consultar CI e revisar outras lacunas de Combate/Reações que possam ser integradas com contexto manual seguro, sem depender de equipamento ativo ou Encontro.
