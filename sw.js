// Official Offline-First PWA Service Worker for PG Soft Mahjong Ways
const CACHE_NAME = 'pgsoft-mahjong-ways-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/audio.js',
  './js/tiles.js',
  './js/game.js',
  './js/pin.js',
  './assets/sprites/pwa_icon_192.png',
  './assets/sprites/pwa_icon_512.png',
  './assets/pg_native/images/e68edb8f51.e78d1.jpg',
  './assets/pg_native/images/atlas_0_732x108.png',
  './assets/pg_native/images/atlas_13_756x1051.png',
  './assets/pg_native/images/atlas_57_253x141.png',
  './assets/pg_native/audio/707e06bc-e0fd-413c-8403-7ea54c9d9252.930a4.mp3',
  './assets/pg_native/audio/b83a99d7-a5a6-4774-8747-9679a8750e7a.55d20.mp3',
  './assets/pg_native/audio/9193cc0d-d1f3-4c76-aa9d-f53fb2f51a03.75ac5.mp3',
  './assets/pg_native/audio/519e1ff4-3fb5-40b1-b764-b5fbca4abe3d.7b3e7.mp3',
  './assets/pg_native/audio/5c79dd63-e19c-491c-8fa1-91ecd1fd71e1.e1ae4.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Cache-First strategy for images/audio/sprites, Network-First with cache fallback for HTML/JS/CSS
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isMediaAsset =
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.mp3');

  if (isMediaAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        });
      })
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

