import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);
const CONVERT_TIMEOUT_MS = 120_000;

// Server-side render PPT -> gambar per-slide via LibreOffice + poppler (pdftoppm),
// bukan viewer online (privasi & offline-first) atau parser JS client-side (fidelity).
// Kalau soffice/pdftoppm tidak terpasang di PATH, lempar error — caller wajib
// menangkapnya dan degrade dengan aman (lampiran unduh tetap jalan, cuma tanpa slide).
export async function convertPptxToSlideImages(
  pptxPath: string,
  outputDir: string
): Promise<string[]> {
  const soffice = process.env.LIBREOFFICE_PATH || "soffice";
  const pdftoppm = process.env.PDFTOPPM_PATH || "pdftoppm";

  await mkdir(outputDir, { recursive: true });

  await execFileAsync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", outputDir, pptxPath], {
    timeout: CONVERT_TIMEOUT_MS,
  });

  const pdfName = `${path.basename(pptxPath, path.extname(pptxPath))}.pdf`;
  const pdfPath = path.join(outputDir, pdfName);

  await execFileAsync(pdftoppm, ["-png", "-r", "120", pdfPath, path.join(outputDir, "slide")], {
    timeout: CONVERT_TIMEOUT_MS,
  });

  const files = (await readdir(outputDir))
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return files;
}
