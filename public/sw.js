// Service worker de PitWall.
// Por ahora no guarda nada en caché: la app siempre se carga desde la red.
// Más adelante acá se agregan las notificaciones.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Necesario para que el navegador considere la app instalable.
self.addEventListener("fetch", () => {});