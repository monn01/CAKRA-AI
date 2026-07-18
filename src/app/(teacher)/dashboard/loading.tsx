import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <div className="flex h-full w-96 shrink-0 flex-col gap-4 border-r border-[rgba(219,193,185,0.3)] bg-brand-cream-alt px-6 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-20" />
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-end gap-4 border-b border-[rgba(219,193,185,0.3)] px-6 py-4">
          <Skeleton className="h-8 w-40" />
        </div>

        <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 flex flex-col gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="col-span-7 flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
