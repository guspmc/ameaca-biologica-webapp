# Identidade narrativa — 23/10/2026

Implementa os campos previstos em Planejamento WebApp v2.0 §5.1, preservando o conteúdo narrativo da ficha oficial: nome, idade, ocupação, apelido, afiliação, gênero da personagem, aparência, personalidade, objetivo, medo, laços e história. Gênero é texto opcional da personagem, sem inferir gênero do jogador ou alterar regras; flexão dos demais textos ainda pendente.

Nome usa a coluna existente. Os onze campos opcionais são salvos em `identidade` JSONB, padrão vazio. Idade/gênero até 40 caracteres; ocupação/apelido/afiliação até 120; aparência/personalidade/objetivo/medo/laços até 1000; história até 4000. Estes são limites técnicos, não regras de personagem. Idade permanece texto livre, sem impor faixa numérica inventada. Campos vazios são removidos ao salvar; isso permite apagar deliberadamente um texto. O formulário substitui o conjunto narrativo salvo, sem alterar mecânicas. Exige Salvar Identidade; fechamento sem salvar não grava, e autosave geral do rascunho permanece pendente.

Migração `20261023050653_identidade_rascunhos.sql` gerada pelo CLI e aplicada SOMENTE no projeto gratuito de teste. Histórico conferido: doze migrações. Nenhuma alteração em produção, sem reparação da 006. A interface seleciona nova coluna e só deve ser publicada após migrações aprovadas no destino.

## Segurança e evidências

- RPC exige identidade autenticada, propriedade, participação admitida como jogador e estado rascunho, com bloqueio de linha. Valida nome e uma lista fechada de chaves/strings/limites no servidor. Campos mecânicos, JSON aninhado, nulls e tipos inesperados são recusados; inválidos não alteram parcialmente nome ou narrativa.
- SECURITY DEFINER com search_path vazio; EXECUTE negado a PUBLIC/anon e permitido a authenticated. UPDATE direto em identidade negado. Metadados confirmados: anon_execute=false, auth_execute=true, escrita_direta=false. Políticas existentes preservadas: Mestre e outros jogadores não leem rascunhos. A política legada de fichas completas ainda permite leitura integral ao Mestre; adequar ao futuro resumo é pendência anterior à ativação de fichas.
- Renderização React usa texto, sem HTML inserido. Quebras de linha preservadas. Nenhuma informação narrativa de usuário real foi consultada ou copiada.
- 27 testes locais passaram: 20 de banco, três de conexão, dois de Perícias e dois de kits. Novos testes cobrem textos/acentos/parágrafos, limpeza explícita, limites, tipos/chaves inválidos, preservação de mecânicas, propriedade, admissão, estado, escrita direta e anon.
- TypeScript e Vite passaram; aviso de bundle de 509,34 kB minificado, sem nova dependência. Sem otimização de bundle nesta etapa.
- `tests/staging-identidade.sql` passou no PostgreSQL 17 do teste, com ROLLBACK de todas as fixtures isoladas sem e-mail/senha. Conferiu texto multilinha e nome, recursos preservados, chave mecânica recusada e edição/leitura indevida negada. Dados do teste humano não foram alterados.
- QA em `tests/ui/identidade.html` usou componente real e adaptador em memória: Ocupação “Médica de resgate” e História em duas linhas, confirmação de salvamento e reabertura preservadas. Essa fixture não testa F5 persistido no Supabase.
- Advisor: nove RPCs SECURITY DEFINER autenticadas; autorização testada, alerta não equivale a certificação. Proteção contra senhas vazadas segue desativada, sem mudança de Auth/custo. [RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) · [senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Aprovação humana anterior

Gus confirmou equipamento funcional após F5. Capturas mostram opção B de Operador, LEMI 10/10, uma moeda, Erva Verde/Lanterna, Kendo e Ferramentas fora da grade, ocupação 4/7 e painel do Mestre sem rascunhos. As imagens documentam B; não são evidência visual específica da troca para C. O relato confirma o roteiro geral.

## Próximo teste humano

1. F5 na prévia local, abra um rascunho → Características → Identidade, aparência e história.
2. Preencha dois campos fictícios e História com acentos e duas linhas. Salve, dê F5 e reabra; devem permanecer iguais.
3. Apague um campo opcional, salve e recarregue; deve continuar vazio. Os demais textos e valores de jogo permanecem.
4. Mestre continua sem acesso ao rascunho. Não enviar dados pessoais, senhas ou história privada ao chat.

Compras iniciais, inventário ativo, equipar, revisão, automações e finalização ainda pendentes. Nenhum botão de finalizar foi criado. Limites de dez jogadores/dez ativas, concorrência estrita, readmissão e reconciliação da 006 em produção seguem pendências conhecidas. Sem merge/publicação.
