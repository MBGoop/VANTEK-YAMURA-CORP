/* GRIT — sw.js
   Strategie:
   - SHELL (html/css/js/icons): cache-first. De app opent instant, ook zonder net.
   - DATA (/data/*): network-first met cache als fallback. Zo zie je een
     bijgewerkte exercises.csv meteen, maar blijft de app offline werken.
   Verhoog CACHE bij elke release, anders blijven oude bestanden hangen. */
const CACHE = 'grit-v5.1.2';

const SHELL = [
  './', './index.html',
  './css/app.css',
  './js/data.js', './js/core.js', './js/storage.js', './js/creature.js',
  './js/planner.js', './js/ui.js', './js/train.js', './js/timer.js',
  './js/hr.js', './js/race.js', './js/review.js', './js/views.js', './js/pwa.js', './js/boot.js',
  './data/exercises.csv', './data/plan.csv', './data/defaults.json', './data/creature.json',
  './data/daytypes.json', './data/gamification.json', './data/formats.json',
  './data/benchmark.json', './data/session-types.json',
  './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const isData = new URL(req.url).pathname.includes('/data/');

  if(isData){
    // network-first: verse content, cache als vangnet
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // cache-first voor de shell
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if(res && res.status === 200 && req.url.startsWith('http')){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
