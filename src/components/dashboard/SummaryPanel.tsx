"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/Button";
import { getSocketClient } from "@/lib/socket/client";

type GlossaryItem = { term: string; definition: string };

type SummaryData = {
  content: string;
  keyPoints: string[];
  glossary: GlossaryItem[];
  validatedAt?: string | null;
};

export function SummaryPanel({
  sessionId,
  hasTranscript,
  initialSummary,
  title,
  subject,
  grade,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialSummary: SummaryData | null;
  title: string;
  subject: string;
  grade: string;
}) {
  const [summary, setSummary] = useState<SummaryData | null>(initialSummary);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftContent, setDraftContent] = useState("");
  const [draftKeyPoints, setDraftKeyPoints] = useState("");
  const [draftGlossary, setDraftGlossary] = useState<GlossaryItem[]>([]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setConfirming(false);

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
    setConfirming(false);
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
    getSocketClient().emit("content:validated", { sessionId, type: "summary" });
  }

  async function handleValidate() {
    setValidating(true);
    setError(null);

    const res = await fetch("/api/ai/summarize/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();

    setValidating(false);

    if (!res.ok) {
      setError(data.error || "Gagal memvalidasi rangkuman");
      return;
    }

    setSummary(data.summary);
    setConfirming(false);
    getSocketClient().emit("content:validated", { sessionId, type: "summary" });
  }

  function handlePrint() {
    if (!summary) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 22;

    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${subject} · Kelas ${grade}`, margin, y);
    doc.setTextColor(0);
    y += 10;

    doc.setFontSize(12);
    doc.text("Rangkuman", margin, y);
    y += 7;
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(summary.content, pageWidth - margin * 2);
    doc.text(contentLines, margin, y);
    y += contentLines.length * 5 + 8;

    if (summary.keyPoints.length > 0) {
      doc.setFontSize(12);
      doc.text("Poin Kunci", margin, y);
      y += 7;
      doc.setFontSize(10);
      for (const point of summary.keyPoints) {
        const lines = doc.splitTextToSize(`• ${point}`, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 1;
      }
      y += 6;
    }

    if (summary.glossary.length > 0) {
      doc.setFontSize(12);
      doc.text("Istilah Penting", margin, y);
      y += 7;
      doc.setFontSize(10);
      for (const item of summary.glossary) {
        const lines = doc.splitTextToSize(`${item.term}: ${item.definition}`, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 1;
      }
    }

    doc.save(`rangkuman-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  }

  function updateGlossaryRow(index: number, field: keyof GlossaryItem, value: string) {
    setDraftGlossary((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  const isValidated = Boolean(summary?.validatedAt);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-brand-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">
          Rangkuman
        </h2>
        {summary && !editing && (
          <div className="flex flex-wrap items-center gap-2">
            {isValidated ? (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                ✅ Sudah Divalidasi
              </span>
            ) : !confirming ? (
              <Button variant="confirm" size="md" onClick={() => setConfirming(true)}>
                ✅ Validasi
              </Button>
            ) : null}
            {isValidated && (
              <Button variant="outline" size="md" onClick={startEditing}>
                Revisi Lagi
              </Button>
            )}
            <Button variant="outline" size="md" onClick={handleGenerate} disabled={generating}>
              {generating ? "Membuat ulang..." : "Buat Ulang"}
            </Button>
            <Button variant="ghost" size="md" onClick={handlePrint}>
              🖨️ Cetak Rangkuman
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!summary && !editing && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          {!hasTranscript ? (
            <p className="text-sm text-brand-muted">
              Transkrip belum tersedia. Selesaikan rekaman sesi terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-sm text-brand-muted">Rangkuman belum dibuat.</p>
              <Button variant="primary" size="lg" onClick={handleGenerate} disabled={generating}>
                {generating ? "Membuat rangkuman..." : "Buat Rangkuman"}
              </Button>
            </>
          )}
        </div>
      )}

      {summary && !editing && confirming && !isValidated && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-confirm/30 bg-confirm/5 p-4">
          <p className="text-sm font-bold text-brand-dark">
            Apakah rangkuman ini sudah benar dan siap ditampilkan ke siswa?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="confirm" size="md" onClick={handleValidate} disabled={validating}>
              {validating ? "Memvalidasi..." : "✅ Ya, Sudah Benar"}
            </Button>
            <Button variant="outline" size="md" onClick={startEditing}>
              ✏️ Belum, Perlu Diperbaiki
            </Button>
            <Button variant="ghost" size="md" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {summary && !editing && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4 text-sm"
        >
          <p className="whitespace-pre-wrap text-brand-dark">{summary.content}</p>

          {summary.keyPoints.length > 0 && (
            <div>
              <h3 className="mb-1 font-semibold text-brand-dark">Poin Kunci</h3>
              <ul className="list-disc space-y-1 pl-5 text-brand-dark/90">
                {summary.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.glossary.length > 0 && (
            <div>
              <h3 className="mb-1 font-semibold text-brand-dark">Istilah Penting</h3>
              <dl className="space-y-1">
                {summary.glossary.map((item, i) => (
                  <div key={i}>
                    <dt className="inline font-semibold text-brand-dark">{item.term}: </dt>
                    <dd className="inline text-brand-dark/90">{item.definition}</dd>
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
            <label className="mb-1 block text-xs font-semibold tracking-wide text-brand-muted">
              Rangkuman
            </label>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-[#dbc1b9] bg-brand-cream-alt p-3 text-sm text-brand-dark outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wide text-brand-muted">
              Poin Kunci (satu per baris)
            </label>
            <textarea
              value={draftKeyPoints}
              onChange={(e) => setDraftKeyPoints(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-[#dbc1b9] bg-brand-cream-alt p-3 text-sm text-brand-dark outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wide text-brand-muted">
              Istilah Penting
            </label>
            <div className="flex flex-col gap-2">
              {draftGlossary.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item.term}
                    onChange={(e) => updateGlossaryRow(i, "term", e.target.value)}
                    placeholder="Istilah"
                    className="w-1/3 rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
                  />
                  <input
                    value={item.definition}
                    onChange={(e) => updateGlossaryRow(i, "definition", e.target.value)}
                    placeholder="Definisi"
                    className="flex-1 rounded-lg border border-[#dbc1b9] bg-brand-cream-alt px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraftGlossary((prev) => [...prev, { term: "", definition: "" }])}
                className="w-fit cursor-pointer rounded-md px-1 text-sm text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-dark hover:underline"
              >
                + Tambah istilah
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="commit" size="md" onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan & Validasi"}
            </Button>
            <Button variant="outline" size="md" onClick={() => setEditing(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
