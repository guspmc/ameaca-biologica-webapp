# Rodada autônoma — revisão da criação

23/10/2026. Segue o [fluxo autorizado](fluxo-autonomo-supervisionado.md). Referência: Planejamento v2.0 §5.1–5.2 e §6.1–6.2, e fórmulas do Arquivo do Jogador v1.0 já verificadas nas etapas anteriores. Sem mudança de banco, RLS, Auth, dados humanos, dependências ou documentos oficiais nesta rodada.

## IMPLEMENTADO

- Revisão somente de leitura ao final do rascunho: identificação, nível/Classe, pontos de Atributos, Origem/Treinamento, lista/orçamento/graus de Perícias, Habilidade, kit/capacidade e máximos dos recursos. Indica Conferido, Pendente ou Revisar e oferece atalhos às seções com pendência.
- Usa valores salvos; não apresenta edição ainda não salva como persistida. Não restaura recursos atuais, não altera escolhas e não ativa ficha. Não substitui validação no servidor. Mesmo quando as escolhas estão conferidas, finalização permanece indisponível.
- Personalizado indica compras pendentes. Fórmulas consideram Policial, Universitária, Cobaia, Mochileiro e Parrudo, sem aplicar Colete guardado. Nível acima de 1 é identificado como fora do alcance da revisão atual, sem conferir fórmulas de nível 1 como se fossem evolução.
- Flexão Operador/Operadora na lista, cabeçalho, Características, formulário de Perícias e revisão, apenas quando o gênero da personagem declara feminino/feminina/mulher/f. Classe mecânica permanece Operador. Agente e Autodidata são invariantes. Texto livre desconhecido usa o nome oficial sem inferência por nome ou conta. Condições ainda não implementadas não receberam flexão fictícia.
- Catálogo de Origens compartilhado com o formulário, sem alterar suas 17 entradas. Isso evita divergência de listas entre edição e revisão.
- Arquivo principal compilado dividido de bibliotecas existentes. Configuração usa manualChunks do Rollup do Vite 7 instalado, sem atualizar versão: [documentação do Rollup](https://rollupjs.org/configuration-options/#output-manualchunks). Site atual do Vite descreve outra versão do empacotador; a API foi validada contra o TypeScript e build da versão instalada.

## TESTADO

- 32 testes passaram: 20 de banco, três de conexão, dois de Perícias, dois de composição dos kits e cinco de revisão/apresentação. Casos novos incluem distribuição parcial/excedente, lista ampliada pela Origem, Amnésico, grau gratuito, Classe incompatível, capacidade baixa, todos os bônus simples e não mutação dos dados de entrada.
- TypeScript sem erros e Vite build aprovado. Resultado minificado: principal 67,61 kB, Supabase 217,75 kB, outras bibliotecas 227,96 kB. O aviso anterior de arquivo único acima de 500 kB não apareceu. Isso reduz o arquivo principal; não demonstra redução equivalente no total baixado nem melhoria de tempo medida.
- Auditoria completa pnpm: zero avisos conhecidos retornados, 131 dependências totais. Nenhum pacote instalado/atualizado. Auditoria não certifica ausência de vulnerabilidade desconhecida.
- QA em `tests/ui/revisao.html`: componente real com ficha fictícia em memória, sem banco. Operadora apareceu por gênero explícito. Revisão conferiu Operador nível 1 com Parrudo: PV 20, SA 1, BI 9, Defesa 11, kit B 4/7. Editar Atletismo sem salvar deixou revisão em 3/3; salvar alterou para Pendente 2/3. Isso verifica estado da interface, não persistência remota.
- Versão compilada servida temporariamente em 127.0.0.1:4175 abriu o portal/configuração no navegador, sem login, credenciais ou conexão salva. Confirma carregamento básico dos arquivos separados; não certifica fluxos autenticados da compilação. Servidor temporário encerrado.
- Confirmação humana da identidade recebida: Gus disse “Tudo salvo e funcional” após o roteiro de persistência/limpeza. Esse relato foi registrado sem consultar textos das personagens. Testes anteriores de Origens, Perícias, Habilidade e kit preservados.

## PENDENTE DE TESTE HUMANO

Acumular os itens abaixo em uma sessão; não exigem apagar fichas ou mudar regras.

| Passo | Resultado esperado |
|---|---|
| F5 na prévia 4174; abrir rascunho e a Revisão da criação ao final | Escolhas e fórmulas correspondem ao que foi salvo; não existe ação de finalizar |
| Comparar pontos salvos de Perícias com a revisão | Completo fica Conferido; parcial fica Pendente. Editar sem salvar não muda a revisão |
| Em uma Operador fictícia, salvar gênero Feminino e reabrir | Exibe Operadora; Habilidade, Classe mecânica e recursos não mudam. Pode preservar o gênero já escolhido em outras personagens |
| Reduzir largura da janela e percorrer revisão, identidade e inventário | Sem corte horizontal de texto ou botões; atalhos e barra inferior utilizáveis |
| Se as duas sessões estiverem abertas, conferir painel do Mestre | Rascunhos continuam invisíveis. Não há mudança de acesso nesta rodada |

Celular físico, teclado virtual e toque permanecem pendentes. A prévia usa loopback do PC; abrir 127.0.0.1 no celular não acessa o PC. Não foi publicada versão nem ampliada exposição à rede para contornar isso.

## BLOQUEADO

- Teste físico móvel depende de ambiente acessível aprovado. Não houve tentativa de expor serviço na rede ou publicar branch.
- Produção, RLS, Auth e dados existentes: alterações dependem de autorização específica. Nada dessas áreas foi alterado nesta rodada. Reconciliação do histórico da 006 continua aguardando checkpoint.
- Revisão não desbloqueia ativação: compras, instâncias de inventário, modo Misto e validações transacionais de finalização ainda precisam ser implementados e validados. Não são recursos aprovados apenas por a tela de revisão existir.

## PRÓXIMO PASSO

Preparar compras do equipamento inicial localmente, conforme preços/acesso oficiais, validando saldo e capacidade sem modificar registros existentes. Antes de ativar gravações que ampliem permissões ou de alterar regras de ativação no ambiente remoto, apresentar operação concreta e obter autorização específica. Finalização deverá criar instâncias de itens uma única vez, configurar automações e revalidar nível/vagas na mesma transação, com autorização no servidor; não converter a revisão visual em autoridade.

Permanecem pendentes concorrência estrita, teto de dez jogadores/dez ativas, readmissão que restaura rascunhos e acesso legado do Mestre à ficha completa além do futuro resumo. As decisões e limitações anteriores não foram removidas.
