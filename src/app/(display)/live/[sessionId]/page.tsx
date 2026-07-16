import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { LiveDisplay } from "@/components/live/LiveDisplay";
import type { MindMapStructure } from "@/components/mindmap/InteractiveMindMap";

export default async function LiveDisplayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      transcript: true,
      summary: true,
      mindMap: true,
      quizzes: { orderBy: { createdAt: "desc" }, take: 1, include: { questions: { orderBy: { order: "asc" } } } },
    },
  });
  if (!session) notFound();

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(`${appUrl}/r/${sessionId}`, { width: 400 });

  const activeQuiz = await prisma.quiz.findFirst({
    where: { sessionId, status: { in: ["LOBBY", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });
  const quizQrDataUrl = activeQuiz
    ? await QRCode.toDataURL(`${appUrl}/quiz/${sessionId}/join`, { width: 400 })
    : null;

  const dateLabel = (session.startedAt ?? session.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const summary = session.summary
    ? {
        content: session.summary.content,
        keyPoints: (session.summary.keyPoints as string[] | null) ?? [],
        validatedAt: session.summary.validatedAt?.toISOString() ?? null,
      }
    : null;

  const mindMap = session.mindMap
    ? {
        structure: session.mindMap.structure as unknown as MindMapStructure,
        validatedAt: session.mindMap.validatedAt?.toISOString() ?? null,
      }
    : null;

  const latestQuiz = session.quizzes[0];
  const quiz = latestQuiz
    ? {
        questions: latestQuiz.questions.map((q) => ({
          question: q.question,
          options: (q.options as string[] | null) ?? [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
        validatedAt: latestQuiz.validatedAt?.toISOString() ?? null,
      }
    : null;

  return (
    <LiveDisplay
      sessionId={sessionId}
      initialFullText={session.transcript?.fullText ?? ""}
      initialStatus={session.status}
      title={session.title}
      subject={session.subject}
      grade={session.grade}
      dateLabel={dateLabel}
      qrDataUrl={qrDataUrl}
      quizQrDataUrl={quizQrDataUrl}
      pptSlideUrls={session.pptSlideUrls}
      summary={summary}
      mindMap={mindMap}
      quiz={quiz}
    />
  );
}
