"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QuizGameControl } from "@/components/dashboard/QuizGameControl";

type Difficulty = "mudah" | "sedang" | "sulit";

type QuizQuestionData = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
};

type QuizData = {
  id: string;
  questions: QuizQuestionData[];
  roomCode: string | null;
  status: string;
};

const LETTERS = ["A", "B", "C", "D"];
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  mudah: "Mudah",
  sedang: "Sedang",
  sulit: "Sulit",
};

function emptyQuestion(): QuizQuestionData {
  return {
    question: "",
    options: ["A. ", "B. ", "C. ", "D. "],
    correctAnswer: "A",
    explanation: "",
    difficulty: "sedang",
  };
}

export function QuizPanel({
  sessionId,
  hasTranscript,
  initialQuiz,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialQuiz: QuizData | null;
}) {
  const [quiz, setQuiz] = useState<QuizData | null>(initialQuiz);
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuizQuestionData[]>([]);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem("sibi-ai:default-quiz-count"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setCount(stored);
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, count }),
    });
    const data = await res.json();

    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat soal quiz");
      return;
    }

    setQuiz(data.quiz);
    setEditing(false);
  }

  function startEditing() {
    if (!quiz) return;
    setDraft(quiz.questions.map((q) => ({ ...q, options: [...q.options] })));
    setEditing(true);
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestionData>) {
    setDraft((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setDraft((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q
      )
    );
  }

  function removeQuestion(index: number) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveEdit() {
    if (!quiz) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/ai/quiz", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id, questions: draft }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Gagal menyimpan revisi soal");
      return;
    }

    setQuiz(data.quiz);
    setEditing(false);
  }

  async function handleLaunch() {
    if (!quiz) return;
    setLaunching(true);
    setError(null);

    const res = await fetch("/api/quiz/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id }),
    });
    const data = await res.json();

    setLaunching(false);

    if (!res.ok) {
      setError(data.error || "Gagal meluncurkan quiz");
      return;
    }

    setQuiz((prev) => (prev ? { ...prev, roomCode: data.quiz.roomCode, status: data.quiz.status } : prev));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Quiz</h2>
        {quiz && !editing && (
          <button onClick={startEditing} className="text-sm text-neutral-500 hover:underline">
            Revisi Soal
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!quiz && !editing && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          {!hasTranscript ? (
            <p className="text-sm text-neutral-500">
              Transkrip belum tersedia. Selesaikan rekaman sesi terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500">Quiz belum dibuat.</p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-500">Jumlah soal:</label>
                <input
                  type="number"
                  min={5}
                  max={15}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {generating ? "Menyiapkan quiz..." : "Generate Quiz"}
              </button>
            </>
          )}
        </div>
      )}

      {quiz && !editing && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-3"
        >
          {quiz.roomCode ? (
            <div className="flex items-center justify-between rounded-md bg-teal-50 px-3 py-2 text-sm dark:bg-teal-950">
              <span className="text-teal-700 dark:text-teal-300">
                Kode Ruangan: <span className="font-semibold">{quiz.roomCode}</span>
              </span>
              <a
                href={`/quiz/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:underline dark:text-teal-300"
              >
                Buka Layar Proyektor ↗
              </a>
            </div>
          ) : null}

          {quiz.roomCode && (
            <QuizGameControl
              sessionId={sessionId}
              totalQuestions={quiz.questions.length}
              initialStatus={quiz.status}
            />
          )}

          {!quiz.roomCode && (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {launching ? "Meluncurkan..." : "Launch Quiz"}
            </button>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">{quiz.questions.length} soal</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={15}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-14 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-sm text-neutral-500 hover:underline disabled:opacity-50"
              >
                {generating ? "Membuat ulang..." : "Generate Ulang"}
              </button>
            </div>
          </div>

          {quiz.questions.map((q, i) => (
            <div
              key={i}
              className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {i + 1}. {q.question}
                </p>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {q.options.map((opt, j) => (
                  <li
                    key={j}
                    className={
                      LETTERS[j] === q.correctAnswer
                        ? "rounded bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "px-2 py-1 text-neutral-600 dark:text-neutral-400"
                    }
                  >
                    {opt}
                  </li>
                ))}
              </ul>
              {q.explanation && (
                <p className="mt-2 text-xs text-neutral-500">Pembahasan: {q.explanation}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {editing && (
        <div className="flex flex-col gap-4">
          {draft.map((q, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Soal {i + 1}</span>
                <button
                  onClick={() => removeQuestion(i)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Hapus
                </button>
              </div>

              <textarea
                value={q.question}
                onChange={(e) => updateQuestion(i, { question: e.target.value })}
                rows={2}
                placeholder="Pertanyaan"
                className="rounded-md border border-neutral-300 p-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={q.correctAnswer === LETTERS[j]}
                      onChange={() => updateQuestion(i, { correctAnswer: LETTERS[j] })}
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, j, e.target.value)}
                      className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                  placeholder="Penjelasan jawaban benar"
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <select
                  value={q.difficulty}
                  onChange={(e) => updateQuestion(i, { difficulty: e.target.value as Difficulty })}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setDraft((prev) => [...prev, emptyQuestion()])}
            className="w-fit text-sm text-neutral-500 hover:underline"
          >
            + Tambah Soal
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
            >
              {saving ? "Menyimpan..." : "Simpan Revisi"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
