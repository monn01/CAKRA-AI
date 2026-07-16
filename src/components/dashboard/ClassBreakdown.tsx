type ClassGroup = { subject: string; grade: string; count: number };

export function ClassBreakdown({ groups }: { groups: ClassGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-neutral-500">Kelas & Mata Pelajaran</h2>
      <div className="flex flex-wrap gap-2">
        {groups.map((g, i) => (
          <span
            key={i}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            {g.subject} · Kelas {g.grade}{" "}
            <span className="text-neutral-400">
              ({g.count} sesi)
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
