# SIBI-AI — Taskplan

## Project Overview

Software pendidikan inklusif berbasis AI. Menangkap suara guru real-time → teks → rangkuman + mind map + quiz interaktif → resume QR code untuk siswa bawa pulang.

**Target user:** Guru + Siswa di daerah 3T
**Platform:** Web app (projector-friendly, responsive)
**AI Backend:** Qwen / LLM sejenis (self-hosted atau API)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Real-time Display | WebSocket (Socket.IO) |
| Speech-to-Text | Web Speech API (browser) + Whisper fallback (server) |
| AI/LLM | Qwen API / Ollama (local) untuk summarize, mind map, quiz gen |
| Mind Map Render | D3.js / React Flow (interactive visual) |
| Quiz Engine | Custom (Quizizz-style, real-time multiplayer via WebSocket) |
| QR Code | `qrcode` npm package |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (guru login) |
| File Storage | Local / Cloudinary (gambar mind map export) |
| Deploy | Docker (biar gampang deploy di server sekolah lokal) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GURU (Browser)                     │
│  [Mic] → Web Speech API → WebSocket → Server        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 NEXT.JS SERVER                       │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ STT Handler │→ │ Transcript   │→ │ LLM Engine │ │
│  │ (Whisper    │  │ Store (DB)   │  │ (Qwen API) │ │
│  │  fallback)  │  └──────────────┘  └─────┬──────┘ │
│  └─────────────┘                          │        │
│                                           ▼        │
│                    ┌──────────────────────────────┐ │
│                    │ Generate:                    │ │
│                    │  • Rangkuman                 │ │
│                    │  • Mind Map (JSON structure) │ │
│                    │  • Quiz Questions            │ │
│                    └──────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket broadcast
                       ▼
┌──────────────────────────────────────────────────────┐
│              SISWA / PROYEKTOR (Browser)              │
│                                                      │
│  ┌────────────┐ ┌───────────┐ ┌───────────────────┐ │
│  │ Live       │ │ Mind Map  │ │ Quiz (Quizizz-    │ │
│  │ Transcript │ │ Viewer    │ │ style, real-time) │ │
│  └────────────┘ └───────────┘ └───────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ QR Code → Resume Page (rangkuman + mind map  │    │
│  │           + soal jawaban, gambar interaktif)  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## Database Schema (Prisma)

```prisma
model Teacher {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String
  sessions  Session[]
  createdAt DateTime  @default(now())
}

model Session {
  id          String       @id @default(cuid())
  title       String
  subject     String
  grade       String
  teacherId   String
  teacher     Teacher      @relation(fields: [teacherId], references: [id])
  transcript  Transcript?
  summary     Summary?
  mindMap     MindMap?
  quizzes     Quiz[]
  status      SessionStatus @default(IDLE)
  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime     @default(now())
}

model Transcript {
  id        String   @id @default(cuid())
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  chunks    TranscriptChunk[]
  fullText  String   @db.Text
  createdAt DateTime @default(now())
}

model TranscriptChunk {
  id           String     @id @default(cuid())
  transcriptId String
  transcript   Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)
  text         String
  timestamp    Float
  createdAt    DateTime   @default(now())
}

model Summary {
  id        String   @id @default(cuid())
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  keyPoints Json
  createdAt DateTime @default(now())
}

model MindMap {
  id        String   @id @default(cuid())
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  structure Json
  imageUrl  String?
  createdAt DateTime @default(now())
}

model Quiz {
  id        String         @id @default(cuid())
  sessionId String
  session   Session        @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  createdAt DateTime       @default(now())
}

model QuizQuestion {
  id            String   @id @default(cuid())
  quizId        String
  quiz          Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question      String
  options       Json
  correctAnswer String
  explanation   String?
  order         Int
}

model QuizAttempt {
  id         String   @id @default(cuid())
  quizId     String
  playerName String
  score      Int
  answers    Json
  createdAt  DateTime @default(now())
}

enum SessionStatus {
  IDLE
  RECORDING
  PROCESSING
  COMPLETED
}
```

---

## Phases & Tasks

### Phase 1 — Foundation (Week 1-2)

#### Module 1: Project Setup
- [x] Init Next.js 14 + TypeScript + Tailwind
- [x] Setup Prisma + PostgreSQL
- [x] Setup Socket.IO server (custom server atau API route)
- [x] Folder structure:
  ```
  src/
    app/
      (auth)/login/page.tsx
      (teacher)/
        dashboard/page.tsx
        session/[id]/page.tsx
        session/[id]/control/page.tsx    ← guru control panel
      (display)/
        live/[sessionId]/page.tsx        ← proyektor view
        quiz/[sessionId]/page.tsx        ← quiz view (proyektor)
        quiz/[sessionId]/join/page.tsx   ← siswa join quiz
      (resume)/
        r/[sessionId]/page.tsx           ← QR resume page
      api/
        auth/[...nextauth]/route.ts
        session/route.ts
        transcript/route.ts
        ai/summarize/route.ts
        ai/mindmap/route.ts
        ai/quiz/route.ts
        socket/route.ts
    components/
      live/TranscriptDisplay.tsx
      live/LiveCaption.tsx
      mindmap/MindMapViewer.tsx
      mindmap/InteractiveMindMap.tsx
      quiz/QuizLobby.tsx
      quiz/QuizQuestion.tsx
      quiz/QuizLeaderboard.tsx
      resume/ResumeView.tsx
      resume/QRCodeGenerator.tsx
    lib/
      ai/llm-client.ts          ← Qwen/LLM API wrapper
      ai/prompts.ts             ← prompt templates
      stt/speech-handler.ts     ← Web Speech API wrapper
      socket/server.ts
      socket/client.ts
    types/
      index.ts
  ```
- [x] Setup NextAuth (guru login, simple credential)
- [x] Teacher dashboard: list sessions, create new session

**Catatan implementasi Module 1:**
- Scaffold jadi **Next.js 16.2.10** (bukan literal 14) karena `create-next-app@latest` narik versi terbaru saat dikerjakan — tetap memenuhi syarat "14+" di taskplan, tapi bawa breaking changes yang perlu diadaptasi (lihat poin di bawah). Tailwind yang terpasang juga v4 (config berbasis CSS di `globals.css`, tidak ada `tailwind.config.ts`).
- **Prisma 7.8.0**: generator client baru (`provider = "prisma-client"`) dengan custom output `src/generated/prisma`, dan **wajib pakai driver adapter** — `new PrismaClient()` tanpa argumen sekarang error di compile time. Dipasang `@prisma/adapter-pg`, dipakai di `src/lib/prisma.ts` (`new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`).
- **Custom server**: `server.ts` di root project menggantikan `next dev`/`next start` bawaan, supaya Socket.IO bisa nempel di HTTP server yang sama (`src/lib/socket/server.ts`, path `/api/socket`). `package.json` scripts diubah jadi `dev: "node server.ts"` dan `start: "cross-env NODE_ENV=production node server.ts"` (pakai `cross-env` karena `NODE_ENV=x cmd` tidak jalan di Windows/PowerShell secara native).
- **Next.js 16 mengganti `middleware.ts` jadi `proxy.ts`** (nama lama dianggap deprecated). Guard auth untuk halaman `/dashboard` dan `/session/*` ada di `src/proxy.ts`, ditulis manual pakai `getToken()` dari `next-auth/jwt` (bukan `withAuth` wrapper) supaya kompatibel dengan konvensi baru.
- **NextAuth pakai strategi JWT, TIDAK memasang `@next-auth/prisma-adapter`** walau paketnya ada di `package.json` (sesuai daftar dependency taskplan). Alasan: adapter NextAuth butuh tabel `User`/`Session` versi NextAuth sendiri, dan itu akan bentrok dengan model `Session` kita yang artinya "sesi mengajar", bukan sesi login. Login diverifikasi langsung lewat `authorize()` di `src/lib/auth.ts`: query `Teacher` by email + `bcrypt.compare()` password.
- File-file utama yang dibuat: `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/socket/{server,client}.ts`, `server.ts`, `src/proxy.ts`, `src/components/AuthProvider.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(teacher)/dashboard/page.tsx` + `src/components/dashboard/{NewSessionForm,SignOutButton}.tsx`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/session/route.ts` (GET list + POST create), serta halaman placeholder untuk semua route Modul 2-13 (`session/[id]`, `session/[id]/control`, `live/[sessionId]`, `quiz/[sessionId]`, `quiz/[sessionId]/join`, `r/[sessionId]`) supaya struktur folder taskplan lengkap dari awal — isinya baru pesan "belum diimplementasikan" sampai modulnya dikerjakan.
- **Belum dibuat** (sengaja, di luar scope Module 1): `api/transcript`, `api/ai/*`, `api/socket/route.ts` (Socket.IO nempel langsung ke custom server, bukan lewat App Router route handler — request ke path itu memang dicegat duluan sama Socket.IO sebelum sampai ke Next router), `src/types/index.ts` (belum ada kebutuhan konkret).
- Verifikasi: `npm run build` ✅, `npm run lint` ✅ (bersih), smoke test manual `curl` ke `/`, `/login`, `/dashboard` (redirect ke `/login` lewat proxy), dan handshake Socket.IO di `/api/socket`.
- **⚠️ Belum bisa diverifikasi end-to-end**: tidak ada PostgreSQL maupun Docker terpasang di environment pengerjaan ini, jadi `npx prisma db push` belum pernah berhasil dijalankan. Prisma Client sudah di-generate (`npx prisma generate`, jalan tanpa perlu koneksi DB), tapi belum ada satupun query yang tersentuh ke database sungguhan. Juga belum ada akun guru (tidak ada halaman signup by design) — harus dibuat manual lewat `npx prisma studio` setelah DB nyala, dengan password yang di-hash pakai bcrypt.

#### Module 2: Database & API
- [x] Prisma schema + migration (schema lengkap dengan `onDelete: Cascade`; migrasi ke DB pending — lihat catatan di bawah)
- [x] CRUD API: sessions, transcripts
- [x] API middleware (auth check)

**Catatan implementasi Module 2:**
- Schema diperkuat dengan `onDelete: Cascade` di semua relasi anak (`Transcript`, `TranscriptChunk`, `Summary`, `MindMap`, `Quiz`, `QuizQuestion`) — tanpa ini, hapus satu `Session` akan gagal dengan foreign key error begitu sesi itu punya transkrip/rangkuman/quiz. Perubahan ini disinkronkan juga ke bagian "Database Schema (Prisma)" di atas supaya `schema.prisma` dan dokumentasi taskplan tidak divergen.
- File baru `src/lib/api-auth.ts`: `requireTeacher()` (cek sesi NextAuth aktif) dan `getOwnedSession(sessionId, teacherId)` (cek kepemilikan). Ini jadi lapisan "middleware auth check" — App Router route handler tidak bisa pakai middleware biasa untuk pengecekan yang butuh query DB (kepemilikan resource), jadi solusinya helper function yang dipanggil di awal tiap route handler. `src/app/api/session/route.ts` direfactor untuk pakai helper ini (sebelumnya manual `getServerSession` di tiap fungsi).
- File baru `src/app/api/session/[id]/route.ts`: GET (detail + relasi transcript/summary/mindMap/quizzes), PATCH (update title/subject/grade/status/startedAt/endedAt, validasi `status` terhadap enum `SessionStatus`), DELETE.
- File baru `src/app/api/transcript/route.ts`: GET (fetch transcript + chunks by `sessionId` query param), POST (append satu chunk + upsert `fullText`, dipakai juga oleh socket handler di Module 3), PATCH (overwrite `fullText` penuh — untuk fitur koreksi manual transkrip).
- Verifikasi: `npm run build` ✅, `npm run lint` ✅, smoke test manual — dikonfirmasi semua endpoint baru (`GET/POST /api/session`, `GET/PATCH/DELETE /api/session/[id]`, `GET/POST/PATCH /api/transcript`) mengembalikan `401` saat diakses tanpa cookie auth (test pakai `curl` tanpa login).
- **⚠️ Blocker sama seperti Module 1**: belum ada DB nyala, jadi logic query Prisma di semua route ini baru tervalidasi lewat TypeScript compiler + build, belum pernah dieksekusi terhadap data sungguhan.

---

### Phase 2 — Speech-to-Text & Live Display (Week 3-4)

#### Module 3: Speech Capture (Guru Side)
- [x] Web Speech API integration di browser guru
- [ ] Fallback: record audio chunk → kirim ke server → Whisper STT (di-skip untuk sekarang — keputusan user, tunggu infra Whisper jelas dulu; STT_PROVIDER="browser" tetap jalur utama)
- [x] Real-time streaming via WebSocket ke server
- [x] Guru control panel:
  - Start/Stop recording
  - Pause/Resume
  - Session info (subject, topic, grade)
  - Live preview transcript
  - Manual text correction (edit kalau STT salah)

**Catatan implementasi Module 3:**
- File baru `src/types/speech-recognition.d.ts`: deklarasi TypeScript manual untuk Web Speech API (`SpeechRecognition`, dll) — API ini tidak ada di lib DOM standar TypeScript, jadi tanpa file ini kode `speech-handler.ts` tidak akan compile.
- File baru `src/lib/stt/speech-handler.ts`: class `SpeechHandler` mengikuti pola reference di taskplan, **dengan satu perbaikan**: ditambah flag `stopped` supaya `pause()`/`stop()` benar-benar menghentikan pengenalan suara. Pola reference asli di taskplan punya bug laten — `recognition.onend` selalu `this.recognition?.start()` tanpa syarat, jadi begitu `pause()` memanggil `.stop()`, event `onend` langsung men-trigger restart otomatis dan fitur Jeda tidak akan pernah benar-benar diam.
- `src/lib/socket/server.ts` ditambah dua handler:
  - `transcript:chunk` — simpan ke DB kalau `isFinal` (upsert `Transcript` + create `TranscriptChunk`), lalu broadcast `transcript:update` ke room sesi (dikonsumsi Module 4).
  - `session:end` — broadcast `session:status: PROCESSING` ke room.
  - **Autentikasi socket**: koneksi Socket.IO didekode JWT NextAuth dari cookie handshake (`getTeacherIdFromHandshake`). Karena `socket.request` adalah `http.IncomingMessage` mentah yang tidak punya properti `.cookies` yang dibutuhkan `getToken()`, ditulis parser cookie manual (`parseCookieHeader`) untuk mengubah header `Cookie` jadi object. Setiap penulisan transkrip dicek kepemilikan sesi (`session.teacherId === decoded teacherId`) sebelum diproses — tapi **join room (`session:start`) tetap terbuka untuk siapa saja**, karena itu dipakai juga oleh viewer proyektor/siswa yang publik tanpa login.
- File baru `src/components/control/ControlPanel.tsx`: tombol Mulai Merekam / Jeda / Lanjutkan / Selesai Sesi, preview transkrip live (3 baris terakhir), dan mode koreksi manual (textarea → `PATCH /api/transcript`). `session/[id]/control/page.tsx` diupdate untuk fetch transcript awal dan merender komponen ini.
- **Temuan teknis penting**: alias import `@/...` cuma di-resolve oleh bundler Next.js (webpack/turbopack), TIDAK oleh `node server.ts` yang dieksekusi langsung sebagai ESM mentah oleh Node. Karena `server.ts` meng-import `src/lib/socket/server.ts`, dan file itu meng-import `src/lib/prisma.ts`, keduanya harus pakai **relative import dengan extension eksplisit** (`../prisma.ts`, bukan `@/lib/prisma`) — Node ESM juga mewajibkan extension pada relative import, beda dari resolusi TypeScript/bundler biasa.
- Verifikasi: `npm run build` ✅, `npm run lint` ✅, plus test manual pakai script `socket.io-client` yang connect ke server dev tanpa cookie auth dan emit `session:start`/`transcript:chunk`/`session:end` — dikonfirmasi lewat server log bahwa event tanpa auth di-ignore dengan aman tanpa membuat server crash.
- **Di-skip atas keputusan user**: fallback Whisper STT (`STT_PROVIDER="whisper"`). Taskplan tidak menyebutkan backend konkret (tidak ada package npm, tidak ada API key env var, tidak ada URL server self-hosted), jadi ditanyakan ke user dan diputuskan untuk ditunda sampai infra-nya jelas (pilihan yang didiskusikan: self-hosted whisper.cpp/faster-whisper vs cloud API OpenAI/Groq). `STT_PROVIDER="browser"` (Web Speech API) tetap jalur utama yang berfungsi.

#### Module 4: Live Transcript Display (Proyektor)
- [x] `/live/[sessionId]` — full-screen projector view
- [x] WebSocket client: terima transcript chunks real-time
- [x] Auto-scroll, font besar, high contrast (projector-friendly)
- [x] Caption mode: tampil 2-3 baris terakhir (subtitle-style)
- [x] Full transcript mode: scroll view seluruh teks
- [x] Toggle mode (guru control dari panel)
- [x] Accessibility: font size adjustable, dark/light mode

**Catatan implementasi Module 4:**
- File baru `src/components/live/LiveCaption.tsx` (mode subtitle: 2 baris final memudar + 1 baris interim terang) dan `src/components/live/TranscriptDisplay.tsx` (mode transkrip penuh, auto-scroll ke bawah tiap ada teks baru).
- File baru `src/components/live/LiveDisplay.tsx`: komponen client orchestrator — join room Socket.IO, dengarkan event `transcript:update` (pisahkan baris final vs interim yang sedang berjalan) dan `display:mode`, kelola state ukuran font & tema dengan persist ke `localStorage`, plus kontrol mengambang (A-/A+/☀🌙) di pojok kanan bawah layar proyektor sendiri (karena tidak ada orang lain yang bisa mengontrolnya dari jauh untuk pengaturan aksesibilitas ini).
- `src/app/(display)/live/[sessionId]/page.tsx` diupdate: server component **publik tanpa auth** (proyektor memang tidak perlu login) yang fetch data sesi + transkrip awal, lalu merender `LiveDisplay`.
- Event socket baru `display:mode` ditambah di `src/lib/socket/server.ts` (guru → server → broadcast ke room), pakai pola auth+kepemilikan yang sama seperti `transcript:chunk` di Module 3. Toggle-nya sendiri ditambahkan ke `ControlPanel.tsx` (Module 3) sebagai dua tombol Caption/Transkrip Penuh, plus link "Buka Layar Proyektor ↗" untuk kemudahan buka tab baru.
- **Sengaja di-skip**: highlight kata kunci penting via "NLP keyword extraction" yang disebut di UI reference. Tidak dibuat heuristik tebak-tebakan (misal kapital/kata panjang) karena itu akan jadi implementasi palsu yang menyesatkan — ekstraksi keyword yang benar itu ranah LLM (Module 5+). Komponen sudah disiapkan untuk menerima data keyword nanti tanpa perlu dirombak ulang.
- Fix lint: ESLint rule baru `react-hooks/set-state-in-effect` menandai pembacaan `localStorage` di dalam `useEffect` sebagai anti-pattern. Pola ini tetap dipertahankan (bukan diganti lazy initializer di `useState`) karena itu justru pola yang BENAR untuk menghindari hydration mismatch SSR (server tidak punya akses `localStorage`) — di-suppress dengan komentar `eslint-disable-next-line` yang menjelaskan alasannya di satu baris spesifik saja.
- Verifikasi: `npm run build` ✅, `npm run lint` ✅, smoke test manual — `curl` ke `/live/[sessionId-tidak-ada]` mengembalikan `500` (wajar, karena query Prisma gagal tanpa DB), tapi dikonfirmasi server tidak crash dan route lain tetap sehat.
- **⚠️ Blocker sama**: belum bisa dites end-to-end dengan data transkrip sungguhan karena tidak ada DB aktif di environment ini.

---

### Phase 3 — AI Generation Engine (Week 5-7)

#### Module 5: LLM Integration
- [ ] LLM client wrapper (`lib/ai/llm-client.ts`)
  - Support Qwen API (cloud)
  - Support Ollama (local/self-hosted)
  - Configurable endpoint + model
- [ ] Prompt engineering templates:
  - Summarize prompt (Bahasa Indonesia context)
  - Mind map structure prompt (output JSON tree)
  - Quiz generation prompt (MCQ + explanation)
- [ ] Rate limiting + error handling
- [ ] Streaming response support

#### Module 6: Rangkuman Generator
- [ ] Trigger: guru klik "Generate Rangkuman" setelah sesi selesai
- [ ] Input: full transcript text
- [ ] LLM generate:
  - Rangkuman singkat (3-5 paragraf)
  - Key points (bullet list)
  - Istilah penting + definisi
- [ ] Save ke DB (Summary model)
- [ ] Preview di teacher dashboard
- [ ] Edit capability (guru bisa revisi sebelum publish)

#### Module 7: Mind Map Generator
- [ ] LLM generate hierarchical structure dari transcript:
  ```json
  {
    "topic": "Fotosintesis",
    "children": [
      {
        "label": "Proses",
        "children": [
          { "label": "Reaksi Terang" },
          { "label": "Siklus Calvin" }
        ]
      },
      {
        "label": "Komponen",
        "children": [
          { "label": "Klorofil" },
          { "label": "CO2 + H2O" }
        ]
      }
    ]
  }
  ```
- [ ] React Flow / D3.js render interactive mind map
- [ ] Fitur mind map:
  - Zoom, pan, drag nodes
  - Expand/collapse branch
  - Color-coded per topik
  - Click node → tampil detail/definisi
- [ ] Export mind map as image (canvas → PNG)
- [ ] Save structure ke DB (MindMap model)

#### Module 8: Quiz Generator
- [ ] LLM generate soal dari transcript:
  - Multiple choice (4 opsi)
  - Difficulty level (mudah/sedang/sulit)
  - Penjelasan jawaban benar
  - 5-15 soal per sesi
- [ ] Guru preview + edit soal sebelum launch
- [ ] Save ke DB (Quiz + QuizQuestion model)

---

### Phase 4 — Interactive Quiz System (Week 8-9)

#### Module 9: Quiz Lobby & Join
- [ ] Guru launch quiz → generate room code (6 digit)
- [ ] Siswa join via URL atau scan QR
- [ ] Lobby screen (proyektor): tampil siswa yang join real-time
- [ ] Siswa input nama (no account needed)
- [ ] WebSocket room management

#### Module 10: Quiz Gameplay
- [ ] Quizizz-style flow:
  - Soal tampil di proyektor + device siswa
  - Timer per soal (configurable: 15/30/60 detik)
  - Siswa jawab di device masing-masing
  - Real-time progress bar di proyektor
  - Streak bonus + speed bonus scoring
- [ ] Animasi transisi antar soal
- [ ] Sound effects (optional, toggle)
- [ ] Leaderboard update setiap soal selesai

#### Module 11: Quiz Results
- [ ] Final leaderboard (top 3 podium style)
- [ ] Per-soal breakdown: berapa persen jawab benar
- [ ] Review soal + pembahasan
- [ ] Save attempts ke DB (QuizAttempt model)

---

### Phase 5 — Resume & QR Code (Week 10-11)

#### Module 12: Resume Page
- [ ] `/r/[sessionId]` — halaman resume pembelajaran
- [ ] Konten resume:
  - Info sesi (mata pelajaran, topik, tanggal, guru)
  - Rangkuman lengkap
  - Mind map interaktif (bukan cuma gambar statis)
  - Daftar istilah penting
  - Soal + jawaban + pembahasan
  - Visual/infografis (generated atau template)
- [ ] Mobile-friendly (siswa buka di HP)
- [ ] Offline support (PWA / save as PDF option)
- [ ] Share button (WhatsApp, copy link)

#### Module 13: QR Code System
- [ ] Generate QR code per session → link ke resume page
- [ ] Tampil QR di proyektor setelah sesi selesai
- [ ] QR besar, scannable dari jarak jauh
- [ ] Guru bisa print QR (PDF export)
- [ ] QR include session metadata

---

### Phase 6 — Polish & Deploy (Week 12-13)

#### Module 14: UI/UX Polish
- [ ] Design system: warna, typography, spacing konsisten
- [ ] Projector mode: high contrast, font besar, minimal clutter
- [ ] Loading states + skeleton screens
- [ ] Error boundaries + user-friendly error messages
- [ ] Responsive: desktop (guru) + mobile (siswa) + projector (display)
- [ ] Animasi subtle (Framer Motion)

#### Module 15: Teacher Dashboard
- [ ] Dashboard overview: recent sessions, stats
- [ ] Session history: list semua sesi + status
- [ ] Session detail: transcript, rangkuman, mind map, quiz results
- [ ] Settings: AI model config, display preferences
- [ ] Class management (optional): daftar kelas + mata pelajaran

#### Module 16: Testing & Deploy
- [ ] Test STT accuracy (Bahasa Indonesia)
- [ ] Test LLM output quality (rangkuman, mind map, quiz)
- [ ] Test WebSocket stability (multiple clients)
- [ ] Test projector display (resolusi, readability)
- [ ] Docker compose setup (Next.js + PostgreSQL + Ollama)
- [ ] Deploy guide untuk sekolah (local server setup)
- [ ] Documentation: user manual guru + siswa

---

## Environment Variables

```env
# .env.local

# === DATABASE ===
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sibi_ai"

# === AUTH ===
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# === LLM PROVIDER CONFIG ===
# Options: "ollama" | "qwen" | "openrouter"
LLM_PROVIDER="ollama"

# Ollama (local, gratis — default untuk dev & daerah 3T)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:7b"

# Qwen Cloud API (opsional, kualitas lebih tinggi)
QWEN_API_KEY=""
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_MODEL="qwen-plus"

# OpenRouter (opsional, akses banyak model via satu API)
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="qwen/qwen-2.5-72b-instruct"

# === STT CONFIG ===
# Options: "browser" | "whisper"
# "browser" = Web Speech API (zero cost, client-side)
# "whisper" = server-side Whisper (lebih akurat, butuh resource)
STT_PROVIDER="browser"
WHISPER_MODEL="large-v3"

# === APP CONFIG ===
APP_URL="http://localhost:3000"
```

---

## LLM Integration — Implementation Reference

Claude Code: implementasikan `lib/ai/llm-client.ts` persis seperti pattern ini.
Wrapper harus provider-agnostic — switch provider cukup ganti env variable.

### Core LLM Client (`lib/ai/llm-client.ts`)

```typescript
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
}

async function callOllama(messages: LLMMessage[]): Promise<LLMResponse> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 4096 },
    }),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { content: data.message.content, model, provider: "ollama" };
}

async function callQwen(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) throw new Error("QWEN_API_KEY not set");
  const baseUrl = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = process.env.QWEN_MODEL || "qwen-plus";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
  });

  if (!response.ok) throw new Error(`Qwen error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { content: data.choices[0].message.content, model, provider: "qwen" };
}

async function callOpenRouter(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const model = process.env.OPENROUTER_MODEL || "qwen/qwen-2.5-72b-instruct";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
  });

  if (!response.ok) throw new Error(`OpenRouter error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { content: data.choices[0].message.content, model, provider: "openrouter" };
}

// Main entry — switch via env
export async function callLLM(messages: LLMMessage[]): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || "ollama";
  switch (provider) {
    case "ollama": return callOllama(messages);
    case "qwen": return callQwen(messages);
    case "openrouter": return callOpenRouter(messages);
    default: throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

// LLM sering bungkus JSON dalam markdown fence — helper ini strip itu
export function parseLLMJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as T;
}
```

### AI Service Layer (`lib/ai/services.ts`)

```typescript
import { callLLM, parseLLMJson } from "./llm-client";
import { PROMPTS } from "./prompts";

export async function generateSummary(transcript: string, subject: string, grade: string, topic: string) {
  const response = await callLLM([
    { role: "system", content: "Kamu asisten pendidikan Indonesia yang ahli merangkum materi. Output HANYA JSON valid." },
    { role: "user", content: PROMPTS.summarize(transcript, subject, grade, topic) },
  ]);
  return parseLLMJson<{
    summary: string;
    keyPoints: string[];
    glossary: { term: string; definition: string }[];
  }>(response.content);
}

export async function generateMindMap(transcript: string, subject: string) {
  const response = await callLLM([
    { role: "system", content: "Kamu menghasilkan struktur mind map dalam format JSON. Output HANYA JSON valid." },
    { role: "user", content: PROMPTS.mindmap(transcript, subject) },
  ]);
  return parseLLMJson<{ topic: string; children: MindMapNode[] }>(response.content);
}

export async function generateQuiz(transcript: string, subject: string, grade: string, count: number = 10) {
  const response = await callLLM([
    { role: "system", content: "Kamu membuat soal quiz pendidikan. Output HANYA JSON array valid." },
    { role: "user", content: PROMPTS.quiz(transcript, subject, grade, count) },
  ]);
  return parseLLMJson<QuizQuestion[]>(response.content);
}
```

### API Route Pattern (`app/api/ai/summarize/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai/services";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { transcript: true },
  });

  if (!session?.transcript) {
    return NextResponse.json({ error: "Transcript tidak ditemukan" }, { status: 404 });
  }

  const result = await generateSummary(
    session.transcript.fullText, session.subject, session.grade, session.title
  );

  const summary = await prisma.summary.upsert({
    where: { sessionId },
    update: { content: result.summary, keyPoints: result.keyPoints },
    create: { sessionId, content: result.summary, keyPoints: result.keyPoints },
  });

  return NextResponse.json({ summary, glossary: result.glossary });
}
```

---

## Speech-to-Text — Implementation Reference

### Browser Web Speech API (`lib/stt/speech-handler.ts`)

```typescript
// Client-side only — import di "use client" component

export class SpeechHandler {
  private recognition: SpeechRecognition | null = null;
  private onChunk: (text: string, isFinal: boolean) => void;

  constructor(onChunk: (text: string, isFinal: boolean) => void) {
    this.onChunk = onChunk;
  }

  start(lang: string = "id-ID") {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error("Browser tidak support Speech Recognition");

    this.recognition = new SR();
    this.recognition.lang = lang;          // "id-ID" Bahasa Indonesia
    this.recognition.continuous = true;     // terus rekam
    this.recognition.interimResults = true; // tampil hasil sementara

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.onChunk(result[0].transcript, result.isFinal);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("STT error:", event.error);
      if (event.error === "network") setTimeout(() => this.recognition?.start(), 1000);
    };

    // Browser auto-stop setelah silence, restart otomatis
    this.recognition.onend = () => this.recognition?.start();
    this.recognition.start();
  }

  stop() { this.recognition?.stop(); this.recognition = null; }
  pause() { this.recognition?.stop(); }
  resume() { this.recognition?.start(); }
}
```

### WebSocket Events (Socket.IO)

```typescript
// === EVENT MAP ===

// Guru → Server
"transcript:chunk"    { sessionId, text, isFinal, timestamp }
"session:start"       { sessionId }
"session:end"         { sessionId }
"quiz:launch"         { sessionId, quizId }
"quiz:next"           { sessionId }

// Server → Proyektor/Siswa (broadcast ke room)
"transcript:update"   { text, isFinal, timestamp }
"session:status"      { status: SessionStatus }
"ai:generating"       { type: "summary" | "mindmap" | "quiz", progress }
"ai:result"           { type, data }
"quiz:question"       { question, options, timeLimit, questionNumber }
"quiz:leaderboard"    { rankings: { name, score }[] }

// Siswa → Server
"quiz:join"           { sessionId, playerName }
"quiz:answer"         { questionId, answer, timeSpent }

// Server → Siswa
"quiz:joined"         { success, totalPlayers }
"quiz:result"         { correct, explanation, score }
```

---

## NPM Dependencies

```bash
# Init
npx create-next-app@latest sibi-ai --typescript --tailwind --app --src-dir

# Database
npm install prisma @prisma/client
npx prisma init

# Auth
npm install next-auth @next-auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs

# Real-time
npm install socket.io socket.io-client

# Mind Map (pilih salah satu)
npm install reactflow

# QR Code
npm install qrcode
npm install -D @types/qrcode

# UI
npm install framer-motion lucide-react clsx tailwind-merge

# Export
npm install html-to-image jspdf
```

---

## Ollama Setup (Local LLM)

```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Download model (pilih sesuai RAM)
ollama pull qwen2.5:7b      # 8GB RAM — rekomendasi default
ollama pull qwen2.5:3b      # 4GB RAM — low-spec
ollama pull qwen2.5:14b     # 16GB RAM — kualitas terbaik

# Verify
curl http://localhost:11434/api/tags

# Test
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:7b",
  "messages": [{"role":"user","content":"Rangkum tentang fotosintesis dalam 3 kalimat"}],
  "stream": false
}'
```

---

## Docker Compose (Production Deploy)

```yaml
version: "3.8"
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/sibi_ai
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5:7b
    depends_on: [db, ollama]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sibi_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]

  ollama:
    image: ollama/ollama:latest
    volumes: [ollama_data:/root/.ollama]
    ports: ["11434:11434"]

volumes:
  pgdata:
  ollama_data:
```

---

## UI/UX Reference — 4 Layar Utama

Referensi visual buat Claude Code pas ngerjain Module 4, 9-11, 12, dan 14. Style: flat, minim border, whitespace lega, no gradient/shadow berlebih.

### 1. Panel Kontrol Guru (`/session/[id]/control`)
Device guru (laptop/tablet), non-projector.
- Header: judul sesi ("IPA · Fotosintesis") + info kelas ("Kelas 8B")
- Badge status: "● Merekam" (merah, pulsing dot) / "Jeda" / "Selesai"
- Box preview transcript live: teks abu-abu, scroll otomatis, tampil 2-3 kalimat terakhir
- Action buttons: Jeda/Resume, Selesai sesi — full width, sejajar
- Setelah "Selesai sesi" → trigger AI generation (loading state: "Membuat rangkuman...", "Menyusun mind map...", "Menyiapkan quiz...")

### 2. Layar Proyektor — Live Caption (`/live/[sessionId]`)
Full-screen, projector-friendly.
- Background gelap solid (bukan gradient), teks putih besar (20-24px+)
- Caption mode: 2-3 baris terakhir aja, auto-fade teks lama
- Highlight kata kunci penting (warna aksen beda, contoh teal) — hasil dari NLP keyword extraction
- Center-aligned, line-height lega (1.6+) biar gampang dibaca dari jarak jauh
- Toggle mode (guru kontrol): caption mode vs full transcript scroll mode

### 3. Quiz Screen (`/quiz/[sessionId]`)
Dua device beda: proyektor (tampil soal+leaderboard) dan HP siswa (tampil opsi jawab).
- Header: progress ("Soal 4 dari 10") + timer countdown (warna berubah pas mepet waktu)
- Pertanyaan: font besar, jelas
- 4 opsi jawaban dalam grid 2x2, warna netral — abu-abu, BUKAN warna jawaban benar (biar gak bocor)
- Setelah waktu habis: highlight jawaban benar (hijau), tampilkan persentase siswa yang jawab tiap opsi
- Footer: jumlah siswa yang udah jawab (real-time count) + leaderboard sementara (top 1)
- Antar soal ada transisi animasi ringan (Framer Motion, bukan yang berat)

### 4. Halaman Resume (`/r/[sessionId]`)
Mobile-first (siswa buka di HP via scan QR), single card layout, max-width ~360-400px.
- Header: judul topik, info sesi (mapel, kelas, tanggal)
- Section rangkuman: card terpisah, teks ringkas 3-5 kalimat
- Section mind map: card terpisah, PREVIEW interaktif (bukan gambar statis) — node bisa di-tap buat expand/zoom, warna per cabang topik berbeda (semantic color, bukan random)
- Section soal+jawaban: list collapsible, tiap soal expand buat liat pembahasan
- Semua section pakai card dengan background sedikit beda dari body (`--surface-1` di atas `--surface-2`) biar section-nya kebaca jelas tanpa border tebal

### Prinsip desain keseluruhan
- **Proyektor** = kontras tinggi, font gede, minim elemen (guru & siswa liat dari jauh)
- **Device guru** = dense tapi tetep rapi, banyak kontrol dalam satu layar
- **Device siswa (quiz + resume)** = mobile-first, touch-friendly, card-based
- **Warna semantic** — jangan warna acak: hijau = benar/sukses, merah = urgent/waktu abis, netral = default state
- **Tidak pakai warna gelap/pekat di background utama** kecuali khusus proyektor (biar gak berat di mata siswa waktu baca resume di HP)

---

## Claude Code Instructions

Ketika mengerjakan project ini via Claude Code, ikuti aturan:

1. **Baca `taskplan.md` sebelum mulai** — single source of truth
2. **Kerjakan per module berurutan** — Phase 1 dulu, jangan loncat
3. **Setiap selesai module, update checklist** — tandai `[x]`
4. **LLM pakai wrapper pattern di atas** — JANGAN hardcode ke satu provider
5. **Semua AI output harus JSON parseable** — pakai `parseLLMJson()` helper
6. **Bahasa Indonesia** — prompt, UI text, error message
7. **Environment variables** — JANGAN hardcode API key/URL
8. **Socket.IO custom server** — Next.js App Router gak native support WebSocket
9. **Prisma** — `npx prisma db push` setelah edit schema
10. **Setiap module buat commit** — `feat(module-X): deskripsi singkat`

### Quick Commands

```bash
cd sibi-ai && npm run dev              # start dev
npx prisma db push                     # sync schema
npx prisma studio                      # GUI database
ollama serve                           # start LLM
ollama pull qwen2.5:7b                 # download model
```

---

## LLM Prompt Templates (Draft)

### Summarize Prompt
```
Kamu adalah asisten pendidikan. Berdasarkan transkrip pembelajaran berikut, buatkan:
1. Rangkuman singkat (3-5 paragraf, bahasa mudah dipahami siswa)
2. Poin-poin kunci (5-10 poin utama)
3. Daftar istilah penting beserta definisinya

Mata Pelajaran: {subject}
Kelas: {grade}
Topik: {topic}

Transkrip:
{transcript}
```

### Mind Map Prompt
```
Berdasarkan transkrip pembelajaran berikut, buatkan struktur mind map dalam format JSON.
Aturan:
- Topik utama sebagai root node
- Maksimal 3 level kedalaman
- Setiap node punya "label" (singkat, 2-5 kata) dan opsional "detail" (penjelasan 1 kalimat)
- Kelompokkan berdasarkan sub-topik logis

Output HANYA JSON, tanpa teks lain:
{
  "topic": "...",
  "children": [
    {
      "label": "...",
      "detail": "...",
      "children": [...]
    }
  ]
}

Transkrip:
{transcript}
```

### Quiz Generation Prompt
```
Berdasarkan transkrip pembelajaran berikut, buatkan {count} soal pilihan ganda.
Setiap soal harus:
- Relevan dengan materi yang disampaikan
- Punya 4 opsi jawaban (A, B, C, D)
- Sertakan jawaban benar dan penjelasan singkat
- Variasi tingkat kesulitan (mudah, sedang, sulit)

Output dalam format JSON array:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "...",
    "difficulty": "mudah"
  }
]

Mata Pelajaran: {subject}
Kelas: {grade}
Transkrip:
{transcript}
```

---

## Priority Order

1. **STT + Live Display** (core feature, demo-able pertama)
2. **LLM Summarize + Mind Map** (value proposition utama)
3. **Quiz System** (engagement, wow factor buat juri)
4. **QR Resume** (deliverable buat siswa)
5. **Polish + Deploy** (production ready)

---

## Risk & Mitigation

| Risk | Mitigation |
|---|---|
| STT Bahasa Indonesia kurang akurat | Whisper large-v3 support Indo, fallback manual edit |
| LLM response lambat | Streaming response, loading animation, cache results |
| Internet tidak stabil di 3T | Ollama local deployment, PWA offline resume |
| Proyektor resolusi rendah | High contrast mode, font besar, minimal UI |
| Banyak siswa join quiz sekaligus | WebSocket room management, stress test |
| Qwen API cost | Ollama self-hosted (gratis), atau model kecil yang cukup |

---

## Notes

- Bahasa Indonesia jadi bahasa utama semua output AI
- Mind map HARUS interaktif (zoom, pan, expand/collapse), bukan gambar statis
- Resume page harus visual-rich: mind map interaktif + infografis, bukan wall of text
- Quiz harus fun: animasi, leaderboard, timer — mirip Quizizz biar siswa engaged
- Semua fitur harus works offline-first atau low-bandwidth friendly untuk daerah 3T

## Feedback 10/07/2026
- qr code berhasil diakses, tetapi siswa tidak bisa melihat mindmappping yang telah digenerate guru, dan tidak bisa didownload diperangkat yang akses link
- khusus bagian soal yang digenerate, konsep yang diammbil terlalu menyulitkan guru, cukup klik satu tombol dan siswa bisa mengerjakan soal sesuai waktu yang ditentukan saja, tidak perlu harus klik "soal selanjutnya" agar soal bisa lanjut terus
- untuk tampilan ke-2 qr code mohon untuk ditamppilkan bersebelahan, anatara qr-code untuk rangkuman dan mindmapping, dengann qr-code untuk quiz agar tidak membingungkan
- untuk mekanisme quiz, nantinya diserahkan kepada guru yang memegang sesi pelajaran saat itu untuk menentukan dimullai atau tidak, jika guru belu klik tombol mulai pada perangkat guru maka quiz masih belum berjalan, jika iya, maka quiz berjalan sesuai dengan waktu pengerjaan yang sudah diatur dipengaturan. setelah quiz selesai, skor ditampilkan dilayar agar dapat melihat siapa saja yang menjawab dengan benar dan melihat peringkat 
- untuk ui sendiri overall sudah bagus dan mudah dipahami, tetapi masih sedikit membingungkan untuk orang awam seperti guru yang jarang memegang perangkat sebelumnya, mohon diperbaiki, agar guru fungsi cortisol tidak membingungkan diawal, (saran mungkin untuk button penting diberikan warna yang berbeda)
- overall sudah sangat baik saya kasih nilai 7/10,  lanjutkan penginstallan doker dan kita akan coba masuk tahap selanjutnya d besok hari

### Module 17 (rencana): Perbaikan berdasarkan Feedback 10/07/2026

Belum dikerjakan — daftar kerja buat sesi besok, dipecah dari feedback mentah di atas jadi item konkret. Catatan diagnosis awal (belum diverifikasi, baru hasil baca kode cepat) disertakan supaya besok tidak mulai dari nol.

- [ ] **Mind map tidak muncul/tidak bisa didownload di HP siswa.** Diagnosis awal: `ResumeView` (`src/components/resume/ResumeView.tsx`) sudah render `InteractiveMindMap` kalau `mindMap` ada, dan render fallback "Mind map belum tersedia" kalau `null` — jadi kemungkinan besar penyebabnya guru belum klik generate mind map di halaman `/session/[id]` sebelum QR dibagikan ke siswa (bukan mindmap-nya gagal render, tapi memang belum pernah di-generate untuk sesi itu), TAPI perlu diverifikasi langsung besok dengan sesi baru + generate mind map dulu baru scan QR. Kalau ternyata sudah di-generate tapi tetap tidak muncul di HP, berarti bug rendering React Flow di mobile browser (perlu dicek console error di HP). Untuk "tidak bisa didownload" — cek `ResumeActions`/export PDF (`jsPDF`), kemungkinan trigger download tidak jalan di mobile Chrome (behavior download blob/file beda di mobile vs desktop).
- [ ] **Quiz gameplay: hapus tombol manual "soal selanjutnya", ganti auto-advance per timer.** Guru cukup 1x klik "Mulai" di awal; tiap soal otomatis lanjut begitu waktu habis (bukan nunggu klik manual tiap soal). Perlu ubah `QuizGameplay`/komponen terkait + event socket yang relevan (lihat Module 10).
- [ ] **Tampilan QR kedua (di layar proyektor) — QR rangkuman+mindmap dan QR quiz ditampilkan BERSEBELAHAN**, bukan terpisah/bergantian, biar siswa tidak bingung QR mana yang mana. Kemungkinan di `/live/[sessionId]` dan/atau `/quiz/[sessionId]` (`src/app/(display)/...`), perlu layout 2 kolom dengan label jelas per QR.
- [ ] **Quiz start dikontrol penuh oleh guru** — siswa yang sudah join lobby harus nunggu, quiz baru mulai serentak begitu guru klik "Mulai" di perangkatnya (bukan mulai sendiri-sendiri per siswa). Setelah waktu habis sesuai durasi yang diset guru, quiz otomatis selesai dan **skor + ranking ditampilkan di layar** (proyektor) supaya semua siswa bisa lihat siapa benar dan peringkatnya. Ini kemungkinan sudah sebagian ada (lihat Module 9-11 quiz lobby/gameplay/results) — perlu diaudit ulang apakah start-nya benar-benar guru-gated atau masih bisa mulai sendiri per klien.
- [ ] **UI onboarding buat guru awam** — tombol-tombol penting (Mulai Merekam, Generate, Mulai Quiz, dst) dikasih warna aksen yang beda/menonjol dari tombol sekunder, supaya guru yang belum familiar teknologi tidak bingung harus klik yang mana duluan. Bisa juga pertimbangkan tooltip/label penuntun di first-time use.
- [ ] **Setelah semua di atas selesai**: update checklist ini dan tulis catatan implementasi lengkap (pola yang sama seperti Module 1-16), lalu jalan `npm run build` + `npm run lint`, test manual ulang end-to-end (guru generate → siswa scan QR → lihat rangkuman/mindmap/quiz → quiz jalan dikontrol guru → skor tampil).
- [ ] **Mind Mapping Realtime**: update proses generate mind mapping agar pada layar yang ditampilkan ke siswa juga bisa melihat proses mindmapping dibuat, pembuatan dibuat dalam animasi smooth gerakan dari cabang inti ke cabang-cabaang anak lainnya

**Skor guru hari ini: 7/10.** Root cause sebagian besar feedback: fitur-fitur yang selama ini cuma diuji lewat script (`test-*.mjs`) atau asumsi desain di taskplan, belum pernah dipakai end-to-end oleh user asli lewat UI sungguhan sampai hari ini — jadi baru ketauan sekarang. Ini konsisten dengan pola temuan modul-modul sebelumnya (bug `server.ts` env loading, bug mind map topic) yang juga baru ketauan pas testing nyata, bukan pas development.
