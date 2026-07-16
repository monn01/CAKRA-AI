import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateMindMap } from "@/lib/ai/services";
import { LLMError } from "@/lib/ai/llm-client";
import type { Prisma } from "@/generated/prisma/client";

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

  const mindMap = await prisma.mindMap.findUnique({ where: { sessionId } });
  return NextResponse.json({ mindMap });
}

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

  const transcript = await prisma.transcript.findUnique({ where: { sessionId } });
  if (!transcript?.fullText.trim()) {
    return NextResponse.json(
      { error: "Transkrip belum tersedia untuk sesi ini" },
      { status: 400 }
    );
  }

  try {
    const result = await generateMindMap(transcript.fullText, owned.subject, owned.title);
    const structure = result as unknown as Prisma.InputJsonValue;

    const mindMap = await prisma.mindMap.upsert({
      where: { sessionId },
      update: { structure, validatedAt: null },
      create: { sessionId, structure },
    });

    return NextResponse.json({ mindMap });
  } catch (err) {
    const message = err instanceof LLMError ? err.message : "Gagal membuat mind map";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
