"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocketClient } from "@/lib/socket/client";
import { LiveCaption } from "@/components/live/LiveCaption";
import { TranscriptDisplay } from "@/components/live/TranscriptDisplay";
import { QRCodeCard } from "@/components/resume/QRCodeGenerator";

type DisplayMode = "caption" | "full";

const MIN_FONT = 28;
const MAX_FONT = 72;
const DEFAULT_FONT = 48;
const ENDED_STATUSES = ["PROCESSING", "COMPLETED"];

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
}) {
  const [mode, setMode] = useState<DisplayMode>("caption");
  const [finalLines, setFinalLines] = useState<string[]>([]);
  const [interimLine, setInterimLine] = useState("");
  const [fullText, setFullText] = useState(initialFullText);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [light, setLight] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(ENDED_STATUSES.includes(initialStatus));
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
    }

    function handleQuizLaunched() {
      router.refresh();
    }

    socket.on("transcript:update", handleTranscriptUpdate);
    socket.on("display:mode", handleDisplayMode);
    socket.on("session:status", handleSessionStatus);
    socket.on("quiz:launched", handleQuizLaunched);

    return () => {
      socket.off("transcript:update", handleTranscriptUpdate);
      socket.off("display:mode", handleDisplayMode);
      socket.off("session:status", handleSessionStatus);
      socket.off("quiz:launched", handleQuizLaunched);
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
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-10 bg-neutral-950 px-6">
        <div className="text-center">
          <p className="text-2xl font-semibold text-white">{title}</p>
          <p className="text-neutral-400">
            {subject} · Kelas {grade} · {dateLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-12">
          <QRCodeCard
            qrDataUrl={qrDataUrl}
            heading="Rangkuman & Mind Map"
            helperText="Scan untuk lihat rangkuman, mind map, dan soal latihan"
            alt="QR code menuju halaman resume pembelajaran"
            dark
          />
          {quizQrDataUrl && (
            <QRCodeCard
              qrDataUrl={quizQrDataUrl}
              heading="Ikuti Quiz"
              helperText="Scan untuk gabung quiz sesi ini"
              alt="QR code menuju halaman gabung quiz"
              dark
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden ${
        light ? "bg-white" : "bg-neutral-950"
      }`}
    >
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

      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur">
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
