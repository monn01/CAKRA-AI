import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { QuizProjectorGame } from "@/components/quiz/QuizProjectorGame";

export default async function QuizProjectorPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { sessionId, status: { in: ["LOBBY", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  if (!quiz || !quiz.roomCode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-indigo-950 px-6 text-center">
        <p className="text-2xl text-white">Kuis belum dibuka oleh guru.</p>
        <p className="mt-2 text-sm text-sky-300/70">Sesi: {sessionId}</p>
      </main>
    );
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const joinUrl = `${appUrl}/quiz/${sessionId}/join`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 300 });

  return (
    <QuizProjectorGame
      sessionId={sessionId}
      roomCode={quiz.roomCode}
      qrDataUrl={qrDataUrl}
      questionCount={quiz._count.questions}
      initialStatus={quiz.status as "LOBBY" | "ACTIVE" | "COMPLETED"}
    />
  );
}
