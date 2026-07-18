"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Clock, Users, ArrowRight, Trash2 } from "lucide-react";
import type { SessionStatus } from "@/generated/prisma/enums";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherTopBar } from "@/components/teacher/TeacherTopBar";
import { NewSessionForm } from "@/components/dashboard/NewSessionForm";
import { formatDuration } from "@/lib/format-relative-time";

type SessionItem = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: SessionStatus;
  dateLabel: string;
  durationMs: number | null;
  studentCount: number;
  createdAt: string;
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  IDLE: "Belum Dimulai",
  RECORDING: "Merekam",
  PROCESSING: "Memproses",
  COMPLETED: "Selesai",
};

const STATUS_BADGE: Record<SessionStatus, string> = {
  COMPLETED: "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-success",
  PROCESSING: "bg-[#ece8e0] border-[rgba(101,93,85,0.3)] text-brand-muted",
  RECORDING: "bg-red-50 border-red-200 text-red-600 animate-pulse",
  IDLE: "bg-[#ece8e0] border-[rgba(101,93,85,0.3)] text-brand-muted",
};

const STATUS_FILTERS: { value: "ALL" | SessionStatus; label: string }[] = [
  { value: "ALL", label: "Semua Status" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "PROCESSING", label: "Memproses" },
  { value: "RECORDING", label: "Merekam" },
  { value: "IDLE", label: "Belum Dimulai" },
];

const TIME_FILTERS: { value: "ALL" | "MONTH" | "WEEK"; label: string }[] = [
  { value: "ALL", label: "Sepanjang Waktu" },
  { value: "MONTH", label: "Bulan Ini" },
  { value: "WEEK", label: "7 Hari Terakhir" },
];

const PAGE_SIZE = 10;

function SessionCard({ item, onDeleted }: { item: SessionItem; onDeleted: () => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/session/${item.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      onDeleted();
      router.refresh();
    } else {
      setConfirming(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[rgba(219,193,185,0.5)] bg-brand-card p-6">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-[#ece8e0] px-2 py-1 font-mono text-sm text-brand-muted">
            {item.dateLabel}
          </span>
          <span
            className={`rounded border px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_BADGE[item.status]}`}
          >
            {STATUS_LABEL[item.status]}
          </span>
          <span className="rounded bg-brand-cream-alt px-2 py-1 text-xs text-brand-muted">
            {item.subject} Kelas {item.grade}
          </span>
        </div>

        <h3 className="text-2xl font-semibold text-brand-dark">{item.title}</h3>

        <div className="flex items-center gap-6 pt-1">
          <span className="flex items-center gap-2 font-mono text-lg text-brand-dark">
            <Clock className="size-4 text-brand-muted" />
            {item.durationMs !== null ? formatDuration(item.durationMs) : "—"}
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-4 text-brand-muted" />
            <span className="font-mono text-lg text-brand-dark">{item.studentCount}</span>
            <span className="text-sm text-brand-muted">Siswa</span>
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!confirming ? (
          <>
            <Link
              href={`/session/${item.id}`}
              className="flex cursor-pointer items-center gap-2 rounded border border-brand-dark px-6 py-2 text-xs font-semibold tracking-wide text-brand-dark transition-colors duration-150 hover:bg-brand-cream-alt"
            >
              Lihat Detail
              <ArrowRight className="size-3" />
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Hapus sesi ${item.title}`}
              className="cursor-pointer rounded border border-transparent p-2.5 text-brand-muted transition-colors duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs">
            <p className="max-w-[160px] font-medium text-red-700">
              Yakin? Transkrip, rangkuman, peta pikiran, dan kuis ikut terhapus.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="cursor-pointer rounded bg-red-600 px-3 py-1.5 font-semibold text-white transition-all duration-150 hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, hapus"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirming(false)}
                className="cursor-pointer rounded bg-white px-3 py-1.5 font-semibold text-brand-muted transition-colors duration-150 hover:bg-brand-cream-alt disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RiwayatShell({
  sessions,
  teacherName,
}: {
  sessions: SessionItem[];
  teacherName: string;
}) {
  // Dihapus optimistik ditandai di sini (bukan disalin ke state terpisah)
  // supaya list selalu ikut `sessions` (prop) yang terbaru dari server tiap
  // `router.refresh()` — kalau di-copy ke useState sendiri, data baru dari
  // server (mis. sesi yang baru dibuat) tidak akan pernah kelihatan karena
  // useState cuma baca nilai awal sekali pas mount.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"ALL" | SessionStatus>("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "MONTH" | "WEEK">("ALL");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showNewSession, setShowNewSession] = useState(false);

  const items = useMemo(
    () => sessions.filter((s) => !pendingDeleteIds.has(s.id)),
    [sessions, pendingDeleteIds]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (timeFilter === "MONTH" && new Date(item.createdAt) < monthAgo) return false;
      if (timeFilter === "WEEK" && new Date(item.createdAt) < weekAgo) return false;
      if (search.trim() && !item.title.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter, timeFilter, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <TeacherSidebar onNewSession={() => setShowNewSession(true)} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <TeacherTopBar teacherName={teacherName} />

        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-serif text-brand-dark">Riwayat Sesi Mengajar</h2>
            <p className="max-w-2xl text-base text-brand-muted">
              Daftar kronologis seluruh sesi kelas Anda. Anda dapat meninjau kembali ringkasan,
              catatan, dan analitik partisipasi siswa dari sesi sebelumnya.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[rgba(219,193,185,0.3)] bg-brand-card p-4">
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "ALL" | SessionStatus);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="rounded border border-brand-dark bg-brand-card px-4 py-2 text-xs font-semibold tracking-wide text-brand-dark"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value as "ALL" | "MONTH" | "WEEK");
                  setVisibleCount(PAGE_SIZE);
                }}
                className="rounded border border-transparent bg-brand-card px-4 py-2 text-xs font-semibold tracking-wide text-brand-muted"
              >
                {TIME_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Cari sesi..."
                className="w-64 rounded border border-[rgba(219,193,185,0.5)] bg-brand-card py-2 pr-3 pl-9 text-sm text-brand-dark outline-none placeholder:text-neutral-500 focus:border-brand"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {visible.length === 0 ? (
              <p className="rounded-lg border border-dashed border-black/20 p-8 text-center text-sm text-brand-muted">
                {items.length === 0
                  ? "Belum ada sesi mengajar. Buat sesi baru untuk mulai mengajar."
                  : "Tidak ada sesi yang cocok dengan filter/pencarian ini."}
              </p>
            ) : (
              visible.map((item) => (
                <SessionCard
                  key={item.id}
                  item={item}
                  onDeleted={() =>
                    setPendingDeleteIds((prev) => new Set(prev).add(item.id))
                  }
                />
              ))
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="cursor-pointer rounded px-6 py-2 text-xs font-semibold tracking-wide text-brand transition-colors duration-150 hover:bg-brand-cream-alt"
              >
                Muat Sesi Terdahulu
              </button>
            </div>
          )}
        </main>
      </div>

      <NewSessionForm open={showNewSession} onClose={() => setShowNewSession(false)} />
    </div>
  );
}
