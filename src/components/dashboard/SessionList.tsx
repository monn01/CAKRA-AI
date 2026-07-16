"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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

export function SessionList({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Belum ada sesi. Buat sesi baru untuk mulai mengajar.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((s, i) => (
        <motion.li
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04 }}
        >
          <Link
            href={`/session/${s.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
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
        </motion.li>
      ))}
    </ul>
  );
}
