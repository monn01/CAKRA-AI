import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthenticatedTeacher = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export async function requireTeacher(): Promise<AuthenticatedTeacher | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as AuthenticatedTeacher;
}

export async function getOwnedSession(sessionId: string, teacherId: string) {
  const teachingSession = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!teachingSession || teachingSession.teacherId !== teacherId) return null;
  return teachingSession;
}

export async function getOwnedQuiz(quizId: string, teacherId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { session: true },
  });
  if (!quiz || quiz.session.teacherId !== teacherId) return null;
  return quiz;
}
