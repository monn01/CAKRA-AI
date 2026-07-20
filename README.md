# CAKRA-AI

Software pendidikan inklusif berbasis AI. Menangkap suara guru secara real-time,
mengubahnya jadi rangkuman, peta pikiran interaktif, dan kuis — langsung tampil di
proyektor kelas, lalu bisa dibawa pulang siswa lewat kode QR. Dirancang offline-first
(AI bisa jalan lokal lewat Ollama) supaya tetap bisa dipakai di sekolah dengan
koneksi internet terbatas.

Landing page publik dengan detail fitur ada di halaman utama aplikasi (`/`) setelah
dijalankan.

## Prasyarat

- Node.js 20+ dan npm
- PostgreSQL (lokal atau hosted)
- Git
- Ollama (opsional — untuk menjalankan AI secara lokal/offline)

## Instalasi Lokal

```bash
git clone https://github.com/monn01/CAKRA-AI.git
cd CAKRA-AI
npm install
```

Salin `.env.local.example` jadi `.env.local`, lalu buat file `.env` terpisah berisi
`DATABASE_URL` (lihat komentar di `.env.local.example` untuk detail kenapa dipisah).
Isi juga `NEXTAUTH_SECRET` dan pilih `LLM_PROVIDER` (`ollama` untuk AI lokal, atau
`qwen`/`openrouter` untuk API cloud).

```bash
npx prisma db push       # sinkronkan schema ke database
npm run dev              # jalankan server dev di http://localhost:3000
```

Kalau memakai Ollama untuk AI lokal, pastikan modelnya sudah diunduh:

```bash
ollama serve
ollama pull qwen2.5:7b
```

Buat akun guru pertama lewat halaman `/register` di browser, atau lewat CLI:

```bash
npm run create-teacher -- "Nama Guru" guru@sekolah.sch.id password123
```

## Perintah Lain yang Berguna

```bash
npx prisma studio         # GUI untuk melihat isi database
npx prisma generate        # generate ulang Prisma client setelah pull kode baru
npm run build              # build produksi
npm run lint                # cek lint
```

## Dokumentasi Lengkap

Detail schema database, arsitektur, dan urutan pengembangan modul ada di
[`taskplan.md`](./taskplan.md).

## Tech Stack

Next.js (App Router) + TypeScript + Tailwind CSS · Prisma + PostgreSQL · Socket.IO
(real-time) · NextAuth.js · LLM via Ollama/Qwen/OpenRouter (provider-agnostic) ·
React Flow (peta pikiran) · `qrcode`
