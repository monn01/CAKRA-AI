"use client";

import { jsPDF } from "jspdf";

export function PrintQRButton({
  qrDataUrl,
  title,
  subject,
  grade,
  dateLabel,
}: {
  qrDataUrl: string;
  title: string;
  subject: string;
  grade: string;
  dateLabel: string;
}) {
  function handlePrint() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(11);
    doc.text(`${subject} · Kelas ${grade} · ${dateLabel}`, pageWidth / 2, 34, { align: "center" });

    const qrSize = 100;
    doc.addImage(qrDataUrl, "PNG", (pageWidth - qrSize) / 2, 45, qrSize, qrSize);

    doc.setFontSize(12);
    doc.text(
      "Scan untuk lihat rangkuman, peta pikiran, dan soal latihan",
      pageWidth / 2,
      45 + qrSize + 12,
      { align: "center" }
    );

    doc.save(`qr-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  }

  return (
    <button
      onClick={handlePrint}
      className="cursor-pointer rounded-lg border border-brand-dark px-4 py-2 text-sm font-medium text-brand-dark transition-all duration-150 hover:bg-brand-cream-alt active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2"
    >
      Cetak / Unduh PDF
    </button>
  );
}
