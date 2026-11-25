/* Offline support: exhibition halls often have poor Wi-Fi.
   Bump VERSION whenever any file below changes so visitors get the update. */
const VERSION = "v7";
const CACHE = `two-cells-${VERSION}`;
const CORE = [
  "./",
  "index.html",
  "present.html",
  "assets/css/present.css",
  "assets/js/present.js",
  "assets/css/site.css",
  "assets/js/main.js",
  "assets/js/vendor/qrcode.min.js",
  "assets/fonts/two-cells-sans.woff2",
  "favicon.svg",
  "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("two-cells-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith(".zip")) return;
  if (req.mode === "navigate") {
    // Pages: network first so edits show up, cache as fallback.
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
    return;
  }
  // Assets: cache first, then network (and keep a copy, e.g. poster images once viewed).
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
