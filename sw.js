// Offline copy of the page, so it opens on the phone next to the console without a connection.
// The page itself is fetched network-first (a new deploy shows up on the next load); everything
// else is served from the cache and refreshed in the background. BUILD is stamped by the deploy
// workflow, so each deploy gets a fresh cache.

const BUILD = '__BUILD__';
const CACHE = `fe3h-crimson-${BUILD}`;
const FONTS = 'fe3h-crimson-fonts';

// Everyone with a portrait: the units and the instructors.
const PORTRAITS = [
  'alois', 'anna', 'annette', 'balthus', 'bernadetta', 'byleth', 'catherine', 'constance', 'dorothea',
  'edelgard', 'flayn', 'gilbert', 'hanneman', 'hapi', 'ingrid', 'jeralt', 'leonie', 'lorenz', 'lysithea',
  'manuela', 'marianne', 'mercedes', 'petra', 'rhea', 'seteth', 'shamir', 'yuri',
];

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-512.png',
  'css/styles.css',
  'js/main.js',
  'js/html.js',
  'js/logic.js',
  'js/seal.js',
  'js/store.js',
  'js/summary.js',
  'js/sync.js',
  'js/controls/place.js',
  'js/controls/select.js',
  'js/controls/tooltip.js',
  'js/controls/dialog.js',
  'js/views/ui.js',
  'js/views/painel.js',
  'js/views/atualizar.js',
  'js/views/esquadrao.js',
  'js/views/unidade.js',
  'js/views/recrutamento.js',
  'js/views/capitulos.js',
  'js/views/paralogues.js',
  'js/views/classes.js',
  'js/views/mosteiro.js',
  'js/views/dados.js',
  'js/views/builds.js',
  'data/builds.js',
  'data/chapters.js',
  'data/classes.js',
  'data/faculty.js',
  'data/paralogues.js',
  'data/accessories.js',
  'data/skills.js',
  'data/snapshot.js',
  'data/social.js',
  'data/tea-gists.js',
  'data/units.js',
  ...PORTRAITS.map((id) => `img/portraits/${id}.webp`),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match('index.html'));
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // The save in the cloud is always fetched fresh.
  if (url.pathname.includes('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS));
  }
});
