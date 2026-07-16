import { prisma } from "@/lib/prisma";
import { QuizPlayerGame } from "@/components/quiz/QuizPlayerGame";

export default async function QuizJoinPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  const quiz = await prisma.quiz.findFirst({
    where: { sessionId, status: { in: ["LOBBY", "ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!session || !quiz) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center dark:bg-neutral-950">
        <p className="text-lg text-neutral-700 dark:text-neutral-300">
          Quiz belum tersedia untuk sesi ini.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {session.title}
        </h1>
        <p className="text-sm text-neutral-500">
          {session.subject} · Kelas {session.grade}
        </p>
      </div>

      <QuizPlayerGame
        sessionId={sessionId}
        initialStatus={quiz.status as "LOBBY" | "ACTIVE" | "COMPLETED"}
      />
    </main>
  );
}
