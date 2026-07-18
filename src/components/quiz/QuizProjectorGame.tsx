"use client";

import { useEffect, useRef, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { QuizLobby } from "@/components/quiz/QuizLobby";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { QuizLeaderboard } from "@/components/quiz/QuizLeaderboard";
import { QuizResults } from "@/components/quiz/QuizResults";
import { ProjectorBackground } from "@/components/live/ProjectorBackground";

type QuestionData = {
  questionId: string;
  question: string;
  options: string[];
  timeLimit: number;
  questionNumber: number;
  totalQuestions: number;
};

type RevealData = {
  correctAnswer: string;
  optionCounts: Record<string, number>;
  explanation: string | null;
};

type BreakdownItem = {
  questionId: string;
  question: string;
  correctAnswer: string;
  explanation: string | null;
  correctCount: number;
  totalAnswered: number;
};

type Phase = "lobby" | "waiting" | "question" | "reveal" | "finished";

export function QuizProjectorGame({
  sessionId,
  roomCode,
  qrDataUrl,
  questionCount,
  initialStatus,
}: {
  sessionId: string;
  roomCode: string;
  qrDataUrl: string;
  questionCount: number;
  initialStatus: "LOBBY" | "ACTIVE" | "COMPLETED";
}) {
  const [phase, setPhase] = useState<Phase>(initialStatus === "LOBBY" ? "lobby" : "waiting");
  const [players, setPlayers] = useState<string[]>([]);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const playersRef = useRef<string[]>([]);

  useEffect(() => {
    if (initialStatus !== "COMPLETED") return;
    fetch(`/api/quiz/results?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          setRankings(data.result.rankings);
          setBreakdown(data.result.breakdown);
          setPhase("finished");
        }
      })
      .catch(() => {});
  }, [sessionId, initialStatus]);

  useEffect(() => {
    const socket = getSocketClient();
    socket.emit("session:start", { sessionId });

    function handleLobbyUpdate({ players }: { players: string[] }) {
      playersRef.current = players;
      setPlayers(players);
      setPhase((prev) => (prev === "waiting" ? "lobby" : prev));
    }

    function handleQuestion(data: QuestionData) {
      setQuestion(data);
      setQuestionStartedAt(Date.now());
      setReveal(null);
      setProgress({ answered: 0, total: playersRef.current.length });
      setPhase("question");
    }

    function handleProgress(data: { answered: number; total: number }) {
      setProgress(data);
    }

    function handleReveal(data: RevealData) {
      setReveal(data);
      setPhase("reveal");
    }

    function handleLeaderboard(data: { rankings: { name: string; score: number }[] }) {
      setRankings(data.rankings);
    }

    function handleFinished(data: {
      rankings: { name: string; score: number }[];
      breakdown: BreakdownItem[];
    }) {
      setRankings(data.rankings);
      setBreakdown(data.breakdown);
      setPhase("finished");
    }

    socket.on("quiz:lobby:update", handleLobbyUpdate);
    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:progress", handleProgress);
    socket.on("quiz:reveal", handleReveal);
    socket.on("quiz:leaderboard", handleLeaderboard);
    socket.on("quiz:finished", handleFinished);

    return () => {
      socket.off("quiz:lobby:update", handleLobbyUpdate);
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:progress", handleProgress);
      socket.off("quiz:reveal", handleReveal);
      socket.off("quiz:leaderboard", handleLeaderboard);
      socket.off("quiz:finished", handleFinished);
    };
  }, [sessionId]);

  if (phase === "lobby") {
    return (
      <QuizLobby
        roomCode={roomCode}
        qrDataUrl={qrDataUrl}
        questionCount={questionCount}
        players={players}
      />
    );
  }

  if (phase === "waiting") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-indigo-950 px-6 text-center">
        <ProjectorBackground seed={5} />
        <p className="relative z-10 text-2xl text-white">Menunggu update dari guru...</p>
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-indigo-950 px-6 py-10 text-center">
        <ProjectorBackground seed={5} />
        <p className="relative z-10 text-3xl font-semibold text-white">Kuis Selesai!</p>
        <div className="relative z-10">
          <QuizResults rankings={rankings} breakdown={breakdown} />
        </div>
      </main>
    );
  }

  if ((phase === "question" || phase === "reveal") && question) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-indigo-950 px-6 py-10">
        <ProjectorBackground seed={5} />
        <div key={question.questionId} className="quiz-question-enter relative z-10 w-full max-w-3xl">
          <QuizQuestion
            variant="projector"
            question={question.question}
            options={question.options}
            questionNumber={question.questionNumber}
            totalQuestions={question.totalQuestions}
            timeLimit={question.timeLimit}
            questionStartedAt={questionStartedAt}
            phase={phase === "question" ? "question" : "reveal"}
            correctAnswer={reveal?.correctAnswer}
            optionCounts={reveal?.optionCounts}
          />
        </div>

        {phase === "question" && (
          <p className="relative z-10 text-sky-300/80">
            {progress.answered} dari {progress.total} siswa sudah menjawab
          </p>
        )}

        {phase === "reveal" && rankings.length > 0 && (
          <div className="relative z-10 flex flex-col items-center gap-3">
            <p className="text-lg text-sky-300/80">Papan Peringkat</p>
            <QuizLeaderboard rankings={rankings} />
          </div>
        )}
      </main>
    );
  }

  return null;
}
