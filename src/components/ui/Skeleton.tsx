export function Skeleton({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "dark";
}) {
  const toneClass = tone === "dark" ? "bg-white/10" : "bg-neutral-200 dark:bg-neutral-800";
  return <div className={`animate-pulse rounded-md ${toneClass} ${className ?? ""}`} />;
}
