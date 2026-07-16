import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/ai/services";
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

  const summary = await prisma.summary.findUnique({ where: { sessionId } });
  return NextResponse.json({ summary });
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
    const result = await generateSummary(
      transcript.fullText,
      owned.subject,
      owned.grade,
      owned.title
    );

    const keyPoints = result.keyPoints as unknown as Prisma.InputJsonValue;
    const glossary = result.glossary as unknown as Prisma.InputJsonValue;

    const summary = await prisma.summary.upsert({
      where: { sessionId },
      update: { content: result.summary, keyPoints, glossary },
      create: { sessionId, content: result.summary, keyPoints, glossary },
    });

    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof LLMError ? err.message : "Gagal membuat rangkuman";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { sessionId, content, keyPoints, glossary } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wajib diisi" }, { status: 400 });
  }

  const owned = await getOwnedSession(sessionId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const summary = await prisma.summary.update({
    where: { sessionId },
    data: {
      ...(content !== undefined && { content }),
      ...(keyPoints !== undefined && { keyPoints }),
      ...(glossary !== undefined && { glossary }),
    },
  });

  return NextResponse.json({ summary });
}
