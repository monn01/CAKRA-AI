export const PROMPTS = {
  summarize: (transcript: string, subject: string, grade: string, topic: string) =>
    `
Kamu adalah asisten pendidikan. Berdasarkan transkrip pembelajaran berikut, buatkan:
1. Rangkuman singkat (3-5 paragraf, bahasa mudah dipahami siswa)
2. Poin-poin kunci (5-10 poin utama)
3. Daftar istilah penting beserta definisinya

Mata Pelajaran: ${subject}
Kelas: ${grade}
Topik: ${topic}

Transkrip:
${transcript}

Output HANYA JSON valid, tanpa teks lain, dengan struktur:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "glossary": [{ "term": "...", "definition": "..." }]
}
`.trim(),

  mindmap: (transcript: string, subject: string, topic: string) =>
    `
Berdasarkan transkrip pembelajaran berikut, buatkan struktur mind map dalam format JSON.
Aturan:
- Topik utama sebagai root node — pakai "${topic}" sebagai root node, JANGAN pakai nama mata pelajaran sebagai root
- Maksimal 3 level kedalaman
- Setiap node punya "label" (singkat, 2-5 kata) dan opsional "detail" (penjelasan 1 kalimat KHUSUS untuk node itu — jangan salin kalimat dari transkrip apa adanya)
- Kelompokkan berdasarkan sub-topik logis

Mata Pelajaran: ${subject}
Topik: ${topic}

Output HANYA JSON, tanpa teks lain:
{
  "topic": "...",
  "children": [
    {
      "label": "...",
      "detail": "...",
      "children": [...]
    }
  ]
}

Transkrip:
${transcript}
`.trim(),

  quiz: (transcript: string, subject: string, grade: string, count: number) =>
    `
Berdasarkan transkrip pembelajaran berikut, buatkan ${count} soal pilihan ganda.
Setiap soal harus:
- Relevan dengan materi yang disampaikan
- Punya 4 opsi jawaban (A, B, C, D)
- Sertakan jawaban benar dan penjelasan singkat
- Variasi tingkat kesulitan (mudah, sedang, sulit)

Mata Pelajaran: ${subject}
Kelas: ${grade}
Transkrip:
${transcript}

Output HANYA JSON array, tanpa teks lain, dengan format:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "...",
    "difficulty": "mudah"
  }
]
`.trim(),
};
