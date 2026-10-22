// Official Offline-First PWA Service Worker for PG Soft Mahjong Ways
const CACHE_NAME = 'pgsoft-mahjong-ways-v8';

// Semua sprite di assets/sprites/. Tambahkan nama file baru di sini bila ada sprite baru.
const SPRITES = [
  '1024ways.png', 'auto_spin.png', 'autospin_arrow_white.png', 'autospin_circle_white.png',
  'bet_options.png', 'bonus_bottom_a.png', 'bonus_button.png', 'bonus_top_a.png', 'bonus_top_b.png',
  'btn_collect_text.png', 'btn_start_text.png', 'button_minus.png', 'button_plus.png',
  'feature_loading.png', 'freespin_won.png',
  'h_char_8.png', 'h_char_8_blur.png', 'h_green.png', 'h_green_blur.png',
  'h_red.png', 'h_red_blur.png', 'h_white.png', 'h_white_blur.png',
  'info0.png', 'info1.png', 'info2.png', 'info3.png', 'info4.png', 'info5.png',
  'infoboard_a.png', 'infoboard_b.png', 'infoboard_c.png',
  'l_ball_2.png', 'l_ball_2_blur.png', 'l_ball_5.png', 'l_ball_5_blur.png',
  'l_bamboo_2.png', 'l_bamboo_2_blur.png', 'l_bamboo_5.png', 'l_bamboo_5_blur.png',
  'main_bottom_a.png', 'main_bottom_b.png', 'main_top_a.png', 'main_top_b.png', 'main_top_c.png',
  'menu_center_white.png',
  'mul_active_x1.png', 'mul_active_x2.png', 'mul_active_x3.png', 'mul_active_x4.png',
  'mul_active_x5.png', 'mul_active_x6.png', 'mul_active_x10.png',
  'mul_inactive_x1.png', 'mul_inactive_x2.png', 'mul_inactive_x2_b.png', 'mul_inactive_x3.png',
  'mul_inactive_x4.png', 'mul_inactive_x5.png', 'mul_inactive_x6.png', 'mul_inactive_x10.png',
  'pwa_icon_192.png', 'pwa_icon_512.png', 'reel_a.png',
  's_scatter.png', 's_scatter_blur.png', 's_wild.png', 's_wild_blur.png',
  'scatter_bg.png', 'shield_pg.png',
  'spin_arrow.png', 'spin_arrow_blur.png', 'spin_arrow_grey.png', 'spin_base.png',
  'symbol_base_gold.png', 'symbol_base_gold_blur.png', 'symbol_base_gold_ingot.png',
  'symbol_base_ingot.png', 'symbol_base_ingot_blur.png',
  'symbol_base_white.png', 'symbol_base_white_blur.png',
  'title_bw.png', 'title_mw.png', 'title_smw.png', 'totalwin_info.png', 'totalwin_title.png',
  'turbo_off.png', 'turbo_on.png', 'win_icon.png', 'win_info.png', 'win_shape.png'
].map(name => './assets/sprites/' + name);

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Harus sama persis dengan href di index.html (termasuk ?v=), kalau tidak entri ini tidak akan cocok.
  './css/style.css?v=1.4',
  './js/audio.js',
  './js/tiles.js',
  './js/game.js',
  './js/pin.js',
  ...SPRITES,
  './assets/pg_native/images/e68edb8f51.e78d1.jpg',
  './assets/pg_native/images/atlas_0_732x108.png',
  './assets/pg_native/images/atlas_13_756x1051.png',
  './assets/pg_native/images/atlas_57_253x141.png',
  './assets/pg_native/audio/707e06bc-e0fd-413c-8403-7ea54c9d9252.930a4.mp3',
  './assets/pg_native/audio/b83a99d7-a5a6-4774-8747-9679a8750e7a.55d20.mp3',
  './assets/pg_native/audio/671c5bc3-bbee-4aa1-b8dc-d32047af93f1.6dc1c.mp3',
  './assets/pg_native/audio/35f37ba4-b805-4315-b9cd-37491e61ee25.54563.mp3',
  './assets/pg_native/audio/aef67769-4c48-42ea-b7cc-df63b14b6d8f.7dba1.mp3',
  './assets/pg_native/audio/23f287acf3.0427e.mp3'
];

// Hanya respons penuh (200) yang boleh disimpan; 206 (Range) akan membuat cache.put gagal.
function cacheIfOk(request, resp) {
  if (resp && resp.status === 200) {
    const clone = resp.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
  }
  return resp;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // Satu per satu: satu file gagal tidak membatalkan seluruh pra-cache seperti addAll.
      Promise.allSettled(CORE_ASSETS.map(url => cache.add(url)))
    )
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
        return fetch(event.request).then(resp => cacheIfOk(event.request, resp));
      })
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then(resp => cacheIfOk(event.request, resp))
        .catch(() => caches.match(event.request))
    );
  }
});
