import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewSessionForm } from "@/components/dashboard/NewSessionForm";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { SessionList } from "@/components/dashboard/SessionList";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ClassBreakdown } from "@/components/dashboard/ClassBreakdown";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const sessions = await prisma.session.findMany({
    where: { teacherId: (session.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
  });

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const completed = sessions.filter((s) => s.status === "COMPLETED").length;
  const thisWeek = sessions.filter((s) => s.createdAt >= startOfWeek).length;

  const classCounts = new Map<string, { subject: string; grade: string; count: number }>();
  for (const s of sessions) {
    const key = `${s.subject}|${s.grade}`;
    const existing = classCounts.get(key);
    if (existing) existing.count++;
    else classCounts.set(key, { subject: s.subject, grade: s.grade, count: 1 });
  }
  const classGroups = Array.from(classCounts.values()).sort((a, b) => b.count - a.count);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Dashboard Guru
          </h1>
          <p className="text-sm text-neutral-500">Halo, {session.user.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-neutral-500 hover:underline">
            Pengaturan
          </Link>
          <SignOutButton />
        </div>
      </header>

      <DashboardStats total={sessions.length} completed={completed} thisWeek={thisWeek} />

      <NewSessionForm />

      <ClassBreakdown groups={classGroups} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Sesi Saya</h2>
        <SessionList sessions={sessions} />
      </section>
    </main>
  );
}
