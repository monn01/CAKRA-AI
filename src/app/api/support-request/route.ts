import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["RESET_PASSWORD", "GENERAL"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, name, email, message } = body as {
    type?: string;
    name?: string;
    email?: string;
    message?: string;
  };

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Jenis permintaan tidak valid" }, { status: 400 });
  }
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nama dan email wajib diisi" }, { status: 400 });
  }

  const supportRequest = await prisma.supportRequest.create({
    data: {
      type,
      name: name.trim(),
      email: email.trim(),
      message: message?.trim() || null,
    },
  });

  return NextResponse.json({ supportRequest: { id: supportRequest.id } });
}
