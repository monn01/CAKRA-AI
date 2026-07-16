"use client";

import { useState } from "react";

export function TranscriptViewer({ fullText }: { fullText: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!fullText.trim()) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-medium text-neutral-500">Transkrip</h2>
        <p className="text-sm text-neutral-400">Belum ada transkrip untuk sesi ini.</p>
      </div>
    );
  }

  const preview = fullText.length > 240 ? `${fullText.slice(0, 240)}...` : fullText;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Transkrip</h2>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-neutral-500 hover:underline"
        >
          {expanded ? "Ciutkan" : "Lihat selengkapnya"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
        {expanded ? fullText : preview}
      </p>
    </div>
  );
}
