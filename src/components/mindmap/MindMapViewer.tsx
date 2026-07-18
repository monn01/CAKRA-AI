"use client";

import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import { InteractiveMindMap, type MindMapStructure } from "@/components/mindmap/InteractiveMindMap";
import { Button } from "@/components/ui/Button";
import { getSocketClient } from "@/lib/socket/client";
import { captureNodeAsPng } from "@/lib/capture-image";

export function MindMapViewer({
  sessionId,
  hasTranscript,
  initialStructure,
  initialValidatedAt,
  title,
  onMindMapChange,
}: {
  sessionId: string;
  hasTranscript: boolean;
  initialStructure: MindMapStructure | null;
  initialValidatedAt?: string | null;
  title: string;
  // Lapor ke parent tiap konten berubah — parent (ValidasiGuruShell) menyimpan
  // cache supaya hasil generate tidak hilang saat panel unmount karena pindah tab.
  onMindMapChange?: (structure: MindMapStructure, validatedAt: string | null) => void;
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
      setError(data.error || "Gagal membuat peta pikiran");
      return;
    }

    setStructure(data.mindMap.structure);
    setValidatedAt(null);
    onMindMapChange?.(data.mindMap.structure, null);
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
      setError(data.error || "Gagal memvalidasi peta pikiran");
      return;
    }

    setValidatedAt(data.mindMap.validatedAt);
    if (structure) onMindMapChange?.(structure, data.mindMap.validatedAt);
    getSocketClient().emit("content:validated", { sessionId, type: "mindmap" });
  }

  async function handleExport() {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await captureNodeAsPng(canvasRef.current);
      const link = document.createElement("a");
      link.download = `mindmap-${sessionId}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Gagal mengekspor peta pikiran sebagai gambar");
    } finally {
      setExporting(false);
    }
  }

  async function handlePrint() {
    if (!canvasRef.current) return;
    setPrinting(true);
    try {
      const dataUrl = await captureNodeAsPng(canvasRef.current);
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
      setError("Gagal mencetak peta pikiran");
    } finally {
      setPrinting(false);
    }
  }

  const isValidated = Boolean(validatedAt);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-brand-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">
          Peta Pikiran
        </h2>
        {structure && (
          <div className="flex flex-wrap items-center gap-2">
            {isValidated ? (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                ✅ Sudah Divalidasi
              </span>
            ) : (
              <Button variant="confirm" size="md" onClick={handleValidate} disabled={validating}>
                {validating ? "Memvalidasi..." : "✅ Validasi Peta Pikiran"}
              </Button>
            )}
            <Button variant="outline" size="md" onClick={handleExport} disabled={exporting}>
              {exporting ? "Mengekspor..." : "Ekspor PNG"}
            </Button>
            <Button variant="ghost" size="md" onClick={handlePrint} disabled={printing}>
              {printing ? "Menyiapkan..." : "🖨️ Cetak PDF"}
            </Button>
            <Button variant="outline" size="md" onClick={handleGenerate} disabled={generating}>
              {generating ? "Membuat ulang..." : "Buat Ulang"}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!structure ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          {!hasTranscript ? (
            <p className="text-sm text-brand-muted">
              Transkrip belum tersedia. Selesaikan rekaman sesi terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-sm text-brand-muted">Peta pikiran belum dibuat.</p>
              <Button variant="primary" size="lg" onClick={handleGenerate} disabled={generating}>
                {generating ? "Menyusun peta pikiran..." : "Buat Peta Pikiran"}
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
