const CACHE_NAME = "flashcard-20260907234747";
const ASSET_LIST = "./offline-assets.json";

self.addEventListener("install", event => {
  event.waitUntil(
    fetch(ASSET_LIST, {cache: "no-store"})
      .then(r => {
        if (!r.ok) throw new Error("offline-assets.json indisponible");
        return r.json();
      })
      .then(urls => caches.open(CACHE_NAME).then(cache => cache.addAll(urls)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
