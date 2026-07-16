import { Skeleton } from "@/components/ui/Skeleton";

export default function QuizJoinLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-12 w-full max-w-sm" />
      <Skeleton className="h-12 w-full max-w-sm" />
    </main>
  );
}
