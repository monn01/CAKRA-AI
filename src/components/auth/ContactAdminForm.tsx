"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export function ContactAdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
      body: JSON.stringify({ type: "GENERAL", name, email, message }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Gagal mengirim pesan. Coba lagi.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
          <MessageCircle className="size-5 text-success" />
        </div>
        <p className="text-base font-semibold text-brand-dark">Pesan terkirim.</p>
        <p className="text-sm text-brand-muted">
          Admin sekolah akan menghubungi Anda kembali lewat email atau telepon yang Anda berikan.
        </p>
        <Link
          href="/login"
          className="mt-2 flex items-center gap-1 text-sm text-brand hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
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
        <label className="text-xs font-bold tracking-wider text-brand-dark uppercase">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email untuk dihubungi kembali"
          className="w-full rounded-lg border border-black/20 bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-wider text-brand-dark uppercase">Pesan</label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ceritakan kendala atau pertanyaan Anda..."
          className="w-full rounded-lg border border-black/20 bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand py-3 text-base text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Mengirim..." : "Kirim Pesan"}
      </button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1 text-sm text-brand-muted hover:text-brand-dark"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
