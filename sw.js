/* Service worker: deixa o app abrir sem internet no tablet, com todas as falas gravadas. */
const CACHE = 'jardim-magico-v2';
const AUDIO = 'jardim-magico-audio';   // as falas não mudam (o nome do arquivo é o hash do texto)
const ARQUIVOS = [
  './', './index.html', './icone.svg', './manifest.webmanifest', './icones/icone-192.png', './icones/icone-512.png',
  './css/app.css', './js/util.js', './js/plantas.js', './js/atividades.js', './js/falas.js', './js/jogo.js',
  './js/traco.js', './js/telas.js', './js/pais.js', './js/app.js'
];

async function guardarFalas() {
  try {
    const indice = await (await fetch('./audio/indice.json', { cache: 'no-cache' })).json();
    const c = await caches.open(AUDIO);
    const ja = new Set((await c.keys()).map(r => new URL(r.url).pathname.split('/').pop()));
    const faltam = Object.keys(indice.clips).map(h => `${h}.${indice.formato || 'ogg'}`).filter(n => !ja.has(n));
    for (let i = 0; i < faltam.length; i += 20) await c.addAll(faltam.slice(i, i + 20).map(n => `./audio/voz/${n}`));
  } catch { /* sem internet agora: as falas entram no cache conforme forem tocadas */ }
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(guardarFalas).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // falas: cache primeiro (são imutáveis e assim tocam sem atraso)
  if (url.pathname.includes('/audio/voz/')) {
    e.respondWith(caches.open(AUDIO).then(c => c.match(e.request).then(r => r || fetch(e.request).then(resp => { if (resp.ok) c.put(e.request, resp.clone()); return resp; }))));
    return;
  }
  // resto: rede primeiro (pega atualizações), cache como rede de segurança — inclui a fonte do Google depois da 1ª visita
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); if (url.pathname.endsWith('/audio/indice.json')) guardarFalas(); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
