"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import { InteractiveMindMap, type MindMapStructure } from "@/components/mindmap/InteractiveMindMap";
import { Button } from "@/components/ui/Button";
import { getSocketClient } from "@/lib/socket/client";

export function MindMapViewer({
  sessionId,
  hasTranscript,
  initialStructure,
  initialValidatedAt,
  title,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialStructure: MindMapStructure | null;
  initialValidatedAt?: string | null;
  title: string;
}) {
  const [structure, setStructure] = useState<MindMapStructure | null>(initialStructure);
  const [validatedAt, setValidatedAt] = useState<string | null>(initialValidatedAt ?? null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [validating, setValidating] = useState(false);
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
    setValidatedAt(null);
  }

  async function handleValidate() {
    setValidating(true);
    setError(null);

    const res = await fetch("/api/ai/mindmap/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();

    setValidating(false);

    if (!res.ok) {
      setError(data.error || "Gagal memvalidasi mind map");
      return;
    }

    setValidatedAt(data.mindMap.validatedAt);
    getSocketClient().emit("content:validated", { sessionId, type: "mindmap" });
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

  async function handlePrint() {
    if (!canvasRef.current) return;
    setPrinting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const doc = new jsPDF({ orientation: img.width > img.height ? "landscape" : "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, 15, { align: "center" });

      const maxW = pageWidth - 20;
      const maxH = pageHeight - 30;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      doc.addImage(dataUrl, "PNG", (pageWidth - w) / 2, 25, w, h);

      doc.save(`mindmap-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
    } catch {
      setError("Gagal mencetak mind map");
    } finally {
      setPrinting(false);
    }
  }

  const isValidated = Boolean(validatedAt);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Mind Map</h2>
        {structure && (
          <div className="flex flex-wrap items-center gap-2">
            {isValidated ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                ✅ Sudah Divalidasi
              </span>
            ) : (
              <Button variant="confirm" size="md" onClick={handleValidate} disabled={validating}>
                {validating ? "Memvalidasi..." : "✅ Validasi Mind Map"}
              </Button>
            )}
            <Button variant="outline" size="md" onClick={handleExport} disabled={exporting}>
              {exporting ? "Mengekspor..." : "Export PNG"}
            </Button>
            <Button variant="ghost" size="md" onClick={handlePrint} disabled={printing}>
              {printing ? "Menyiapkan..." : "🖨️ Cetak PDF"}
            </Button>
            <Button variant="outline" size="md" onClick={handleGenerate} disabled={generating}>
              {generating ? "Membuat ulang..." : "Generate Ulang"}
            </Button>
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
              <Button variant="primary" size="lg" onClick={handleGenerate} disabled={generating}>
                {generating ? "Menyusun mind map..." : "Generate Mind Map"}
              </Button>
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
