"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";

type Phase = "lobby" | "question" | "reveal" | "finished";

export function QuizGameControl({
  sessionId,
  totalQuestions,
  initialStatus,
}: {
  sessionId: string;
  totalQuestions: number;
  initialStatus: string;
}) {
  const [timeLimit, setTimeLimit] = useState(30);
  const [phase, setPhase] = useState<Phase>(initialStatus === "COMPLETED" ? "finished" : "lobby");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });

  useEffect(() => {
    const stored = Number(localStorage.getItem("sibi-ai:default-quiz-time-limit"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ([15, 30, 60].includes(stored)) setTimeLimit(stored);
  }, []);

  useEffect(() => {
    const socket = getSocketClient();
    socket.emit("session:start", { sessionId });

    function handleQuestion(data: { questionNumber: number }) {
      setPhase("question");
      setQuestionNumber(data.questionNumber);
      setProgress({ answered: 0, total: 0 });
    }

    function handleProgress(data: { answered: number; total: number }) {
      setProgress(data);
    }

    function handleReveal() {
      setPhase("reveal");
    }

    function handleFinished() {
      setPhase("finished");
    }

    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:progress", handleProgress);
    socket.on("quiz:reveal", handleReveal);
    socket.on("quiz:finished", handleFinished);

    return () => {
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:progress", handleProgress);
      socket.off("quiz:reveal", handleReveal);
      socket.off("quiz:finished", handleFinished);
    };
  }, [sessionId]);

  function handleStart() {
    getSocketClient().emit("quiz:next", { sessionId, timeLimit });
  }

  if (phase === "finished") {
    return <p className="text-sm text-brand-muted">Kuis sudah selesai dimainkan.</p>;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-brand-muted">
          {phase === "lobby" ? "Belum dimulai" : `Soal ${questionNumber} dari ${totalQuestions}`}
        </span>
        {phase === "question" && (
          <span className="text-brand-muted">
            {progress.answered}/{progress.total} menjawab
          </span>
        )}
      </div>

      {phase === "lobby" ? (
        <div className="flex items-center gap-2">
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark"
          >
            <option value={15}>15 detik</option>
            <option value={30}>30 detik</option>
            <option value={60}>60 detik</option>
          </select>

          <button
            onClick={handleStart}
            className="cursor-pointer rounded-lg bg-confirm px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-confirm/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-confirm/60 focus-visible:ring-offset-2"
          >
            Mulai Kuis
          </button>
        </div>
      ) : (
        <p className="text-sm text-brand-muted">
          {phase === "question" ? "Soal berjalan..." : "Menampilkan jawaban benar, lanjut otomatis..."}
        </p>
      )}
    </div>
  );
}
