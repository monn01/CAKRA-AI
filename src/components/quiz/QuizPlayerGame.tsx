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
    return <p className="text-sm text-neutral-500">Memuat hasil...</p>;
  }

  if (phase === "waiting") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
          Kamu sudah bergabung
        </p>
        <p className="text-sm text-neutral-500">Menunggu guru memulai quiz...</p>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Quiz Selesai!
        </p>
        <QuizResults rankings={rankings} breakdown={breakdown} light />
      </div>
    );
  }

  if ((phase === "question" || phase === "answered" || phase === "result") && question) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
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
          <p className="text-center text-sm text-neutral-500">Jawaban terkirim, menunggu...</p>
        )}

        {phase === "result" && result && (
          <div
            className={`rounded-lg p-3 text-center text-sm ${
              result.correct
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            <p className="font-medium">
              {result.correct ? `Benar! +${result.pointsEarned} poin` : "Kurang tepat"}
            </p>
            {result.explanation && <p className="mt-1 text-xs opacity-80">{result.explanation}</p>}
            <p className="mt-1 text-xs opacity-80">Total skor: {result.score}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
