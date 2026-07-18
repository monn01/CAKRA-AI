"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X, Mic, Play, ChevronDown } from "lucide-react";

const MAX_PPT_SIZE = 50 * 1024 * 1024; // 50MB
const PPT_EXTENSIONS = [".ppt", ".pptx"];

type MicStatus = "checking" | "connected" | "missing";

export function NewSessionForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [theme, setTheme] = useState("");
  const [kelas, setKelas] = useState("1");
  const [rombel, setRombel] = useState("");
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [micStatus, setMicStatus] = useState<MicStatus>("checking");

  useEffect(() => {
    if (!open) return;
    // Reset ke "checking" tiap modal dibuka (komponen tidak unmount antar
    // buka/tutup) sebelum query async browser API — bukan state yang bisa
    // diturunkan sinkron dari props, jadi setState di sini memang perlu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMicStatus("checking");

    if (!navigator.mediaDevices?.enumerateDevices) {
      setMicStatus("missing");
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const hasMic = devices.some((d) => d.kind === "audioinput");
        setMicStatus(hasMic ? "connected" : "missing");
      })
      .catch(() => setMicStatus("missing"));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setTitle("");
    setSubject("");
    setTheme("");
    setKelas("1");
    setRombel("");
    setPptFile(null);
    setError(null);
    setWarning(null);
  }

  function handleClose() {
    reset();
    onClose();
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
        // Sesi sudah valid dibuat — tetap lanjut ke halaman sesi, guru bisa
        // upload ulang PPT dari sana kalau perlu.
        reset();
        router.push(`/session/${sessionId}`);
        return;
      }
    }

    reset();
    router.push(`/session/${sessionId}`);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(36,30,24,0.4)] p-6 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="my-auto flex w-full max-w-[512px] flex-col overflow-hidden rounded-xl border border-[rgba(219,193,185,0.6)] bg-brand-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-col items-center gap-2 border-b border-[rgba(219,193,185,0.4)] px-8 pt-8 pb-4">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-brand-muted transition-colors duration-150 hover:bg-brand-cream-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <X className="size-3.5" />
          </button>
          <h2 className="font-serif text-3xl font-semibold text-brand-dark">Buat Sesi Baru</h2>
          <p className="text-center text-base text-brand-muted">
            Persiapkan ruang rekam cerdas untuk kelas Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-8 py-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wide text-[#55433d]">
              Judul Sesi
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Matematika Bangun Ruang"
              className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-[#d0c4bb] focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-[#55433d]">Kelas</label>
              <div className="relative">
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none focus:border-brand"
                >
                  {["1", "2", "3", "4", "5", "6"].map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-brand-muted" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-[#55433d]">
                Mata Pelajaran
              </label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Misal: IPA"
                className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-[#d0c4bb] focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-[#55433d]">
                Tema (opsional)
              </label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Misal: Lingkungan Hidup"
                className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-[#d0c4bb] focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-[#55433d]">
                Rombel (opsional)
              </label>
              <input
                value={rombel}
                onChange={(e) => setRombel(e.target.value.slice(0, 3))}
                placeholder="Misal: A"
                className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-4 py-3 text-base text-brand-dark outline-none placeholder:text-[#d0c4bb] focus:border-brand"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wide text-[#55433d]">
              PPT Guru (opsional)
            </label>
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handlePptChange}
              className="rounded-lg border border-dashed border-[#dbc1b9] bg-brand-cream-alt px-4 py-3 text-sm text-brand-dark file:mr-3 file:rounded file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            {pptFile && <span className="text-xs text-brand-muted">Terpilih: {pptFile.name}</span>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[rgba(219,193,185,0.6)] bg-[#f7f3eb] p-4">
            <div className="flex items-center gap-3">
              <Mic className="size-6 text-brand" />
              <div className="flex flex-col">
                <span className="text-[10px] tracking-wide text-brand-muted uppercase">
                  Pemeriksaan Perangkat
                </span>
                <span className="text-sm text-brand-dark">
                  {micStatus === "checking" && "Memeriksa mikrofon..."}
                  {micStatus === "connected" && "Mikrofon Terhubung"}
                  {micStatus === "missing" && "Mikrofon Tidak Terdeteksi"}
                </span>
              </div>
            </div>
            <span className="relative flex size-3">
              {micStatus === "connected" && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              )}
              <span
                className={`relative inline-flex size-3 rounded-full ${
                  micStatus === "connected"
                    ? "bg-success"
                    : micStatus === "missing"
                      ? "bg-red-500"
                      : "bg-neutral-300"
                }`}
              />
            </span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {warning && <p className="text-sm text-amber-600">{warning}</p>}

          <div className="-mx-8 -mb-6 flex items-center justify-end gap-4 border-t border-[rgba(219,193,185,0.4)] bg-[rgba(247,243,235,0.5)] px-8 py-5">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-lg border border-brand-dark px-5 py-2.5 text-xs font-semibold tracking-wide text-brand-dark transition-all duration-150 hover:bg-brand-cream-alt active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-all duration-150 hover:bg-brand/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              <Play className="size-3.5" />
              {loading ? "Menyimpan..." : "Mulai Rekam Sesi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
