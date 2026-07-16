"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
        Terjadi kesalahan
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        Ada masalah saat memuat halaman ini. Coba lagi, atau kembali ke dashboard kalau masalah
        berlanjut.
      </p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900"
        >
          Coba Lagi
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Ke Dashboard
        </a>
      </div>
    </main>
  );
}
