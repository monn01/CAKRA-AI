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
  { order: "order-2", height: 140, medal: "🥇", bg: "bg-amber-400 text-amber-950", delay: 0.3 },
  { order: "order-1", height: 100, medal: "🥈", bg: "bg-neutral-300 text-neutral-800", delay: 0.15 },
  { order: "order-3", height: 75, medal: "🥉", bg: "bg-orange-300 text-orange-950", delay: 0 },
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
        <div className="flex w-full items-end justify-center gap-3 mt-4">
          {top3.map((player, i) => {
            const style = PODIUM_STYLE[i];
            return (
              <div key={i} className={`flex ${style.order} flex-1 flex-col items-center gap-2`}>
                <span className="text-4xl animate-bounce" style={{ animationDelay: `${style.delay}s` }}>
                  {style.medal}
                </span>
                <p className={`truncate max-w-[120px] text-base font-black px-2.5 py-1 bg-white/80 dark:bg-black/30 rounded-full border border-neutral-300/30 shadow-sm ${textClass}`}>
                  {player.name}
                </p>
                <p className="text-sm font-black bg-amber-400/20 text-amber-500 dark:text-amber-300 px-3 py-0.5 rounded-full">
                  {player.score} ⭐
                </p>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: style.height }}
                  transition={{ duration: 0.6, delay: style.delay, ease: "backOut" }}
                  className={`w-full rounded-t-2xl border-x-3 border-t-3 border-black/10 shadow-lg ${style.bg}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <ol className="flex w-full flex-col gap-2.5">
          {rest.map((player, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded-full border-2 border-primary/10 px-5 py-2.5 text-base font-bold shadow-sm transition hover:scale-102 ${
                light ? "bg-white" : "bg-white/10"
              } ${textClass}`}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950 text-xs font-black text-primary">
                  {i + 4}
                </span>
                <span>{player.name}</span>
              </span>
              <span className="font-black text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full text-sm">
                {player.score} ⭐
              </span>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className={`text-sm font-extrabold underline cursor-pointer mt-2 hover:text-primary transition ${mutedClass}`}
      >
        {showBreakdown ? "Tutup pembahasan 🙈" : "Tengok jawaban & pembahasan yuk! 💡✨"}
      </button>

      {showBreakdown && (
        <div className="flex w-full flex-col gap-4">
          {breakdown.map((item, i) => {
            const pct =
              item.totalAnswered > 0
                ? Math.round((item.correctCount / item.totalAnswered) * 100)
                : 0;
            return (
              <div
                key={item.questionId}
                className={`card-chunky p-5 text-left text-base ${
                  light ? "bg-white border-2 border-primary/10" : "bg-white/10 border border-white/10"
                }`}
              >
                <p className={`font-black ${textClass} mb-1`}>
                  {i + 1}. {item.question}
                </p>
                <p className={`${mutedClass} font-bold text-sm flex items-center gap-1.5`}>
                  🎯 {pct}% teman-teman berhasil menjawab benar!
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mt-1">
                  ✅ Kunci Jawaban: {item.correctAnswer}
                </p>
                {item.explanation && (
                  <p className={`mt-2 p-3 bg-sky-50/50 dark:bg-sky-950/20 border border-primary/10 rounded-xl text-sm font-semibold leading-relaxed ${mutedClass}`}>
                    💡 Penjelasan: {item.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
