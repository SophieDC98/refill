// Offline support: every app file is cached on install and served cache-first.
// When any cached file changes, bump CACHE (refill-v2, ...): the new worker
// installs under the new name, takes over on the next load, and activate
// deletes the old cache.
const CACHE = "refill-v6";

// Every file the page loads. tests/smoke/install.test.js checks that each
// src/**/*.js module is listed, so a new module cannot be forgotten.
const PRECACHE = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "fonts/inter-latin.woff2",
  "fonts/pixelify-sans-latin.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "src/main.js",
  "src/notify.js",
  "src/core/days.js",
  "src/core/reminders.js",
  "src/core/settings.js",
  "src/core/storage.js",
  "src/ui/calendar.js",
  "src/ui/pixels.js",
  "src/ui/settings-view.js",
  "src/ui/stars.js",
  "src/ui/tracker.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit ?? fetch(event.request)),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) =>
      windows.length > 0 ? windows[0].focus() : self.clients.openWindow("./"),
    ),
  );
});
