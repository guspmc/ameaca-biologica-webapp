/* Ameaça Biológica — cache somente do shell estático.
 * Nunca armazena respostas da API/Supabase nem dados de personagem.
 */
const CACHE_NAME = 'ameaca-biologica-shell-v1';

function urlsDoEscopo() {
  const base = self.registration.scope;
  return {
    root: new URL('./', base).href,
    index: new URL('./index.html', base).href,
    manifest: new URL('./manifest.webmanifest', base).href,
    icon: new URL('./icon.svg', base).href,
  };
}

async function guardarShell(cache) {
  const urls = urlsDoEscopo();
  let resposta;
  try {
    resposta = await fetch(urls.index, { cache: 'reload' });
  } catch {
    resposta = await fetch(urls.root, { cache: 'reload' });
  }
  if (!resposta.ok) throw new Error('Shell indisponível para cache.');
  await cache.put(urls.root, resposta.clone());
  await cache.put(urls.index, resposta.clone());

  const html = await resposta.clone().text();
  const referencias = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|svg|webmanifest)(?:\?[^"']*)?)["']/g)]
    .map((match) => new URL(match[1], urls.root).href);
  const estaticos = [...new Set([...referencias, urls.manifest, urls.icon])];
  await Promise.all(estaticos.map(async (url) => {
    const recurso = new URL(url);
    if (recurso.origin !== self.location.origin || !url.startsWith(self.registration.scope)) return;
    try {
      const respostaRecurso = await fetch(url, { cache: 'reload' });
      if (respostaRecurso.ok && respostaRecurso.type !== 'opaque') {
        await cache.put(url, respostaRecurso.clone());
      }
    } catch {
      // O shell principal pode ser instalado mesmo se um recurso opcional falhar.
    }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await guardarShell(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const chaves = await caches.keys();
    await Promise.all(chaves
      .filter((chave) => chave.startsWith('ameaca-biologica-shell-') && chave !== CACHE_NAME)
      .map((chave) => caches.delete(chave)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const pedido = event.request;
  if (pedido.method !== 'GET') return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;
  if (!url.href.startsWith(self.registration.scope)) return;

  const urls = urlsDoEscopo();
  if (pedido.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const resposta = await fetch(pedido);
        if (resposta.ok && resposta.type !== 'opaque') {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(urls.root, resposta.clone());
          await cache.put(urls.index, resposta.clone());
        }
        return resposta;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(pedido))
          || (await cache.match(urls.index))
          || (await cache.match(urls.root))
          || Response.error();
      }
    })());
    return;
  }

  const estatico = url.pathname.includes('/assets/')
    || url.pathname.endsWith('/manifest.webmanifest')
    || url.pathname.endsWith('/icon.svg');
  if (!estatico) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const guardado = await cache.match(pedido);
    if (guardado) return guardado;
    try {
      const resposta = await fetch(pedido);
      if (resposta.ok && resposta.type !== 'opaque') await cache.put(pedido, resposta.clone());
      return resposta;
    } catch {
      return guardado || Response.error();
    }
  })());
});
