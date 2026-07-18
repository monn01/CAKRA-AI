"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSocketClient } from "@/lib/socket/client";
import { LiveCaption } from "@/components/live/LiveCaption";
import { TranscriptDisplay } from "@/components/live/TranscriptDisplay";
import { ProjectorBackground } from "@/components/live/ProjectorBackground";
import { PptSlideViewer } from "@/components/live/PptSlideViewer";
import { SessionResultsPanel } from "@/components/live/SessionResultsPanel";
import { QRCodeCard } from "@/components/resume/QRCodeGenerator";
import type { MindMapStructure } from "@/components/mindmap/InteractiveMindMap";

type DisplayMode = "caption" | "full";

const MIN_FONT = 28;
const MAX_FONT = 72;
const DEFAULT_FONT = 48;
const ENDED_STATUSES = ["PROCESSING", "COMPLETED"];

type ReviewQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

export function LiveDisplay({
  sessionId,
  initialFullText,
  initialStatus,
  title,
  subject,
  grade,
  dateLabel,
  qrDataUrl,
  quizQrDataUrl,
  pptSlideUrls,
  summary,
  mindMap,
  quiz,
}: {
  sessionId: string;
  initialFullText: string;
  initialStatus: string;
  title: string;
  subject: string;
  grade: string;
  dateLabel: string;
  qrDataUrl: string;
  quizQrDataUrl: string | null;
  pptSlideUrls: string[];
  summary: { content: string; keyPoints: string[]; validatedAt: string | null } | null;
  mindMap: { structure: MindMapStructure; validatedAt: string | null } | null;
  quiz: { questions: ReviewQuestion[]; validatedAt: string | null } | null;
}) {
  const [mode, setMode] = useState<DisplayMode>("caption");
  // finalLines = kalimat yang sudah utuh & dikunci (riwayat, redup).
  // interimLine = baris yang lagi tumbuh real-time selagi guru bicara
  // (terang, diketik via TypewriterText) — sengaja TETAP live per kata biar
  // nggak ada delay, karena delay-nya justru bikin caption kerasa lambat.
  // "Koreksi" (baris dikunci final & pindah ke riwayat) cuma terjadi sekali
  // per KALIMAT utuh — itu terjadi di speech-handler.ts (sentenceBuffer),
  // bukan di sini, jadi baris final tidak pernah ganti-ganti kata per kata.
  const [finalLines, setFinalLines] = useState<string[]>([]);
  const [interimLine, setInterimLine] = useState("");
  const [fullText, setFullText] = useState(initialFullText);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [light, setLight] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(ENDED_STATUSES.includes(initialStatus));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recording, setRecording] = useState(initialStatus === "RECORDING");
  const [connected, setConnected] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Dibaca setelah mount (bukan lazy initializer) supaya render pertama cocok
    // dengan SSR — localStorage tidak tersedia di server.
    const storedFont = Number(localStorage.getItem("sibi-ai:live-font"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedFont) setFontSize(storedFont);
    setLight(localStorage.getItem("sibi-ai:live-theme") === "light");
  }, []);

  useEffect(() => {
    const socket = getSocketClient();
    socket.emit("session:start", { sessionId });

    function handleTranscriptUpdate({
      text,
      isFinal,
    }: {
      text: string;
      isFinal: boolean;
    }) {
      if (isFinal) {
        setFinalLines((prev) => [...prev, text].slice(-2));
        setInterimLine("");
        setFullText((prev) => `${prev} ${text}`.trim());
      } else {
        setInterimLine(text);
      }
    }

    function handleDisplayMode({ mode }: { mode: DisplayMode }) {
      setMode(mode);
    }

    function handleSessionStatus({ status }: { status: string }) {
      if (ENDED_STATUSES.includes(status)) setSessionEnded(true);
      setRecording(status === "RECORDING");
    }

    function handleConnect() {
      setConnected(true);
    }
    function handleDisconnect() {
      setConnected(false);
    }

    function handleQuizLaunched() {
      router.refresh();
    }

    function handlePptSlide({ index }: { index: number }) {
      setCurrentSlide(index);
    }

    function handleContentValidated() {
      router.refresh();
    }

    socket.on("transcript:update", handleTranscriptUpdate);
    socket.on("display:mode", handleDisplayMode);
    socket.on("session:status", handleSessionStatus);
    socket.on("quiz:launched", handleQuizLaunched);
    socket.on("ppt:slide", handlePptSlide);
    socket.on("content:validated", handleContentValidated);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    // Sinkronisasi status koneksi socket yang sudah ada saat mount (bukan
    // event baru) — tidak bisa diturunkan sinkron dari state lain.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConnected(socket.connected);

    return () => {
      socket.off("transcript:update", handleTranscriptUpdate);
      socket.off("display:mode", handleDisplayMode);
      socket.off("session:status", handleSessionStatus);
      socket.off("quiz:launched", handleQuizLaunched);
      socket.off("ppt:slide", handlePptSlide);
      socket.off("content:validated", handleContentValidated);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [sessionId, router]);

  function adjustFont(delta: number) {
    setFontSize((prev) => {
      const next = Math.min(MAX_FONT, Math.max(MIN_FONT, prev + delta));
      localStorage.setItem("sibi-ai:live-font", String(next));
      return next;
    });
  }

  function toggleTheme() {
    setLight((prev) => {
      const next = !prev;
      localStorage.setItem("sibi-ai:live-theme", next ? "light" : "dark");
      return next;
    });
  }

  if (sessionEnded) {
    return (
      <div className="relative flex h-screen w-screen overflow-hidden bg-indigo-950">
        <ProjectorBackground seed={11} />

        <div className="absolute top-6 left-10 z-10 flex items-center gap-2">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand">CAKRA-AI</h2>
          <Sparkles className="size-3.5 text-brand/70" aria-hidden="true" />
        </div>

        <div className="relative z-10 flex w-[38%] flex-col justify-center gap-4 px-10">
          <div>
            <p className="text-lg font-semibold text-white">{title}</p>
            <p className="text-sm text-sky-300/70">
              {subject} · Kelas {grade} · {dateLabel}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {finalLines.length > 0 ? (
              finalLines.map((line, i) => (
                <p key={i} className="text-xl leading-relaxed text-white/80">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-white/40">Materi pembelajaran hari ini sudah selesai disampaikan.</p>
            )}
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
          <SessionResultsPanel summary={summary} mindMap={mindMap} quiz={quiz} />
        </div>

        <div className="absolute bottom-4 right-4 z-10 flex items-end gap-3">
          <QRCodeCard
            qrDataUrl={qrDataUrl}
            heading="Bagikan ke Orang Tua"
            helperText="Rangkuman & peta pikiran"
            alt="QR code menuju halaman resume pembelajaran"
            dark
            compact
          />
          {quizQrDataUrl && (
            <QRCodeCard
              qrDataUrl={quizQrDataUrl}
              heading="Ikuti Kuis"
              helperText="Gabung kuis sesi ini"
              alt="QR code menuju halaman gabung kuis"
              dark
              compact
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden ${
        light ? "bg-gradient-to-br from-sky-50 via-white to-amber-50" : "bg-indigo-950"
      }`}
    >
      <ProjectorBackground light={light} />

      {!light && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
              CAKRA-AI
            </h2>
            <Sparkles className="size-4 text-brand/70" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/50 uppercase">
              <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
              {connected ? "Tersambung ke Server" : "Menyambungkan ulang..."}
            </span>
            {recording && (
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-semibold tracking-wider text-red-400 uppercase">
                  Merekam Sesi Aktif
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className={pptSlideUrls.length > 0 ? "h-[42%]" : "h-full"}>
          {mode === "caption" ? (
            <LiveCaption
              finalLines={finalLines}
              interimLine={interimLine}
              fontSize={fontSize}
              light={light}
            />
          ) : (
            <TranscriptDisplay fullText={fullText} fontSize={fontSize} light={light} />
          )}
        </div>

        {pptSlideUrls.length > 0 && (
          <div className="h-[58%]">
            <PptSlideViewer slideUrls={pptSlideUrls} currentSlide={currentSlide} />
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur">
        <button
          onClick={() => adjustFont(-4)}
          aria-label="Perkecil huruf"
          className="h-7 w-7 rounded-full text-sm text-white/70 hover:text-white"
        >
          A-
        </button>
        <button
          onClick={() => adjustFont(4)}
          aria-label="Perbesar huruf"
          className="h-7 w-7 rounded-full text-sm text-white/70 hover:text-white"
        >
          A+
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Ganti tema"
          className="h-7 w-7 rounded-full text-sm text-white/70 hover:text-white"
        >
          {light ? "🌙" : "☀"}
        </button>
      </div>
    </div>
  );
}
