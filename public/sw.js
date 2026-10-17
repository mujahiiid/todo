const CACHE = "ritual-shell-v1";
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/app", "/icons/icon.svg"]))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => { if (event.request.method !== "GET") return; event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/app")))); });
self.addEventListener("push", (event) => { const data = event.data?.json() ?? { title: "Ritual", body: "A routine is due." }; event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon.svg", badge: "/icons/icon.svg", data: { url: data.url || "/app" } })); });
self.addEventListener("notificationclick", (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data?.url || "/app")); });
