const CACHE_NAME = "quizit-pwa-cache-v1";
const PRECACHE_RESOURCES = [
  // HTML
  "/",
  "/index.html",
  "/about/index.html",

  // CSS
  "/style.css",
  "/about/style.css",
  "/utils/css/root.css",
  "/utils/css/scrollbar.css",

  // JS
  "/about/script.js",
  "/scripts/fileSystem.js",
  "/scripts/jsonParse.js",
  "/scripts/main.js",
  "/scripts/popup.js",
  "/scripts/state.js",
  "/scripts/theme.js",
  "/scripts/ui.js",
  "/scripts/sw-register.js",

  // Manifest and icons
  "/site.webmanifest",
  "/assets/icons/icons.json",

  // Fonts
  "/assets/fonts/Atkinson/Atkinson.ttf",
  "/assets/fonts/Courier/Courier.ttf",
  "/assets/fonts/Inter/Inter.ttf",

  // Icons - Android
  "/assets/icons/android/android-launchericon-48-48.png",
  "/assets/icons/android/android-launchericon-72-72.png",
  "/assets/icons/android/android-launchericon-96-96.png",
  "/assets/icons/android/android-launchericon-144-144.png",
  "/assets/icons/android/android-launchericon-192-192.png",
  "/assets/icons/android/android-launchericon-512-512.png",

  // Icons - iOS
  "/assets/icons/ios/16.png",
  "/assets/icons/ios/20.png",
  "/assets/icons/ios/29.png",
  "/assets/icons/ios/32.png",
  "/assets/icons/ios/40.png",
  "/assets/icons/ios/50.png",
  "/assets/icons/ios/57.png",
  "/assets/icons/ios/58.png",
  "/assets/icons/ios/60.png",
  "/assets/icons/ios/64.png",
  "/assets/icons/ios/72.png",
  "/assets/icons/ios/76.png",
  "/assets/icons/ios/80.png",
  "/assets/icons/ios/87.png",
  "/assets/icons/ios/100.png",
  "/assets/icons/ios/114.png",
  "/assets/icons/ios/120.png",
  "/assets/icons/ios/128.png",
  "/assets/icons/ios/144.png",
  "/assets/icons/ios/152.png",
  "/assets/icons/ios/167.png",
  "/assets/icons/ios/180.png",
  "/assets/icons/ios/192.png",
  "/assets/icons/ios/256.png",
  "/assets/icons/ios/512.png",
  "/assets/icons/ios/1024.png",
  "/assets/icons/apple-touch-icon.png",
  "/assets/icons/favicon-96x96.png",
  "/assets/icons/favicon.svg",
  "/assets/icons/favicon.ico",

  // Icons - Windows 11
  "/assets/icons/windows11/LargeTile.scale-100.png",
  "/assets/icons/windows11/LargeTile.scale-125.png",
  "/assets/icons/windows11/LargeTile.scale-150.png",
  "/assets/icons/windows11/LargeTile.scale-200.png",
  "/assets/icons/windows11/LargeTile.scale-400.png",
  "/assets/icons/windows11/SmallTile.scale-100.png",
  "/assets/icons/windows11/SmallTile.scale-125.png",
  "/assets/icons/windows11/SmallTile.scale-150.png",
  "/assets/icons/windows11/SmallTile.scale-200.png",
  "/assets/icons/windows11/SmallTile.scale-400.png",
  "/assets/icons/windows11/SplashScreen.scale-100.png",
  "/assets/icons/windows11/SplashScreen.scale-125.png",
  "/assets/icons/windows11/SplashScreen.scale-150.png",
  "/assets/icons/windows11/SplashScreen.scale-200.png",
  "/assets/icons/windows11/SplashScreen.scale-400.png",
  "/assets/icons/windows11/Square150x150Logo.scale-100.png",
  "/assets/icons/windows11/Square150x150Logo.scale-125.png",
  "/assets/icons/windows11/Square150x150Logo.scale-150.png",
  "/assets/icons/windows11/Square150x150Logo.scale-200.png",
  "/assets/icons/windows11/Square150x150Logo.scale-400.png",
  "/assets/icons/windows11/Wide310x150Logo.scale-100.png",
  "/assets/icons/windows11/Wide310x150Logo.scale-125.png",
  "/assets/icons/windows11/Wide310x150Logo.scale-150.png",
  "/assets/icons/windows11/Wide310x150Logo.scale-200.png",
  "/assets/icons/windows11/Wide310x150Logo.scale-400.png",
  "/assets/icons/windows11/StoreLogo.scale-100.png",
  "/assets/icons/windows11/StoreLogo.scale-125.png",
  "/assets/icons/windows11/StoreLogo.scale-150.png",
  "/assets/icons/windows11/StoreLogo.scale-200.png",
  "/assets/icons/windows11/StoreLogo.scale-400.png",
];

// Install event: cache initial assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of PRECACHE_RESOURCES) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res);
        } catch (e) {
          // Failed to cache
        }
      }
      //resource cached
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          }),
      );
      await self.clients.claim();
    })(),
  );
});

// Fetch event: stale-while-revalidate
self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});

// Background cache update
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses (status 200–299)
    if (!networkResponse || !networkResponse.ok) return;

    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, networkResponse.clone());
  } catch (err) {
    // Fail silently if fetch fails
  }
}

// Respond with cached first, update cache in background
async function handleRequest(event) {
  let request = event.request;
  const url = new URL(request.url);

  // If the request is for a directory, append index.html
  if (url.pathname.endsWith("/")) {
    request = new Request(url.href + "index.html");
  }

  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Stale-while-revalidate: return cached response and update in background
    updateCacheInBackground(request);
    return cachedResponse;
  }

  // Not in cache, so try to fetch from network
  try {
    const networkResponse = await fetch(request);
    // Don't cache all responses, only OK ones.
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network fetch failed, return offline fallback
    return getOfflineFallback(request);
  }
}

async function getOfflineFallback(request) {
  const dest = request.destination;

  if (dest === "document") {
    // Fallback to main page
    return await caches.match("/index.html");
  }

  if (dest === "image") {
    // Simple offline image response
    return new Response("Image unavailable", {
      status: 503,
      statusText: "Offline",
    });
  }

  // Generic fallback for other requests
  return new Response(JSON.stringify({ error: "Offline" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
