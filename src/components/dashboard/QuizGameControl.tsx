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
    return <p className="text-sm text-neutral-500">Quiz sudah selesai dimainkan.</p>;
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">
          {phase === "lobby" ? "Belum dimulai" : `Soal ${questionNumber} dari ${totalQuestions}`}
        </span>
        {phase === "question" && (
          <span className="text-neutral-500">
            {progress.answered}/{progress.total} menjawab
          </span>
        )}
      </div>

      {phase === "lobby" ? (
        <div className="flex items-center gap-2">
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value={15}>15 detik</option>
            <option value={30}>30 detik</option>
            <option value={60}>60 detik</option>
          </select>

          <button
            onClick={handleStart}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Mulai Quiz
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          {phase === "question" ? "Soal berjalan..." : "Menampilkan jawaban benar, lanjut otomatis..."}
        </p>
      )}
    </div>
  );
}
