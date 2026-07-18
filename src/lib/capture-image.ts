import { toPng } from "html-to-image";

const CAPTURE_TIMEOUT_MS = 15000;

// html-to-image (toPng) punya langkah "embed font" yang membaca cssRules dari
// SEMUA stylesheet di halaman untuk inline-kan @font-face. Di beberapa browser
// mobile (dan webview hasil buka QR), langkah ini bisa HANG TANPA ERROR kalau
// ada stylesheet yang gagal diakses (mis. dibatasi CORS) — promise-nya tidak
// pernah resolve maupun reject, jadi `await` di pemanggil nyangkut selamanya:
// UI tampak "diam saja" tanpa pesan error apa pun, padahal sebenarnya ngestuck.
//
// skipFonts: true melewati langkah itu (PDF/PNG hasil generate tidak perlu
// font custom, cukup font default sistem). timeout adalah jaring pengaman
// kedua: kalau tetap nyangkut karena sebab lain, pemanggil pasti dapat error
// dalam beberapa detik, bukan macet tanpa batas.
export async function captureNodeAsPng(node: HTMLElement): Promise<string> {
  const capture = toPng(node, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    skipFonts: true,
  });

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Waktu ekspor gambar habis")), CAPTURE_TIMEOUT_MS);
  });

  return Promise.race([capture, timeout]);
}
