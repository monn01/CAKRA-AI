import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuizResultsForSession } from "@/lib/quiz-results";
import { ValidasiGuruShell } from "@/components/session/ValidasiGuruShell";
import type { MindMapStructure } from "@/components/mindmap/InteractiveMindMap";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const teachingSession = await prisma.session.findUnique({
    where: { id },
    include: {
      transcript: { include: { chunks: { orderBy: { timestamp: "asc" } } } },
      summary: true,
      mindMap: true,
      quizzes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { questions: { orderBy: { order: "asc" } } },
      },
      teacher: { select: { notifySessionComplete: true, notifyAudioQuality: true } },
    },
  });
  if (!teachingSession || teachingSession.teacherId !== (session.user as { id: string }).id) {
    notFound();
  }

  const hasTranscript = Boolean(teachingSession.transcript?.fullText.trim());
  const initialSummary = teachingSession.summary
    ? {
        content: teachingSession.summary.content,
        keyPoints: (teachingSession.summary.keyPoints as string[] | null) ?? [],
        glossary:
          (teachingSession.summary.glossary as { term: string; definition: string }[] | null) ??
          [],
        validatedAt: teachingSession.summary.validatedAt?.toISOString() ?? null,
      }
    : null;
  const initialMindMap = teachingSession.mindMap
    ? (teachingSession.mindMap.structure as unknown as MindMapStructure)
    : null;
  const initialMindMapValidatedAt = teachingSession.mindMap?.validatedAt?.toISOString() ?? null;
  const latestQuiz = teachingSession.quizzes[0];
  const initialQuiz = latestQuiz
    ? {
        id: latestQuiz.id,
        roomCode: latestQuiz.roomCode,
        status: latestQuiz.status,
        validatedAt: latestQuiz.validatedAt?.toISOString() ?? null,
        questions: latestQuiz.questions.map((q) => ({
          question: q.question,
          options: (q.options as string[] | null) ?? [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? "",
          difficulty: (q.difficulty as "mudah" | "sedang" | "sulit") ?? "sedang",
        })),
      }
    : null;

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resumeUrl = `${appUrl}/r/${teachingSession.id}`;
  const qrDataUrl = await QRCode.toDataURL(resumeUrl, { width: 400 });
  const dateLabel = (teachingSession.startedAt ?? teachingSession.createdAt).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );
  const quizResults = await getQuizResultsForSession(teachingSession.id);

  const initialChunks = (teachingSession.transcript?.chunks ?? []).map((c) => ({
    id: c.id,
    text: c.text,
    timestamp: c.timestamp,
  }));

  return (
    <ValidasiGuruShell
      sessionId={teachingSession.id}
      title={teachingSession.title}
      subject={teachingSession.subject}
      grade={teachingSession.grade}
      initialStatus={teachingSession.status}
      initialFullText={teachingSession.transcript?.fullText ?? ""}
      initialChunks={initialChunks}
      pptSlideCount={teachingSession.pptSlideUrls.length}
      pptUrl={teachingSession.pptUrl}
      pptName={teachingSession.pptName}
      hasTranscript={hasTranscript}
      initialSummary={initialSummary}
      initialMindMap={initialMindMap}
      initialMindMapValidatedAt={initialMindMapValidatedAt}
      initialQuiz={initialQuiz}
      quizResults={quizResults}
      qrDataUrl={qrDataUrl}
      dateLabel={dateLabel}
      notifySessionComplete={teachingSession.teacher.notifySessionComplete}
      notifyAudioQuality={teachingSession.teacher.notifyAudioQuality}
    />
  );
}
