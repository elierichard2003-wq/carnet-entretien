/* Carnet d'entretien : cache hors ligne. Changez VERSION à chaque mise à jour des fichiers. */
var VERSION = 'carnet-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var font = FONT_HOSTS.indexOf(url.hostname) !== -1;
  if (!sameOrigin && !font) return;
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: sameOrigin }).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      });
      if (hit) { fresh.catch(function () {}); return hit; }
      return fresh.catch(function () {
        if (req.mode === 'navigate') return cache.match('./index.html');
        return Response.error();
      });
    });
  }));
});
