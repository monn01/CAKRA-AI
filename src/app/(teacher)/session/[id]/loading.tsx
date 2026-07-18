import { Skeleton } from "@/components/ui/Skeleton";

export default function SessionDetailLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <div className="flex w-96 shrink-0 flex-col gap-4 border-r border-black/10 bg-brand-cream-alt p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div className="mb-4 flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
