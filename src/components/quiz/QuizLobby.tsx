import { ProjectorBackground } from "@/components/live/ProjectorBackground";

const PLAYER_COLORS = [
  "bg-sky-950 text-sky-300",
  "bg-amber-950 text-amber-300",
  "bg-orange-950 text-orange-300",
  "bg-emerald-950 text-emerald-300",
  "bg-pink-950 text-pink-300",
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
  return (
    <div className="relative min-h-screen overflow-hidden bg-indigo-950 px-8 py-10 text-center text-white">
      <ProjectorBackground seed={5} />
      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-8">
        <div>
          <p className="text-lg text-sky-300/80">Kode Ruangan</p>
          <p className="text-7xl font-bold tracking-widest">{roomCode}</p>
        </div>

        {/* data URL base64 — next/image tidak menghemat apa-apa di sini, butuh unoptimized juga */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code untuk join quiz"
          className="h-56 w-56 rounded-lg bg-white p-3"
        />

        <p className="text-sky-300/80">{questionCount} soal siap dimainkan</p>

        <div className="w-full max-w-xl">
          <p className="mb-3 text-xl">{players.length} siswa bergabung</p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((name, i) => (
              <span
                key={i}
                className={`rounded-full px-4 py-2 text-sm ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`}
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
