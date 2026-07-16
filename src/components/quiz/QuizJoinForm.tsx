"use client";

import { useState, type FormEvent } from "react";
import { getSocketClient } from "@/lib/socket/client";

export function QuizJoinForm({
  sessionId,
  onJoined,
}: {
  sessionId: string;
  onJoined: (playerName: string) => void;
}) {
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setJoining(true);
    setError(null);

    const socket = getSocketClient();
    const trimmed = name.trim();

    function handleJoined(res: { success: boolean; error?: string }) {
      socket.off("quiz:joined", handleJoined);
      setJoining(false);

      if (!res.success) {
        setError(res.error || "Gagal bergabung");
        return;
      }

      onJoined(trimmed);
    }

    socket.on("quiz:joined", handleJoined);
    socket.emit("quiz:join", { sessionId, playerName: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tulis nama kamu di sini... ✍"
        maxLength={24}
        required
        className="rounded-full border-3 border-primary bg-white px-6 py-4 text-center text-xl font-bold shadow-md outline-none focus:border-secondary transition-all placeholder:text-neutral-400"
      />

      {error && <p className="text-center text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={joining}
        className="rounded-full bg-secondary hover:bg-amber-500 px-6 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
      >
        {joining ? "Sedang masuk... 🚀" : "Mulai Ikut Quiz! 🎉"}
      </button>
    </form>
  );
}
