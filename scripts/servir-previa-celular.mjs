import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative,isAbsolute,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isIP} from 'node:net';

export function hostLocal(host){return isIP(host)===4&&(host==='127.0.0.1'||/^10\./.test(host)||/^192\.168\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host));}
export function caminhoPermitido(url,manifesto){
 let p;try{p=decodeURIComponent(url.split('?')[0]);}catch{return null;}
 if(p==='/')return manifesto.entrada;
 if(!p.startsWith('/')||p.includes('..')||p.includes('\\')||p.includes('\0'))return null;
 p=p.slice(1);return Object.hasOwn(manifesto.arquivos,p)?p:null;
}
export async function criarServidor({diretorio,host,porta}){
 if(!hostLocal(host)||!Number.isInteger(porta)||porta<1024||porta>65535)throw Error('Use IPv4 privado ou loopback e porta entre 1024 e 65535.');
 const raiz=await realpath(diretorio),manifesto=JSON.parse(await readFile(resolve(raiz,'site-manifest.json'),'utf8'));
 if(manifesto.tipo!=='qa-celular-v1'||manifesto.entrada!=='tests/ui/celular.html'||!manifesto.arquivos||typeof manifesto.arquivos!=='object')throw Error('Pacote fictício inválido.');
 const tipos={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
 const servidor=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const nome=caminhoPermitido(req.url??'/',manifesto);if(!nome||!tipos[extname(nome)]){res.writeHead(404);res.end('Não encontrado.');return;}
  try{
   const alvo=await realpath(resolve(raiz,nome)),rel=relative(raiz,alvo);if(rel.startsWith('..')||isAbsolute(rel))throw Error();
   const bytes=await readFile(alvo);if(createHash('sha256').update(bytes).digest('hex')!==manifesto.arquivos[nome])throw Error();
   res.writeHead(200,{'Content-Type':tipos[extname(nome)]});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Não encontrado.');}
 });
 await new Promise((ok,no)=>{servidor.once('error',no);servidor.listen(porta,host,ok);});return servidor;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [diretorio,host='127.0.0.1',p='4175']=process.argv.slice(2);if(!diretorio)throw Error('Informe a pasta estática preparada.');
 const servidor=await criarServidor({diretorio,host,porta:Number(p)});console.log(`Prévia fictícia disponível em http://${host}:${p}/ — Ctrl+C encerra. Sem alteração de firewall.`);
 for(const sinal of ['SIGINT','SIGTERM'])process.on(sinal,()=>servidor.close(()=>process.exit(0)));
}
