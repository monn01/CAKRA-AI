export function QuizLeaderboard({
  rankings,
  light,
}: {
  rankings: { name: string; score: number }[];
  light?: boolean;
}) {
  if (rankings.length === 0) {
    return (
      <p className={light ? "text-sm text-neutral-500" : "text-sm text-neutral-400"}>
        Belum ada skor.
      </p>
    );
  }

  const top = rankings.slice(0, 5);

  return (
    <ol className="flex w-full max-w-md flex-col gap-2">
      {top.map((player, i) => (
        <li
          key={i}
          className={`flex items-center justify-between rounded-lg px-4 py-2 ${
            i === 0
              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
              : light
                ? "bg-neutral-100 text-neutral-800"
                : "bg-white/10 text-white"
          }`}
        >
          <span className="font-medium">
            {i + 1}. {player.name}
          </span>
          <span className="font-semibold">{player.score}</span>
        </li>
      ))}
    </ol>
  );
}
