"use client";

import { useState, type FormEvent } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { playSound } from "@/lib/sound";

const MASCOTS = [
  { emoji: "🦁", label: "Singa" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🦊", label: "Rubah" },
  { emoji: "🐸", label: "Katak" },
  { emoji: "🦄", label: "Poni" },
  { emoji: "🦖", label: "Dino" },
  { emoji: "🐨", label: "Koala" },
  { emoji: "🐰", label: "Kelinci" },
];

export function QuizJoinForm({
  sessionId,
  onJoined,
}: {
  sessionId: string;
  onJoined: (playerName: string) => void;
}) {
  const [name, setName] = useState("");
  const [selectedMascot, setSelectedMascot] = useState("🦁");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setJoining(true);
    setError(null);

    const socket = getSocketClient();
    const trimmed = name.trim();
    const fullNameWithMascot = `${selectedMascot} ${trimmed}`;

    function handleJoined(res: { success: boolean; error?: string }) {
      socket.off("quiz:joined", handleJoined);
      setJoining(false);

      if (!res.success) {
        setError(res.error || "Gagal bergabung");
        return;
      }

      playSound.playPop();
      onJoined(fullNameWithMascot);
    }

    socket.on("quiz:joined", handleJoined);
    socket.emit("quiz:join", { sessionId, playerName: fullNameWithMascot });
  }

  function handleSelectMascot(emoji: string) {
    setSelectedMascot(emoji);
    playSound.playPop();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6 bg-white p-6 rounded-3xl border-3 border-sky-200/50 shadow-xl">
      <div className="flex flex-col gap-2">
        <label className="text-center text-base font-black text-sky-700">
          Pilih Karakter Kamu 🦄✨
        </label>
        <div className="grid grid-cols-4 gap-2.5">
          {MASCOTS.map((m) => (
            <button
              key={m.emoji}
              type="button"
              onClick={() => handleSelectMascot(m.emoji)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all border-3 ${
                selectedMascot === m.emoji
                  ? "border-amber-400 bg-amber-50 scale-110 shadow-md animate-bounce"
                  : "border-neutral-100 bg-neutral-50 hover:bg-sky-50 hover:scale-105"
              }`}
              title={m.label}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-name" className="text-center text-base font-black text-sky-700">
          Tulis Nama Panggilanmu ✍️
        </label>
        <input
          id="student-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kamu... 😊"
          maxLength={18}
          required
          className="rounded-full border-3 border-sky-400 bg-neutral-50 px-6 py-3.5 text-center text-lg font-black shadow-inner outline-none focus:border-amber-400 focus:bg-white transition-all placeholder:text-neutral-400"
        />
      </div>

      {error && <p className="text-center text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={joining}
        className="rounded-full bg-amber-400 hover:bg-amber-500 px-6 py-4 text-xl font-black text-amber-950 shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer btn-chunky"
      >
        {joining ? "Sedang masuk... 🚀" : "Mulai Ikut Quiz! 🎉"}
      </button>
    </form>
  );
}

