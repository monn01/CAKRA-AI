// Buat/update akun guru — dipakai karena aplikasi ini sengaja tidak punya
// halaman signup (lihat taskplan.md Modul 1). Jalankan:
//
//   node scripts/create-teacher.mjs "Nama Guru" guru@sekolah.sch.id password123
//
// atau lewat npm: npm run create-teacher -- "Nama Guru" guru@sekolah.sch.id password123

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error("Pemakaian: node scripts/create-teacher.mjs <nama> <email> <password>");
  process.exit(1);
}

const hashed = await bcrypt.hash(password, 10);

const teacher = await prisma.teacher.upsert({
  where: { email },
  update: { name, password: hashed },
  create: { name, email, password: hashed },
});

console.log(`Akun guru siap: ${teacher.email} (${teacher.name})`);

await prisma.$disconnect();
