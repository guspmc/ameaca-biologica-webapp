# Checkpoint — primeira implementação da ficha local — 01/11/2026

**Branch:** `fix/lab-criacao-feedback-2026-10-31`  
**HEAD:** `1b904c7f8286bb87845a8c8b3b861d6154a4a9f4`  
**Escopo:** primeira interface contínua de consulta para rascunhos locais e ampliação do formulário local. Nenhum teste ou build foi executado nesta rodada, conforme combinado para validação posterior pelo Gus. Nenhuma publicação, merge, alteração de `main` ou operação Supabase foi realizada.

## Implementado nesta rodada

### Ficha contínua
- Novo componente `src/FichaLocal.tsx`.
- A ficha abre a partir de cada rascunho local, sem criar cópia nem alterar o registro.
- Estrutura única com navegação por âncoras nas quatro seções aprovadas:
  1. Características;
  2. Atributos e Perícias;
  3. Combate;
  4. Inventário.
- Apresenta Classe, resumo, Ramos disponíveis, Proficiências, Origem e benefício, Habilidade Básica quando escolhida, Atributos, graus de Perícia, recursos máximos calculados para nível 1, Defesa básica, Movimento e capacidade de Inventário.
- Exibe itens característicos da Classe e os itens do conjunto inicial selecionado.
- Inclui avisos explícitos para operações ainda não implementadas: combate ativo, rolagens, dano, munição, condições, compras personalizadas e operações de inventário.
- Layout responsivo para desktop e celular em `src/styles.css`.

### Criação local
- `src/LaboratorioLocal.tsx` agora permite selecionar Habilidade Básica da Classe e conjunto de Equipamento Inicial.
- As duas escolhas são gravadas no rascunho local e recuperadas ao continuar a edição.
- Trocar a Classe limpa essas duas escolhas para evitar manter seleção incompatível.
- As escolhas são opcionais nesta etapa de rascunho. A ficha mostra claramente quando não foram selecionadas.
- Nenhum efeito de Habilidade é executado e nenhum equipamento é ativado automaticamente.

## Regras e limites preservados
- Reutilizados os catálogos existentes de Classe, Origem, Habilidades, Perícias e Equipamento.
- Recursos mostrados são máximos/base calculados para nível 1; recursos atuais não foram criados nem restaurados.
- Defesa exibida é básica e não inclui bônus de equipamento.
- Bônus de Treinamento é mostrado separadamente; o total de Teste depende do Atributo associado e de contexto.
- A ficha continua marcada como rascunho local e não ativo.
- A implementação continua usando o armazenamento isolado do laboratório (localStorage); não conecta ao servidor LAN, Supabase ou contas reais.

## Pendente para próximas etapas
- Conferência visual e funcional pelo usuário em desktop e celular.
- Executar `pnpm test` e `pnpm run build` após a rodada de implementação.
- Revisar fórmulas e associações de Atributos das Perícias com os livros oficiais antes de mostrar totais completos de Teste.
- Completar criação/revisão: validação obrigatória de Habilidade Básica e kit, compras do conjunto Personalizado, revisão de criação e persistência transacional.
- Integrar ficha com servidor SQLite/LAN; implementar PV/SA/BI atuais, inventário ativo e combate somente quando seus serviços e regras estiverem prontos.
- A ficha online/Supabase permanece separada e inalterada.

**Estado:** código registrado na branch; implementação ainda não validada por build, testes automatizados ou teste humano.
