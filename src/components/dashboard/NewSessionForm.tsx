"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_PPT_SIZE = 50 * 1024 * 1024; // 50MB
const PPT_EXTENSIONS = [".ppt", ".pptx"];

type Step = "closed" | "confirm" | "form";

export function NewSessionForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("closed");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [theme, setTheme] = useState("");
  const [kelas, setKelas] = useState("1");
  const [rombel, setRombel] = useState("");
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle("");
    setSubject("");
    setTheme("");
    setKelas("1");
    setRombel("");
    setPptFile(null);
    setError(null);
  }

  function handlePptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPptFile(null);
      return;
    }
    const lower = file.name.toLowerCase();
    if (!PPT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setError("File harus format .ppt atau .pptx");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PPT_SIZE) {
      setError("Ukuran file PPT maksimal 50MB");
      e.target.value = "";
      return;
    }
    setError(null);
    setPptFile(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    const grade = `${kelas}${rombel.trim()}`;

    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, theme, grade }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Gagal membuat sesi baru");
      return;
    }

    const data = await res.json();
    const sessionId = data.session.id;

    if (pptFile) {
      const formData = new FormData();
      formData.append("file", pptFile);
      const uploadRes = await fetch(`/api/session/${sessionId}/ppt`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        setLoading(false);
        setWarning("Sesi berhasil dibuat, tapi upload PPT gagal. Coba upload ulang dari halaman sesi.");
        reset();
        setStep("closed");
        router.refresh();
        return;
      }

      const uploadData = await uploadRes.json();
      if (uploadData.slidesError) {
        setWarning(uploadData.slidesError);
      }
    }

    setLoading(false);
    reset();
    setStep("closed");
    router.refresh();
  }

  if (step === "closed") {
    return (
      <div className="flex flex-col gap-2">
        {warning && <p className="text-sm text-amber-600">{warning}</p>}
        <button
          onClick={() => setStep("confirm")}
          className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + Sesi Baru
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-primary/10 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-lg font-black text-primary">Mulai sesi belajar baru? 🚀</p>
        <p className="text-sm text-neutral-500">
          Kamu akan diarahkan untuk mengisi mata pelajaran, tema, judul, kelas, dan materi PPT (opsional).
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setStep("form")}
            className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-sky-700"
          >
            Ya, Mulai
          </button>
          <button
            onClick={() => setStep("closed")}
            className="rounded-md px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Mata Pelajaran (mis. IPA)"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-800"
        />
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Tema (mis. Lingkungan Hidup)"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-800"
        />
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul Pembelajaran (mis. Fotosintesis)"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-800 sm:col-span-2"
        />
        <select
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-800"
        >
          {["1", "2", "3", "4", "5", "6"].map((k) => (
            <option key={k} value={k}>
              Kelas {k}
            </option>
          ))}
        </select>
        <input
          value={rombel}
          onChange={(e) => setRombel(e.target.value.slice(0, 3))}
          placeholder="Rombel (opsional, mis. A)"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-600 dark:text-neutral-400">
          PPT Guru (opsional) 📎
        </span>
        <input
          type="file"
          accept=".ppt,.pptx"
          onChange={handlePptChange}
          className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
        />
        {pptFile && <span className="text-xs text-neutral-500">Terpilih: {pptFile.name}</span>}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setStep("closed");
          }}
          className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
