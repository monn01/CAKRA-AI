import { Skeleton } from "@/components/ui/Skeleton";

export default function LiveLoading() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-neutral-950">
      <Skeleton tone="dark" className="h-10 w-2/3 max-w-xl" />
    </main>
  );
}
