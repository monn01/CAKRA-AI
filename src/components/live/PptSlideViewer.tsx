export function PptSlideViewer({
  slideUrls,
  currentSlide,
}: {
  slideUrls: string[];
  currentSlide: number;
}) {
  const index = Math.min(currentSlide, slideUrls.length - 1);
  const src = slideUrls[index];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 px-10 pb-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar hasil konversi lokal, next/image tidak menghemat apa-apa */}
      <img
        src={src}
        alt={`Slide presentasi ${index + 1}`}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
      <span className="rounded-full bg-black/40 px-3 py-1 text-sm text-white/70 backdrop-blur">
        Slide {index + 1} / {slideUrls.length}
      </span>
    </div>
  );
}
