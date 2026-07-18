"use client";

import { type RefObject, useState } from "react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

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
  const [savingPdf, setSavingPdf] = useState(false);

  function shareUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  function handleShareWhatsApp() {
    const text = `Rangkuman pembelajaran: ${title} (${subject})\n${shareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSavePDF() {
    setSavingPdf(true);
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
          const dataUrl = await toPng(mindMapRef.current, {
            backgroundColor: "#ffffff",
            pixelRatio: 2,
          });
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

      doc.save(`resume-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
    } finally {
      setSavingPdf(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShareWhatsApp}
        className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-500 shadow-md active:scale-95 transition-all cursor-pointer"
      >
        WhatsApp 💬
      </button>
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
  );
}
