import { Skeleton } from "@/components/ui/Skeleton";

export default function QuizProjectorLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6">
      <Skeleton tone="dark" className="h-16 w-48" />
      <Skeleton tone="dark" className="h-56 w-56 rounded-lg" />
    </main>
  );
}
