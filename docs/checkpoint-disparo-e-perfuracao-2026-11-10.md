# Checkpoint — Disparo Cadenciado, Rajada e Perfuração (10/11/2026)

## Fonte canônica
Arquivo do Jogador v1.0, Capítulo 3 — Arsenal e Equipamentos, p. 49; perfis específicos das armas nas pp. 53–60.

## Implementado
- `src/procedimentosDisparoArmas.ts`: consulta compatibilidade de Disparo Único, Disparo Cadenciado, Rajada e Perfuração a partir do perfil do catálogo.
- `src/CalculadoraTesteLocal.tsx`: seletor manual de modo de disparo para perfis compatíveis; Matilda exige confirmação explícita da Coronha específica para habilitar Cadenciado e usar custo de 3 cartuchos.
- Disparo Cadenciado mantém o Ataque normal e orienta rolar +2 dados do mesmo tipo, informados no campo de Dados adicionais.
- Rajada é tratada como ação em área sem Teste de Ataque nem Crítico; mostra cone de 4,5 m, Reflexos DT 12, custo de 10 cartuchos e regra de alcance Curto.
- Perfuração apresenta procedimento manual universal e exceção da Punisher.

## Limites deliberados
- Não confirma posse, equipamento, munição carregada ou instalação real de Peças; a Coronha da Matilda depende de confirmação manual do usuário.
- Não consome cartuchos, não resolve Reflexos, não compara Defesa, não escolhe alvos/linha/cobertura e não aplica dano.
- Perfuração não automatiza redução cumulativa de Dados nem ajuste por tamanho; cada Teste subsequente e cálculo permanecem manuais.
- O dano da Rajada pode ser consultado/calculado como valor integral; o Narrador aplica metade em sucesso no Reflexos DT 12 e integral em falha. Nenhum resultado é aplicado à ficha.

## Testes
- Adicionados testes unitários em `tests/procedimentos-disparo.test.mjs` e verificações estáticas em `tests/ataques-calculadora.test.mjs`.
- Execução local indisponível neste ciclo; aguarda CI.
- Sem validação humana, merge ou publicação.
