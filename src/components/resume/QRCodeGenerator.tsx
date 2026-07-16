export function QRCodeCard({
  qrDataUrl,
  heading,
  helperText,
  alt,
  dark,
}: {
  qrDataUrl: string;
  heading: string;
  helperText: string;
  alt: string;
  dark?: boolean;
}) {
  const textClass = dark ? "text-white" : "text-neutral-900";
  const mutedClass = dark ? "text-neutral-400" : "text-neutral-500";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className={`text-lg font-semibold ${textClass}`}>{heading}</p>

      {/* data URL base64 — next/image tidak menghemat apa-apa di sini, butuh unoptimized juga */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt={alt} className="h-56 w-56 rounded-lg bg-white p-3" />

      <p className={mutedClass}>{helperText}</p>
    </div>
  );
}

export function QRCodeGenerator({
  qrDataUrl,
  title,
  subject,
  grade,
  dateLabel,
  dark,
}: {
  qrDataUrl: string;
  title: string;
  subject: string;
  grade: string;
  dateLabel: string;
  dark?: boolean;
}) {
  const textClass = dark ? "text-white" : "text-neutral-900";
  const mutedClass = dark ? "text-neutral-400" : "text-neutral-500";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div>
        <p className={`text-2xl font-semibold ${textClass}`}>{title}</p>
        <p className={mutedClass}>
          {subject} · Kelas {grade} · {dateLabel}
        </p>
      </div>

      <QRCodeCard
        qrDataUrl={qrDataUrl}
        heading="Rangkuman & Mind Map"
        helperText="Scan untuk lihat rangkuman, mind map, dan soal latihan"
        alt="QR code menuju halaman resume pembelajaran"
        dark={dark}
      />
    </div>
  );
}
