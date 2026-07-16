"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type GlossaryItem = { term: string; definition: string };

type SummaryData = {
  content: string;
  keyPoints: string[];
  glossary: GlossaryItem[];
};

export function SummaryPanel({
  sessionId,
  hasTranscript,
  initialSummary,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialSummary: SummaryData | null;
}) {
  const [summary, setSummary] = useState<SummaryData | null>(initialSummary);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftContent, setDraftContent] = useState("");
  const [draftKeyPoints, setDraftKeyPoints] = useState("");
  const [draftGlossary, setDraftGlossary] = useState<GlossaryItem[]>([]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();

    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat rangkuman");
      return;
    }

    setSummary(data.summary);
  }

  function startEditing() {
    if (!summary) return;
    setDraftContent(summary.content);
    setDraftKeyPoints(summary.keyPoints.join("\n"));
    setDraftGlossary(summary.glossary.length > 0 ? summary.glossary : [{ term: "", definition: "" }]);
    setEditing(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    setError(null);

    const keyPoints = draftKeyPoints
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    const glossary = draftGlossary.filter((g) => g.term.trim() && g.definition.trim());

    const res = await fetch("/api/ai/summarize", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content: draftContent, keyPoints, glossary }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Gagal menyimpan revisi");
      return;
    }

    setSummary(data.summary);
    setEditing(false);
  }

  function updateGlossaryRow(index: number, field: keyof GlossaryItem, value: string) {
    setDraftGlossary((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Rangkuman</h2>
        {summary && !editing && (
          <div className="flex gap-3">
            <button onClick={startEditing} className="text-sm text-neutral-500 hover:underline">
              Revisi
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm text-neutral-500 hover:underline disabled:opacity-50"
            >
              {generating ? "Membuat ulang..." : "Generate Ulang"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!summary && !editing && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          {!hasTranscript ? (
            <p className="text-sm text-neutral-500">
              Transkrip belum tersedia. Selesaikan rekaman sesi terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500">Rangkuman belum dibuat.</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {generating ? "Membuat rangkuman..." : "Generate Rangkuman"}
              </button>
            </>
          )}
        </div>
      )}

      {summary && !editing && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4 text-sm"
        >
          <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
            {summary.content}
          </p>

          {summary.keyPoints.length > 0 && (
            <div>
              <h3 className="mb-1 font-medium text-neutral-900 dark:text-neutral-50">
                Poin Kunci
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
                {summary.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.glossary.length > 0 && (
            <div>
              <h3 className="mb-1 font-medium text-neutral-900 dark:text-neutral-50">
                Istilah Penting
              </h3>
              <dl className="space-y-1">
                {summary.glossary.map((item, i) => (
                  <div key={i}>
                    <dt className="inline font-medium text-neutral-900 dark:text-neutral-50">
                      {item.term}:{" "}
                    </dt>
                    <dd className="inline text-neutral-700 dark:text-neutral-300">
                      {item.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </motion.div>
      )}

      {editing && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Rangkuman</label>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Poin Kunci (satu per baris)
            </label>
            <textarea
              value={draftKeyPoints}
              onChange={(e) => setDraftKeyPoints(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Istilah Penting
            </label>
            <div className="flex flex-col gap-2">
              {draftGlossary.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item.term}
                    onChange={(e) => updateGlossaryRow(i, "term", e.target.value)}
                    placeholder="Istilah"
                    className="w-1/3 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <input
                    value={item.definition}
                    onChange={(e) => updateGlossaryRow(i, "definition", e.target.value)}
                    placeholder="Definisi"
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraftGlossary((prev) => [...prev, { term: "", definition: "" }])}
                className="w-fit text-sm text-neutral-500 hover:underline"
              >
                + Tambah istilah
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
            >
              {saving ? "Menyimpan..." : "Simpan Revisi"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
