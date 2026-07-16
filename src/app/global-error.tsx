"use client";

export default function GlobalRootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center">
          <p className="text-lg font-medium text-neutral-900">Aplikasi mengalami masalah</p>
          <p className="max-w-sm text-sm text-neutral-500">
            Silakan muat ulang halaman. Kalau masalah terus terjadi, hubungi admin sekolah.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Muat Ulang
          </button>
        </main>
      </body>
    </html>
  );
}
