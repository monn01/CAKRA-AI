import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RiwayatShell } from "@/components/teacher/RiwayatShell";

export default async function RiwayatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const teacherId = (session.user as { id: string }).id;
  const teacherName = session.user.name ?? "Guru";

  const sessions = await prisma.session.findMany({
    where: { teacherId },
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    include: { quizzes: { select: { id: true } } },
  });

  const allQuizIds = sessions.flatMap((s) => s.quizzes.map((q) => q.id));

  const attempts =
    allQuizIds.length > 0
      ? await prisma.quizAttempt.findMany({
          where: { quizId: { in: allQuizIds } },
          select: { quizId: true, playerName: true },
        })
      : [];

  const quizIdToSessionId = new Map<string, string>();
  for (const s of sessions) {
    for (const q of s.quizzes) quizIdToSessionId.set(q.id, s.id);
  }

  const studentsPerSession = new Map<string, Set<string>>();
  for (const attempt of attempts) {
    const sessionId = quizIdToSessionId.get(attempt.quizId);
    if (!sessionId) continue;
    const set = studentsPerSession.get(sessionId) ?? new Set<string>();
    set.add(attempt.playerName);
    studentsPerSession.set(sessionId, set);
  }

  const items = sessions.map((s) => {
    const dateLabel = (s.startedAt ?? s.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const durationMs =
      s.startedAt && s.endedAt ? s.endedAt.getTime() - s.startedAt.getTime() : null;

    return {
      id: s.id,
      title: s.title,
      subject: s.subject,
      grade: s.grade,
      status: s.status,
      dateLabel,
      durationMs,
      studentCount: studentsPerSession.get(s.id)?.size ?? 0,
      createdAt: s.createdAt.toISOString(),
    };
  });

  return <RiwayatShell sessions={items} teacherName={teacherName} />;
}
