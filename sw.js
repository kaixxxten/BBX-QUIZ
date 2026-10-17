const CACHE_NAME = "bbx-quiz-ipad-1017-0d1c2299641e8be7";
const CACHE_PREFIX = "bbx-quiz-ipad-1017-";
const PRECACHE_URLS = ["./","./icons/apple-touch-icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./images/choices/queen-house-a.jpg","./images/choices/queen-house-b.jpg","./images/choices/zonamos-manor-a.jpg","./images/choices/zonamos-manor-a-v2.jpg","./images/choices/zonamos-manor-b.jpg","./images/choices/zonamos-manor-b-v2.jpg","./images/prompts/g-bit.jpg","./images/prompts/montblanc-sushi.jpg","./images/prompts/multi-superstar-form.jpg","./images/prompts/tropical-pizza-sushi.jpg","./images/README.txt","./images/zonamos-manor-a.jpg","./images/zonamos-manor-b.jpg","./index.html","./manifest.webmanifest","./offline-data.js","./questions/anime_easy.txt","./questions/anime_hard.txt","./questions/bey_easy.txt","./questions/bey_hard.txt","./settings/page_text.txt","./settings/staff.txt"];
const INDEX_URL = "./index.html";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(INDEX_URL, response.clone());
        }
        return response;
      } catch (error) {
        return (
          await caches.match(request, {ignoreSearch: true}) ||
          await caches.match(INDEX_URL) ||
          Response.error()
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, {ignoreSearch: true});
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});