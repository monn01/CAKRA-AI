import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter` },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    const teacher = await prisma.teacher.create({
      data: { name: name.trim(), email: email.trim(), password: hashed },
    });
    return NextResponse.json({ teacher: { id: teacher.id, email: teacher.email } });
  } catch (err) {
    const isUniqueViolation =
      typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ error: "Email ini sudah terdaftar" }, { status: 409 });
    }
    throw err;
  }
}
