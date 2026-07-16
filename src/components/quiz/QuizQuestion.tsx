"use client";

import { useEffect, useState } from "react";

const LETTERS = ["A", "B", "C", "D"];

function optionColor({
  letter,
  phase,
  correctAnswer,
  selectedAnswer,
}: {
  letter: string;
  phase: "question" | "reveal";
  correctAnswer?: string;
  selectedAnswer?: string | null;
}) {
  if (phase !== "reveal") {
    return selectedAnswer === letter
      ? "border-neutral-900 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-800"
      : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900";
  }
  if (letter === correctAnswer) {
    return "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  }
  if (letter === selectedAnswer) {
    return "border-red-400 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400";
  }
  return "border-neutral-200 bg-white opacity-60 dark:border-neutral-700 dark:bg-neutral-900";
}

export function QuizQuestion({
  variant,
  question,
  options,
  questionNumber,
  totalQuestions,
  timeLimit,
  questionStartedAt,
  phase,
  correctAnswer,
  optionCounts,
  selectedAnswer,
  onSelectAnswer,
  disabled,
}: {
  variant: "projector" | "player";
  question: string;
  options: string[];
  questionNumber: number;
  totalQuestions: number;
  timeLimit: number;
  questionStartedAt: number;
  phase: "question" | "reveal";
  correctAnswer?: string;
  optionCounts?: Record<string, number>;
  selectedAnswer?: string | null;
  onSelectAnswer?: (letter: string) => void;
  disabled?: boolean;
}) {
  const [remaining, setRemaining] = useState(timeLimit);

  useEffect(() => {
    if (phase !== "question") return;
    const tick = () => {
      const elapsed = (Date.now() - questionStartedAt) / 1000;
      setRemaining(Math.max(0, Math.ceil(timeLimit - elapsed)));
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [phase, questionStartedAt, timeLimit]);

  const urgent = remaining <= 5 && phase === "question";
  const totalAnswered = optionCounts ? Object.values(optionCounts).reduce((a, b) => a + b, 0) : 0;

  const isProjector = variant === "projector";

  return (
    <div className={isProjector ? "flex flex-col items-center gap-6 text-white" : "flex flex-col gap-4"}>
      <div className="flex w-full items-center justify-between text-sm">
        <span className={isProjector ? "text-neutral-400" : "text-neutral-500"}>
          Soal {questionNumber} dari {totalQuestions}
        </span>
        {phase === "question" && (
          <span className={`font-semibold ${urgent ? "text-red-500" : isProjector ? "text-white" : "text-neutral-900 dark:text-neutral-50"}`}>
            {remaining}s
          </span>
        )}
      </div>

      <p className={isProjector ? "text-center text-3xl font-semibold" : "text-lg font-medium text-neutral-900 dark:text-neutral-50"}>
        {question}
      </p>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt, i) => {
          const letter = LETTERS[i];
          const isClickable =
            variant === "player" && phase === "question" && !disabled && onSelectAnswer;
          const count = optionCounts?.[letter] ?? 0;
          const pct = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;

          return (
            <button
              key={i}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectAnswer?.(letter)}
              className={`relative overflow-hidden rounded-lg border-2 p-4 text-left text-sm font-medium transition ${optionColor(
                { letter, phase, correctAnswer, selectedAnswer }
              )} ${isClickable ? "cursor-pointer hover:border-neutral-400" : "cursor-default"}`}
            >
              {phase === "reveal" && (
                <div
                  className="absolute inset-y-0 left-0 bg-black/5 dark:bg-white/5"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative">{opt}</span>
              {phase === "reveal" && (
                <span className="relative float-right text-xs opacity-70">{pct}%</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
