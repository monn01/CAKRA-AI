import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireTeacher, getOwnedSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { convertPptxToSlideImages } from "@/lib/ppt/convert";

const MAX_PPT_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".ppt", ".pptx"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "ppt");
const SLIDES_DIR = path.join(process.cwd(), "public", "uploads", "ppt-slides");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await getOwnedSession(id, teacher.id);
  if (!owned) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File PPT wajib diisi" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "File harus format .ppt atau .pptx" },
      { status: 400 }
    );
  }
  if (file.size > MAX_PPT_SIZE) {
    return NextResponse.json({ error: "Ukuran file PPT maksimal 50MB" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${id}-${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const pptUrl = `/uploads/ppt/${filename}`;

  let pptSlideUrls: string[] = [];
  let slidesError: string | null = null;
  try {
    const sessionSlideDir = path.join(SLIDES_DIR, id);
    const slideFiles = await convertPptxToSlideImages(
      path.join(UPLOAD_DIR, filename),
      sessionSlideDir
    );
    pptSlideUrls = slideFiles.map((f) => `/uploads/ppt-slides/${id}/${f}`);
  } catch (err) {
    // Konversi PPT->gambar opsional — kalau LibreOffice/poppler tidak terpasang
    // (ENOENT) atau gagal, lampiran unduh tetap jalan, cuma tidak tampil di proyektor.
    console.warn("[ppt] gagal konversi slide:", err);
    slidesError = "Slide PPT tidak bisa ditampilkan di proyektor (LibreOffice tidak terpasang di server), tapi file PPT tetap bisa diunduh.";
  }

  const updated = await prisma.session.update({
    where: { id },
    data: { pptUrl, pptName: file.name, pptSlideUrls },
  });

  return NextResponse.json({
    pptUrl: updated.pptUrl,
    pptName: updated.pptName,
    pptSlideUrls: updated.pptSlideUrls,
    slidesError,
  });
}
