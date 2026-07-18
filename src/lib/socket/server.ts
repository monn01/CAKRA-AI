import type { Server as HTTPServer, IncomingMessage } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { getToken } from "next-auth/jwt";
import { prisma } from "../prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

let io: SocketIOServer | undefined;

// Lobby quiz murni in-memory (belum ada model DB buat "participant") —
// cukup untuk kehadiran real-time, hasil akhir baru disimpan ke QuizAttempt (Modul 11).
const lobbyPlayers = new Map<string, Map<string, string>>(); // sessionId -> socketId -> playerName
const socketLobby = new Map<string, string>(); // socketId -> sessionId

function broadcastLobby(sessionId: string) {
  const players = Array.from(lobbyPlayers.get(sessionId)?.values() ?? []);
  io?.to(sessionId).emit("quiz:lobby:update", { players });
}

// ---- Gameplay quiz (Modul 10) — juga in-memory, alasan sama seperti lobby:
// tidak ada model DB buat progres per-soal, cuma QuizAttempt (hasil akhir, Modul 11). ----

interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

interface PlayerAnswer {
  answer: string;
  correct: boolean;
  timeSpent: number;
}

interface PlayerScore {
  playerName: string;
  score: number;
  streak: number;
  answers: Record<string, PlayerAnswer>; // questionId -> jawaban
}

interface QuestionStat {
  questionId: string;
  correctCount: number;
  totalAnswered: number;
}

interface GameState {
  quizId: string;
  questions: GameQuestion[];
  currentIndex: number; // -1 = belum mulai
  phase: "question" | "reveal";
  timeLimit: number; // detik
  questionStartedAt: number;
  answersThisQuestion: Map<string, string>; // playerName(lower) -> huruf jawaban (soal berjalan)
  questionStats: QuestionStat[]; // akumulasi statistik tiap soal yang sudah di-reveal
  timer: ReturnType<typeof setTimeout> | null;
}

const games = new Map<string, GameState>(); // sessionId -> GameState
const gameScores = new Map<string, Map<string, PlayerScore>>(); // sessionId -> playerName(lower) -> skor

function getScoreEntry(sessionId: string, playerName: string): PlayerScore {
  const scores = gameScores.get(sessionId) ?? new Map<string, PlayerScore>();
  gameScores.set(sessionId, scores);
  const key = playerName.toLowerCase();
  const existing = scores.get(key);
  if (existing) return existing;
  const fresh: PlayerScore = { playerName, score: 0, streak: 0, answers: {} };
  scores.set(key, fresh);
  return fresh;
}

function currentQuestionPayload(game: GameState) {
  const q = game.questions[game.currentIndex];
  return {
    questionId: q.id,
    question: q.question,
    options: q.options,
    timeLimit: game.timeLimit,
    questionNumber: game.currentIndex + 1,
    totalQuestions: game.questions.length,
  };
}

function rankings(sessionId: string) {
  const scores = Array.from(gameScores.get(sessionId)?.values() ?? []);
  return scores
    .sort((a, b) => b.score - a.score)
    .map((s) => ({ name: s.playerName, score: s.score }));
}

// Jeda tampil jawaban benar + papan peringkat sebelum otomatis lanjut ke soal berikutnya —
// guru cukup klik "Mulai Quiz" sekali, sisanya berjalan sendiri berdasarkan timer (Feedback 10/07/2026).
const REVEAL_DURATION_MS = 5000;

function revealCurrentQuestion(sessionId: string) {
  const game = games.get(sessionId);
  if (!game || game.phase !== "question") return;

  if (game.timer) clearTimeout(game.timer);
  game.phase = "reveal";

  const q = game.questions[game.currentIndex];
  const optionCounts: Record<string, number> = {};
  for (const letter of q.options.map((_, i) => String.fromCharCode(65 + i))) {
    optionCounts[letter] = 0;
  }
  let correctCount = 0;
  for (const answer of game.answersThisQuestion.values()) {
    if (answer in optionCounts) optionCounts[answer]++;
    if (answer === q.correctAnswer) correctCount++;
  }
  game.questionStats.push({
    questionId: q.id,
    correctCount,
    totalAnswered: game.answersThisQuestion.size,
  });

  io?.to(sessionId).emit("quiz:reveal", {
    correctAnswer: q.correctAnswer,
    optionCounts,
    explanation: q.explanation,
  });
  io?.to(sessionId).emit("quiz:leaderboard", { rankings: rankings(sessionId) });

  game.timer = setTimeout(() => {
    advanceQuiz(sessionId).catch((err) => console.error("[socket] advanceQuiz error:", err));
  }, REVEAL_DURATION_MS);
}

function startQuestion(sessionId: string, game: GameState) {
  game.phase = "question";
  game.questionStartedAt = Date.now();
  game.answersThisQuestion = new Map();

  io?.to(sessionId).emit("quiz:question", currentQuestionPayload(game));

  game.timer = setTimeout(() => revealCurrentQuestion(sessionId), game.timeLimit * 1000);
}

async function finishQuiz(sessionId: string, game: GameState) {
  const finalRankings = rankings(sessionId);
  const breakdown = game.questions.map((q) => {
    const stat = game.questionStats.find((s) => s.questionId === q.id);
    return {
      questionId: q.id,
      question: q.question,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      correctCount: stat?.correctCount ?? 0,
      totalAnswered: stat?.totalAnswered ?? 0,
    };
  });

  io?.to(sessionId).emit("quiz:finished", { rankings: finalRankings, breakdown });

  const scores = Array.from(gameScores.get(sessionId)?.values() ?? []);
  if (scores.length > 0) {
    await prisma.quizAttempt.createMany({
      data: scores.map((s) => ({
        quizId: game.quizId,
        playerName: s.playerName,
        score: s.score,
        answers: s.answers as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  await prisma.quiz.update({ where: { id: game.quizId }, data: { status: "COMPLETED" } });
  games.delete(sessionId);
  gameScores.delete(sessionId);
}

async function advanceQuiz(sessionId: string) {
  const game = games.get(sessionId);
  if (!game) return;

  if (game.timer) clearTimeout(game.timer);
  game.currentIndex += 1;

  if (game.currentIndex >= game.questions.length) {
    await finishQuiz(sessionId, game);
    return;
  }

  startQuestion(sessionId, game);
}

// Socket.IO tidak menangkap rejection dari handler async secara otomatis —
// tanpa ini, error DB (mis. koneksi putus) jadi unhandledRejection yang bikin
// client menunggu ack yang tidak pernah datang tanpa pesan error apapun.
function safeHandler<T>(handler: (payload: T) => Promise<void>) {
  return async (payload: T) => {
    try {
      await handler(payload);
    } catch (err) {
      console.error("[socket] handler error:", err);
    }
  };
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = decodeURIComponent(part.slice(eq + 1).trim());
    if (name) cookies[name] = value;
  }
  return cookies;
}

async function getTeacherIdFromHandshake(req: IncomingMessage): Promise<string | null> {
  try {
    const token = await getToken({
      req: {
        headers: req.headers,
        cookies: parseCookieHeader(req.headers.cookie),
      } as unknown as Parameters<typeof getToken>[0]["req"],
      secret: process.env.NEXTAUTH_SECRET,
    });
    return (token?.id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function persistTranscriptChunk(sessionId: string, text: string, timestamp: number) {
  const existing = await prisma.transcript.findUnique({ where: { sessionId } });

  if (existing) {
    return prisma.transcript.update({
      where: { sessionId },
      data: {
        fullText: `${existing.fullText} ${text}`.trim(),
        chunks: { create: { text, timestamp } },
      },
    });
  }

  return prisma.transcript.create({
    data: { sessionId, fullText: text, chunks: { create: { text, timestamp } } },
  });
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: { origin: process.env.APP_URL || "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    const teacherIdPromise = getTeacherIdFromHandshake(socket.request);

    socket.on("session:start", ({ sessionId }: { sessionId: string }) => {
      socket.join(sessionId);
    });

    socket.on(
      "session:end",
      safeHandler(async ({ sessionId }: { sessionId: string }) => {
        const teacherId = await teacherIdPromise;
        if (!teacherId) return;
        const owned = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!owned || owned.teacherId !== teacherId) return;

        io?.to(sessionId).emit("session:status", { status: "PROCESSING" });
      })
    );

    socket.on(
      "display:mode",
      safeHandler(async ({ sessionId, mode }: { sessionId: string; mode: "caption" | "full" }) => {
        const teacherId = await teacherIdPromise;
        if (!teacherId) return;

        const owned = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!owned || owned.teacherId !== teacherId) return;

        io?.to(sessionId).emit("display:mode", { mode });
      })
    );

    socket.on(
      "ppt:slide",
      safeHandler(async ({ sessionId, index }: { sessionId: string; index: number }) => {
        const teacherId = await teacherIdPromise;
        if (!teacherId) return;

        const owned = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!owned || owned.teacherId !== teacherId) return;

        io?.to(sessionId).emit("ppt:slide", { index });
      })
    );

    // Next.js Route Handler (App Router) berjalan di module graph Turbopack yang
    // terpisah dari module yang di-import langsung oleh server.ts, jadi getSocketServer()
    // yang dipanggil dari dalam route handler TIDAK PERNAH melihat `io` yang sama —
    // makanya broadcast real-time (setelah guru validasi/launch quiz lewat HTTP POST)
    // dilempar balik ke client, dan client-lah yang emit event socket ini (pola sama
    // seperti display:mode/ppt:slide di atas), bukan API route yang emit langsung.
    socket.on(
      "content:validated",
      safeHandler(async ({ sessionId, type }: { sessionId: string; type: string }) => {
        const teacherId = await teacherIdPromise;
        if (!teacherId) return;

        const owned = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!owned || owned.teacherId !== teacherId) return;

        io?.to(sessionId).emit("content:validated", { type });
      })
    );

    socket.on(
      "quiz:launched",
      safeHandler(async ({ sessionId }: { sessionId: string }) => {
        const teacherId = await teacherIdPromise;
        if (!teacherId) return;

        const owned = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!owned || owned.teacherId !== teacherId) return;

        io?.to(sessionId).emit("quiz:launched", {});
      })
    );

    socket.on(
      "transcript:chunk",
      safeHandler(
        async ({
          sessionId,
          text,
          isFinal,
          timestamp,
        }: {
          sessionId: string;
          text: string;
          isFinal: boolean;
          timestamp: number;
        }) => {
          if (!text.trim()) return;
          const teacherId = await teacherIdPromise;
          if (!teacherId) return;

          const owned = await prisma.session.findUnique({ where: { id: sessionId } });
          if (!owned || owned.teacherId !== teacherId) return;

          if (isFinal) {
            await persistTranscriptChunk(sessionId, text, timestamp);
          }

          io?.to(sessionId).emit("transcript:update", { text, isFinal, timestamp });
        }
      )
    );

    socket.on(
      "quiz:join",
      safeHandler(async ({ sessionId, playerName }: { sessionId: string; playerName: string }) => {
        const name = playerName?.trim();
        if (!sessionId || !name) {
          socket.emit("quiz:joined", { success: false, error: "Nama tidak boleh kosong" });
          return;
        }

        const activeQuiz = await prisma.quiz.findFirst({
          where: { sessionId, status: "LOBBY" },
          orderBy: { createdAt: "desc" },
        });

        if (!activeQuiz) {
          socket.emit("quiz:joined", { success: false, error: "Kuis belum dibuka untuk sesi ini" });
          return;
        }

        const room = lobbyPlayers.get(sessionId) ?? new Map<string, string>();
        const nameTaken = Array.from(room.values()).some(
          (existing) => existing.toLowerCase() === name.toLowerCase()
        );
        if (nameTaken) {
          socket.emit("quiz:joined", { success: false, error: "Nama sudah dipakai, coba nama lain" });
          return;
        }

        room.set(socket.id, name);
        lobbyPlayers.set(sessionId, room);
        socketLobby.set(socket.id, sessionId);
        socket.join(sessionId);

        socket.emit("quiz:joined", { success: true, totalPlayers: room.size });
        broadcastLobby(sessionId);
      })
    );

    socket.on(
      "quiz:next",
      safeHandler(
        async ({ sessionId, timeLimit }: { sessionId: string; timeLimit?: number }) => {
          const teacherId = await teacherIdPromise;
          if (!teacherId) return;
          const owned = await prisma.session.findUnique({ where: { id: sessionId } });
          if (!owned || owned.teacherId !== teacherId) return;

          // Quiz sudah berjalan — soal berikutnya lanjut otomatis sendiri (lihat revealCurrentQuestion),
          // jadi event ini abaikan kalau game udah ada (klik dobel/telat dari client lama).
          if (games.has(sessionId)) return;

          const quiz = await prisma.quiz.findFirst({
            where: { sessionId, status: "LOBBY" },
            orderBy: { createdAt: "desc" },
            include: { questions: { orderBy: { order: "asc" } } },
          });
          if (!quiz || quiz.questions.length === 0) return;

          await prisma.quiz.update({ where: { id: quiz.id }, data: { status: "ACTIVE" } });

          const game: GameState = {
            quizId: quiz.id,
            questions: quiz.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options as string[],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
            currentIndex: -1,
            phase: "reveal",
            timeLimit: timeLimit && [15, 30, 60].includes(timeLimit) ? timeLimit : 30,
            questionStartedAt: 0,
            answersThisQuestion: new Map(),
            questionStats: [],
            timer: null,
          };
          games.set(sessionId, game);
          gameScores.set(sessionId, new Map());

          await advanceQuiz(sessionId);
        }
      )
    );

    socket.on(
      "quiz:answer",
      safeHandler(
        async ({
          sessionId,
          questionId,
          answer,
        }: {
          sessionId: string;
          questionId: string;
          answer: string;
        }) => {
          const playerName = lobbyPlayers.get(sessionId)?.get(socket.id);
          if (!playerName) return;

          const game = games.get(sessionId);
          if (!game || game.phase !== "question") return;

          const q = game.questions[game.currentIndex];
          if (q.id !== questionId) return;

          const key = playerName.toLowerCase();
          if (game.answersThisQuestion.has(key)) return;

          const timeSpent = Date.now() - game.questionStartedAt;
          const correct = answer === q.correctAnswer;
          const entry = getScoreEntry(sessionId, playerName);

          let pointsEarned = 0;
          if (correct) {
            const timeRatio = Math.max(0, 1 - timeSpent / (game.timeLimit * 1000));
            const basePoints = 500 + Math.round(500 * timeRatio);
            entry.streak += 1;
            const streakBonus = Math.min(entry.streak - 1, 5) * 50;
            pointsEarned = basePoints + streakBonus;
            entry.score += pointsEarned;
          } else {
            entry.streak = 0;
          }

          game.answersThisQuestion.set(key, answer);
          entry.answers[q.id] = { answer, correct, timeSpent };

          socket.emit("quiz:result", {
            correct,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            score: entry.score,
            pointsEarned,
          });

          const totalPlayers = lobbyPlayers.get(sessionId)?.size ?? 0;
          io?.to(sessionId).emit("quiz:progress", {
            answered: game.answersThisQuestion.size,
            total: totalPlayers,
          });

          if (totalPlayers > 0 && game.answersThisQuestion.size >= totalPlayers) {
            revealCurrentQuestion(sessionId);
          }
        }
      )
    );

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);

      const sessionId = socketLobby.get(socket.id);
      if (sessionId) {
        lobbyPlayers.get(sessionId)?.delete(socket.id);
        socketLobby.delete(socket.id);
        broadcastLobby(sessionId);
      }
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) throw new Error("Socket.IO server belum diinisialisasi");
  return io;
}

// Dipakai dari API route (bukan socket handler) yang cuma perlu broadcast best-effort
// ke proyektor — kalau socket server belum siap, aksi utama (mis. simpan validasi ke DB)
// tetap harus sukses, jadi kegagalan emit di sini cuma di-log, tidak melempar error.
export function emitToSession(sessionId: string, event: string, payload: unknown): void {
  try {
    getSocketServer().to(sessionId).emit(event, payload);
  } catch (err) {
    console.warn(`[socket] gagal emit "${event}" ke sesi ${sessionId}:`, err);
  }
}
