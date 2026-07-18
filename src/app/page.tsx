import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  GraduationCap,
  Mic,
  FileText,
  Network,
  ListChecks,
  MonitorPlay,
  QrCode,
  ArrowRight,
  GitFork,
  Download,
  Database,
  Wifi,
  Boxes,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { CopyCommandBlock } from "@/components/marketing/CopyCommandBlock";

const REPO_URL = "https://github.com/monn01/CAKRA-AI";
const ZIP_URL = `${REPO_URL}/archive/refs/heads/main.zip`;

const FEATURES = [
  {
    icon: Mic,
    title: "Transkrip Suara Real-time",
    desc: "Suara guru saat mengajar langsung ditangkap dan diubah jadi teks secara live, tanpa alat tambahan.",
  },
  {
    icon: FileText,
    title: "Rangkuman Otomatis AI",
    desc: "Transkrip diringkas AI jadi rangkuman, poin kunci, dan istilah penting — tinggal divalidasi guru.",
  },
  {
    icon: Network,
    title: "Peta Pikiran Interaktif",
    desc: "Struktur materi divisualisasikan jadi peta pikiran yang bisa di-zoom, digeser, dan diekspor.",
  },
  {
    icon: ListChecks,
    title: "Kuis Real-time",
    desc: "Soal latihan dibuat otomatis dari materi, dimainkan langsung di kelas gaya Kahoot/Quizizz.",
  },
  {
    icon: MonitorPlay,
    title: "Layar Proyektor Ramah Anak",
    desc: "Tampilan kontras tinggi dan font besar, dirancang untuk dilihat dari jarak jauh di depan kelas.",
  },
  {
    icon: QrCode,
    title: "Resume via Kode QR",
    desc: "Siswa memindai QR untuk membawa pulang rangkuman, peta pikiran, dan soal latihan hari itu.",
  },
];

const STEPS = [
  {
    title: "Guru mulai sesi & mengajar seperti biasa",
    desc: "Cukup buka sesi baru dan bicara — mikrofon menangkap suara secara real-time.",
  },
  {
    title: "AI menyusun rangkuman, peta pikiran, dan kuis",
    desc: "Transkrip diolah otomatis jadi tiga materi belajar sekaligus dalam Bahasa Indonesia.",
  },
  {
    title: "Guru validasi, materi tampil di proyektor",
    desc: "Sekali dikonfirmasi benar, materi langsung muncul di layar depan kelas.",
  },
  {
    title: "Siswa ikut kuis & bawa pulang resume",
    desc: "Lewat kode QR yang sama, siswa bisa mengulang belajar di rumah bersama orang tua.",
  },
];

const TECH = [
  { icon: Boxes, label: "Next.js + TypeScript" },
  { icon: Database, label: "PostgreSQL + Prisma" },
  { icon: Wifi, label: "Socket.IO Real-time" },
  { icon: Network, label: "React Flow" },
  { icon: Mic, label: "Ollama / Qwen / OpenRouter" },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user);

  return (
    <main className="min-h-screen bg-brand-cream text-brand-dark">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-black/10 bg-brand-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-brand" strokeWidth={2.25} />
            <span className="font-serif text-xl font-bold text-brand">CAKRA-AI</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-brand-muted md:flex">
            <a href="#fitur" className="transition-colors hover:text-brand-dark">
              Fitur
            </a>
            <a href="#cara-kerja" className="transition-colors hover:text-brand-dark">
              Cara Kerja
            </a>
            <a href="#instalasi" className="transition-colors hover:text-brand-dark">
              Instalasi
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-brand-dark"
            >
              <GitFork className="size-4" />
              GitHub
            </a>
          </nav>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.97]"
            >
              Buka Panel Guru
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="cursor-pointer text-sm font-medium text-brand-muted transition-colors hover:text-brand-dark"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.97]"
              >
                Daftar Gratis
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="pointer-events-none absolute -top-32 -left-32 size-64 rounded-br-full bg-brand-cream-alt opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -right-32 size-96 rounded-tl-full bg-brand opacity-10" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
          <span className="rounded-full border border-brand/30 bg-brand/10 px-4 py-1 text-xs font-semibold tracking-wide text-brand uppercase">
            Open source · Bisa dipasang sendiri
          </span>
          <h1 className="font-serif text-4xl leading-tight font-bold text-brand-dark sm:text-5xl">
            Ubah Suara Mengajar Jadi Rangkuman, Peta Pikiran, dan Kuis — Otomatis
          </h1>
          <p className="max-w-xl text-lg text-brand-muted">
            CAKRA-AI menangkap suara guru secara real-time dan mengubahnya jadi materi belajar
            interaktif untuk kelas inklusif, langsung tampil di proyektor dan bisa dibawa pulang
            siswa lewat kode QR.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2"
            >
              Daftar Gratis
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-brand-dark px-6 py-3 text-base font-semibold text-brand-dark transition-all duration-150 hover:bg-brand-cream-alt active:scale-[0.98]"
            >
              <GitFork className="size-4" />
              Lihat di GitHub
            </a>
          </div>
          <CopyCommandBlock command="git clone https://github.com/monn01/CAKRA-AI.git" />
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-dark">Fitur yang Sudah Jalan</h2>
          <p className="mt-2 text-brand-muted">
            Bukan sekadar rencana — semua di bawah ini sudah bisa dipakai hari ini.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-brand-card p-6 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
                <Icon className="size-5 text-brand" />
              </div>
              <h3 className="font-semibold text-brand-dark">{title}</h3>
              <p className="text-sm text-brand-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="bg-brand-cream-alt px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold text-brand-dark">Cara Kerjanya</h2>
            <p className="mt-2 text-brand-muted">Dari suara guru sampai ke tangan siswa.</p>
          </div>
          <div className="flex flex-col gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-dark">{step.title}</h3>
                  <p className="text-sm text-brand-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instalasi */}
      <section id="instalasi" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-dark">Instal di Perangkat Sendiri</h2>
          <p className="mt-2 text-brand-muted">
            CAKRA-AI open source — cocok dipasang mandiri di server sekolah, termasuk yang koneksi
            internetnya terbatas (AI bisa jalan lokal lewat Ollama).
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-brand-card p-6 sm:p-8">
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-brand-muted uppercase">
            Prasyarat
          </h3>
          <ul className="mb-6 grid grid-cols-1 gap-2 text-sm text-brand-dark sm:grid-cols-2">
            <li>• Node.js 20+ dan npm</li>
            <li>• PostgreSQL (lokal atau hosted)</li>
            <li>• Ollama (opsional, untuk AI lokal offline)</li>
            <li>• Git</li>
          </ul>

          <h3 className="mb-3 text-sm font-semibold tracking-wide text-brand-muted uppercase">
            Langkah Instalasi
          </h3>
          <div className="flex flex-col gap-2">
            <CopyCommandBlock command="git clone https://github.com/monn01/CAKRA-AI.git" />
            <CopyCommandBlock command="cd CAKRA-AI && npm install" />
            <CopyCommandBlock command="npx prisma db push" />
            <CopyCommandBlock command="npm run dev" />
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            Sebelum menjalankan, salin <code className="font-mono">.env.local.example</code> jadi{" "}
            <code className="font-mono">.env.local</code> dan isi variabel yang diperlukan (lihat
            README untuk detail).
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href={ZIP_URL}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2"
            >
              <Download className="size-4" />
              Unduh ZIP
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-brand-dark px-6 py-3 text-base font-semibold text-brand-dark transition-all duration-150 hover:bg-brand-cream-alt active:scale-[0.98]"
            >
              <GitFork className="size-4" />
              Lihat di GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Teknologi */}
      <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
        <h3 className="mb-6 text-sm font-semibold tracking-wide text-brand-muted uppercase">
          Dibangun Dengan
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TECH.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-brand-card px-4 py-2 text-sm text-brand-dark"
            >
              <Icon className="size-4 text-brand" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-brand-muted sm:flex-row">
          <p>© 2026 CAKRA-AI. Dibuat untuk pendidikan inklusif Indonesia.</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-brand-dark"
          >
            <GitFork className="size-4" />
            github.com/monn01/CAKRA-AI
          </a>
        </div>
      </footer>
    </main>
  );
}
