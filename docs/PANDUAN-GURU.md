# Panduan Guru — SIBI-AI

## 1. Masuk

Buka alamat SIBI-AI sekolah (tanya admin/IT sekolah kalau belum tahu), lalu login pakai email dan password yang sudah dibuatkan admin. Belum ada akun? Minta admin sekolah buatkan lewat Prisma Studio (lihat `DEPLOYMENT.md`).

## 2. Buat Sesi Baru

Di Dashboard, klik **"+ Sesi Baru"**, isi:
- **Judul** — topik yang mau diajarkan (mis. "Fotosintesis")
- **Mata Pelajaran** (mis. "IPA")
- **Kelas** (mis. "8B")

## 3. Merekam Pembelajaran

1. Buka sesi yang baru dibuat, klik **"Buka Panel Kontrol"**.
2. Klik **"Mulai Merekam"** — browser akan minta izin akses mikrofon, izinkan.
3. Ngajar seperti biasa. Transkrip suara akan muncul otomatis di panel (untuk cek) dan di layar proyektor kalau sudah dibuka.
4. Kalau perlu jeda (istirahat, dsb), klik **"Jeda"**, lalu **"Lanjutkan"** kalau mau lanjut lagi.
5. Kalau STT (deteksi suara) salah tangkap kata, klik **"Koreksi transkrip manual"** buat edit langsung.
6. Selesai mengajar, klik **"Selesai Sesi"**.

**Catatan**: fitur rekam suara pakai Web Speech API browser (gratis, jalan di sisi browser) — pastikan pakai **Chrome atau Edge versi terbaru**. Browser lain (Firefox, Safari) belum tentu mendukung.

## 4. Tampilkan di Proyektor

Buka `Buka Layar Proyektor` dari panel kontrol (atau salin link `/live/[id-sesi]`) di laptop yang terhubung ke proyektor kelas. Ada dua mode tampilan:
- **Caption**: cuma 2-3 baris terakhir, cocok buat "running subtitle" selama ngajar.
- **Transkrip Penuh**: scroll seluruh teks dari awal sesi.

Guru bisa ganti mode ini dari panel kontrol — proyektor otomatis ikut berubah tanpa perlu refresh.

## 5. Bikin Rangkuman, Mind Map, dan Quiz

Setelah sesi selesai direkam, buka halaman detail sesi (klik dari Dashboard), lalu di masing-masing bagian:

- **Rangkuman**: klik "Generate Rangkuman" — AI akan buat rangkuman singkat, poin kunci, dan istilah penting. Bisa direvisi manual lewat "Revisi" kalau ada yang kurang pas.
- **Mind Map**: klik "Generate Mind Map" — hasilnya bisa di-zoom/pan/klik tiap cabang buat lihat detail, dan di-export jadi gambar PNG.
- **Quiz**: pilih jumlah soal (5-15), klik "Generate Quiz" — soal bisa direvisi manual (ubah pertanyaan/opsi/jawaban benar/tingkat kesulitan) sebelum dimainkan.

Proses generate butuh beberapa detik sampai semenit tergantung kecepatan server AI sekolah — sabar ya.

## 6. Main Quiz Bareng Siswa (Kelas Interaktif)

1. Di bagian Quiz, klik **"Launch Quiz"** — sistem akan bikin kode ruangan 6 digit.
2. Buka **"Buka Layar Proyektor"** khusus quiz (link `/quiz/[id-sesi]`) — proyektor akan tampilkan kode + QR code.
3. Siswa scan QR (atau buka link + masukkan nama, tanpa perlu akun).
4. Setelah semua siswa siap, klik **"Mulai Quiz"** di panel kontrol quiz (pilih dulu batas waktu per soal: 15/30/60 detik).
5. Klik **"Soal Berikutnya"** buat lanjut ke soal berikutnya setelah waktu habis / semua sudah jawab.
6. Setelah semua soal selesai, papan peringkat final (podium top 3) otomatis tampil.

## 7. Bagikan Rangkuman ke Siswa (QR Resume)

Setelah sesi selesai (rekaman berhenti), layar proyektor otomatis ganti jadi QR code besar buat halaman rangkuman siswa. Siswa scan pakai HP untuk dapat rangkuman, mind map interaktif, dan latihan soal — bisa dibuka lagi kapan saja, tanpa perlu login.

Guru juga bisa cetak QR ini (tombol **"Cetak / Unduh PDF"** di halaman detail sesi) buat ditempel di papan kelas.

## 8. Pengaturan

Buka **Pengaturan** dari Dashboard untuk:
- Lihat provider AI yang sedang aktif (diatur admin sekolah, bukan bisa diganti sendiri dari sini)
- Atur preferensi jumlah soal & batas waktu default buat quiz

## Tips

- Kalau internet sekolah lambat/putus, fitur rekam suara dan tampilan live tetap jalan (tidak butuh internet). Cuma fitur AI (rangkuman/mind map/quiz) yang butuh server Ollama sekolah menyala.
- Simpan transkrip penting lewat "Koreksi transkrip manual" kalau ada bagian yang salah tangkap sebelum generate AI — hasil AI akan lebih akurat kalau transkripnya bersih.
