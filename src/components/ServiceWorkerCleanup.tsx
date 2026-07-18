"use client";

import { useEffect } from "react";

// Aplikasi ini tidak memakai service worker — komponen ini justru
// membersihkan SW basi peninggalan app lain di origin yang sama (kasus
// nyata: SW lama di localhost:3000 menyajikan bundle JS kadaluarsa dari
// cache sehingga tombol-tombol tidak bereaksi). Berpasangan dengan
// public/sw.js (kill-switch untuk browser yang cuma lewat update-check).
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      })
      .catch(() => {
        // best-effort — kalau gagal, kill-switch sw.js yang beresin
      });
  }, []);

  return null;
}
