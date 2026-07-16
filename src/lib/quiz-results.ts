import { prisma } from "@/lib/prisma";

type StoredAnswer = { answer: string; correct: boolean; timeSpent: number };

export async function getQuizResultsForSession(sessionId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { sessionId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!quiz) return null;

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id },
    orderBy: { score: "desc" },
  });

  const rankings = attempts.map((a) => ({ name: a.playerName, score: a.score }));

  const breakdown = quiz.questions.map((q) => {
    let correctCount = 0;
    let totalAnswered = 0;

    for (const attempt of attempts) {
      const answers = attempt.answers as Record<string, StoredAnswer> | null;
      const record = answers?.[q.id];
      if (record) {
        totalAnswered++;
        if (record.correct) correctCount++;
      }
    }

    return {
      questionId: q.id,
      question: q.question,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      correctCount,
      totalAnswered,
    };
  });

  return { rankings, breakdown };
}
