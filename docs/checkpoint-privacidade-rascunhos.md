# Checkpoint — privacidade e limite de rascunhos

Preparado em 22/10/2026. Branch do PR #1. Proposta não aplicada em produção; nenhum dado real foi alterado. A auditoria anterior é um registro histórico do estado observado, não o estado posterior à aplicação desta proposta.

## Mudança proposta

Arquivo `supabase/migrations/20261022224633_privacidade_e_limite_rascunhos.sql`, gerado pela ferramenta oficial do Supabase e preenchido para revisão:

- Rascunhos ficam visíveis apenas ao proprietário ainda participante. Mestre continua consultando fichas completas de sua Mesa.
- Criar personagem passa a verificar somente os rascunhos daquela conta/Mesa e recusa a quarta criação.
- Fichas completas e rascunhos de outras contas/Mesas não consomem essas três posições.
- O bloqueio da linha de participação serializa criações da mesma conta/Mesa e a remoção desse vínculo. Chamadas sem admissão não adquirem esse bloqueio.
- Mantém validações de Classe, Atributos e fórmulas de criação, com search_path vazio e EXECUTE somente para authenticated.
- Não exclui nem atualiza personagens existentes. Quem já tiver mais de três rascunhos pode continuar lendo seus registros, mas não criar outro.
- Contador e impedimento na interface ajudam o usuário; o limite de segurança é imposto no banco.

Dez personagens ativas é uma regra da futura finalização, não um bloqueio para começar rascunhos. Esta proposta não cria finalização nem concede escrita no estado da ficha.

## Validação automatizada

`pnpm test`: sete testes de integração em PostgreSQL 18.6 via PGlite 0.5.11. Aplicam os arquivos de migração reais, com roles anon/authenticated e auth.uid() mínimo de teste. Executam ações sob roles sem privilégio de proprietário; o papel administrativo é usado apenas para preparar fixtures fictícias.

Cobertura: reprodução da exposição anterior e proteção proposta; leitura de completas pelo Mestre; separação de contas/Mesas; três rascunhos mesmo com dez completas; preservação de excedentes legados; RPC alheia e escrita direta negadas; todas as 17 Origens; rejeição de escolhas inválidas sem atualização parcial; bônus sem acumulação; SA gastos e BI preservados; fórmulas das Classes e Atributos legais/ilegais.

Há também teste que documenta uma pendência: removido perde acesso, mas readmitido recupera rascunhos. Não foi implementada a exclusão automática porque exige alteração destrutiva e aprovação específica.

PGlite tem uma única conexão: os testes não certificam contenção de locks entre transações independentes. Auth real, PostgREST, cache de esquema, Realtime e interface com duas sessões não são simulados por esses testes. Os testes não se conectam à produção e não solicitam segredos.

Dependências fixadas em pnpm-lock.yaml; Supabase JS e PGlite também têm versão exata no manifesto. CI passa a executar os mesmos testes e compilação. Alterar o workflow de publicação não o dispara nesta branch: publicação continua dependente de main ou disparo manual autorizado.

## O que ainda não aplicar

- Não reaplicar 006: ela já existe no banco e falta apenas seu registro no histórico. Uma reconciliação separada deve registrar a realidade sem executar novamente o SQL.
- Não executar esta nova proposta sem autorização específica para o ambiente escolhido.
- Não excluir fichas, membros ou rascunhos reais para testar.
- Não mesclar ou publicar com base apenas em testes locais.

## Roteiro humano quando houver ambiente de teste isolado

Pré-requisito: confirmar um projeto Supabase de teste sem dados reais, aplicar 001–006 e esta proposta nele e abrir o código desta branch apontando exclusivamente para esse projeto. Não usar a página publicada atual para validar esta proposta. Não compartilhar senha, token ou chave administrativa.

1. Abra a conta fictícia de Mestre em um navegador e a de Jogador em outro perfil. Crie uma Mesa de teste e admita o Jogador pelo convite.
2. Jogador cria um rascunho. Confira que o Mestre não o encontra, inclusive após Atualizar e F5.
3. Jogador escolhe Policial e Pontaria. Confira Defesa = 10 + AGI + 2, Pontaria = AGI + 2, estado rascunho e persistência após F5.
4. Crie mais dois rascunhos: contador 3/3 e criação bloqueada. Feche/abra uma ficha e confirme que as escolhas de Origem pertencem à ficha correta.
5. Em outra Mesa, o mesmo Jogador deve conseguir criar novo rascunho. O Mestre não deve conseguir alterar recursos do Jogador nem criar como jogador em sua própria Mesa.
6. Use apenas fixtures descartáveis para remover/readmitir o Jogador: acesso deve sumir após atualização; restauração após readmissão é pendência conhecida, não aprovação de conformidade.

Não existe fluxo público de finalização nesta Alfa; a leitura de ficha completa pelo Mestre foi validada somente por fixture administrativa local. Não marcar rascunho real como completo para testar.

Para testar recursos em duas sessões e Realtime sem expor rascunhos, será necessária uma ficha completa fictícia no ambiente isolado. Verificar eventos para contas autorizadas e ausência para as demais; uma atualização após 30 segundos pode ser o polling alternativo, não prova de Realtime.

Ao relatar, basta informar passo, resultado esperado e observado e eventual mensagem de erro, sem dados pessoais. Neste checkpoint nenhum teste humano em produção é necessário.

## Próxima autorização

Escolher o ambiente de teste antes de aplicar a proposta. A aplicação em produção, reconciliação do histórico da 006 e qualquer exclusão automática de rascunhos precisam de aprovações específicas separadas. Merge e publicação permanecem bloqueados até checkpoint explícito do Gus.
