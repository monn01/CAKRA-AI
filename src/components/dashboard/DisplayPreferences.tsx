"use client";

import { useEffect, useState } from "react";

const COUNT_KEY = "sibi-ai:default-quiz-count";
const TIME_KEY = "sibi-ai:default-quiz-time-limit";

export function DisplayPreferences() {
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedCount = Number(localStorage.getItem(COUNT_KEY));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedCount) setCount(storedCount);
    const storedTime = Number(localStorage.getItem(TIME_KEY));
    if (storedTime) setTimeLimit(storedTime);
  }, []);

  function handleSave() {
    localStorage.setItem(COUNT_KEY, String(count));
    localStorage.setItem(TIME_KEY, String(timeLimit));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-brand-dark">Jumlah soal default saat membuat kuis</label>
        <input
          type="number"
          min={5}
          max={15}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-16 rounded border border-black/20 bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-brand-dark">Batas waktu default per soal</label>
        <select
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          className="cursor-pointer rounded border border-black/20 bg-brand-cream-alt px-2 py-1 text-sm text-brand-dark"
        >
          <option value={15}>15 detik</option>
          <option value={30}>30 detik</option>
          <option value={60}>60 detik</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-fit cursor-pointer rounded bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-dark/85 active:scale-[0.97]"
      >
        {saved ? "Tersimpan!" : "Simpan Preferensi"}
      </button>
      <p className="text-xs text-brand-muted">
        Preferensi disimpan di perangkat ini dan dipakai sebagai nilai awal saat membuat kuis atau
        meluncurkan sesi kuis baru.
      </p>
    </div>
  );
}
