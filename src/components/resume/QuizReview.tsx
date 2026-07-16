"use client";

import { useState } from "react";

const LETTERS = ["A", "B", "C", "D"];

type ReviewQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

export function QuizReview({ questions }: { questions: ReviewQuestion[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {questions.map((q, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="overflow-hidden rounded-lg bg-white">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-neutral-900"
            >
              <span>
                {i + 1}. {q.question}
              </span>
              <span className="shrink-0 text-neutral-400">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-2 px-3 pb-3 text-sm">
                <ul className="flex flex-col gap-1">
                  {q.options.map((opt, j) => (
                    <li
                      key={j}
                      className={
                        LETTERS[j] === q.correctAnswer
                          ? "rounded bg-emerald-50 px-2 py-1 text-emerald-700"
                          : "px-2 py-1 text-neutral-600"
                      }
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
                {q.explanation && (
                  <p className="text-xs text-neutral-500">Pembahasan: {q.explanation}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
