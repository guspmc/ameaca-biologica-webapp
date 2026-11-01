# Checkpoint — criação e revisão da ficha local — 01/11/2026

**Branch:** `fix/lab-criacao-feedback-2026-10-31`  
**HEAD:** `1663d203b4afa40e3c556062555fe43e36031040`  
**Estado:** código registrado; sem build, testes automatizados ou teste humano nesta rodada. Não houve merge, publicação, alteração de `main` ou operação Supabase.

## Implementado nesta etapa

- A criação local agora exige uma Habilidade Básica válida para a Classe.
- A criação local exige a escolha de um conjunto inicial A, B ou C.
- O conjunto C apresenta o planejador de compras existente, usando o catálogo inicial parcial e os limites de orçamento/capacidade já definidos no projeto.
- O plano de compras e sua revisão são guardados no rascunho local quando o personagem é salvo; também são recuperados ao continuar a edição.
- A validação do rascunho impede salvar o conjunto C sem um plano confirmado, com orçamento válido e que caiba na capacidade.
- A revisão existente `RevisaoCriacao` foi integrada ao formulário local, reaproveitando `revisarCriacao`.
- A revisão apresenta pendências, cálculos de PV/SA/BI/Defesa e atalhos para as seções do formulário.
- A ficha passou a montar uma prévia de inventário com `planejarInventarioCriacao`, incluindo itens característicos, kit e compras do conjunto C, com estado inicial e espaços ocupados.
- Cancelar edição limpa também o estado temporário das compras. Trocar Classe limpa Habilidade, kit e compras.

## Limites preservados

- O catálogo de compras continua parcial; não foram inventados itens ou preços.
- A confirmação do plano no componente de compras mantém a escolha no formulário; ela só passa a integrar o rascunho persistido quando o usuário salva o personagem.
- A revisão é uma conferência, não ativa a personagem.
- O inventário continua sendo uma prévia de criação: não há equipar, usar, consumir, transferir, recarregar ou descartar.
- Preferências de funcionamento exibidas pela revisão continuam sendo prévia local e não estão persistidas nesta etapa.
- O laboratório continua isolado em localStorage; nenhuma integração com servidor SQLite/LAN ou Supabase foi feita.

## Próxima etapa sugerida

Conferir as fórmulas e a exibição de perícias com o cânone, consolidar o formulário e a ficha em uma experiência de edição contínua (em vez de manter a ficha como somente leitura), e então preparar a persistência local do funcionamento da ficha. Depois disso, avançar para a integração com o servidor local, sem habilitar operações compartilhadas offline.

**Validação pendente:** executar build/testes e conferir criação, edição, recuperação de rascunho, conjunto A/B/C, orçamento, capacidade e revisão em desktop e celular.
