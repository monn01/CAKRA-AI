"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { QuizJoinForm } from "@/components/quiz/QuizJoinForm";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { QuizResults } from "@/components/quiz/QuizResults";

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
      setPhase("question");
    }

    function handleResult(data: ResultData) {
      setResult(data);
      setPhase("result");
    }

    function handleFinished(data: {
      rankings: { name: string; score: number }[];
      breakdown: BreakdownItem[];
    }) {
      setRankings(data.rankings);
      setBreakdown(data.breakdown);
      setPhase("finished");
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
          Quiz Selesai! Hore! 🥳🏆
        </p>
        <QuizResults rankings={rankings} breakdown={breakdown} light />
      </div>
    );
  }

  if ((phase === "question" || phase === "answered" || phase === "result") && question) {
    return (
      <div className="flex w-full max-w-md flex-col gap-6">
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
            className={`rounded-lg p-5 text-center text-base shadow-lg border-3 transition-all ${
              result.correct
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-2xl font-black mb-2">
              {result.correct ? "Hebat! Jawabanmu BENAR! 🥳" : "Yah, belum tepat... 🥹"}
            </p>
            {result.correct && (
              <p className="text-lg font-extrabold text-emerald-600 mb-2">
                Kamu dapat +{result.pointsEarned} poin! 🏆
              </p>
            )}
            {result.explanation && (
              <p className="mt-2 text-sm font-semibold opacity-90 border-t border-dashed border-current pt-2 text-left">
                💡 Penjelasan: {result.explanation}
              </p>
            )}
            <p className="mt-3 text-lg font-black text-neutral-700">
              Total Skor Kamu: {result.score} ⭐
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
