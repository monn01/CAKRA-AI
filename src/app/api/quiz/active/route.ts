import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wajib diisi" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findFirst({
    where: { sessionId, status: { in: ["LOBBY", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      roomCode: true,
      status: true,
      _count: { select: { questions: true } },
    },
  });

  if (!quiz) {
    return NextResponse.json({ quiz: null });
  }

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      roomCode: quiz.roomCode,
      status: quiz.status,
      questionCount: quiz._count.questions,
    },
  });
}
