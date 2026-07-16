"use client";

import { useEffect, useRef, useState } from "react";

const MS_PER_CHAR = 36;

/**
 * Animasi ketik untuk teks yang sedang "live" (mis. interim STT).
 * Kalau teks baru adalah lanjutan dari teks sebelumnya, lanjut ngetik dari
 * titik terakhir; kalau beda/reset, mulai ulang dari kosong.
 */
export function TypewriterText({
  text,
  className,
  showCursor = true,
}: {
  text: string;
  className?: string;
  showCursor?: boolean;
}) {
  const [display, setDisplay] = useState("");
  const prevTextRef = useRef("");

  useEffect(() => {
    const prev = prevTextRef.current;
    const startFrom = text.startsWith(prev) ? prev.length : 0;
    prevTextRef.current = text;

    if (startFrom === 0) setDisplay("");
    if (startFrom >= text.length) {
      setDisplay(text);
      return;
    }

    let i = startFrom;
    const interval = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, MS_PER_CHAR);

    return () => clearInterval(interval);
  }, [text]);

  const typing = display.length < text.length;

  return (
    <span className={className}>
      {display}
      {showCursor && typing && (
        <span className="typewriter-cursor" aria-hidden="true">
          ▏
        </span>
      )}
    </span>
  );
}
