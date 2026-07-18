"use client";

import { type RefObject, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { captureNodeAsPng } from "@/lib/capture-image";

type GlossaryItem = { term: string; definition: string };
type ReviewQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

export function ResumeActions({
  title,
  subject,
  grade,
  dateLabel,
  teacherName,
  summaryContent,
  keyPoints,
  glossary,
  questions,
  mindMapRef,
}: {
  title: string;
  subject: string;
  grade: string;
  dateLabel: string;
  teacherName: string;
  summaryContent: string | null;
  keyPoints: string[];
  glossary: GlossaryItem[];
  questions: ReviewQuestion[];
  mindMapRef: RefObject<HTMLDivElement | null> | null;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  // Tautan blob ke PDF hasil generate — unduhan otomatis (doc.save) sering
  // gagal DIAM-DIAM di browser HP/in-app webview, jadi selalu sediakan
  // tautan yang bisa diketuk manual sebagai jalan kedua.
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");

  // URL halaman dibaca setelah mount — window tidak ada di server, dan kalau
  // dihitung saat render SSR hasilnya kosong (hydration mismatch).
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageUrl(window.location.href);
  }, []);

  const waHref = pageUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Rangkuman pembelajaran: ${title} (${subject})\n${pageUrl}`)}`
    : undefined;

  async function handleCopyLink() {
    const url = pageUrl || window.location.href;
    let ok = false;

    // Clipboard API cuma tersedia di secure context (HTTPS/localhost) —
    // halaman ini sering dibuka HP lewat http://IP-LAN hasil scan QR, jadi
    // wajib punya fallback, bukan langsung crash.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      // lanjut ke fallback legacy di bawah
    }

    if (!ok) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand("copy");
        textarea.remove();
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Tampilkan URL-nya supaya tetap bisa disalin manual.
      setCopyFailed(true);
    }
  }

  async function handleSavePDF() {
    setSavingPdf(true);
    setPdfError(false);
    try {
      const doc = new jsPDF();
      const marginX = 15;
      const pageWidth = doc.internal.pageSize.getWidth() - marginX * 2;
      let y = 20;

      function addText(text: string, size = 11, gap = 7) {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, pageWidth);
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, marginX, y);
          y += gap;
        }
      }

      addText(title, 16, 8);
      addText(`${subject} · Kelas ${grade} · ${dateLabel}`, 10, 6);
      addText(`Guru: ${teacherName}`, 10, 10);

      if (summaryContent) {
        addText("Rangkuman", 13, 8);
        addText(summaryContent, 11, 6);
        y += 4;
      }

      if (keyPoints.length > 0) {
        addText("Poin Kunci", 13, 8);
        for (const point of keyPoints) addText(`• ${point}`, 11, 6);
        y += 4;
      }

      if (glossary.length > 0) {
        addText("Istilah Penting", 13, 8);
        for (const item of glossary) addText(`${item.term}: ${item.definition}`, 11, 6);
        y += 4;
      }

      if (mindMapRef?.current) {
        try {
          const dataUrl = await captureNodeAsPng(mindMapRef.current);
          const { width: elW, height: elH } = mindMapRef.current.getBoundingClientRect();
          const imgHeight = (elH / elW) * pageWidth;

          addText("Peta Pikiran", 13, 8);
          if (y + imgHeight > 280) {
            doc.addPage();
            y = 20;
          }
          doc.addImage(dataUrl, "PNG", marginX, y, pageWidth, imgHeight);
          y += imgHeight + 8;
        } catch {
          // gagal capture mind map; lanjut tanpa gambar biar PDF tetap ke-generate
        }
      }

      if (questions.length > 0) {
        addText("Soal & Pembahasan", 13, 8);
        questions.forEach((q, i) => {
          addText(`${i + 1}. ${q.question}`, 11, 6);
          addText(`Jawaban benar: ${q.correctAnswer}`, 10, 6);
          if (q.explanation) addText(q.explanation, 10, 6);
          y += 3;
        });
      }

      const fileName = `resume-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

      // Siapkan tautan manual dulu (selalu jalan), baru coba auto-download.
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(doc.output("blob")));
      setPdfFileName(fileName);

      doc.save(fileName);
    } catch {
      setPdfError(true);
    } finally {
      setSavingPdf(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* Tautan <a> asli, bukan window.open — window.open sering diblokir
            in-app browser HP (pembuka QR bawaan kamera, browser WhatsApp). */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-emerald-500 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          WhatsApp 💬
        </a>
        <button
          onClick={handleCopyLink}
          className="flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-3 text-sm font-black text-primary hover:bg-sky-50 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          {copied ? "Tersalin! ✨" : "Salin Tautan 🔗"}
        </button>
        <button
          onClick={handleSavePDF}
          disabled={savingPdf}
          className="flex-1 rounded-full border-2 border-primary/20 bg-white px-4 py-3 text-sm font-black text-primary hover:bg-sky-50 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {savingPdf ? "Menyimpan... ⏳" : "Simpan PDF 📂"}
        </button>
      </div>

      {copyFailed && (
        <div className="flex flex-col gap-1 rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-700">
            Browser ini tidak mengizinkan salin otomatis — salin manual tautan di bawah ya:
          </p>
          <input
            readOnly
            value={pageUrl}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 font-mono text-xs text-neutral-700"
          />
        </div>
      )}

      {pdfUrl && (
        <a
          href={pdfUrl}
          download={pdfFileName}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border-2 border-teal-200 bg-teal-50 p-3 text-center text-xs font-bold text-teal-700 active:scale-95 transition-all"
        >
          📄 PDF siap! Kalau unduhan tidak mulai otomatis, ketuk di sini untuk membukanya.
        </a>
      )}

      {pdfError && (
        <p className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
          Gagal menyimpan PDF di browser ini. Coba buka halaman ini di Chrome/Safari lalu ulangi.
        </p>
      )}
    </div>
  );
}
