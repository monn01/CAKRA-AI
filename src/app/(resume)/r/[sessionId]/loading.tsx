import { Skeleton } from "@/components/ui/Skeleton";

export default function ResumeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-4 bg-neutral-50 px-4 py-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}
