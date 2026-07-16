import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SummaryPanel } from "@/components/dashboard/SummaryPanel";
import { MindMapViewer } from "@/components/mindmap/MindMapViewer";
import { QuizPanel } from "@/components/dashboard/QuizPanel";
import { QRCodeGenerator } from "@/components/resume/QRCodeGenerator";
import { PrintQRButton } from "@/components/resume/PrintQRButton";
import { TranscriptViewer } from "@/components/dashboard/TranscriptViewer";
import { QuizResults } from "@/components/quiz/QuizResults";
import { getQuizResultsForSession } from "@/lib/quiz-results";
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
      transcript: true,
      summary: true,
      mindMap: true,
      quizzes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { questions: { orderBy: { order: "asc" } } },
      },
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
        ← Kembali ke Dashboard
      </Link>

      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        {teachingSession.title}
      </h1>
      <p className="text-sm text-neutral-500">
        {teachingSession.subject}
        {teachingSession.theme ? ` · ${teachingSession.theme}` : ""} · Kelas{" "}
        {teachingSession.grade}
      </p>

      {teachingSession.pptUrl && (
        <a
          href={teachingSession.pptUrl}
          download={teachingSession.pptName ?? undefined}
          className="flex w-fit items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 hover:border-primary/40 hover:text-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
        >
          📎 {teachingSession.pptName ?? "Materi PPT"} — Unduh
        </a>
      )}

      <Link
        href={`/session/${teachingSession.id}/control`}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900"
      >
        Buka Panel Kontrol
      </Link>

      <TranscriptViewer fullText={teachingSession.transcript?.fullText ?? ""} />

      <SummaryPanel
        sessionId={teachingSession.id}
        hasTranscript={hasTranscript}
        initialSummary={initialSummary}
        title={teachingSession.title}
        subject={teachingSession.subject}
        grade={teachingSession.grade}
      />

      <MindMapViewer
        sessionId={teachingSession.id}
        hasTranscript={hasTranscript}
        initialStructure={initialMindMap}
        initialValidatedAt={initialMindMapValidatedAt}
        title={teachingSession.title}
      />

      <QuizPanel
        sessionId={teachingSession.id}
        hasTranscript={hasTranscript}
        initialQuiz={initialQuiz}
        title={teachingSession.title}
        subject={teachingSession.subject}
        grade={teachingSession.grade}
      />

      {quizResults && (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="w-full text-sm font-medium text-neutral-500">Hasil Quiz</h2>
          <QuizResults rankings={quizResults.rankings} breakdown={quizResults.breakdown} light />
        </section>
      )}

      <section className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="w-full text-sm font-medium text-neutral-500">QR Resume</h2>
        <QRCodeGenerator
          qrDataUrl={qrDataUrl}
          title={teachingSession.title}
          subject={teachingSession.subject}
          grade={teachingSession.grade}
          dateLabel={dateLabel}
        />
        <PrintQRButton
          qrDataUrl={qrDataUrl}
          title={teachingSession.title}
          subject={teachingSession.subject}
          grade={teachingSession.grade}
          dateLabel={dateLabel}
        />
      </section>
    </main>
  );
}
