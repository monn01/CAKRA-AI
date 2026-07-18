import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResumeView } from "@/components/resume/ResumeView";
import type { MindMapStructure } from "@/components/mindmap/InteractiveMindMap";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      teacher: true,
      summary: true,
      mindMap: true,
      quizzes: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!session) notFound();

  const dateLabel = (session.startedAt ?? session.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const quiz = session.quizzes[0];
  const questions =
    quiz?.questions.map((q) => ({
      question: q.question,
      options: (q.options as string[] | null) ?? [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })) ?? [];

  // Halaman ini publik (QR dibagikan ke orang tua) — konten AI hanya boleh
  // tampil setelah guru memvalidasinya, sama seperti gerbang validatedAt di
  // layar proyektor. Yang belum divalidasi diperlakukan seolah belum ada
  // (ResumeView sudah punya pesan "belum siap" yang jujur).
  const validatedSummary = session.summary?.validatedAt ? session.summary : null;
  const validatedMindMap = session.mindMap?.validatedAt ? session.mindMap : null;

  return (
    <ResumeView
      title={session.title}
      subject={session.subject}
      grade={session.grade}
      dateLabel={dateLabel}
      teacherName={session.teacher.name}
      summaryContent={validatedSummary?.content ?? null}
      keyPoints={(validatedSummary?.keyPoints as string[] | null) ?? []}
      glossary={(validatedSummary?.glossary as { term: string; definition: string }[] | null) ?? []}
      mindMap={validatedMindMap ? (validatedMindMap.structure as unknown as MindMapStructure) : null}
      questions={questions}
      pptUrl={session.pptUrl}
      pptName={session.pptName}
    />
  );
}
