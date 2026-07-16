import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { title, subject, grade } = await req.json();
  if (!title || !subject || !grade) {
    return NextResponse.json(
      { error: "Judul, mata pelajaran, dan kelas wajib diisi" },
      { status: 400 }
    );
  }

  const created = await prisma.session.create({
    data: { title, subject, grade, teacherId: teacher.id },
  });

  return NextResponse.json({ session: created }, { status: 201 });
}
