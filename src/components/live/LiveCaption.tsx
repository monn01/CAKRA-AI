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
  const dimClass = light ? "text-neutral-500" : "text-neutral-400";
  const activeClass = light ? "text-neutral-900" : "text-white";

  return (
    <div className="flex h-full w-full items-center justify-center px-12">
      {!hasContent ? (
        <p className={`text-center ${mutedClass}`} style={{ fontSize: fontSize * 0.6 }}>
          Menunggu suara guru...
        </p>
      ) : (
        <div
          className={`mx-auto max-w-5xl text-center font-medium ${activeClass}`}
          style={{ lineHeight: 1.6 }}
        >
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
              {interimLine}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
