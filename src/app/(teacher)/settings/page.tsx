import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/app-version";
import { PengaturanShell } from "@/components/teacher/PengaturanShell";

const PROVIDER_LABEL: Record<string, string> = {
  ollama: "Ollama (lokal/self-hosted)",
  qwen: "Qwen Cloud API",
  openrouter: "OpenRouter",
};

function currentModel(provider: string) {
  switch (provider) {
    case "qwen":
      return process.env.QWEN_MODEL || "qwen-plus";
    case "openrouter":
      return process.env.OPENROUTER_MODEL || "qwen/qwen-2.5-72b-instruct";
    default:
      return process.env.OLLAMA_MODEL || "qwen2.5:7b";
  }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const teacherId = (session.user as { id: string }).id;
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) redirect("/login");

  const provider = process.env.LLM_PROVIDER || "ollama";
  const sttProvider = process.env.STT_PROVIDER || "browser";

  return (
    <PengaturanShell
      teacher={{
        name: teacher.name,
        email: teacher.email,
        school: teacher.school ?? "",
        mainSubject: teacher.mainSubject ?? "",
        notifySessionComplete: teacher.notifySessionComplete,
        notifyAudioQuality: teacher.notifyAudioQuality,
        notifySystemUpdates: teacher.notifySystemUpdates,
      }}
      appVersion={APP_VERSION}
      hasNewVersion={teacher.notifySystemUpdates && teacher.lastSeenAppVersion !== APP_VERSION}
      aiInfo={{
        providerLabel: PROVIDER_LABEL[provider] ?? provider,
        model: currentModel(provider),
        sttLabel: sttProvider === "whisper" ? "Whisper (server)" : "Web Speech API (browser)",
      }}
    />
  );
}
