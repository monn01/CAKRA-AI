import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { DisplayPreferences } from "@/components/dashboard/DisplayPreferences";

const PROVIDER_LABEL: Record<string, string> = {
  ollama: "Ollama (lokal/self-hosted)",
  qwen: "Qwen Cloud API",
  openrouter: "OpenRouter",
};

function currentModel(provider: string) {
  switch (provider) {
    case "qwen":
      return process.env.QWEN_MODEL || "qwen-plus";
    case "openrouter":
      return process.env.OPENROUTER_MODEL || "qwen/qwen-2.5-72b-instruct";
    default:
      return process.env.OLLAMA_MODEL || "qwen2.5:7b";
  }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const provider = process.env.LLM_PROVIDER || "ollama";
  const model = currentModel(provider);
  const sttProvider = process.env.STT_PROVIDER || "browser";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
        ← Kembali ke Dashboard
      </Link>

      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Pengaturan</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-medium text-neutral-500">Konfigurasi AI</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Provider LLM</span>
            <span className="text-neutral-900 dark:text-neutral-50">
              {PROVIDER_LABEL[provider] ?? provider}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Model</span>
            <span className="text-neutral-900 dark:text-neutral-50">{model}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Speech-to-Text</span>
            <span className="text-neutral-900 dark:text-neutral-50">
              {sttProvider === "whisper" ? "Whisper (server)" : "Web Speech API (browser)"}
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          Konfigurasi ini diatur lewat environment variable server (`.env`), bukan lewat halaman
          ini — hubungi admin sekolah kalau perlu diganti.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-medium text-neutral-500">Preferensi Tampilan</h2>
        <DisplayPreferences />
      </section>
    </main>
  );
}
