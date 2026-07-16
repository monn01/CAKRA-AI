import { NextRequest, NextResponse } from "next/server";
import { getQuizResultsForSession } from "@/lib/quiz-results";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wajib diisi" }, { status: 400 });
  }

  const result = await getQuizResultsForSession(sessionId);
  return NextResponse.json({ result });
}
