import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ControlPanel } from "@/components/control/ControlPanel";

export default async function SessionControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const teachingSession = await prisma.session.findUnique({
    where: { id },
    include: { transcript: true },
  });
  if (!teachingSession || teachingSession.teacherId !== (session.user as { id: string }).id) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {teachingSession.title}
        </h1>
        <p className="text-sm text-neutral-500">
          {teachingSession.subject} · Kelas {teachingSession.grade}
        </p>
      </div>

      <ControlPanel
        sessionId={teachingSession.id}
        initialFullText={teachingSession.transcript?.fullText ?? ""}
        initialStatus={teachingSession.status}
        pptSlideCount={teachingSession.pptSlideUrls.length}
      />
    </main>
  );
}
