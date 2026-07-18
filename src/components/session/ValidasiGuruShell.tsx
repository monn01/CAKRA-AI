"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Square, Mic } from "lucide-react";
import { SpeechHandler } from "@/lib/stt/speech-handler";
import { getSocketClient } from "@/lib/socket/client";
import { preferredAudioConstraint } from "@/lib/mic-preference";
import { Button } from "@/components/ui/Button";
import { SummaryPanel } from "@/components/dashboard/SummaryPanel";
import { MindMapViewer } from "@/components/mindmap/MindMapViewer";
import { QuizPanel } from "@/components/dashboard/QuizPanel";
import { QRCodeGenerator } from "@/components/resume/QRCodeGenerator";
import { PrintQRButton } from "@/components/resume/PrintQRButton";
import { QuizResults } from "@/components/quiz/QuizResults";
import type { MindMapStructure } from "@/components/mindmap/InteractiveMindMap";

type RecordingState = "idle" | "recording" | "paused" | "ended";
type Tab = "ringkasan" | "mindmap" | "quiz";
type Chunk = { id: string; text: string; timestamp: number };

const STATUS_BADGE: Record<RecordingState, { label: string; className: string }> = {
  idle: { label: "Belum Dimulai", className: "bg-brand-cream-alt text-brand-muted" },
  recording: { label: "● Merekam", className: "bg-red-100 text-red-700 animate-pulse" },
  paused: { label: "Jeda", className: "bg-amber-100 text-amber-700" },
  ended: { label: "Selesai", className: "bg-success/10 text-success" },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "mindmap", label: "Peta Pikiran" },
  { id: "quiz", label: "Soal Latihan" },
];

export function ValidasiGuruShell({
  sessionId,
  title,
  subject,
  grade,
  initialStatus,
  initialFullText,
  initialChunks,
  pptSlideCount,
  pptUrl,
  pptName,
  hasTranscript,
  initialSummary,
  initialMindMap,
  initialMindMapValidatedAt,
  initialQuiz,
  quizResults,
  qrDataUrl,
  dateLabel,
  notifySessionComplete,
  notifyAudioQuality,
}: {
  sessionId: string;
  title: string;
  subject: string;
  grade: string;
  initialStatus: string;
  initialFullText: string;
  initialChunks: Chunk[];
  pptSlideCount: number;
  pptUrl: string | null;
  pptName: string | null;
  hasTranscript: boolean;
  initialSummary: {
    content: string;
    keyPoints: string[];
    glossary: { term: string; definition: string }[];
    validatedAt: string | null;
  } | null;
  initialMindMap: MindMapStructure | null;
  initialMindMapValidatedAt: string | null;
  initialQuiz: {
    id: string;
    roomCode: string | null;
    status: string;
    validatedAt: string | null;
    questions: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: "mudah" | "sedang" | "sulit";
    }[];
  } | null;
  quizResults: {
    rankings: { name: string; score: number }[];
    breakdown: {
      questionId: string;
      question: string;
      correctAnswer: string;
      explanation: string | null;
      correctCount: number;
      totalAnswered: number;
    }[];
  } | null;
  qrDataUrl: string;
  dateLabel: string;
  notifySessionComplete: boolean;
  notifyAudioQuality: boolean;
}) {
  const [recordingState, setRecordingState] = useState<RecordingState>(
    initialStatus === "COMPLETED" || initialStatus === "PROCESSING" ? "ended" : "idle"
  );
  const [chunks, setChunks] = useState<Chunk[]>(initialChunks);
  const [fullText, setFullText] = useState(initialFullText);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [draftText, setDraftText] = useState(initialFullText);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [displayMode, setDisplayMode] = useState<"caption" | "full">("caption");
  const [slideIndex, setSlideIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [audioWarning, setAudioWarning] = useState<string | null>(null);

  // Cache konten hasil generate per panel. Panel tab dirender kondisional
  // (unmount saat pindah tab), jadi tanpa cache ini konten yang baru
  // di-generate tapi belum divalidasi "hilang" ketika guru pindah tab lalu
  // balik lagi — padahal datanya sudah tersimpan di DB, cuma props server
  // (initial*) masih nilai lama saat halaman pertama dimuat.
  const [summaryCache, setSummaryCache] = useState(initialSummary);
  const [mindMapCache, setMindMapCache] = useState({
    structure: initialMindMap,
    validatedAt: initialMindMapValidatedAt,
  });
  const [quizCache, setQuizCache] = useState(initialQuiz);

  const handlerRef = useRef<SpeechHandler | null>(null);
  // Sesi yang sudah pernah mulai (mis. guru refresh halaman di tengah
  // merekam, status masih RECORDING) tidak boleh PATCH startedAt lagi —
  // kalau di-PATCH ulang, waktu mulai asli tertimpa dan statistik durasi
  // mengajar di Riwayat/Analitik jadi salah.
  const startedRef = useRef(initialStatus !== "IDLE");
  const feedEndRef = useRef<HTMLDivElement>(null);
  const audioMonitorRef = useRef<{
    context: AudioContext;
    analyser: AnalyserNode;
    stream: MediaStream;
    interval: ReturnType<typeof setInterval>;
  } | null>(null);

  useEffect(() => {
    const socket = getSocketClient();
    socket.emit("session:start", { sessionId });

    return () => {
      handlerRef.current?.stop();
    };
  }, [sessionId]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chunks]);

  useEffect(() => {
    if (notifySessionComplete && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    return () => stopAudioMonitor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushChunk(text: string) {
    setChunks((prev) => [...prev, { id: `local-${Date.now()}`, text, timestamp: Date.now() }]);
  }

  async function startAudioMonitor() {
    if (!notifyAudioQuality || audioMonitorRef.current) return;
    try {
      // Menghormati mic yang dipilih guru di Pengaturan (fallback ke default).
      const stream = await navigator.mediaDevices.getUserMedia(preferredAudioConstraint());
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let quietStreak = 0;

      const interval = setInterval(() => {
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(
          data.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / data.length
        );
        if (rms < 0.02) {
          quietStreak += 1;
          if (quietStreak >= 4) {
            setAudioWarning("Suara kelas terlalu pelan, coba dekatkan mikrofon ke guru.");
          }
        } else {
          quietStreak = 0;
          setAudioWarning(null);
        }
      }, 2000);

      audioMonitorRef.current = { context, analyser, stream, interval };
    } catch {
      // gagal akses mikrofon buat monitor kualitas audio — bukan fatal, fitur ini opsional
    }
  }

  function stopAudioMonitor() {
    const monitor = audioMonitorRef.current;
    if (!monitor) return;
    clearInterval(monitor.interval);
    monitor.stream.getTracks().forEach((t) => t.stop());
    monitor.context.close();
    audioMonitorRef.current = null;
    setAudioWarning(null);
  }

  async function handleStart() {
    setError(null);

    if (!SpeechHandler.isSupported()) {
      setError(
        "Browser tidak mendukung Web Speech API. Gunakan Chrome/Edge terbaru, atau rekam manual."
      );
      return;
    }

    const socket = getSocketClient();

    handlerRef.current = new SpeechHandler(
      (text, isFinal) => {
        const timestamp = Date.now();
        if (isFinal) {
          pushChunk(text);
          setFullText((prev) => `${prev} ${text}`.trim());
        }
        socket.emit("transcript:chunk", { sessionId, text, isFinal, timestamp });
      },
      (err) => setError(`Kesalahan STT: ${err}`)
    );

    handlerRef.current.start("id-ID");
    setRecordingState("recording");
    startAudioMonitor();

    if (!startedRef.current) {
      startedRef.current = true;
      await fetch(`/api/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECORDING", startedAt: new Date().toISOString() }),
      });
    }
  }

  function handlePause() {
    handlerRef.current?.pause();
    setRecordingState("paused");
    stopAudioMonitor();
  }

  function handleResume() {
    handlerRef.current?.resume();
    setRecordingState("recording");
    startAudioMonitor();
  }

  async function handleEnd() {
    handlerRef.current?.stop();
    setRecordingState("ended");
    stopAudioMonitor();

    const socket = getSocketClient();
    socket.emit("session:end", { sessionId });

    await fetch(`/api/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PROCESSING", endedAt: new Date().toISOString() }),
    });

    if (notifySessionComplete && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Sesi selesai direkam", { body: title });
    }
  }

  async function handleSaveCorrection() {
    setSaving(true);
    const res = await fetch("/api/transcript", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, fullText: draftText }),
    });
    setSaving(false);

    if (res.ok) {
      setFullText(draftText);
      setCorrectionMode(false);
    } else {
      setError("Gagal menyimpan koreksi transkrip");
    }
  }

  function handleSetDisplayMode(next: "caption" | "full") {
    setDisplayMode(next);
    getSocketClient().emit("display:mode", { sessionId, mode: next });
  }

  function handleSlideChange(next: number) {
    if (next < 0 || next >= pptSlideCount) return;
    setSlideIndex(next);
    getSocketClient().emit("ppt:slide", { sessionId, index: next });
  }

  const badge = STATUS_BADGE[recordingState];

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      {/* Pane kiri: Feed Transkrip */}
      <aside className="flex w-96 shrink-0 flex-col border-r border-black/10 bg-brand-cream-alt">
        <div className="flex flex-col gap-3 border-b border-black/10 p-4">
          <Link
            href="/dashboard"
            className="flex w-fit items-center gap-1 text-sm text-brand-muted hover:text-brand-dark"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke Dashboard
          </Link>
          <div>
            <h1 className="font-serif text-lg font-semibold text-brand-dark">{title}</h1>
            <p className="text-sm text-brand-muted">
              {subject} · Kelas {grade}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
            <a
              href={`/live/${sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-dark hover:underline"
            >
              Buka Layar Proyektor ↗
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-brand-muted">Mode proyektor:</span>
            <button
              onClick={() => handleSetDisplayMode("caption")}
              className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                displayMode === "caption"
                  ? "bg-brand-dark text-white"
                  : "border border-black/10 text-brand-muted hover:border-brand/40 hover:text-brand-dark"
              }`}
            >
              Caption
            </button>
            <button
              onClick={() => handleSetDisplayMode("full")}
              className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                displayMode === "full"
                  ? "bg-brand-dark text-white"
                  : "border border-black/10 text-brand-muted hover:border-brand/40 hover:text-brand-dark"
              }`}
            >
              Transkrip Penuh
            </button>
          </div>

          {pptSlideCount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-black/10 bg-brand-card px-3 py-2 text-xs">
              <span className="text-brand-muted">
                Slide PPT: {slideIndex + 1} / {pptSlideCount}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSlideChange(slideIndex - 1)}
                  disabled={slideIndex === 0}
                  className="cursor-pointer rounded border border-black/10 px-2 py-1 text-brand-dark transition-colors hover:bg-brand-cream-alt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  ←
                </button>
                <button
                  onClick={() => handleSlideChange(slideIndex + 1)}
                  disabled={slideIndex >= pptSlideCount - 1}
                  className="cursor-pointer rounded border border-black/10 px-2 py-1 text-brand-dark transition-colors hover:bg-brand-cream-alt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <h2 className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
            Feed Transkrip
          </h2>
          {chunks.length === 0 ? (
            <p className="text-sm text-brand-muted">
              Transkrip live akan muncul di sini saat mulai merekam...
            </p>
          ) : (
            chunks.map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] tracking-wide text-brand-muted uppercase">
                  <Mic className="size-3" />
                  <span>Guru</span>
                  <span>
                    {new Date(c.timestamp).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="rounded-xl rounded-tl-none border border-black/10 bg-brand-card px-3 py-2 text-sm text-brand-dark">
                  {c.text}
                </p>
              </div>
            ))
          )}
          <div ref={feedEndRef} />
        </div>

        <div className="flex flex-col gap-2 border-t border-black/10 p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {audioWarning && (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-700">
              ⚠️ {audioWarning}
            </p>
          )}

          <div className="flex gap-2">
            {recordingState === "idle" && (
              <Button variant="primary" size="md" onClick={handleStart} className="flex-1">
                <span className="flex items-center justify-center gap-1.5">
                  <Play className="size-4" /> Mulai Merekam
                </span>
              </Button>
            )}
            {recordingState === "recording" && (
              <>
                <Button variant="outline" size="md" onClick={handlePause} className="flex-1">
                  <span className="flex items-center justify-center gap-1.5">
                    <Pause className="size-4" /> Jeda
                  </span>
                </Button>
                <Button variant="commit" size="md" onClick={handleEnd} className="flex-1">
                  <span className="flex items-center justify-center gap-1.5">
                    <Square className="size-4" /> Selesai
                  </span>
                </Button>
              </>
            )}
            {recordingState === "paused" && (
              <>
                <Button variant="outline" size="md" onClick={handleResume} className="flex-1">
                  <span className="flex items-center justify-center gap-1.5">
                    <Play className="size-4" /> Lanjutkan
                  </span>
                </Button>
                <Button variant="commit" size="md" onClick={handleEnd} className="flex-1">
                  <span className="flex items-center justify-center gap-1.5">
                    <Square className="size-4" /> Selesai
                  </span>
                </Button>
              </>
            )}
            {recordingState === "ended" && (
              <p className="flex-1 rounded-lg bg-success/10 px-3 py-2 text-center text-sm font-medium text-success">
                Sesi selesai direkam
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setDraftText(fullText);
              setCorrectionMode((v) => !v);
            }}
            className="w-fit cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-dark hover:underline"
          >
            {correctionMode ? "Tutup koreksi transkrip" : "Koreksi transkrip manual"}
          </button>

          {correctionMode && (
            <div className="flex flex-col gap-2">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={5}
                className="rounded-lg border border-[#dbc1b9] bg-brand-card p-2 text-xs text-brand-dark outline-none focus:border-brand"
              />
              <Button variant="commit" size="md" onClick={handleSaveCorrection} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Koreksi"}
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Area utama: tab konten */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex gap-1 border-b border-black/10 bg-brand-cream/90 px-8 pt-4 backdrop-blur-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                tab === t.id
                  ? "border-b-2 border-brand text-brand"
                  : "text-brand-muted hover:bg-black/5 hover:text-brand-dark"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
          {pptUrl && (
            <a
              href={pptUrl}
              download={pptName ?? undefined}
              className="flex w-fit items-center gap-2 rounded-lg border border-black/10 bg-brand-card px-3 py-2 text-sm text-brand-muted hover:border-brand/40 hover:text-brand"
            >
              📎 {pptName ?? "Materi PPT"} — Unduh
            </a>
          )}

          {tab === "ringkasan" && (
            <SummaryPanel
              sessionId={sessionId}
              hasTranscript={hasTranscript}
              initialSummary={summaryCache}
              title={title}
              subject={subject}
              grade={grade}
              onSummaryChange={(s) => setSummaryCache({ ...s, validatedAt: s.validatedAt ?? null })}
            />
          )}

          {tab === "mindmap" && (
            <MindMapViewer
              sessionId={sessionId}
              hasTranscript={hasTranscript}
              initialStructure={mindMapCache.structure}
              initialValidatedAt={mindMapCache.validatedAt}
              title={title}
              onMindMapChange={(structure, validatedAt) =>
                setMindMapCache({ structure, validatedAt })
              }
            />
          )}

          {tab === "quiz" && (
            <QuizPanel
              sessionId={sessionId}
              hasTranscript={hasTranscript}
              initialQuiz={quizCache}
              title={title}
              subject={subject}
              grade={grade}
              onQuizChange={(q) => setQuizCache({ ...q, validatedAt: q.validatedAt ?? null })}
            />
          )}

          {quizResults && (
            // QuizResults sengaja TIDAK direstyle — dipakai bareng sisi siswa
            // (proyektor quiz & kartu "selesai" di kid app), warna pastelnya
            // bagian dari tema anak SD yang harus tetap konsisten di sana.
            <section className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-brand-card p-5">
              <h2 className="w-full text-sm font-semibold tracking-wide text-brand-muted uppercase">
                Hasil Kuis
              </h2>
              <QuizResults rankings={quizResults.rankings} breakdown={quizResults.breakdown} light />
            </section>
          )}

          <section className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-brand-card p-5">
            <h2 className="w-full text-sm font-semibold tracking-wide text-brand-muted uppercase">
              QR Resume
            </h2>
            <QRCodeGenerator
              qrDataUrl={qrDataUrl}
              title={title}
              subject={subject}
              grade={grade}
              dateLabel={dateLabel}
            />
            <PrintQRButton
              qrDataUrl={qrDataUrl}
              title={title}
              subject={subject}
              grade={grade}
              dateLabel={dateLabel}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
