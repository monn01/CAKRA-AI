import { NextRequest, NextResponse } from "next/server";
import { requireTeacher, getOwnedSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { SessionStatus } from "@/generated/prisma/enums";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const teachingSession = await prisma.session.findUnique({
    where: { id },
    include: { transcript: true, summary: true, mindMap: true, quizzes: true },
  });

  if (!teachingSession || teachingSession.teacherId !== teacher.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ session: teachingSession });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await getOwnedSession(id, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json();
  const { title, subject, grade, status, startedAt, endedAt } = body as {
    title?: string;
    subject?: string;
    grade?: string;
    status?: string;
    startedAt?: string;
    endedAt?: string;
  };

  if (status && !Object.values(SessionStatus).includes(status as SessionStatus)) {
    return NextResponse.json({ error: "Status sesi tidak valid" }, { status: 400 });
  }

  const updated = await prisma.session.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(subject !== undefined && { subject }),
      ...(grade !== undefined && { grade }),
      ...(status !== undefined && { status: status as SessionStatus }),
      ...(startedAt !== undefined && { startedAt: new Date(startedAt) }),
      ...(endedAt !== undefined && { endedAt: new Date(endedAt) }),
    },
  });

  return NextResponse.json({ session: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await getOwnedSession(id, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
