// Minimal service worker: makes the app installable and lets the shell load offline.
// Network-first for our own files (including pub tiles, so visited areas work offline); Overpass (cross-origin) is never touched or cached here.
const CACHE = "pubwhichway-v7";
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "lib.js",
  "overpass.js",
  "pubs.js",
  "facts.js",
  "wiki.js",
  "data/meta.json",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    // no-cache: always revalidate with the server (cheap via ETag) so deploys show up immediately,
    // instead of the browser's HTTP cache serving old files for GitHub Pages' 10-minute max-age.
    fetch(e.request.url, { cache: "no-cache" }) // by URL: navigate-mode Requests can't take an init
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
