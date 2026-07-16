import { Skeleton } from "@/components/ui/Skeleton";

export default function SessionDetailLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-40" />

      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </main>
  );
}
