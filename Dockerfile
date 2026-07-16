# SIBI-AI — Node 24 dibutuhkan karena custom server (server.ts) dieksekusi
# langsung oleh Node (native TypeScript execution), bukan lewat next build.
FROM node:24-alpine

# libc6-compat dibutuhkan beberapa native dependency Next.js di Alpine.
# libreoffice + poppler-utils dibutuhkan src/lib/ppt/convert.ts (soffice + pdftoppm)
# buat konversi PPT guru jadi gambar per-slide yang ditampilkan di layar proyektor —
# tanpa ini, upload PPT tetap jalan (lampiran unduh), cuma slide tidak akan pernah tampil.
RUN apk add --no-cache libc6-compat libreoffice poppler-utils

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Prisma client di-generate dari schema — tidak butuh koneksi DB, cuma baca schema.prisma
RUN npx prisma generate

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# server.ts (custom server) tidak dibundle next build — file .ts sumber
# dan node_modules harus tetap ada di image runtime (bukan cuma next standalone output,
# yang menurut dokumentasi Next.js tidak kompatibel dengan custom server).
#
# `prisma db push` dijalankan tiap container start (bukan cuma sekali manual) supaya
# skema di database produksi otomatis sinkron begitu image baru di-deploy — aman
# diulang (idempotent), konsisten dengan alur `npx prisma db push` yang dipakai
# sepanjang proyek ini (bukan `prisma migrate`).
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
