import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { LiveDisplay } from "@/components/live/LiveDisplay";

export default async function LiveDisplayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { transcript: true },
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
    />
  );
}
