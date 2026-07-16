// Kelas SD biasanya ditulis "3" atau "3A" — urutkan angka dulu, baru rombel (huruf).
function gradeSortKey(grade: string): [number, string] {
  const match = grade.trim().match(/^(\d+)\s*(.*)$/);
  if (match) return [Number(match[1]), match[2].trim().toLowerCase()];
  return [Number.POSITIVE_INFINITY, grade.trim().toLowerCase()];
}

export function compareGrades(a: string, b: string): number {
  const [aNum, aSuffix] = gradeSortKey(a);
  const [bNum, bSuffix] = gradeSortKey(b);
  if (aNum !== bNum) return aNum - bNum;
  return aSuffix.localeCompare(bSuffix);
}
