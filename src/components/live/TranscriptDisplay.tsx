import { useEffect, useRef } from "react";

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
    <div className="h-full w-full overflow-y-auto px-12 py-10">
      {!fullText ? (
        <p className={`text-center ${mutedClass}`} style={{ fontSize: fontSize * 0.6 }}>
          Menunggu suara guru...
        </p>
      ) : (
        <p
          className={`mx-auto max-w-4xl whitespace-pre-wrap ${activeClass}`}
          style={{ fontSize: fontSize * 0.7, lineHeight: 1.7 }}
        >
          {fullText}
        </p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
