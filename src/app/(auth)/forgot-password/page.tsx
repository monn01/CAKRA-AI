"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/support-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "RESET_PASSWORD", name, email }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Gagal mengirim permintaan. Coba lagi.");
      return;
    }

    setSent(true);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-cream px-4 py-16">
      <div className="absolute -top-32 -left-32 size-64 rounded-br-full bg-brand-cream-alt opacity-30" />
      <div className="absolute -bottom-24 -right-32 size-96 rounded-tl-full bg-brand opacity-10" />

      <div className="relative flex w-full max-w-[500px] flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="size-6 text-brand" strokeWidth={2.25} />
            <h1 className="font-serif text-3xl font-bold text-brand">Inovasi CAKRA</h1>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Lupa Kata Sandi</h2>
          <p className="text-base text-brand-muted">
            Ajukan permintaan reset kata sandi ke admin sekolah Anda.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-brand-card p-8 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
                <KeyRound className="size-5 text-success" />
              </div>
              <p className="text-base font-semibold text-brand-dark">Permintaan diterima.</p>
              <p className="text-sm text-brand-muted">
                Admin sekolah akan menghubungi Anda untuk verifikasi identitas sebelum kata sandi
                direset. Proses ini dilakukan manual karena sistem belum terhubung ke layanan
                email.
              </p>
              <Link
                href="/login"
                className="mt-2 flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wider text-brand-dark uppercase">
                  Nama Lengkap
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full rounded-lg border border-black/20 bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wider text-brand-dark uppercase">
                  Email Akun
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email yang dipakai untuk masuk"
                  className="w-full rounded-lg border border-black/20 bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand py-3 text-base text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Mengirim..." : "Kirim Permintaan Reset"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1 text-sm text-brand-muted hover:text-brand-dark"
              >
                <ArrowLeft className="size-3.5" />
                Kembali ke halaman masuk
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
