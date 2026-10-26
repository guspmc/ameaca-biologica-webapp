# Fluxo vigente — desenvolvimento autônomo supervisionado

Confirmado por Gus em 25/10/2026 e ampliado em 26/10/2026: avançar nas etapas aprovadas em alterações pequenas e verificáveis, acumulando **dez novos casos humanos no PC e, separadamente, dez independentes no celular**, até vinte no total. O acesso físico foi aprovado no Galaxy S24 FE (MC1–MC4). As filas não dependem uma da outra. Não criar testes manuais artificiais para preencher a fila.

Gus autorizou avançar pelos checkpoints de preparação necessários enquanto os testes puderem aguardar. Isso não revoga as restrições a banco remoto, Auth/RLS, produção, publicação ou merge na principal. Ao atingir as duas filas, consolidar e aguardar; interação indispensável pode antecipar a parada. Computador desligado interrompe o trabalho e as prévias; deixar checkpoint verificável para retomar, sem prometer execução fora do host.

Uma necessidade indispensável de decisão, autorização ou interação permite interromper antes de dez. Registrar a dependência e continuar trabalho independente quando possível. Não interpretar silêncio como autorização. Testes aprovados permanecem encerrados, salvo mudança relevante.

Compilação, TypeScript e testes automatizados são evidências distintas de teste humano. Relatório ao encerrar: IMPLEMENTADO, TESTADO, PENDENTE DE TESTE HUMANO, BLOQUEADO e PRÓXIMO PASSO. Incluir passos e resultado esperado de cada caso disponível, preservar histórico e evidências.

Banco de produção, RLS/Auth remotos e dados existentes exigem autorização específica. Aplicação de novas funções/permissões no ambiente TESTE também depende de pacote revisável e checkpoint próprio. Sem merge na principal ou publicação sem checkpoint. Documentos oficiais, Planejamento v2.0 e `sources/` permanecem preservados.

Estado ao iniciar este protocolo consolidado: T13.1–T13.10 aprovados e encerrados; T10–T12 ainda futuros, condicionados à integração/acesso. Celular físico pendente. Nenhum novo caso executável enfileirado apenas pela preparação de módulos ou SQL sem interface.
