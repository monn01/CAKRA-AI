"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, User, Lock, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email atau password salah");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          <h2 className="font-serif text-2xl font-bold text-brand-dark">
            Selamat Datang di Panel Guru
          </h2>
          <p className="text-base text-brand-muted">
            Silakan masuk untuk mengakses modul pengajaran.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-brand-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-bold tracking-wider text-brand-dark uppercase"
              >
                Nama Pengguna atau Surel
              </label>
              <div className="relative">
                <User className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan surel Anda..."
                  className="w-full rounded-lg border border-black/20 bg-brand-cream-alt py-3 pr-4 pl-10 text-base text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-bold tracking-wider text-brand-dark uppercase"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full rounded-lg border border-black/20 bg-brand-cream-alt py-3 pr-10 pl-10 text-base text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-brand-muted transition-colors hover:text-brand-dark"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Link
                href="/forgot-password"
                className="w-fit cursor-pointer self-end rounded-md px-1 text-sm text-brand underline transition-colors hover:text-brand/80"
              >
                Lupa kata sandi?
              </Link>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand py-3 text-base text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk ke Panel"}
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          <div className="flex items-center justify-center gap-3 py-4 opacity-50">
            <span className="h-px w-10 bg-brand-dark" />
            <span className="size-1.5 rotate-45 bg-brand-dark" />
            <span className="h-px w-10 bg-brand-dark" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-brand-muted">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="cursor-pointer text-brand underline transition-colors hover:text-brand/80"
              >
                Daftar di sini
              </Link>
            </p>
            <Link
              href="/contact-admin"
              className="flex cursor-pointer items-center gap-1 rounded-md px-1 text-sm text-brand-muted transition-colors hover:text-brand-dark"
            >
              <Phone className="size-3" />
              Hubungi Admin Sekolah
            </Link>
          </div>
        </div>

        <p className="text-center text-xs tracking-wider text-brand-muted opacity-70">
          © 2024 CAKRA-AI. Hak Cipta Dilindungi.
        </p>
      </div>
    </main>
  );
}
