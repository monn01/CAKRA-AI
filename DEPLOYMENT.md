# Panduan Deploy SIBI-AI untuk Sekolah

Panduan ini untuk staf IT sekolah yang mau menjalankan SIBI-AI di server lokal (laptop/PC/mini-server sekolah), termasuk untuk sekolah di daerah 3T dengan internet terbatas.

## Kebutuhan Server

- **CPU/RAM**: minimal 4 core, 8GB RAM (16GB direkomendasikan kalau mau pakai model Ollama yang lebih besar dari `qwen2.5:7b`)
- **Storage**: minimal 20GB kosong (model AI + database + aplikasi)
- **OS**: Linux/Windows/macOS apa saja yang bisa jalanin Docker
- **Docker** dan **Docker Compose** terpasang ([panduan instal Docker](https://docs.docker.com/get-docker/))

## Langkah Deploy

### 1. Siapkan file environment

Copy `.env.example` (atau lihat bagian "Environment Variables" di `taskplan.md`) jadi file `.env` di root project, lalu isi minimal:

```env
NEXTAUTH_SECRET="ganti-dengan-string-acak-panjang"
NEXTAUTH_URL="http://<ip-server-sekolah>:3000"
APP_URL="http://<ip-server-sekolah>:3000"
LLM_PROVIDER="ollama"
OLLAMA_MODEL="qwen2.5:7b"
```

Generate `NEXTAUTH_SECRET` yang aman, contoh:

```bash
openssl rand -base64 32
```

`NEXTAUTH_URL` dan `APP_URL` **harus** pakai alamat IP/domain server sekolah yang bisa diakses dari perangkat guru dan siswa di jaringan yang sama (bukan `localhost`), supaya QR code dan link resume bisa dibuka dari HP siswa.

### 2. Jalankan Docker Compose

```bash
docker compose up -d --build
```

Ini akan menjalankan 3 container: `app` (SIBI-AI), `db` (PostgreSQL), `ollama` (LLM lokal).

### 3. Download model Ollama (sekali saja)

```bash
docker compose exec ollama ollama pull qwen2.5:7b
```

Pilih model sesuai RAM server (lihat bagian "Ollama Setup" di `taskplan.md` untuk pilihan `qwen2.5:3b`/`qwen2.5:14b`).

### 4. Sinkronkan skema database (sekali saja, atau tiap ada perubahan schema.prisma)

```bash
docker compose exec app npx prisma db push
```

### 5. Buat akun guru pertama

Aplikasi ini **tidak punya halaman pendaftaran** (`signup`) — akun guru dibuat lewat skrip `scripts/create-teacher.mjs` (bikin baru atau update password kalau emailnya sudah ada):

```bash
docker compose exec app npm run create-teacher -- "Nama Guru" guru@sekolah.sch.id password-guru
```

Kalau perlu lihat/edit data langsung, `npx prisma studio` (lewat `docker compose exec app npx prisma studio`, buka `http://<ip-server>:5555`) tetap bisa dipakai sebagai alternatif.

### 6. Verifikasi

- Buka `http://<ip-server-sekolah>:3000` dari browser guru → harus redirect ke halaman login.
- Login pakai akun yang baru dibuat.
- Buat sesi baru, coba rekam suara singkat, cek transkrip muncul di `/live/[sessionId]` yang dibuka di layar proyektor.

## Update Aplikasi

```bash
git pull
docker compose up -d --build
docker compose exec app npx prisma db push   # kalau ada perubahan schema.prisma
```

## Troubleshooting

| Masalah | Kemungkinan Penyebab |
|---|---|
| Halaman blank/500 terus | Cek `docker compose logs app` — biasanya `DATABASE_URL` salah atau `db` belum siap (`docker compose ps` buat cek status healthcheck) |
| Login gagal terus padahal password benar | `NEXTAUTH_SECRET` beda antara saat generate hash password vs saat runtime — pastikan `.env` konsisten |
| AI generation gagal/timeout | Model Ollama belum ke-pull (`docker compose exec ollama ollama list` buat cek), atau RAM server tidak cukup buat model yang dipilih |
| QR code / link resume tidak bisa dibuka dari HP siswa | `NEXTAUTH_URL`/`APP_URL` masih `localhost` — harus IP/domain yang bisa diakses dari jaringan sekolah |
| STT (Web Speech API) tidak jalan | Browser guru harus Chrome/Edge terbaru dan **HTTPS** (atau `localhost`) — Web Speech API browser tidak jalan di HTTP biasa kecuali localhost. Untuk deploy production, pertimbangkan reverse proxy dengan TLS (mis. Caddy/nginx + Let's Encrypt, atau self-signed cert untuk jaringan lokal sekolah) |

> ⚠️ **Catatan jujur**: konfigurasi Docker di atas belum pernah benar-benar di-build/dijalankan — environment pengerjaan proyek ini tidak punya Docker terpasang. Dockerfile dan docker-compose.yml ditulis mengikuti pattern standar Next.js + Prisma + custom server yang sudah teruji, tapi sekolah yang deploy pertama kali sebaiknya siap troubleshoot hal-hal kecil (versi base image, dependency native, dsb).
