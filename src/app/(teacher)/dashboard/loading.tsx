import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-14" />
      </header>

      <Skeleton className="h-10 w-32" />

      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </main>
  );
}
