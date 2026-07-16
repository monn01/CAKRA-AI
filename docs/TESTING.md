# Testing SIBI-AI

Dokumen ini merangkum apa yang **sudah** diverifikasi secara otomatis selama pengembangan (Module 1-16), dan apa yang **butuh verifikasi manual** dengan hardware/software sungguhan.

> **Update pasca-Modul 16**: setelah dokumen ini pertama ditulis, PostgreSQL 16 dan Ollama (native Windows, bukan Docker) berhasil diinstal di environment pengerjaan — lihat bagian "🔴 Bug kritis" di `taskplan.md`. Ini membuka verifikasi end-to-end pertama kali: login sungguhan, buat sesi, dan **generate rangkuman sungguhan lewat `qwen2.5:7b`** semua sudah dicoba dan berhasil (detail di bawah). Yang masih genuinely tidak bisa diverifikasi di CLI: STT (butuh mikrofon+browser), tampilan proyektor sungguhan (butuh proyektor fisik), dan Docker (belum diinstal — PostgreSQL/Ollama dipasang native atas keputusan user karena Docker Desktop butuh WSL2/Hyper-V yang lebih invasif).

## Sudah diverifikasi otomatis (tiap modul)

- **Build & lint**: `npm run build` dan `npm run lint` bersih di setiap modul (1-16), tidak ada error TypeScript atau ESLint yang lolos.
- **Auth gating**: semua API route yang seharusnya butuh login dikonfirmasi mengembalikan `401` tanpa auth (session, transcript, ai/summarize, ai/mindmap, ai/quiz, quiz/launch), dan yang seharusnya publik dikonfirmasi TIDAK mengembalikan `401` (quiz/active, quiz/results, live, quiz projector, quiz join, resume).
- **Pipeline LLM** (Module 5-8): `callLLM`/`streamLLM`/`parseLLMJson`/`generateSummary`/`generateMindMap`/`generateQuiz` dites end-to-end pakai mock HTTP server yang meniru response Ollama — memverifikasi prompt yang terkirim benar, parsing JSON (termasuk markdown fence stripping) benar, retry logic pulih dari error 5xx, dan error handling menghasilkan pesan Bahasa Indonesia yang jelas.
- **Logic scoring quiz** (Module 10): formula poin (base kecepatan + bonus streak, capped) dites lewat 6 skenario termasuk edge case lag jaringan.
- **Logic agregasi hasil quiz** (Module 11): tally opsi jawaban dan sorting leaderboard dites termasuk kasus siswa yang disconnect sebelum sempat jawab soal terakhir.
- **WebSocket stability** (Module 16): 50 client konkuren × 3 ronde (150 total koneksi) connect-emit-disconnect secara paralel ke server dev — dikonfirmasi **nol unhandled rejection**, server tetap responsif setelahnya. ⚠️ Ini menguji **stabilitas koneksi/room di bawah beban konkuren**, BUKAN gameplay quiz penuh dengan banyak pemain sungguhan (itu butuh DB untuk inisialisasi game state).
- **Error recovery**: dikonfirmasi berkali-kali bahwa kegagalan Prisma (karena tidak ada DB di environment ini) tidak pernah membuat server crash — selalu ter-handle sebagai 500 response atau error ter-log, konsisten di semua 16 modul.

## Belum bisa diverifikasi di environment ini (butuh hardware/software nyata)

Ketiga item checklist Module 16 di bawah ini **butuh browser sungguhan dengan mikrofon, dan/atau server Ollama yang benar-benar jalan** — tidak mungkin dieksekusi dari CLI. Berikut prosedur manual yang perlu dijalankan sekolah/tim QA sebelum go-live:

### Test STT Accuracy (Bahasa Indonesia)

1. Buka `/session/[id]/control` di Chrome/Edge terbaru, mikrofon aktif.
2. Baca beberapa kalimat pendek dalam Bahasa Indonesia dengan kecepatan bicara normal, termasuk istilah teknis mata pelajaran (mis. "fotosintesis", "stoikiometri").
3. Bandingkan transkrip yang muncul vs. yang diucapkan — catat kata yang sering salah tangkap.
4. Ulangi di ruangan dengan noise background (kelas ramai) untuk menguji kondisi realistis.
5. **Kriteria lolos** (rekomendasi, sesuaikan kebutuhan sekolah): akurasi kata ≥85% untuk kalimat non-teknis, guru bisa mengoreksi manual untuk sisanya lewat fitur "Koreksi transkrip manual".

### Test LLM Output Quality (rangkuman, mind map, quiz)

**✅ Sebagian sudah dicoba dengan model sungguhan** (`qwen2.5:7b` via Ollama native Windows, bukan mock server lagi): `generateSummary()` (kode project asli, `src/lib/ai/services.ts`) dipanggil dengan transkrip contoh singkat tentang fotosintesis. Hasilnya:

- Rangkuman: akurat, bahasa mudah dipahami, tidak ada halusinasi jelas. ✅
- Poin kunci: 5 poin, semua relevan dan sesuai isi transkrip. ✅
- Istilah penting: **ditemukan satu kesalahan faktual** — glosarium menyebut klorofil sebagai "hormon hijau", padahal klorofil itu pigmen, bukan hormon. ⚠️

Temuan ini justru jadi bukti nyata kenapa "guru bisa merevisi sebelum publish" (Modul 6) itu bukan fitur formalitas — model 7B kadang salah fakta walau strukturnya rapi, dan guru **harus** membaca ulang hasil AI sebelum dibagikan ke siswa, bukan cuma klik generate lalu selesai.

**✅ `generateQuiz()` juga sudah dicoba** (5 soal, transkrip sama): struktur valid, **semua jawaban benar akurat** sesuai transkrip, penjelasan masuk akal, tingkat kesulitan bervariasi (mudah/sedang/sulit). Satu typo minor dari model sendiri ditemukan di teks salah satu opsi ("Karbon Didosida") — bukan bug kode, murni typo LLM, tidak ada tindakan lanjut selain guru baca ulang sebelum publish (sama seperti temuan rangkuman di atas).

**✅ `generateMindMap()` sudah dicoba — dan ketemu bug NYATA di kode kita sendiri** (bukan cuma keterbatasan model): root topic mind map awalnya keluar `"IPA"` (mata pelajaran) padahal seharusnya `"Fotosintesis"` (topik pelajaran). Akar masalah: `generateMindMap()` tidak pernah menerima judul/topik sesi sama sekali — beda dari `generateSummary()` yang sudah benar sejak awal. Ditemukan juga masalah kedua: satu node mind map field `detail`-nya cuma copy-paste dua kalimat pertama transkrip mentah-mentah, tidak relevan sama isi node itu sendiri.

**Sudah diperbaiki**: `PROMPTS.mindmap()`, `generateMindMap()`, dan `api/ai/mindmap/route.ts` diupdate supaya menerima & memakai judul sesi sebagai topik root (pola yang sama seperti summarize), plus instruksi eksplisit larangan menyalin teks transkrip mentah ke field detail. **Diverifikasi ulang terhadap Ollama sungguhan** — root topic sekarang benar dan detail node yang tadinya copy-paste sekarang jadi ringkasan spesifik akurat. Detail lengkap ada di `taskplan.md` bagian "Status Akhir Proyek".

**✅ Sudah dicoba juga dengan transkrip lebih panjang** (~600 kata, gaya bicara natural dengan pengulangan khas STT, topik beda: Matematika — Sistem Persamaan Linear Dua Variabel):

- Fix mind map di atas **terbukti konsisten** di topik baru — root topic langsung benar tanpa perlu penyesuaian lagi.
- Rangkuman, poin kunci, istilah, dan struktur mind map semua akurat dan logis.
- **⚠️ Ditemukan kesalahan matematika nyata di quiz**: transkrip contoh menyertakan soal cerita (beli pensil & penghapus, cari harga masing-masing). Model menjawab "harga pensil = 3000 rupiah" — **diverifikasi langsung dengan hitungan manual, jawaban ini salah** (`3×3000 + 2×2000 = 13000`, seharusnya `11000`). Model memberikan angka spesifik dengan percaya diri penuh, tanpa tanda keraguan, meski jawabannya tidak memenuhi persamaan yang diberikan.

**🔴 Rekomendasi konkret, bukan cuma saran umum**: untuk mata pelajaran yang butuh presisi angka (Matematika, Fisika, Kimia hitungan), **guru wajib menghitung ulang jawaban quiz berbasis perhitungan sebelum di-launch ke siswa** — bukan cuma baca redaksional soalnya. Kesalahan istilah (kayak temuan "hormon" di atas) itu satu hal, tapi model **mengklaim menyelesaikan soal matematika dengan hasil yang bisa diverifikasi salah** itu risiko lebih serius — siswa yang percaya penuh sama quiz AI bisa belajar jawaban yang salah.

**🔴 Test lanjutan topik Fisika mengonfirmasi ini POLA, bukan kebetulan** (transkrip Usaha & Energi, 2 soal contoh yang sudah diverifikasi bersih SEBELUM dipakai — W=50J, Ek=18J, jadi bukan kasus "data test-nya yang salah" seperti sebelumnya): dari 8 soal quiz yang di-generate, **4 soal (50%) punya kesalahan matematika**, tiga pola berbeda ditemukan:

- Salah kalkulasi murni: formula & angka input benar, tapi hasil perkaliannya salah (model bilang 5×10×2=50, padahal =100)
- Jawaban benar tidak ada di 4 opsi yang ditawarkan sama sekali
- **Paling mengkhawatirkan**: field jawaban benar (`correct`) tidak cocok dengan angka yang dihitung di field `explanation`-nya sendiri — model menulis penjelasan yang menghitung angka BENAR, tapi tetap memilih huruf opsi yang SALAH

Detail lengkap tabel per-soal ada di `taskplan.md` bagian "Status Akhir Proyek".

**🟢 TAPI — test kelima (Kimia, Konsep Mol, pola sama: 2 soal hitungan diverifikasi manual dulu) hasilnya 0% error.** Ke-8 soal quiz semua benar, termasuk 2 soal hitungan langsung (mol dari massa, molaritas dari mol+volume) — semua cocok antara `correct` dan `explanation`. Ini mengubah kesimpulannya jadi **lebih penting lagi, bukan lebih ringan**: perbandingan Matematika/Fisika/Kimia menunjukkan **tingkat kesalahan sangat bervariasi dan tidak bisa ditebak dari mata pelajarannya** — Kimia yang tadinya diprediksi bakal sama bermasalahnya kayak Fisika, ternyata sempurna, sementara Fisika 50% rusak. Kemungkinan penyebab: kompleksitas soal (soal Fisika yang salah butuh "reverse" dari hasil ke variabel, soal Kimia yang benar cuma substitusi langsung), atau murni random sampling (`temperature: 0.7` bikin tiap run bisa beda meski prompt sama).

**🔴 Test keenam — Fisika lagi, tapi topik berbeda (Gerak Lurus, bukan Usaha & Energi)**, khusus buat cek apakah 50% error di test Fisika pertama itu kebetulan sampel atau memang pola per-mapel. Dua soal hitungan diverifikasi manual dulu sebelum dipakai (v=s/t=60 km/jam; v=v0+at=10 m/s). Hasil: dari 2 soal hitungan langsung, **1 benar (12 m/s, cocok)**, **1 salah parah** — soal jarak GLBB (jawaban benar seharusnya 18 m, tersedia sebagai opsi D) malah ditandai benar di opsi "12 m", sementara teks penjelasan modelnya sendiri menghitung "9 m" — tiga angka berbeda (12, 9, 18) saling kontradiksi di satu soal yang sama. Ditemukan juga 1 soal konsep (bukan hitungan) dengan opsi jawaban dan teks penjelasan yang saling bertentangan langsung ("percepatannya tidak konstan" ditandai benar, tapi penjelasan bilang "percepatan konstan").

**Kesimpulan setelah 2 sampel Fisika**: pola error tinggi di Fisika **terkonfirmasi**, bukan kebetulan test pertama — kedua test independen (topik beda) sama-sama menunjukkan kegagalan signifikan di soal hitungan. Dibandingkan Kimia yang bersih (0/8), Fisika sejauh ini tampak konsisten lebih rawan. Sampel masih kecil (2 test per mapel, belum cukup buat klaim statistik kuat), tapi cukup buat menaikkan level kewaspadaan guru khusus mapel Fisika, di atas rekomendasi umum di bawah.

**Kesimpulan akhir**: karena tidak bisa ditebak mapel/topik mana yang "aman", **verifikasi manual wajib untuk SEMUA soal hitungan yang di-generate AI, setiap kali, tanpa terkecuali** — bukan cuma untuk mapel yang "kelihatannya rawan". Anggap default-nya AI-generated quiz butuh verifikasi penuh untuk soal berbasis angka, sampai ada bukti sebaliknya dari testing lebih luas di sekolah.

**Masih perlu dilakukan sekolah/QA sebelum go-live**: pengujian dengan lebih banyak topik/mata pelajaran dan lebih banyak run per topik (sudah dicoba 5 topik: IPA-Fotosintesis, Matematika-Sistem Persamaan Linear, Fisika-Usaha&Energi, Kimia-Konsep Mol, Fisika-Gerak Lurus — Fisika sudah 2 sampel dan konsisten bermasalah, mapel lain masih 1 sampel, jadi idealnya tiap topik dicoba beberapa kali lagi buat lihat rata-rata tingkat errornya). Prosedur:

1. Siapkan transkrip contoh dari beberapa mata pelajaran berbeda, termasuk yang ada soal hitungan (bukan cuma hafalan/konsep).
2. Generate rangkuman, mind map, dan quiz — cek tiap output seperti kriteria di atas, **selalu baca ulang, jangan asumsikan benar**.
3. **Khusus soal hitungan**: hitung ulang manual jawabannya, jangan cuma percaya "kelihatannya masuk akal".
4. Generate mind map — cek juga: apakah struktur topik/sub-topik masuk akal, kedalaman maksimal 3 level sesuai prompt?
5. Generate quiz — cek juga: apakah soal relevan, opsi jawaban tidak ambigu, jawaban benar memang benar, tingkat kesulitan bervariasi?
6. Kalau kualitas kurang baik dengan model default (`qwen2.5:7b`), coba model yang lebih besar (`qwen2.5:14b`) atau provider cloud (Qwen/OpenRouter) via `.env`.

**Catatan performa**: di mesin dev (CPU-only, tanpa GPU), `generateSummary()` untuk transkrip pendek makan waktu ~19 detik; test chat singkat (44 token prompt) makan waktu ~64 detik dengan ~29 detik di antaranya cuma buat load model pertama kali. Untuk transkrip panjang sungguhan (satu sesi kelas 30-40 menit), waktu generate bisa jauh lebih lama di server sekolah tanpa GPU — pertimbangkan ini saat kasih ekspektasi ke guru ("generate rangkuman butuh beberapa menit", bukan "instan").

### Test Projector Display (resolusi, readability)

1. Sambungkan laptop ke proyektor kelas sungguhan (bukan cuma preview di layar laptop).
2. Buka `/live/[sessionId]` — cek keterbacaan caption dari jarak duduk siswa paling belakang.
3. Cek kontras di kondisi ruangan terang (siang hari, lampu kelas menyala) — proyektor biasanya lebih redup dari monitor.
4. Test toggle Caption ↔ Transkrip Penuh dan ubah ukuran font (A-/A+) dari panel kontrol guru, pastikan proyektor ikut berubah real-time.
5. Ulangi untuk layar quiz (`/quiz/[sessionId]`) — cek kode ruangan, QR, dan soal quiz kelihatan jelas dari jarak jauh.
6. Cek juga resolusi proyektor sekolah (banyak proyektor lama cuma 1024×768) — pastikan layout tidak terpotong di resolusi rendah.

## Menjalankan test yang sudah otomatis

Test-test di atas (WebSocket stability, dsb) ditulis sebagai skrip sementara selama development dan dihapus setelah dipakai (bukan bagian dari test suite permanen — project ini tidak punya framework testing terpasang seperti Jest/Vitest, sesuai daftar dependency taskplan.md yang tidak menyertakannya). Kalau mau menjalankan ulang salah satu skenario di atas, pola umumnya:

```js
// Contoh: test koneksi WebSocket konkuren
import { io } from "socket.io-client";
const sockets = await Promise.all(
  Array.from({ length: 50 }, () => new Promise((resolve) => {
    const s = io("http://localhost:3000", { path: "/api/socket" });
    s.on("connect", () => resolve(s));
  }))
);
// ... verifikasi semua masih connected, dst.
```

Jalankan dengan `node nama-file.mjs` dari root project (server dev harus sudah jalan di port 3000).
