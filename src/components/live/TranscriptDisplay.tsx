import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

export function TranscriptDisplay({
  fullText,
  fontSize,
  light,
}: {
  fullText: string;
  fontSize: number;
  light: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fullText]);

  const mutedClass = light ? "text-neutral-400" : "text-neutral-500";
  const activeClass = light ? "text-neutral-900" : "text-white";

  return (
    <div className="relative z-10 h-full w-full overflow-y-auto px-12 py-10">
      {!fullText ? (
        <p className={`text-center ${mutedClass}`} style={{ fontSize: fontSize * 0.6 }}>
          <span className="cute-bounce mr-2 inline-block">🎙️</span>
          Menunggu suara guru...
        </p>
      ) : (
        <div className="mx-auto max-w-4xl">
          {!light && (
            <p className="mb-3 flex items-center gap-2 text-sm tracking-[0.2em] text-white/50 uppercase">
              <Mic className="size-3.5" />
              Penjelasan Guru
            </p>
          )}
          <p
            className={`whitespace-pre-wrap ${activeClass}`}
            style={{ fontSize: fontSize * 0.7, lineHeight: 1.7 }}
          >
            {fullText}
          </p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
