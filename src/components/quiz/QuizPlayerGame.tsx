"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { QuizJoinForm } from "@/components/quiz/QuizJoinForm";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { QuizResults } from "@/components/quiz/QuizResults";
import { playSound } from "@/lib/sound";

type QuestionData = {
  questionId: string;
  question: string;
  options: string[];
  timeLimit: number;
  questionNumber: number;
  totalQuestions: number;
};

type ResultData = {
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
  score: number;
  pointsEarned: number;
};

type BreakdownItem = {
  questionId: string;
  question: string;
  correctAnswer: string;
  explanation: string | null;
  correctCount: number;
  totalAnswered: number;
};

type ConfettiItem = {
  id: number;
  left: number;
  delay: number;
  char: string;
};

type Phase = "join" | "waiting" | "question" | "answered" | "result" | "finished" | "loading-results";

export function QuizPlayerGame({
  sessionId,
  initialStatus,
}: {
  sessionId: string;
  initialStatus: "LOBBY" | "ACTIVE" | "COMPLETED";
}) {
  const [phase, setPhase] = useState<Phase>(
    initialStatus === "COMPLETED" ? "loading-results" : "join"
  );
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [confetti, setConfetti] = useState<ConfettiItem[]>([]);

  useEffect(() => {
    if (phase !== "loading-results") return;
    fetch(`/api/quiz/results?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          setRankings(data.result.rankings);
          setBreakdown(data.result.breakdown);
        }
        setPhase("finished");
      })
      .catch(() => setPhase("finished"));
  }, [phase, sessionId]);

  useEffect(() => {
    if (phase === "join" || phase === "loading-results") return;

    const socket = getSocketClient();

    function handleQuestion(data: QuestionData) {
      setQuestion(data);
      setQuestionStartedAt(Date.now());
      setSelectedAnswer(null);
      setResult(null);
      setConfetti([]);
      setPhase("question");
    }

    function handleResult(data: ResultData) {
      setResult(data);
      setPhase("result");
      if (data.correct) {
        playSound.playCorrect();
        const chars = ["⭐", "✨", "🎈", "🍬", "🍭", "🚀", "🌈"];
        const newConfetti = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 1.2,
          char: chars[Math.floor(Math.random() * chars.length)],
        }));
        setConfetti(newConfetti);
      } else {
        playSound.playIncorrect();
        setConfetti([]);
      }
    }

    function handleFinished(data: {
      rankings: { name: string; score: number }[];
      breakdown: BreakdownItem[];
    }) {
      setRankings(data.rankings);
      setBreakdown(data.breakdown);
      setPhase("finished");
      playSound.playWin();
    }

    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:result", handleResult);
    socket.on("quiz:finished", handleFinished);

    return () => {
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:result", handleResult);
      socket.off("quiz:finished", handleFinished);
    };
  }, [phase]);

  function handleAnswer(answer: string) {
    if (!question) return;
    setSelectedAnswer(answer);
    setPhase("answered");
    playSound.playPop();
    getSocketClient().emit("quiz:answer", {
      sessionId,
      questionId: question.questionId,
      answer,
    });
  }

  if (phase === "join") {
    return <QuizJoinForm sessionId={sessionId} onJoined={() => setPhase("waiting")} />;
  }

  if (phase === "loading-results") {
    return (
      <div className="flex flex-col items-center gap-4 text-center p-8 bg-white rounded-2xl shadow-lg border-3 border-primary/20 max-w-sm w-full">
        <div className="flex gap-3 justify-center mb-1">
          <span className="cute-bounce text-4xl" style={{ animationDelay: "0s" }}>🎈</span>
          <span className="cute-bounce text-4xl" style={{ animationDelay: "0.15s" }}>🧸</span>
          <span className="cute-bounce text-4xl" style={{ animationDelay: "0.3s" }}>✨</span>
        </div>
        <p className="text-xl font-black text-primary">Tunggu sebentar ya... ⏳</p>
        <p className="text-base font-bold text-neutral-500">Sedang mengumpulkan nilai kuis kamu! 🏆🌟</p>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="flex flex-col items-center gap-5 text-center bg-white p-8 rounded-lg shadow-lg border-3 border-primary/30 max-w-sm w-full">
        <div className="h-4 w-4 animate-ping rounded-full bg-emerald-500" />
        <p className="text-2xl font-black text-primary">
          Hore! Kamu Sudah Masuk! 🎉
        </p>
        <p className="text-base font-bold text-neutral-500">
          Tunggu sebentar ya, bapak/ibu guru sedang bersiap memulai kuis... 🎯
        </p>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="flex flex-col items-center gap-6 text-center w-full">
        <p className="text-3xl font-black text-primary">
          Kuis Selesai! Hore! 🥳🏆
        </p>
        <QuizResults rankings={rankings} breakdown={breakdown} light />
      </div>
    );
  }

  if ((phase === "question" || phase === "answered" || phase === "result") && question) {
    return (
      <div className="flex w-full max-w-md flex-col gap-6 relative">
        {phase === "result" && result?.correct && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {confetti.map((c) => (
              <span
                key={c.id}
                className="confetti-particle text-3xl"
                style={{
                  left: `${c.left}%`,
                  animationDelay: `${c.delay}s`,
                }}
              >
                {c.char}
              </span>
            ))}
          </div>
        )}

        <QuizQuestion
          variant="player"
          question={question.question}
          options={question.options}
          questionNumber={question.questionNumber}
          totalQuestions={question.totalQuestions}
          timeLimit={question.timeLimit}
          questionStartedAt={questionStartedAt}
          phase={phase === "result" ? "reveal" : "question"}
          correctAnswer={phase === "result" ? result?.correctAnswer : undefined}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleAnswer}
          disabled={phase !== "question"}
        />

        {phase === "answered" && (
          <p className="text-center text-lg font-black text-primary animate-pulse mt-4">
            Jawaban kamu sudah terkirim! Keren! 🌟🚀
          </p>
        )}

        {phase === "result" && result && (
          <div
            className={`card-chunky p-6 text-center text-base transition-all ${
              result.correct
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-3xl font-black mb-2">
              {result.correct ? "Hebat! Jawabanmu BENAR! 🥳🎉" : "Yah, hampir tepat... 🥹💪"}
            </p>
            {result.correct ? (
              <p className="text-lg font-black text-emerald-600 mb-2">
                Kamu dapat +{result.pointsEarned} poin! 🏆⭐
              </p>
            ) : (
              <p className="text-lg font-black text-red-500 mb-2">
                Ayo coba lagi di soal berikutnya ya!
              </p>
            )}
            {result.explanation && (
              <p className="mt-3 text-sm font-bold opacity-90 border-t-2 border-dashed border-current pt-2 text-left leading-relaxed">
                💡 Penjelasan: {result.explanation}
              </p>
            )}
            <p className="mt-4 text-xl font-black text-neutral-800 bg-neutral-100/50 py-2 rounded-full border border-neutral-200">
              Total Skor: {result.score} ⭐
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

