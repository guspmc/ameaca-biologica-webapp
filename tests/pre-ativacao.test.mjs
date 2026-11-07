import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const files=['origens','habilidades','pericias','equipamento','textoPersonagem','comprasIniciais','conferenciaCriacao','funcionamentoFicha','inventarioCriacao','preAtivacao'];
const source=(await Promise.all(files.map(f=>readFile(new URL('../src/'+f+'.ts',import.meta.url),'utf8')))).map(s=>s.replace(/^import .*;\r?$/gm,'')).join('\n');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {avaliarPreAtivacao:avaliar,configuracaoInicial}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
function fixture(){
 const configuracao_funcionamento=configuracaoInicial();
 configuracao_funcionamento.preferenciasMisto.biInfectante=false;
 configuracao_funcionamento.preferenciasMisto.durabilidadeAparar=true;
 const f={jogador_id:'autoria',estado_ficha:'rascunho',nome:'Sobrevivente ficticio',classe:'Operador',nivel:1,
  forca:3,agilidade:1,vigor:3,astucia:0,origem:'Investigador',pericia_origem_treinada:'Investigação',
  pericia_origem_extra:null,pontos_pericia_classe:{Atletismo:1,Luta:2},habilidade_basica:'parrudo',
  equipamento_inicial:'B',compras_iniciais:{},revisao_compras:0,revisao_funcionamento:2,
  configuracao_funcionamento,pv_maximo:20,sa_maximo:1,bi_maximo:9,defesa:11,pv_atual:4,bi_atual:5};
 const c={usuarioId:'autoria',papel:'jogador',admitido:true,mesaPermiteCriacao:true,metodoAtual:'padrao',
  nivelInicialAtual:1,contextoRevisado:{metodo:'padrao',nivelInicial:1},quantidadeJogadores:10,
  quantidadeAtivas:9,revisoesEsperadas:{compras:0,funcionamento:2}};
 return {f,c};
}
const tem=(r,codigo)=>r.impedimentos.some(i=>i.codigo===codigo);

test('pre-ativacao: nona ativa permite preparar decima, sem alterar ficha ou restaurar recursos',()=>{
 const {f,c}=fixture(),antes=structuredClone({f,c});
 const r=avaliar(f,c);assert.equal(r.precondicoesLocaisAtendidas,true);assert.deepEqual(r.impedimentos,[]);
 assert.deepEqual({f,c},antes);assert.equal(f.estado_ficha,'rascunho');assert.equal(f.pv_atual,4);assert.equal(f.bi_atual,5);
 // Nao existe teto de uma ativa por autoria; somente a contagem coletiva importa.
 assert.equal(avaliar(f,{...c,quantidadeAtivas:2}).precondicoesLocaisAtendidas,true);
 assert.ok(tem(avaliar(f,{...c,quantidadeAtivas:10}),'ativas'));
 assert.ok(tem(avaliar(f,{...c,quantidadeJogadores:11}),'jogadores'));
 for(const n of [-1,0.5,NaN,Infinity,'9'])assert.ok(tem(avaliar(f,{...c,quantidadeAtivas:n}),'contagem'));
});

test('pre-ativacao: autoria admitida e papel de jogador sao obrigatorios antes da conferencia',()=>{
 const {f,c}=fixture();
 for(const patch of [{usuarioId:null},{usuarioId:'outra'},{papel:'mestre'},{papel:null},{admitido:false}]){
  const r=avaliar(f,{...c,...patch});assert.equal(r.precondicoesLocaisAtendidas,false);
  assert.deepEqual(r.impedimentos.map(i=>i.codigo),['acesso']);
 }
 assert.ok(tem(avaliar({...f,estado_ficha:'completa'},c),'estado'));
 assert.ok(tem(avaliar(f,{...c,mesaPermiteCriacao:false}),'mesa'));
});

test('pre-ativacao: metodo, nivel e revisoes alterados recusam sem apagar escolhas',()=>{
 const {f,c}=fixture(),antes=structuredClone(f);
 const casa={...c,metodoAtual:'casa'};
 assert.ok(tem(avaliar(f,casa),'escopo'));assert.ok(tem(avaliar(f,casa),'contexto_alterado'));
 assert.ok(tem(avaliar(f,{...c,nivelInicialAtual:2}),'escopo'));
 assert.ok(tem(avaliar({...f,nivel:2},c),'escopo'));
 for(const patch of [{revisao_compras:1},{revisao_funcionamento:3},{revisao_compras:-1},{revisao_funcionamento:NaN}])
  assert.ok(tem(avaliar({...f,...patch},c),'revisao'));
 assert.ok(tem(avaliar(f,{...c,revisoesEsperadas:{compras:0,funcionamento:1}}),'revisao'));
 assert.deepEqual(f,antes);
});

test('pre-ativacao: nenhuma confianca em status do cliente; escolhas parciais ou derivados errados impedem',()=>{
 const {f,c}=fixture();
 for(const patch of [{pontos_pericia_classe:{Luta:1}},{habilidade_basica:null},{origem:null},
  {pontos_pericia_classe:{Vontade:2,Luta:1}},{pv_maximo:999},{forca:0,astucia:0},{nome:'X'}]){
  const r=avaliar({...f,...patch,conferido:true},c);
  assert.equal(r.precondicoesLocaisAtendidas,false);assert.ok(tem(r,'criacao'));
 }
 assert.ok(tem(avaliar({...f,pontos_pericia_classe:null, nome:null},c),'dados_criacao'));
 assert.ok(tem(avaliar({...f,equipamento_inicial:'C',compras_iniciais:{faca:4}},c),'inventario'));
 assert.ok(tem(avaliar({...f,compras_iniciais:{faca:1}},c),'inventario'));
});

test('pre-ativacao: Misto indefinido nao ganha padrao; Manual e Automatico preservam preferencias inativas',()=>{
 const {f,c}=fixture(),config=configuracaoInicial(),antes=structuredClone(config);
 assert.ok(tem(avaliar({...f,configuracao_funcionamento:config},c),'opcoes_misto'));
 assert.deepEqual(config,antes);
 for(const modo of ['manual','automatico']){
  const configuracao_funcionamento={...config,modo};
  assert.equal(avaliar({...f,configuracao_funcionamento},c).precondicoesLocaisAtendidas,true);
  assert.equal(configuracao_funcionamento.preferenciasMisto.biInfectante,null);
 }
 for(const configRuim of [null,[],{}, {...config,extra:true},{...config,modo:'inventado'},
  {...config,preferenciasMisto:{...config.preferenciasMisto,municao:null}},
  {...config,preferenciasMisto:{...config.preferenciasMisto,biInfectante:'sim'}},
  {...config,preferenciasMisto:{...config.preferenciasMisto,intrusa:false}}])
  assert.ok(tem(avaliar({...f,configuracao_funcionamento:configRuim},c),'configuracao'));
});

test('pre-ativacao: plano salvo com compras e saldo tem conferencia propria, sem reliberacao retroativa',()=>{
 const {f,c}=fixture();
 const comprada={...f,equipamento_inicial:'C',compras_iniciais:{faca:1},revisao_compras:1};
 const contexto={...c,revisoesEsperadas:{compras:1,funcionamento:2}};
 assert.equal(avaliar(comprada,contexto).precondicoesLocaisAtendidas,true);
 assert.ok(tem(avaliar({...comprada,revisao_compras:0},{...contexto,revisoesEsperadas:{compras:0,funcionamento:2}}),'criacao'));
 // Sem consulta a disponibilidade nesta preparacao: bloqueio posterior nao retira compra salva.
 assert.equal(comprada.compras_iniciais.faca,1);
});
