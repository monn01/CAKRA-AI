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
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 px-8 py-10 text-center text-white">
      <div>
        <p className="text-lg text-neutral-400">Kode Ruangan</p>
        <p className="text-7xl font-bold tracking-widest">{roomCode}</p>
      </div>

      {/* data URL base64 — next/image tidak menghemat apa-apa di sini, butuh unoptimized juga */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="QR code untuk join quiz"
        className="h-56 w-56 rounded-lg bg-white p-3"
      />

      <p className="text-neutral-400">{questionCount} soal siap dimainkan</p>

      <div className="w-full max-w-xl">
        <p className="mb-3 text-xl">{players.length} siswa bergabung</p>
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((name, i) => (
            <span key={i} className="rounded-full bg-teal-950 px-4 py-2 text-sm text-teal-300">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
