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
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-4 bg-neutral-50 px-4 py-6">
      <SubjectBanner subject={subject} />

      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">
          {subject} · Kelas {grade} · {dateLabel}
        </p>
        <p className="text-sm text-neutral-500">Guru: {teacherName}</p>
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

      <section className="rounded-xl bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-neutral-500">Rangkuman</h2>
        {summaryContent ? (
          <>
            <p className="whitespace-pre-wrap text-sm text-neutral-700">{summaryContent}</p>
            {keyPoints.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-400">Rangkuman belum tersedia untuk sesi ini.</p>
        )}
      </section>

      {glossary.length > 0 && (
        <section className="rounded-xl bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">Istilah Penting</h2>
          <dl className="flex flex-col gap-1.5 text-sm">
            {glossary.map((item, i) => (
              <div key={i}>
                <dt className="inline font-medium text-neutral-900">{item.term}: </dt>
                <dd className="inline text-neutral-700">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rounded-xl bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Mind Map</h2>
          {mindMap && (
            <button
              onClick={handleDownloadMindMap}
              disabled={exportingMindMap}
              className="text-sm font-medium text-teal-600 hover:underline disabled:opacity-50"
            >
              {exportingMindMap ? "Mengunduh..." : "Unduh PNG"}
            </button>
          )}
        </div>
        {mindMap ? (
          <InteractiveMindMap ref={mindMapRef} structure={mindMap} height={320} />
        ) : (
          <p className="text-sm text-neutral-400">Mind map belum tersedia untuk sesi ini.</p>
        )}
      </section>

      {questions.length > 0 && (
        <section className="rounded-xl bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">Soal & Pembahasan</h2>
          <QuizReview questions={questions} />
        </section>
      )}
    </div>
  );
}
