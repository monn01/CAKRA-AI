"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SpeechHandler } from "@/lib/stt/speech-handler";
import { getSocketClient } from "@/lib/socket/client";
import { Button } from "@/components/ui/Button";

type RecordingState = "idle" | "recording" | "paused" | "ended";

const STATUS_BADGE: Record<RecordingState, { label: string; className: string }> = {
  idle: {
    label: "Belum dimulai",
    className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  },
  recording: {
    label: "● Merekam",
    className: "bg-red-100 text-red-700 animate-pulse dark:bg-red-950 dark:text-red-400",
  },
  paused: {
    label: "Jeda",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  },
  ended: {
    label: "Selesai",
    className: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  },
};

export function ControlPanel({
  sessionId,
  initialFullText,
  initialStatus,
  pptSlideCount = 0,
}: {
  sessionId: string;
  initialFullText: string;
  initialStatus: string;
  pptSlideCount?: number;
}) {
  const [recordingState, setRecordingState] = useState<RecordingState>(
    initialStatus === "COMPLETED" || initialStatus === "PROCESSING" ? "ended" : "idle"
  );
  const [liveLines, setLiveLines] = useState<string[]>([]);
  const [fullText, setFullText] = useState(initialFullText);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [draftText, setDraftText] = useState(initialFullText);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [displayMode, setDisplayMode] = useState<"caption" | "full">("caption");
  const [slideIndex, setSlideIndex] = useState(0);

  const handlerRef = useRef<SpeechHandler | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const socket = getSocketClient();
    socket.emit("session:start", { sessionId });

    return () => {
      handlerRef.current?.stop();
    };
  }, [sessionId]);

  function pushLiveLine(text: string) {
    setLiveLines((prev) => [...prev, text].slice(-3));
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
          pushLiveLine(text);
          setFullText((prev) => `${prev} ${text}`.trim());
        }
        socket.emit("transcript:chunk", { sessionId, text, isFinal, timestamp });
      },
      (err) => setError(`Kesalahan STT: ${err}`)
    );

    handlerRef.current.start("id-ID");
    setRecordingState("recording");

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
  }

  function handleResume() {
    handlerRef.current?.resume();
    setRecordingState("recording");
  }

  async function handleEnd() {
    handlerRef.current?.stop();
    setRecordingState("ended");

    const socket = getSocketClient();
    socket.emit("session:end", { sessionId });

    await fetch(`/api/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PROCESSING", endedAt: new Date().toISOString() }),
    });
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>

        <a
          href={`/live/${sessionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-500 hover:underline"
        >
          Buka Layar Proyektor ↗
        </a>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Mode proyektor:</span>
        <button
          onClick={() => handleSetDisplayMode("caption")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            displayMode === "caption"
              ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
              : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          Caption
        </button>
        <button
          onClick={() => handleSetDisplayMode("full")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            displayMode === "full"
              ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
              : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          Transkrip Penuh
        </button>
      </div>

      {pptSlideCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-neutral-500">
            Slide PPT: {slideIndex + 1} / {pptSlideCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleSlideChange(slideIndex - 1)}
              disabled={slideIndex === 0}
            >
              ← Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => handleSlideChange(slideIndex + 1)}
              disabled={slideIndex >= pptSlideCount - 1}
            >
              Berikutnya →
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-[96px] rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        {liveLines.length === 0 ? (
          <p>Transkrip live akan muncul di sini saat mulai merekam...</p>
        ) : (
          liveLines.map((line, i) => <p key={i}>{line}</p>)
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {recordingState === "idle" && (
          <Button variant="primary" size="lg" onClick={handleStart} className="flex-1">
            Mulai Merekam
          </Button>
        )}

        {recordingState === "recording" && (
          <>
            <Button variant="outline" size="lg" onClick={handlePause} className="flex-1">
              Jeda
            </Button>
            <Button variant="commit" size="lg" onClick={handleEnd} className="flex-1">
              Selesai Sesi
            </Button>
          </>
        )}

        {recordingState === "paused" && (
          <>
            <Button variant="outline" size="lg" onClick={handleResume} className="flex-1">
              Lanjutkan
            </Button>
            <Button variant="commit" size="lg" onClick={handleEnd} className="flex-1">
              Selesai Sesi
            </Button>
          </>
        )}

        {recordingState === "ended" && (
          <Link
            href={`/session/${sessionId}`}
            className="flex-1 rounded-2xl bg-neutral-900 px-6 py-3 text-center text-base font-bold text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900"
          >
            Sesi Selesai — Lihat Rangkuman →
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            setDraftText(fullText);
            setCorrectionMode((v) => !v);
          }}
          className="w-fit text-sm text-neutral-500 hover:underline"
        >
          {correctionMode ? "Tutup koreksi transkrip" : "Koreksi transkrip manual"}
        </button>

        {correctionMode && (
          <div className="flex flex-col gap-2">
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={8}
              className="rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
            />
            <Button variant="commit" size="md" onClick={handleSaveCorrection} disabled={saving} className="w-fit">
              {saving ? "Menyimpan..." : "Simpan Koreksi"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
