import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedSession, getOwnedQuiz } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateQuiz, type QuizDifficulty } from "@/lib/ai/services";
import { LLMError } from "@/lib/ai/llm-client";
import type { Prisma } from "@/generated/prisma/client";

const VALID_DIFFICULTIES: QuizDifficulty[] = ["mudah", "sedang", "sulit"];

function normalizeDifficulty(value: unknown): QuizDifficulty {
  const lower = String(value).toLowerCase();
  return (VALID_DIFFICULTIES as string[]).includes(lower) ? (lower as QuizDifficulty) : "sedang";
}

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

  const quizzes = await prisma.quiz.findMany({
    where: { sessionId },
    include: { questions: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { sessionId, count } = await req.json();
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

  const soalCount = Math.min(15, Math.max(5, Number(count) || 10));

  try {
    const result = await generateQuiz(transcript.fullText, owned.subject, owned.grade, soalCount);

    const quiz = await prisma.quiz.create({
      data: {
        sessionId,
        questions: {
          create: result.map((q, i) => ({
            question: q.question,
            options: q.options as unknown as Prisma.InputJsonValue,
            correctAnswer: q.correct,
            explanation: q.explanation,
            difficulty: normalizeDifficulty(q.difficulty),
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ quiz });
  } catch (err) {
    const message = err instanceof LLMError ? err.message : "Gagal membuat soal quiz";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { quizId, questions } = await req.json();
  if (!quizId || !Array.isArray(questions)) {
    return NextResponse.json(
      { error: "quizId dan questions wajib diisi" },
      { status: 400 }
    );
  }

  const owned = await getOwnedQuiz(quizId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
  }

  const quiz = await prisma.$transaction(async (tx) => {
    await tx.quizQuestion.deleteMany({ where: { quizId } });
    await tx.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          create: questions.map(
            (
              q: {
                question: string;
                options: string[];
                correctAnswer: string;
                explanation?: string;
                difficulty?: string;
              },
              i: number
            ) => ({
              question: q.question,
              options: q.options as unknown as Prisma.InputJsonValue,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: normalizeDifficulty(q.difficulty),
              order: i,
            })
          ),
        },
      },
    });
    return tx.quiz.findUniqueOrThrow({
      where: { id: quizId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json({ quiz });
}
