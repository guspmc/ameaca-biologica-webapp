import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const workerSource=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
const mainSource=await readFile(new URL('../src/main.tsx',import.meta.url),'utf8');
const viteSource=await readFile(new URL('../vite.config.ts',import.meta.url),'utf8');

function criarWorker(){
 const scope='https://example.test/ameaca-biologica-webapp/';
 const index=new URL('index.html',scope).href;
 const root=scope;
 const html='<html><head><link rel="stylesheet" href="/ameaca-biologica-webapp/assets/app.css"></head><body><script type="module" src="/ameaca-biologica-webapp/assets/app.js"></script></body></html>';
 const eventos=new Map();
 const dados=new Map();
 const chamadas=[];
 let offline=false;
 const chave=x=>typeof x==='string'?x:(x?.url??String(x));
 const caches={
  async open(nome){
   if(!dados.has(nome))dados.set(nome,new Map());
   const mapa=dados.get(nome);
   return {
    async put(k,v){mapa.set(chave(k),v.clone());},
    async match(k){const v=mapa.get(chave(k));return v?.clone();},
   };
  },
  async keys(){return [...dados.keys()];},
  async delete(nome){return dados.delete(nome);},
 };
 async function fetchFalso(input){
  const url=chave(input);chamadas.push(url);
  if(offline)throw new TypeError('offline');
  if(url===index||url===root)return new Response(html,{headers:{'content-type':'text/html'}});
  if(url.endsWith('.js'))return new Response('console.log("shell");',{headers:{'content-type':'text/javascript'}});
  if(url.endsWith('.css'))return new Response('body{}',{headers:{'content-type':'text/css'}});
  if(url.endsWith('.webmanifest'))return new Response('{}',{headers:{'content-type':'application/manifest+json'}});
  if(url.endsWith('.svg'))return new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}});
  return new Response('asset');
 }
 const self={
  location:new URL(scope),
  registration:{scope},
  clients:{async claim(){}},
  async skipWaiting(){},
  addEventListener(tipo,callback){eventos.set(tipo,callback);},
 };
 vm.runInNewContext(workerSource,{self,caches,fetch:fetchFalso,URL,Response,Promise});
 return {eventos,caches,scope,index,root,html,ponOffline(){offline=true;},chamadas,dados};
}

test('service worker pré-cacheia shell e assets locais sem depender de uma segunda visita',async()=>{
 const w=criarWorker();
 let instalacao;
 w.eventos.get('install')({waitUntil(p){instalacao=p;}});
 await instalacao;
 const cache=await w.caches.open('ameaca-biologica-shell-v1');
 assert.equal((await cache.match(w.root)).status,200);
 assert.equal((await cache.match(w.index)).status,200);
 assert.ok(await cache.match(new URL('assets/app.js',w.scope).href));
 assert.ok(await cache.match(new URL('assets/app.css',w.scope).href));
 assert.ok(await cache.match(new URL('manifest.webmanifest',w.scope).href));
 assert.ok(await cache.match(new URL('icon.svg',w.scope).href));
});

test('service worker nunca intercepta nem armazena requisições cross-origin do Supabase',async()=>{
 const w=criarWorker();
 let instalacao;w.eventos.get('install')({waitUntil(p){instalacao=p;}});await instalacao;
 const antes=w.chamadas.length;
 let interceptada=false;
 w.eventos.get('fetch')({
  request:{url:'https://projeto.supabase.co/rest/v1/personagens',method:'GET',mode:'cors'},
  respondWith(){interceptada=true;},
 });
 assert.equal(interceptada,false);
 assert.equal(w.chamadas.length,antes);
});

test('navegação offline retorna o shell guardado',async()=>{
 const w=criarWorker();
 let instalacao;w.eventos.get('install')({waitUntil(p){instalacao=p;}});await instalacao;
 w.ponOffline();
 let resposta;
 w.eventos.get('fetch')({
  request:{url:w.root,method:'GET',mode:'navigate'},
  respondWith(p){resposta=p;},
 });
 assert.ok(resposta);
 assert.match(await (await resposta).text(),/<html>/);
});

test('assets versionados continuam disponíveis offline após instalação',async()=>{
 const w=criarWorker();
 let instalacao;w.eventos.get('install')({waitUntil(p){instalacao=p;}});await instalacao;
 w.ponOffline();
 const antes=w.chamadas.length;
 let resposta;
 w.eventos.get('fetch')({
  request:{url:new URL('assets/app.js',w.scope).href,method:'GET',mode:'cors'},
  respondWith(p){resposta=p;},
 });
 assert.ok(resposta);
 assert.match(await (await resposta).text(),/shell/);
 assert.equal(w.chamadas.length,antes);
});

test('registro do service worker respeita base do GitHub Pages e não ativa no modo teste/dev',()=>{
 assert.match(mainSource,/import\.meta\.env\.PROD/);
 assert.match(mainSource,/import\.meta\.env\.MODE === 'teste'/);
 assert.match(mainSource,/navigator\.serviceWorker\.register/);
 assert.match(mainSource,/\$\{import\.meta\.env\.BASE_URL\}sw\.js/);
 assert.match(viteSource,/base: '\/ameaca-biologica-webapp\/'/);
});
