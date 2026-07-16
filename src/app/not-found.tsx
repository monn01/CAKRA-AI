import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
        Halaman tidak ditemukan
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        Sesi atau halaman yang kamu cari mungkin sudah dihapus, atau link-nya salah.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900"
      >
        Ke Dashboard
      </Link>
    </main>
  );
}
