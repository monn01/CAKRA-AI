// Kill-switch service worker.
//
// Aplikasi ini TIDAK memakai service worker — tapi origin ini (mis.
// localhost:3000 di mesin dev, atau domain sekolah yang pernah dipakai app
// lain) bisa punya SW basi peninggalan project lain yang menyajikan bundle
// JS lama dari cache, bikin halaman "beku": tombol tidak bereaksi karena
// kode yang jalan bukan kode terbaru.
//
// Browser yang masih memegang SW lama akan otomatis fetch /sw.js saat
// update-check; begitu dapat file ini, worker langsung menghapus semua
// cache, meng-unregister dirinya, dan me-reload tab yang dikendalikannya
// supaya balik dijalani server langsung tanpa perantara.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});
