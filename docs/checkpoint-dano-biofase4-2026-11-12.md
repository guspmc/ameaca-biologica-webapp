# Checkpoint — lembrete de Dano da 4ª Fase da Bio-Infecção

**Data:** 12/11/2026  
**Branch:** feat/offline-first-ficha  
**Arquivos de código:** src/CalculadoraTesteLocal.tsx; src/FichaLocal.tsx  
**Teste atualizado:** tests/ataques-calculadora.test.mjs  
**Base canônica:** Arquivo do Jogador v1.0, p. 90 (Fases da Bio-Infecção).

## 1. Achado da auditoria

A Ficha já calculava e exibia corretamente o bônus de +3 nos Testes de Ataque e o +1d4 de Dano Corpo a Corpo da 4ª Fase da BI no resumo de Bio-Infecção. O bônus de Ataque era repassado à calculadora. Entretanto, o bônus de Dano não era repassado à calculadora nem aparecia junto ao procedimento de cálculo manual de Dano.

A calculadora exige que dados adicionais sejam rolados/informados manualmente. Sua orientação anterior restringia o campo a dados de Peças, Habilidades e modos de disparo, sem mencionar a BI. Isso criava risco de omissão do +1d4 em Ataques Corpo a Corpo na 4ª Fase.

## 2. Regra oficial conferida

Arquivo do Jogador v1.0, p. 90:
- 3ª Fase: +2 em Testes de Ataque.
- 4ª Fase: mantém os benefícios anteriores, recebe +1 adicional em Testes de Ataque (total +3) e +1d4 de Dano Corpo a Corpo.
- 5ª Fase: perde os benefícios anteriores.

## 3. Correção mínima

### src/FichaLocal.tsx
- Passa `faseBi.danoCorpoACorpoAdicional` à calculadora de Ataques.

### src/CalculadoraTesteLocal.tsx
- Recebe a prop opcional `danoCorpoACorpoAdicionalBI`.
- Exibe lembrete contextual somente em Ataque Corpo a Corpo quando a Fase fornece Dano adicional.
- Instrui o jogador a rolar o dado adicional e incluir sua soma no campo de Dados adicionais.
- Explicita que não se aplica a Ataques à distância e que a calculadora não rola esse dado automaticamente.
- Não altera fórmula, não aplica Dano e não muda a multiplicação por Crítico; os dados adicionais informados continuam integrando o total conforme o cálculo já existente.

### tests/ataques-calculadora.test.mjs
- Adicionado teste estrutural para passagem da prop e apresentação do lembrete apenas no contexto de Ataque Corpo a Corpo.

## 4. Classificação

| Item | Estado |
|---|---|
| Fases/limites da BI | IMPLEMENTADOS; revisão estática consistente com p. 90 |
| Bônus de Ataque da 3ª/4ª Fase | IMPLEMENTADO E REPASSADO À CALCULADORA |
| +1d4 de Dano Corpo a Corpo na 4ª Fase | LEMBRETE DE INTEGRAÇÃO CORRIGIDO |
| Rolagem do +1d4 | MANUAL, conforme modo de dados e escopo da calculadora |
| Teste estrutural | ADICIONADO, NÃO EXECUTADO NESTA SESSÃO |
| Build | NÃO EXECUTADO NESTA SESSÃO |
| Validação humana | PENDENTE |

## 5. Roteiro dirigido de conferência

1. Com BI abaixo de 40%, confirmar Fases 1–2 sem bônus de Ataque/Dano.
2. Com BI entre 40% e menos de 60%, confirmar +2 em Testes de Ataque e nenhum +1d4.
3. Com BI entre 60% e menos de 80%, confirmar +3 total em Ataques e lembrete de +1d4 apenas em Ataques Corpo a Corpo.
4. Conferir que Ataques à distância não exibem o lembrete de +1d4.
5. Informar a soma do dado adicional no campo próprio e conferir que ela integra o Dano calculado e o Crítico conforme regra geral.
6. Com BI entre 80% e abaixo do máximo, confirmar perda dos bônus anteriores, Movimento -6 m e Desvantagem em Ataques/Testes.
7. Ao atingir BI Máxima, confirmar Colapso Viral, sem sexta fase.

## 6. Restrições

- Sem rolagem automática de Dano, alteração de PV ou aplicação de efeitos.
- Sem alteração de regras, CSS, layout, navegação, LAN, Supabase, banco, main, merge, deploy ou publicação.
- Inventário ativo permanece bloqueado até validação humana da Ficha Offline e aprovação expressa.
