import { Mic } from "lucide-react";
import { TypewriterText } from "@/components/live/TypewriterText";

export function LiveCaption({
  finalLines,
  interimLine,
  fontSize,
  light,
}: {
  finalLines: string[];
  interimLine: string;
  fontSize: number;
  light: boolean;
}) {
  const hasContent = finalLines.length > 0 || interimLine.length > 0;
  const mutedClass = light ? "text-neutral-400" : "text-neutral-500";
  const dimClass = light ? "text-sky-700/60" : "text-sky-200/60";
  const activeClass = light ? "text-neutral-900" : "text-white";

  return (
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-end px-12 pb-[12%]">
      {!hasContent ? (
        <p className={`text-center ${mutedClass}`} style={{ fontSize: fontSize * 0.6 }}>
          <span className="cute-bounce mr-2 inline-block">🎙️</span>
          Menunggu suara guru...
        </p>
      ) : (
        <div
          className={`mx-auto max-w-5xl text-center font-medium ${activeClass}`}
          style={{ lineHeight: 1.6 }}
        >
          {!light && (
            <p className="mb-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] text-white/50 uppercase">
              <Mic className="size-3.5" />
              Penjelasan Guru
            </p>
          )}
          {finalLines.map((line, i) => (
            <p
              key={i}
              className={`${dimClass} transition-opacity duration-500`}
              style={{ fontSize: fontSize * 0.75 }}
            >
              {line}
            </p>
          ))}
          {interimLine && (
            <p className={activeClass} style={{ fontSize }}>
              <TypewriterText text={interimLine} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
