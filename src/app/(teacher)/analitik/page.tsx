import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalitikShell } from "@/components/teacher/AnalitikShell";

export default async function AnalitikPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const teacherId = (session.user as { id: string }).id;
  const teacherName = session.user.name ?? "Guru";

  const [sessions, summaries, mindMaps, quizzes] = await Promise.all([
    prisma.session.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.summary.findMany({
      where: { session: { teacherId } },
      select: { sessionId: true, createdAt: true },
    }),
    prisma.mindMap.findMany({
      where: { session: { teacherId } },
      select: { sessionId: true, createdAt: true },
    }),
    prisma.quiz.findMany({
      where: { session: { teacherId } },
      select: {
        id: true,
        sessionId: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    }),
  ]);

  const quizIds = quizzes.map((q) => q.id);
  const rawAttempts =
    quizIds.length > 0
      ? await prisma.quizAttempt.findMany({
          where: { quizId: { in: quizIds } },
          select: { quizId: true, playerName: true, answers: true },
        })
      : [];

  // QuizAttempt.answers = Record<questionId, { answer, correct, timeSpent }>
  // (pola sama seperti src/lib/quiz-results.ts) — dihitung jadi akurasi %
  // per attempt di server, biar client gak perlu tau bentuk JSON-nya.
  const attempts = rawAttempts.map((a) => {
    const answers = a.answers as Record<string, { correct: boolean }> | null;
    const values = answers ? Object.values(answers) : [];
    const totalAnswered = values.length;
    const correctCount = values.filter((v) => v.correct).length;
    return {
      quizId: a.quizId,
      playerName: a.playerName,
      accuracy: totalAnswered > 0 ? correctCount / totalAnswered : null,
    };
  });

  return (
    <AnalitikShell
      teacherName={teacherName}
      sessions={sessions.map((s) => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        grade: s.grade,
        createdAt: s.createdAt.toISOString(),
        startedAt: s.startedAt?.toISOString() ?? null,
        endedAt: s.endedAt?.toISOString() ?? null,
      }))}
      summaries={summaries.map((s) => ({
        sessionId: s.sessionId,
        createdAt: s.createdAt.toISOString(),
      }))}
      mindMaps={mindMaps.map((m) => ({
        sessionId: m.sessionId,
        createdAt: m.createdAt.toISOString(),
      }))}
      quizzes={quizzes.map((q) => ({
        id: q.id,
        sessionId: q.sessionId,
        createdAt: q.createdAt.toISOString(),
        questionCount: q._count.questions,
      }))}
      attempts={attempts}
    />
  );
}
