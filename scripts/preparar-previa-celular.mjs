import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const destino=resolve(raiz,'../output/previa-celular');
const entradas=['celular','compras','contexto','fluxo','ativacao','resumo'].map(n=>resolve(raiz,`tests/ui/${n}.html`));
// Entrada fechada: nenhuma aplicação conectada, SDK, pasta pública ou .env exposta.
const resultado=await build({configFile:false,root:raiz,base:'/',mode:'qa-celular',envPrefix:'QA_CELULAR_',publicDir:false,plugins:[react(),{
 name:'qa-sem-conexao',generateBundle(_op,bundle){
  for(const item of Object.values(bundle))if(item.type==='chunk')for(const id of Object.keys(item.modules)){
   const p=id.replaceAll('\\','/');if(/\/src\/(conexao|App|main)\.tsx?$|\/node_modules\/@supabase\//.test(p))throw Error('Módulo conectado não permitido na prévia.');
  }
 }
}],build:{write:false,sourcemap:false,rollupOptions:{input:entradas},outDir:destino}});
const arquivos={};
for(const item of (Array.isArray(resultado)?resultado:[resultado]).flatMap(r=>r.output)){
 const nome=item.fileName;if(nome.includes('..')||nome.startsWith('/')||!/^[-a-zA-Z0-9_./]+\.(html|js|css)$/.test(nome))throw Error('Saída inesperada.');
 const conteudo=item.type==='chunk'?item.code:item.source;const bytes=typeof conteudo==='string'?Buffer.from(conteudo):Buffer.from(conteudo);
 await mkdir(dirname(resolve(destino,nome)),{recursive:true});await writeFile(resolve(destino,nome),bytes);arquivos[nome]=createHash('sha256').update(bytes).digest('hex');
}
await writeFile(resolve(destino,'site-manifest.json'),JSON.stringify({tipo:'qa-celular-v1',entrada:'tests/ui/celular.html',arquivos},null,2)+'\n');
console.log('Prévia fictícia preparada: '+destino+' ('+Object.keys(arquivos).length+' arquivos).');
