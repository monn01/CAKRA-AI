# SIBI-AI — Node 24 dibutuhkan karena custom server (server.ts) dieksekusi
# langsung oleh Node (native TypeScript execution), bukan lewat next build.
FROM node:24-alpine

# libc6-compat dibutuhkan beberapa native dependency Next.js di Alpine
RUN apk add --no-cache libc6-compat

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
CMD ["npm", "start"]
