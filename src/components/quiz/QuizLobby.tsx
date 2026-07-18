"use client";

import { useEffect, useRef } from "react";
import { ProjectorBackground } from "@/components/live/ProjectorBackground";
import { playSound } from "@/lib/sound";

const PLAYER_COLORS = [
  "bg-sky-500 text-white border-sky-400",
  "bg-amber-400 text-amber-950 border-amber-300",
  "bg-pink-500 text-white border-pink-400",
  "bg-emerald-500 text-white border-emerald-400",
  "bg-orange-500 text-white border-orange-400",
];

export function QuizLobby({
  roomCode,
  qrDataUrl,
  questionCount,
  players,
}: {
  roomCode: string;
  qrDataUrl: string;
  questionCount: number;
  players: string[];
}) {
  const prevCount = useRef(players.length);

  useEffect(() => {
    if (players.length > prevCount.current) {
      playSound.playPop();
    }
    prevCount.current = players.length;
  }, [players.length]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-indigo-950 px-8 py-10 text-center text-white">
      <ProjectorBackground seed={5} />
      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-8">
        <div>
          <p className="text-xl text-sky-300/80 font-bold uppercase tracking-wider">Kode Ruangan Kuis 🎮</p>
          <p className="text-8xl font-black tracking-widest text-amber-400 drop-shadow-md">{roomCode}</p>
        </div>

        {/* data URL base64 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code untuk gabung kuis"
          className="h-56 w-56 rounded-3xl bg-white p-3 border-4 border-amber-400 shadow-xl"
        />

        <p className="text-sky-300 font-extrabold text-lg">{questionCount} Soal Latihan Seru Siap Dimainkan! 🚀</p>

        <div className="w-full max-w-2xl bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
          <p className="mb-4 text-2xl font-black text-amber-300">{players.length} Siswa Sudah Gabung</p>
          <div className="flex flex-wrap justify-center gap-3">
            {players.map((name, i) => (
              <span
                key={i}
                className={`rounded-full px-5 py-2.5 text-lg font-black border-3 shadow-md animate-wiggle ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

