import {test} from 'node:test';import assert from 'node:assert/strict';
import {hostLocal,caminhoPermitido} from '../scripts/servir-previa-celular.mjs';
const m={entrada:'tests/ui/celular.html',arquivos:{'tests/ui/celular.html':'hash','assets/exemplo.js':'hash'}};
test('previa celular: somente arquivos explicitamente empacotados podem ser resolvidos',()=>{
 assert.equal(caminhoPermitido('/',m),m.entrada);assert.equal(caminhoPermitido('/assets/exemplo.js?v=1',m),'assets/exemplo.js');
 for(const u of ['/.env','/src/conexao.ts','/site-manifest.json','/tests/ui/','/../.env','/%2e%2e/.env','/assets%5cexemplo.js','/%zz','/assets/exemplo.js%00'])assert.equal(caminhoPermitido(u,m),null);
});
test('previa celular: escuta restrita a IPv4 privado ou loopback, sem wildcard ou endereço público',()=>{
 for(const h of ['127.0.0.1','192.168.1.14','10.0.0.2','172.16.1.2','172.31.1.2'])assert.equal(hostLocal(h),true);
 for(const h of ['0.0.0.0','::','8.8.8.8','172.32.0.1','example.com'])assert.equal(hostLocal(h),false);
});
