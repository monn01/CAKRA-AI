import { Skeleton } from "@/components/ui/Skeleton";

export default function ControlLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
    </main>
  );
}
