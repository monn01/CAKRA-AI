import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wajib diisi" }, { status: 400 });
  }

  const owned = await getOwnedSession(sessionId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const transcript = await prisma.transcript.findUnique({
    where: { sessionId },
    include: { chunks: { orderBy: { timestamp: "asc" } } },
  });

  return NextResponse.json({ transcript });
}

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { sessionId, text, timestamp } = await req.json();
  if (!sessionId || !text || timestamp === undefined) {
    return NextResponse.json(
      { error: "sessionId, text, dan timestamp wajib diisi" },
      { status: 400 }
    );
  }

  const owned = await getOwnedSession(sessionId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.transcript.findUnique({ where: { sessionId } });

  const transcript = existing
    ? await prisma.transcript.update({
        where: { sessionId },
        data: {
          fullText: `${existing.fullText} ${text}`.trim(),
          chunks: { create: { text, timestamp } },
        },
      })
    : await prisma.transcript.create({
        data: {
          sessionId,
          fullText: text,
          chunks: { create: { text, timestamp } },
        },
      });

  return NextResponse.json({ transcript }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { sessionId, fullText } = await req.json();
  if (!sessionId || fullText === undefined) {
    return NextResponse.json(
      { error: "sessionId dan fullText wajib diisi" },
      { status: 400 }
    );
  }

  const owned = await getOwnedSession(sessionId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const transcript = await prisma.transcript.update({
    where: { sessionId },
    data: { fullText },
  });

  return NextResponse.json({ transcript });
}
