import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedQuiz } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitToSession } from "@/lib/socket/server";

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { quizId } = await req.json();
  if (!quizId) {
    return NextResponse.json({ error: "quizId wajib diisi" }, { status: 400 });
  }

  const owned = await getOwnedQuiz(quizId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
  }

  const quiz = await prisma.quiz.update({
    where: { id: quizId },
    data: { validatedAt: new Date() },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  emitToSession(owned.sessionId, "content:validated", { type: "quiz" });

  return NextResponse.json({ quiz });
}
