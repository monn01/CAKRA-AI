import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    school,
    mainSubject,
    notifySessionComplete,
    notifyAudioQuality,
    notifySystemUpdates,
    lastSeenAppVersion,
  } = body as {
    name?: string;
    school?: string | null;
    mainSubject?: string | null;
    notifySessionComplete?: boolean;
    notifyAudioQuality?: boolean;
    notifySystemUpdates?: boolean;
    lastSeenAppVersion?: string;
  };

  const updated = await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      ...(name !== undefined && { name }),
      ...(school !== undefined && { school }),
      ...(mainSubject !== undefined && { mainSubject }),
      ...(notifySessionComplete !== undefined && { notifySessionComplete }),
      ...(notifyAudioQuality !== undefined && { notifyAudioQuality }),
      ...(notifySystemUpdates !== undefined && { notifySystemUpdates }),
      ...(lastSeenAppVersion !== undefined && { lastSeenAppVersion }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      school: true,
      mainSubject: true,
      notifySessionComplete: true,
      notifyAudioQuality: true,
      notifySystemUpdates: true,
      lastSeenAppVersion: true,
    },
  });

  return NextResponse.json({ teacher: updated });
}
