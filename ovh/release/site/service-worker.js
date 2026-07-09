const CACHE_NAME = "linktalk-v3";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./app-enhancements.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./config.js"
];
const EXTERNAL_ASSETS = [
  "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.0/+esm"
];

function appScopePath() {
  const pathname = new URL(self.registration.scope).pathname;
  if (!pathname || pathname === "/") return "";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function scopedAssetPath(asset) {
  const scope = appScopePath();
  const trimmed = asset.replace(/^\.\//, "");
  if (!trimmed) return scope || "/";
  return `${scope}/${trimmed}`.replace(/\/{2,}/g, "/");
}

const APP_SHELL_PATHS = new Set(APP_ASSETS.map(scopedAssetPath));

async function cacheStaticAssets() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_ASSETS);
  await Promise.allSettled(
    EXTERNAL_ASSETS.map(async (assetUrl) => {
      const response = await fetch(assetUrl, { mode: "cors", cache: "reload" });
      await cache.put(assetUrl, response);
    })
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(cacheStaticAssets());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.url.endsWith("/config.js") || event.request.url.includes("config.js")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request, { cache: "no-store" });
        await cache.put(event.request, response.clone());
        return response;
      } catch {
        return caches.match(event.request) || cache.match("./config.js");
      }
    })());
    return;
  }
  if (url.pathname.endsWith("/app.js")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: "no-store" });
        const text = await response.text();
        const patched = new Response(`${text}\nimport("./app-enhancements.js").catch(() => {});\n`, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8"
          }
        });
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, patched.clone());
        return patched;
      } catch (error) {
        return caches.match(event.request) || fetch(event.request);
      }
    })());
    return;
  }
  if (EXTERNAL_ASSETS.includes(event.request.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request, { cache: "reload" });
        await cache.put(event.request, response.clone());
        return response;
      } catch {
        return caches.match(event.request);
      }
    })());
    return;
  }
  if (event.request.mode === "navigate" || (url.origin === self.location.origin && APP_SHELL_PATHS.has(url.pathname))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
