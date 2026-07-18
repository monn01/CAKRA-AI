"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { QuizGameControl } from "@/components/dashboard/QuizGameControl";
import { Button } from "@/components/ui/Button";
import { getSocketClient } from "@/lib/socket/client";

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
  validatedAt?: string | null;
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
  title,
  subject,
  grade,
  onQuizChange,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialQuiz: QuizData | null;
  title: string;
  subject: string;
  grade: string;
  // Lapor ke parent tiap konten berubah — parent (ValidasiGuruShell) menyimpan
  // cache supaya hasil generate tidak hilang saat panel unmount karena pindah tab.
  onQuizChange?: (quiz: QuizData) => void;
}) {
  const [quiz, setQuiz] = useState<QuizData | null>(initialQuiz);

  function updateQuiz(next: QuizData) {
    setQuiz(next);
    onQuizChange?.(next);
  }
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
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
    setConfirming(false);

    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, count }),
    });
    const data = await res.json();

    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat soal kuis");
      return;
    }

    updateQuiz(data.quiz);
    setEditing(false);
  }

  function startEditing() {
    if (!quiz) return;
    setDraft(quiz.questions.map((q) => ({ ...q, options: [...q.options] })));
    setConfirming(false);
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

    updateQuiz(data.quiz);
    setEditing(false);
    getSocketClient().emit("content:validated", { sessionId, type: "quiz" });
  }

  async function handleValidate() {
    if (!quiz) return;
    setValidating(true);
    setError(null);

    const res = await fetch("/api/ai/quiz/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id }),
    });
    const data = await res.json();

    setValidating(false);

    if (!res.ok) {
      setError(data.error || "Gagal memvalidasi soal");
      return;
    }

    updateQuiz(data.quiz);
    setConfirming(false);
    getSocketClient().emit("content:validated", { sessionId, type: "quiz" });
  }

  function handlePrint() {
    if (!quiz) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    let y = 22;

    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${subject} · Kelas ${grade} · Soal Latihan`, margin, y);
    doc.setTextColor(0);
    y += 12;

    quiz.questions.forEach((q, i) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 22;
      }
      doc.setFontSize(11);
      const qLines = doc.splitTextToSize(`${i + 1}. ${q.question}`, pageWidth - margin * 2);
      doc.text(qLines, margin, y);
      y += qLines.length * 5.5 + 2;

      doc.setFontSize(10);
      q.options.forEach((opt, j) => {
        const isCorrect = LETTERS[j] === q.correctAnswer;
        doc.setTextColor(isCorrect ? 5 : 60, isCorrect ? 122 : 60, isCorrect ? 71 : 60);
        const optLines = doc.splitTextToSize(opt, pageWidth - margin * 2 - 4);
        doc.text(optLines, margin + 4, y);
        y += optLines.length * 5;
      });
      doc.setTextColor(0);

      if (q.explanation) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        const expLines = doc.splitTextToSize(`Pembahasan: ${q.explanation}`, pageWidth - margin * 2 - 4);
        doc.text(expLines, margin + 4, y);
        y += expLines.length * 4.5;
        doc.setTextColor(0);
      }
      y += 6;
    });

    doc.save(`soal-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
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
      setError(data.error || "Gagal meluncurkan kuis");
      return;
    }

    updateQuiz({ ...quiz, roomCode: data.quiz.roomCode, status: data.quiz.status });
    getSocketClient().emit("quiz:launched", { sessionId });
  }

  const isValidated = Boolean(quiz?.validatedAt);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-brand-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">Kuis</h2>
        {quiz && !editing && (
          <div className="flex flex-wrap items-center gap-2">
            {isValidated ? (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                ✅ Sudah Divalidasi
              </span>
            ) : !confirming ? (
              <Button variant="confirm" size="md" onClick={() => setConfirming(true)}>
                ✅ Validasi Soal
              </Button>
            ) : null}
            {isValidated && (
              <Button variant="outline" size="md" onClick={startEditing}>
                Revisi Lagi
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={handlePrint}>
              🖨️ Cetak Soal
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!quiz && !editing && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          {!hasTranscript ? (
            <p className="text-sm text-brand-muted">
              Transkrip belum tersedia. Selesaikan rekaman sesi terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-sm text-brand-muted">Kuis belum dibuat.</p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-brand-muted">Jumlah soal:</label>
                <input
                  type="number"
                  min={5}
                  max={15}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-16 rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark"
                />
              </div>
              <Button variant="primary" size="lg" onClick={handleGenerate} disabled={generating}>
                {generating ? "Menyiapkan kuis..." : "Buat Kuis"}
              </Button>
            </>
          )}
        </div>
      )}

      {quiz && !editing && confirming && !isValidated && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-confirm/30 bg-confirm/5 p-4">
          <p className="text-sm font-bold text-brand-dark">
            Apakah soal-soal ini sudah benar dan siap ditampilkan/dimainkan siswa?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="confirm" size="md" onClick={handleValidate} disabled={validating}>
              {validating ? "Memvalidasi..." : "✅ Ya, Sudah Benar"}
            </Button>
            <Button variant="outline" size="md" onClick={startEditing}>
              ✏️ Belum, Perlu Diperbaiki
            </Button>
            <Button variant="ghost" size="md" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </div>
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
            <div className="flex items-center justify-between rounded-lg bg-confirm/10 px-3 py-2 text-sm">
              <span className="text-confirm">
                Kode Ruangan: <span className="font-semibold">{quiz.roomCode}</span>
              </span>
              <a
                href={`/quiz/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-confirm hover:underline"
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
            <Button variant="primary" size="md" onClick={handleLaunch} disabled={launching} className="w-fit">
              {launching ? "Meluncurkan..." : "Luncurkan Kuis"}
            </Button>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-muted">{quiz.questions.length} soal</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={15}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-14 rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark"
              />
              <Button variant="outline" size="md" onClick={handleGenerate} disabled={generating}>
                {generating ? "Membuat ulang..." : "Buat Ulang"}
              </Button>
            </div>
          </div>

          {quiz.questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-brand-dark">
                  {i + 1}. {q.question}
                </p>
                <span className="shrink-0 rounded-full bg-brand-cream-alt px-2 py-0.5 text-xs text-brand-muted">
                  {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {q.options.map((opt, j) => (
                  <li
                    key={j}
                    className={
                      LETTERS[j] === q.correctAnswer
                        ? "rounded bg-success/10 px-2 py-1 text-success"
                        : "px-2 py-1 text-brand-muted"
                    }
                  >
                    {opt}
                  </li>
                ))}
              </ul>
              {q.explanation && (
                <p className="mt-2 text-xs text-brand-muted">Pembahasan: {q.explanation}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {editing && (
        <div className="flex flex-col gap-4">
          {draft.map((q, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-black/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-muted">Soal {i + 1}</span>
                <button
                  onClick={() => removeQuestion(i)}
                  className="cursor-pointer rounded-md px-2 py-0.5 text-xs text-red-600 transition-colors hover:bg-red-50 hover:underline"
                >
                  Hapus
                </button>
              </div>

              <textarea
                value={q.question}
                onChange={(e) => updateQuestion(i, { question: e.target.value })}
                rows={2}
                placeholder="Pertanyaan"
                className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt p-2 text-sm text-brand-dark outline-none focus:border-brand"
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
                      className="flex-1 rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark outline-none focus:border-brand"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                  placeholder="Penjelasan jawaban benar"
                  className="flex-1 rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark outline-none focus:border-brand"
                />
                <select
                  value={q.difficulty}
                  onChange={(e) => updateQuestion(i, { difficulty: e.target.value as Difficulty })}
                  className="rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark"
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
            className="w-fit cursor-pointer rounded-md px-1 text-sm text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-dark hover:underline"
          >
            + Tambah Soal
          </button>

          <div className="flex gap-2">
            <Button variant="commit" size="md" onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan & Validasi"}
            </Button>
            <Button variant="outline" size="md" onClick={() => setEditing(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
