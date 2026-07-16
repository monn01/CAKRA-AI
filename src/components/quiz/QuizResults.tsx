"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Ranking = { name: string; score: number };
type BreakdownItem = {
  questionId: string;
  question: string;
  correctAnswer: string;
  explanation: string | null;
  correctCount: number;
  totalAnswered: number;
};

const PODIUM_STYLE = [
  { order: "order-2", height: 112, medal: "🥇", bg: "bg-amber-400 text-amber-950", delay: 0.3 },
  { order: "order-1", height: 80, medal: "🥈", bg: "bg-neutral-300 text-neutral-800", delay: 0.15 },
  { order: "order-3", height: 64, medal: "🥉", bg: "bg-orange-300 text-orange-950", delay: 0 },
];

export function QuizResults({
  rankings,
  breakdown,
  light,
}: {
  rankings: Ranking[];
  breakdown: BreakdownItem[];
  light?: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, 10);

  const textClass = light ? "text-neutral-900 dark:text-neutral-50" : "text-white";
  const mutedClass = light ? "text-neutral-500" : "text-neutral-400";

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      {top3.length > 0 && (
        <div className="flex w-full items-end justify-center gap-3">
          {top3.map((player, i) => {
            const style = PODIUM_STYLE[i];
            return (
              <div key={i} className={`flex ${style.order} flex-1 flex-col items-center gap-1`}>
                <span className="text-2xl">{style.medal}</span>
                <p className={`truncate text-sm font-medium ${textClass}`}>{player.name}</p>
                <p className={`text-xs ${mutedClass}`}>{player.score}</p>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: style.height }}
                  transition={{ duration: 0.4, delay: style.delay, ease: "easeOut" }}
                  className={`w-full rounded-t-md ${style.bg}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <ol className="flex w-full flex-col gap-1">
          {rest.map((player, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                light ? "bg-neutral-100" : "bg-white/10"
              } ${textClass}`}
            >
              <span>
                {i + 4}. {player.name}
              </span>
              <span className="font-medium">{player.score}</span>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className={`text-sm underline ${mutedClass}`}
      >
        {showBreakdown ? "Sembunyikan pembahasan" : "Lihat pembahasan soal"}
      </button>

      {showBreakdown && (
        <div className="flex w-full flex-col gap-2">
          {breakdown.map((item, i) => {
            const pct =
              item.totalAnswered > 0
                ? Math.round((item.correctCount / item.totalAnswered) * 100)
                : 0;
            return (
              <div
                key={item.questionId}
                className={`rounded-md p-3 text-left text-sm ${
                  light ? "bg-neutral-100" : "bg-white/10"
                }`}
              >
                <p className={`font-medium ${textClass}`}>
                  {i + 1}. {item.question}
                </p>
                <p className={mutedClass}>
                  {pct}% siswa menjawab benar · Jawaban benar: {item.correctAnswer}
                </p>
                {item.explanation && <p className={`mt-1 ${mutedClass}`}>{item.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
