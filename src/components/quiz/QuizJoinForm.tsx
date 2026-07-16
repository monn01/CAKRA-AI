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
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama kamu"
        maxLength={24}
        required
        className="rounded-md border border-neutral-300 px-4 py-3 text-center text-lg outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
      />

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={joining}
        className="rounded-md bg-neutral-900 px-4 py-3 text-lg font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
      >
        {joining ? "Bergabung..." : "Gabung Quiz"}
      </button>
    </form>
  );
}
