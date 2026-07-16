export function DashboardStats({
  total,
  completed,
  thisWeek,
}: {
  total: number;
  completed: number;
  thisWeek: number;
}) {
  const items = [
    { label: "Total Sesi", value: total },
    { label: "Selesai", value: completed },
    { label: "Minggu Ini", value: thisWeek },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white py-3 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {item.value}
          </p>
          <p className="text-xs text-neutral-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
