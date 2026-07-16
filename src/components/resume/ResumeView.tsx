"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { InteractiveMindMap, type MindMapStructure } from "@/components/mindmap/InteractiveMindMap";
import { QuizReview } from "@/components/resume/QuizReview";
import { ResumeActions } from "@/components/resume/ResumeActions";
import { SubjectBanner } from "@/components/resume/SubjectBanner";

type GlossaryItem = { term: string; definition: string };
type ReviewQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

export function ResumeView({
  title,
  subject,
  grade,
  dateLabel,
  teacherName,
  summaryContent,
  keyPoints,
  glossary,
  mindMap,
  questions,
}: {
  title: string;
  subject: string;
  grade: string;
  dateLabel: string;
  teacherName: string;
  summaryContent: string | null;
  keyPoints: string[];
  glossary: GlossaryItem[];
  mindMap: MindMapStructure | null;
  questions: ReviewQuestion[];
}) {
  const mindMapRef = useRef<HTMLDivElement>(null);
  const [exportingMindMap, setExportingMindMap] = useState(false);

  async function handleDownloadMindMap() {
    if (!mindMapRef.current) return;
    setExportingMindMap(true);
    try {
      const dataUrl = await toPng(mindMapRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `mindmap-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // best-effort; biarkan pengguna coba lagi kalau gagal
    } finally {
      setExportingMindMap(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-6 bg-neutral-50 px-6 py-8 shadow-sm rounded-3xl min-h-screen">
      <SubjectBanner subject={subject} />

      <div className="px-1 bg-white p-5 rounded-2xl border-2 border-primary/10 shadow-sm">
        <p className="text-base font-black text-secondary mb-2">👋 Halo! Ini catatan belajar seru kita hari ini. Yuk dibaca lagi agar makin pintar! 🌟</p>
        <h1 className="text-2xl font-black text-primary leading-tight">{title}</h1>
        <p className="text-base font-extrabold text-neutral-500 mt-2">
          📚 {subject} · Kelas {grade}
        </p>
        <p className="text-sm font-bold text-neutral-400 mt-1">🗓️ {dateLabel} · Guru: {teacherName}</p>
      </div>

      <ResumeActions
        title={title}
        subject={subject}
        grade={grade}
        dateLabel={dateLabel}
        teacherName={teacherName}
        summaryContent={summaryContent}
        keyPoints={keyPoints}
        glossary={glossary}
        questions={questions}
        mindMapRef={mindMap ? mindMapRef : null}
      />

      <section className="rounded-2xl bg-white p-6 shadow-md border-2 border-primary/5 flex flex-col gap-3">
        <h2 className="text-sm font-black text-primary tracking-wide uppercase">Rangkuman 📝</h2>
        {summaryContent ? (
          <>
            <p className="whitespace-pre-wrap text-base font-medium text-neutral-700 leading-relaxed">{summaryContent}</p>
            {keyPoints.length > 0 && (
              <ul className="mt-2 list-disc space-y-2 pl-5 text-base font-medium text-neutral-700">
                {keyPoints.map((point, i) => (
                  <li key={i} className="leading-relaxed">{point}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-base text-neutral-400 font-bold">Oops! Rangkuman catatan belum siap nih. Tunggu bapak/ibu guru membuatnya ya! ⏳</p>
        )}
      </section>

      {glossary.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-md border-2 border-primary/5 flex flex-col gap-3">
          <h2 className="text-sm font-black text-primary tracking-wide uppercase">Istilah Penting 🔍</h2>
          <dl className="flex flex-col gap-3 text-base">
            {glossary.map((item, i) => (
              <div key={i} className="bg-sky-50/50 p-3 rounded-xl border border-primary/10">
                <dt className="font-extrabold text-primary mb-1">{item.term}</dt>
                <dd className="text-neutral-700 font-medium leading-relaxed">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-md border-2 border-primary/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-primary tracking-wide uppercase">Mind Map 🗺️</h2>
          {mindMap && (
            <button
              onClick={handleDownloadMindMap}
              disabled={exportingMindMap}
              className="text-sm font-extrabold text-teal-600 hover:text-teal-700 hover:underline disabled:opacity-50 cursor-pointer"
            >
              {exportingMindMap ? "Mengunduh..." : "Unduh Gambar 📥"}
            </button>
          )}
        </div>
        {mindMap ? (
          <InteractiveMindMap ref={mindMapRef} structure={mindMap} height={320} />
        ) : (
          <p className="text-base text-neutral-400 font-bold">Oops! Peta pikiran (mind map) belum siap nih. Tunggu bapak/ibu guru ya! 🗺️</p>
        )}
      </section>

      {questions.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-md border-2 border-primary/5 flex flex-col gap-3">
          <h2 className="text-sm font-black text-primary tracking-wide uppercase">Soal & Pembahasan ✍️</h2>
          <QuizReview questions={questions} />
        </section>
      )}
    </div>
  );
}
