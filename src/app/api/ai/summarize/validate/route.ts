import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitToSession } from "@/lib/socket/server";

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wajib diisi" }, { status: 400 });
  }

  const owned = await getOwnedSession(sessionId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const summary = await prisma.summary.update({
    where: { sessionId },
    data: { validatedAt: new Date() },
  });

  emitToSession(sessionId, "content:validated", { type: "summary" });

  return NextResponse.json({ summary });
}
