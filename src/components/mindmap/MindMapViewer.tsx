"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { InteractiveMindMap, type MindMapStructure } from "@/components/mindmap/InteractiveMindMap";

export function MindMapViewer({
  sessionId,
  hasTranscript,
  initialStructure,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialStructure: MindMapStructure | null;
}) {
  const [structure, setStructure] = useState<MindMapStructure | null>(initialStructure);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/ai/mindmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();

    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat mind map");
      return;
    }

    setStructure(data.mindMap.structure);
  }

  async function handleExport() {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `mindmap-${sessionId}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Gagal mengekspor mind map sebagai gambar");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Mind Map</h2>
        {structure && (
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-sm text-neutral-500 hover:underline disabled:opacity-50"
            >
              {exporting ? "Mengekspor..." : "Export PNG"}
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

      {!structure ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          {!hasTranscript ? (
            <p className="text-sm text-neutral-500">
              Transkrip belum tersedia. Selesaikan rekaman sesi terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500">Mind map belum dibuat.</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {generating ? "Menyusun mind map..." : "Generate Mind Map"}
              </button>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <InteractiveMindMap ref={canvasRef} structure={structure} />
        </motion.div>
      )}
    </div>
  );
}
