const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime();

  if (diff < HOUR) {
    const minutes = Math.max(1, Math.floor(diff / MINUTE));
    return `${minutes} menit yang lalu`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} jam yang lalu`;
  }

  if (diff < 2 * DAY) {
    const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return `Kemarin, ${time}`;
  }

  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return `${days} hari yang lalu`;
  }

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Format durasi rata-rata ringkas, mis. "1j 12m" atau "38m". */
export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
}
