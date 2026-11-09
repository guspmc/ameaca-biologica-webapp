# Checkpoint — Exposto por Falha Crítica, 09/11/2026

## Estado técnico
- Repositório: `guspmc/ameaca-biologica-webapp`
- Branch: `feat/offline-first-ficha`
- HEAD documental observado: `052bba0f962afee530bdeab4c814a4f0a553a7b6`
- HEAD de código deste ciclo: `411a78efc1b16b85639c72c90d3c053b44e0c63a`
- CI para o SHA de código: **pendente de confirmação**; o status consultado não retornou verificações associadas.
- Sem merge para `main`, deploy ou alterações em produção.
- Sem testes humanos; permanecem reservados à bateria integrada da Ficha completa.

## Decisão aprovada pelo Gus
- Exposto ocorre quando há Falha Crítica: resultado natural 1 no d20.
- Na Ficha Automática, Exposto é ativado automaticamente apenas quando a Falha Crítica ocorre em um Ataque (corpo a corpo ou à distância).
- Testes comuns de Perícia ou Atributo não acionam essa automação.
- Nos modos Misto e Manual, o Jogador ativa Exposto manualmente.
- Duração registrada para a instância originada por Falha Crítica: até o final do próximo turno da criatura.
- Essa decisão resolve a pendência anteriormente registrada no §7.6 da v2.6. A próxima revisão do planejamento deve atualizar o texto para refletir a decisão.

## Implementação
- `src/CalculadoraTesteLocal.tsx`: após a ação explícita de rolar/confirmar dados, calcula o resultado escolhido conforme Normal/Vantagem/Desvantagem. Somente se o tipo for Ataque Corpo a Corpo ou Ataque à distância e o resultado for `falha-critica`, chama o callback de Exposto.
- `src/FichaLocal.tsx`: o callback confirma que o modo da Ficha é `automatico`, valida o registro de Condições, não duplica uma instância ativa de Exposto, cria a instância com fonte, duração e observação e salva pelo fluxo existente `aoSalvarRecursos`.
- O retorno da operação é apresentado ao Jogador: salvamento confirmado ou aviso para conferir as Condições se não foi possível confirmar.
- Testes automatizados em `tests/roladores-ficha.test.mjs` verificam que o callback só é chamado no caminho de Ataque em Falha Crítica e que a Ficha valida o modo Automático.

## Limites preservados
- Nenhum Exposto automático em Teste comum de Perícia/Atributo.
- Nenhum Exposto automático nos modos Misto/Manual.
- Nenhuma rolagem espontânea.
- A Ficha não administra turnos nem encerra Exposto automaticamente; apenas registra a duração prevista como informação. O encerramento segue o fluxo de Condições já existente, sem inventar um relógio de Encontro dentro da Ficha.
- Nenhum dano, PV, SA, BI, munição ou estado de Inventário é alterado pelo gatilho.
- Não houve integração de armas ou Dano neste ciclo.

## Estado por categoria
- **DECISÃO:** aprovada pelo Gus em 09/11/2026.
- **IMPLEMENTADO:** callback de Falha Crítica em Ataque, guarda de modo Automático e persistência da Condição.
- **TESTES AUTOMATIZADOS:** testes escritos/atualizados; execução da suíte/build não foi observada.
- **VALIDADO HUMANAMENTE:** pendente, reservado à bateria integrada final.
- **CI:** pendente de evidência associada ao SHA `411a78efc1b16b85639c72c90d3c053b44e0c63a`.

## Próxima frente
Continuar a auditoria de Ataque e Dano sem antecipar Inventário ativo: inspecionar contratos de armas, habilidades, peças, cálculos e testes já existentes; separar o que pode ser integrado agora do que depende do Inventário ativo. Não presumir arma equipada, bônus, consumo de munição ou multiplicadores ausentes.

## Continuidade
Na próxima sessão, ler este checkpoint e a matriz; confirmar branch/HEAD; verificar CI; inspecionar dependências antes de editar. Não reabrir decisões já aprovadas sem evidência. O próximo ciclo de implementação começa após apresentação e validação deste checkpoint pelo Gus.

## Limites permanentes
Inventário ativo e Baú continuam adiados até a conclusão do Painel do Mestre. Não alterar `main`, não publicar e não tocar em produção sem autorização expressa.
