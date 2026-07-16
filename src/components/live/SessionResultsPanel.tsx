import { InteractiveMindMap, type MindMapStructure } from "@/components/mindmap/InteractiveMindMap";
import { QuizReview } from "@/components/resume/QuizReview";

type ReviewQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center text-neutral-500">
      <span className="cute-bounce text-2xl">⏳</span>
      <p className="text-sm font-bold">{label}</p>
    </div>
  );
}

function ResultCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-2xl bg-white/95 p-6 shadow-xl">
      <h3 className="mb-3 text-lg font-black text-primary">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export function SessionResultsPanel({
  summary,
  mindMap,
  quiz,
}: {
  summary: { content: string; keyPoints: string[]; validatedAt: string | null } | null;
  mindMap: { structure: MindMapStructure; validatedAt: string | null } | null;
  quiz: { questions: ReviewQuestion[]; validatedAt: string | null } | null;
}) {
  return (
    <div className="flex flex-col">
      <ResultCard icon="📝" title="Rangkuman">
        {summary?.validatedAt ? (
          <div className="flex flex-col gap-3 text-neutral-800">
            <p className="whitespace-pre-wrap leading-relaxed">{summary.content}</p>
            {summary.keyPoints.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {summary.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <LoadingState label="Sedang menyiapkan rangkuman..." />
        )}
      </ResultCard>

      <ResultCard icon="🗺️" title="Mind Map">
        {mindMap?.validatedAt ? (
          <InteractiveMindMap structure={mindMap.structure} height={360} />
        ) : (
          <LoadingState label="Sedang menyiapkan mind map..." />
        )}
      </ResultCard>

      <ResultCard icon="✍️" title="Soal Latihan">
        {quiz?.validatedAt ? (
          <QuizReview questions={quiz.questions} />
        ) : (
          <LoadingState label="Sedang menyiapkan soal latihan..." />
        )}
      </ResultCard>
    </div>
  );
}
