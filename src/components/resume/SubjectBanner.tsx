import {
  Atom,
  Calculator,
  BookOpen,
  Globe,
  Palette,
  Music,
  Dumbbell,
  Landmark,
  Leaf,
  FlaskConical,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const SUBJECT_MAP: { keywords: string[]; icon: LucideIcon; color: string }[] = [
  { keywords: ["fisika", "ipa"], icon: Atom, color: "bg-sky-100 text-sky-700" },
  { keywords: ["kimia"], icon: FlaskConical, color: "bg-violet-100 text-violet-700" },
  { keywords: ["biologi"], icon: Leaf, color: "bg-emerald-100 text-emerald-700" },
  { keywords: ["matematika", "hitung"], icon: Calculator, color: "bg-amber-100 text-amber-700" },
  { keywords: ["bahasa", "sastra", "literasi"], icon: BookOpen, color: "bg-rose-100 text-rose-700" },
  { keywords: ["ips", "geografi", "sejarah", "ppkn"], icon: Landmark, color: "bg-orange-100 text-orange-700" },
  { keywords: ["dunia", "sosial", "geo"], icon: Globe, color: "bg-teal-100 text-teal-700" },
  { keywords: ["seni", "rupa"], icon: Palette, color: "bg-pink-100 text-pink-700" },
  { keywords: ["musik"], icon: Music, color: "bg-indigo-100 text-indigo-700" },
  { keywords: ["olahraga", "pjok", "penjas"], icon: Dumbbell, color: "bg-lime-100 text-lime-700" },
];

function resolveSubject(subject: string) {
  const lower = subject.toLowerCase();
  for (const entry of SUBJECT_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry;
  }
  return { icon: Sparkles, color: "bg-neutral-100 text-neutral-700" };
}

export function SubjectBanner({ subject }: { subject: string }) {
  const { icon: Icon, color } = resolveSubject(subject);

  return (
    <div className={`flex h-24 w-full items-center justify-center rounded-xl ${color}`}>
      <Icon size={40} strokeWidth={1.5} />
    </div>
  );
}
