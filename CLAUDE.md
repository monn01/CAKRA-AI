# CLAUDE.md

Panduan buat Claude Code kerja di project ini. Baca `taskplan.md` dulu buat detail lengkap module, schema, dan implementation reference — file ini cuma summary + aturan kerja harian.

## Project

SIBI-AI — software pendidikan inklusif. Nangkep suara guru real-time → STT → tampil di proyektor → LLM generate rangkuman + mind map interaktif + quiz (Quizizz-style) → resume via QR code buat siswa bawa pulang. Target: sekolah daerah 3T (internet/infra terbatas).

## Tech Stack

Next.js 14 (App Router) + TypeScript + Tailwind · Prisma + PostgreSQL · Socket.IO (real-time) · NextAuth.js · LLM via Ollama/Qwen/OpenRouter (provider-agnostic wrapper) · React Flow (mind map) · `qrcode` npm package

## Commands

```bash
npm run dev              # start dev server
npx prisma db push       # sync schema ke DB setelah edit schema.prisma
npx prisma generate      # generate Prisma client setelah pull
npx prisma studio        # GUI browse database
ollama serve             # start LLM lokal
ollama pull qwen2.5:7b   # download model (sekali aja)
npm run build             # production build, jalanin sebelum deploy
npm run lint              # cek lint errors
```

## Cara Kerja

1. **Ikuti `taskplan.md` berurutan** — Phase 1 → 6, jangan loncat module kecuali diminta.
2. **Update checklist di taskplan.md** — tandai `[x]` tiap task selesai, jangan diam-diam skip.
3. **Satu module = satu unit kerja.** Selesaikan, test manual, baru lanjut module berikutnya.
4. **Commit per module** — format `feat(module-N): deskripsi singkat`, bukan satu commit raksasa di akhir.
5. **Kalau ragu soal keputusan desain/schema, cek dulu bagian relevan di `taskplan.md`** sebelum nebak — semua Prisma schema, prompt template, dan pattern kode udah didefinisikan di sana.

## Aturan Teknis

- **LLM provider-agnostic.** Semua panggilan AI lewat `lib/ai/llm-client.ts`, switch provider via `.env` (`LLM_PROVIDER=ollama|qwen|openrouter`). Jangan hardcode ke satu provider di komponen manapun.
- **AI output selalu JSON.** Parse pakai helper `parseLLMJson()` (strip markdown fence dulu), jangan regex manual.
- **Bahasa Indonesia** untuk semua: prompt LLM, UI text, error message, komentar penting. Kode/variable/function name tetap English.
- **Environment variables wajib** untuk semua secret/endpoint (API key, DB URL, LLM base URL). Jangan pernah hardcode.
- **Socket.IO pakai custom server** — App Router Next.js gak native support WebSocket, ikuti setup yang ada di taskplan.md.
- **Projector-first display** — layar proyektor (`/live`, `/quiz`) harus kontras tinggi, font besar, minim clutter. Device siswa (`/quiz/join`, `/r`) mobile-first, card-based.
- **Mind map harus interaktif** (zoom/pan/expand pakai React Flow), bukan gambar statis di manapun kecuali versi export PNG.
- **Offline-first mindset** — fitur inti (STT, live display) harus tetap jalan meski internet lambat/putus; LLM generation boleh nunggu koneksi balik. Prioritaskan Ollama lokal buat deployment sekolah 3T.

## Yang JANGAN dilakukan

- Jangan install package di luar yang udah di-listing di taskplan.md tanpa alasan jelas.
- Jangan ubah Prisma schema tanpa update taskplan.md juga (biar tetap sinkron).
- Jangan bikin UI component baru tanpa liat referensi visual di section "UI/UX Reference" di taskplan.md dulu.
- Jangan skip testing manual sebelum lanjut ke module berikutnya, walau kelihatan simpel.

## Referensi

Semua detail schema, prompt template, API route pattern, WebSocket event map, Docker setup, dan mockup layar ada di `taskplan.md` — anggap itu source of truth, file ini cuma pengingat cara kerja.
