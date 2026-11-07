import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ler = arquivo => readFile(new URL('../src/' + arquivo, import.meta.url), 'utf8');

test('editores da ficha preservam a montagem e sincronizam props externas após confirmação', async () => {
  const ficha = await ler('FichaLocal.tsx');
  const casos = [
    ['EditorCaracteristicasLocal', 'EditorCaracteristicasLocal.tsx'],
    ['IdentidadeLocal', 'IdentidadeLocal.tsx'],
    ['EditorAtributosPericiasLocal', 'EditorAtributosPericiasLocal.tsx'],
    ['EditorInventarioLocal', 'EditorInventarioLocal.tsx'],
    ['FuncionamentoFichaLocal', 'FuncionamentoFichaLocal.tsx'],
    ['RecursosFichaLocal', 'RecursosFichaLocal.tsx'],
    ['PainelAcoesLocal', 'PainelAcoesLocal.tsx'],
  ];
  for (const [componente, arquivo] of casos) {
    const tag = ficha.match(new RegExp('<' + componente + '\\b[\\s\\S]*?\\/>'))?.[0] ?? '';
    assert.ok(tag, componente + ': deve estar integrado à ficha');
    assert.doesNotMatch(tag, /\\bkey=/, componente + ': não deve remontar após salvar');
    const fonte = await ler(arquivo);
    assert.match(fonte, /useEffect/, arquivo + ': deve sincronizar dados externos');
    assert.match(fonte, /sujo/, arquivo + ': deve preservar estado de edição');
  }
});
