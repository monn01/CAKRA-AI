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
        <label className="text-sm text-neutral-700 dark:text-neutral-300">
          Jumlah soal default saat generate quiz
        </label>
        <input
          type="number"
          min={5}
          max={15}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-neutral-700 dark:text-neutral-300">
          Batas waktu default per soal
        </label>
        <select
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value={15}>15 detik</option>
          <option value={30}>30 detik</option>
          <option value={60}>60 detik</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900"
      >
        {saved ? "Tersimpan!" : "Simpan Preferensi"}
      </button>
      <p className="text-xs text-neutral-400">
        Preferensi disimpan di perangkat ini dan dipakai sebagai nilai awal saat generate quiz
        atau meluncurkan sesi quiz baru.
      </p>
    </div>
  );
}
