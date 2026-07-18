import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { RingkasanShell } from "@/components/teacher/RingkasanShell";

function getGreeting(name: string, now: Date) {
  const hour = now.getHours();
  const timeLabel = hour < 11 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";
  return `Selamat ${timeLabel}, ${name}.`;
}

function sumDurationHours(sessions: { startedAt: Date | null; endedAt: Date | null }[]) {
  const totalMs = sessions.reduce((sum, s) => {
    if (!s.startedAt || !s.endedAt) return sum;
    return sum + (s.endedAt.getTime() - s.startedAt.getTime());
  }, 0);
  return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const teacherId = (session.user as { id: string }).id;
  const teacherName = session.user.name ?? "Guru";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    idleCount,
    unreviewedSummaryCount,
    monthSessions,
    summariesThisMonth,
    mindMapsThisMonth,
    quizzesThisMonth,
    evaluasiAktifCount,
    completedQuizzesRecent,
    recentSummaries,
    recentMindMaps,
    recentQuizzes,
  ] = await Promise.all([
    prisma.session.count({ where: { teacherId, status: "IDLE" } }),
    prisma.summary.count({ where: { session: { teacherId }, validatedAt: null } }),
    prisma.session.findMany({
      where: { teacherId, createdAt: { gte: startOfMonth } },
      select: { startedAt: true, endedAt: true },
    }),
    prisma.summary.count({ where: { session: { teacherId }, createdAt: { gte: startOfMonth } } }),
    prisma.mindMap.count({ where: { session: { teacherId }, createdAt: { gte: startOfMonth } } }),
    prisma.quiz.count({ where: { session: { teacherId }, createdAt: { gte: startOfMonth } } }),
    prisma.quiz.count({ where: { session: { teacherId }, status: { in: ["LOBBY", "ACTIVE"] } } }),
    prisma.quiz.findMany({
      where: { session: { teacherId }, status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, session: { select: { title: true } } },
    }),
    prisma.summary.findMany({
      where: { session: { teacherId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sessionId: true,
        createdAt: true,
        session: { select: { title: true, subject: true, grade: true } },
      },
    }),
    prisma.mindMap.findMany({
      where: { session: { teacherId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sessionId: true,
        createdAt: true,
        session: { select: { title: true, subject: true, grade: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { session: { teacherId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sessionId: true,
        createdAt: true,
        session: { select: { title: true, subject: true, grade: true } },
        _count: { select: { questions: true } },
      },
    }),
  ]);

  // Saran Sistem: topik dengan partisipasi kuis (jumlah QuizAttempt) tertinggi
  // dalam 30 hari terakhir. QuizAttempt tidak punya relasi Prisma langsung ke
  // Quiz (cuma quizId polos di skema), jadi pakai groupBy manual.
  let suggestion: string;
  if (completedQuizzesRecent.length > 0) {
    const attemptCounts = await prisma.quizAttempt.groupBy({
      by: ["quizId"],
      where: { quizId: { in: completedQuizzesRecent.map((q) => q.id) } },
      _count: { _all: true },
    });
    const top = attemptCounts.sort((a, b) => b._count._all - a._count._all)[0];
    const topQuiz = top ? completedQuizzesRecent.find((q) => q.id === top.quizId) : undefined;
    suggestion =
      topQuiz && top && top._count._all > 0
        ? `Berdasarkan tren 30 hari terakhir, topik "${topQuiz.session.title}" mendapat partisipasi kuis tertinggi (${top._count._all} pengerjaan). Pertimbangkan membuat materi lanjutan untuk topik ini.`
        : "Belum ada cukup data kuis untuk memberi saran. Mainkan kuis bersama siswa untuk melihat insight di sini.";
  } else {
    suggestion =
      "Belum ada cukup data kuis untuk memberi saran. Mainkan kuis bersama siswa untuk melihat insight di sini.";
  }

  const recentMateri = [
    ...recentSummaries.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      type: "ringkasan" as const,
      sessionTitle: s.session.title,
      subject: s.session.subject,
      grade: s.session.grade,
      createdAt: s.createdAt,
    })),
    ...recentMindMaps.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      type: "mindmap" as const,
      sessionTitle: m.session.title,
      subject: m.session.subject,
      grade: m.session.grade,
      createdAt: m.createdAt,
    })),
    ...recentQuizzes.map((q) => ({
      id: q.id,
      sessionId: q.sessionId,
      type: "quiz" as const,
      sessionTitle: q.session.title,
      subject: q.session.subject,
      grade: q.session.grade,
      questionCount: q._count.questions,
      createdAt: q.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      relativeTime: formatRelativeTime(item.createdAt, now),
    }));

  return (
    <RingkasanShell
      teacherName={teacherName}
      greeting={getGreeting(teacherName, now)}
      subtitle={`Siap untuk menginspirasi hari ini? Anda memiliki ${idleCount} sesi belum dimulai, dan ${unreviewedSummaryCount} ringkasan materi siap direview.`}
      stats={{
        durasiJam: sumDurationHours(monthSessions),
        materiDibuat: summariesThisMonth + mindMapsThisMonth + quizzesThisMonth,
        evaluasiAktif: evaluasiAktifCount,
      }}
      suggestion={suggestion}
      recentMateri={recentMateri}
    />
  );
}
