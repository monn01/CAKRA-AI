"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { compareGrades } from "@/lib/grade-sort";

const STATUS_LABEL: Record<string, string> = {
  IDLE: "Belum dimulai",
  RECORDING: "Merekam",
  PROCESSING: "Memproses",
  COMPLETED: "Selesai",
};

type SessionItem = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
};

function SessionRow({ s, index }: { s: SessionItem; index: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/session/${s.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
    } else {
      setConfirming(false);
    }
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
      className="flex items-center gap-2"
    >
      <Link
        href={`/session/${s.id}`}
        className="flex flex-1 items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-primary/40 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-50">{s.title}</p>
          <p className="text-sm text-neutral-500">
            {s.subject} · Kelas {s.grade}
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {STATUS_LABEL[s.status]}
        </span>
      </Link>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Hapus sesi ${s.title}`}
          className="shrink-0 rounded-lg border border-transparent p-3 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          🗑️
        </button>
      ) : (
        <div className="flex shrink-0 flex-col gap-1 rounded-lg border border-red-200 bg-red-50 p-2 text-xs dark:border-red-900 dark:bg-red-950/40">
          <p className="max-w-[160px] font-medium text-red-700 dark:text-red-300">
            Yakin? Transkrip, rangkuman, mind map, dan quiz ikut terhapus.
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-2 py-1 font-semibold text-white disabled:opacity-50"
            >
              {deleting ? "Menghapus..." : "Ya, hapus"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="rounded-md bg-white px-2 py-1 font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </motion.li>
  );
}

export function SessionList({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Belum ada sesi. Buat sesi baru untuk mulai mengajar.
      </p>
    );
  }

  const groups = new Map<string, SessionItem[]>();
  for (const s of sessions) {
    const list = groups.get(s.grade);
    if (list) list.push(s);
    else groups.set(s.grade, [s]);
  }
  const sortedGrades = Array.from(groups.keys()).sort(compareGrades);

  return (
    <div className="flex flex-col gap-5">
      {sortedGrades.map((grade) => (
        <div key={grade} className="flex flex-col gap-2">
          <h3 className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Kelas {grade}
          </h3>
          <ul className="flex flex-col gap-2">
            {groups.get(grade)!.map((s, i) => (
              <SessionRow key={s.id} s={s} index={i} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
