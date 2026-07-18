import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedQuiz } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { emitToSession } from "@/lib/socket/server";

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { quizId } = await req.json();
  if (!quizId) {
    return NextResponse.json({ error: "quizId wajib diisi" }, { status: 400 });
  }

  const owned = await getOwnedQuiz(quizId, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
  }

  // Aturan produk: konten AI harus dikonfirmasi guru dulu sebelum tampil ke
  // siswa — kuis yang belum divalidasi tidak boleh diluncurkan ke kelas.
  if (!owned.validatedAt) {
    return NextResponse.json(
      { error: "Validasi soal terlebih dahulu sebelum meluncurkan kuis" },
      { status: 400 }
    );
  }

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode();
    try {
      const quiz = await prisma.quiz.update({
        where: { id: quizId },
        data: { roomCode, status: "LOBBY" },
      });
      emitToSession(owned.sessionId, "quiz:launched", {});
      return NextResponse.json({ quiz });
    } catch (err) {
      const isUniqueViolation =
        typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
      if (!isUniqueViolation) throw err;
      // roomCode bentrok — coba lagi dengan kode baru
    }
  }

  return NextResponse.json(
    { error: "Gagal membuat kode ruangan unik, coba lagi" },
    { status: 500 }
  );
}
