"use client";

import { useMemo, useState } from "react";
import { TrendingUp, PieChart, BarChart3, ChevronDown } from "lucide-react";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherTopBar } from "@/components/teacher/TeacherTopBar";
import { NewSessionForm } from "@/components/dashboard/NewSessionForm";
import { formatDurationShort } from "@/lib/format-relative-time";

// Palet kategorikal divalidasi lewat scripts/validate_palette.js (skill
// dataviz) — 3 warna asli Figma (#b85c3e/#ffdbd0/#f2ece1) gagal cek kontras &
// keterbacaan buta warna (semua kepucetan). Ini lolos semua cek (CVD ΔE > 8,
// normal-vision ΔE > 15, kontras >= 3:1) sambil tetap senada nuansa hangat.
const CONTENT_COLORS = {
  ringkasan: "#b85c3e",
  mindmap: "#0d9488",
  quiz: "#a16207",
};

type SessionRaw = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
};
type ContentRaw = { sessionId: string; createdAt: string };
type QuizRaw = { id: string; sessionId: string; createdAt: string; questionCount: number };
type AttemptRaw = { quizId: string; playerName: string; accuracy: number | null };

function monthKey(iso: string) {
  return iso.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center text-center text-sm text-brand-muted">
      {message}
    </div>
  );
}

function TrenAktivitasChart({ data }: { data: { label: string; count: number }[] }) {
  if (data.length === 0) {
    return <EmptyChartState message="Belum ada data sesi untuk rentang ini." />;
  }

  const width = 600;
  const height = 220;
  const padding = 24;
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (d.count / maxCount) * (height - padding * 2),
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padding}
          x2={width - padding}
          y1={height - padding - f * (height - padding * 2)}
          y2={height - padding - f * (height - padding * 2)}
          stroke="rgba(36,30,24,0.08)"
          strokeWidth={1}
        />
      ))}
      <path d={areaPath} fill="rgba(184,92,62,0.12)" stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={CONTENT_COLORS.ringkasan}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={CONTENT_COLORS.ringkasan}>
          <title>{`${p.label}: ${p.count} sesi`}</title>
        </circle>
      ))}
    </svg>
  );
}

function DistribusiKontenChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <EmptyChartState message="Belum ada materi (ringkasan/mind map/quiz) untuk rentang ini." />;
  }

  const stops = segments
    .reduce<{ parts: string[]; cumulative: number }>(
      (acc, s) => {
        const start = (acc.cumulative / total) * 100;
        const cumulative = acc.cumulative + s.value;
        const end = (cumulative / total) * 100;
        return { parts: [...acc.parts, `${s.color} ${start}% ${end}%`], cumulative };
      },
      { parts: [], cumulative: 0 }
    )
    .parts.join(", ");

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="relative flex size-44 shrink-0 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-brand-card">
          <span className="font-mono text-lg font-medium text-brand-dark">{total}</span>
          <span className="text-xs tracking-wide text-brand-muted">Total</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-brand-dark">{s.label}</span>
            </div>
            <span className="font-mono text-sm text-brand-dark">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformaKuisChart({ bars }: { bars: { label: string; value: number }[] }) {
  if (bars.length === 0) {
    return <EmptyChartState message="Belum ada data quiz yang dimainkan untuk topik apa pun." />;
  }

  const maxIndex = bars.reduce((best, b, i, arr) => (b.value > arr[best].value ? i : best), 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-56 gap-2 border-b border-black/10 pl-10">
        {[100, 75, 50, 25, 0].map((p) => (
          <span
            key={p}
            className="absolute left-0 -translate-y-1/2 font-mono text-xs text-brand-muted"
            style={{ bottom: `${p}%` }}
          >
            {p}%
          </span>
        ))}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="pointer-events-none absolute right-0 left-10 border-t border-black/5"
            style={{ bottom: `${p}%` }}
          />
        ))}
        <div className="flex flex-1 items-end justify-around gap-4">
          {bars.map((b, i) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="font-mono text-sm font-semibold text-brand-dark">
                {Math.round(b.value * 100)}%
              </span>
              <div
                className={`w-full max-w-16 rounded-t-2xl ${
                  i === maxIndex
                    ? "bg-brand shadow-sm"
                    : "border border-black/10 bg-brand-cream-alt"
                }`}
                style={{ height: `${Math.max(2, Math.round(b.value * 100))}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 pl-10">
        {bars.map((b) => (
          <span
            key={b.label}
            className="flex-1 truncate text-center text-xs font-semibold tracking-wide text-brand-dark"
            title={b.label}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AnalitikShell({
  teacherName,
  sessions,
  summaries,
  mindMaps,
  quizzes,
  attempts,
}: {
  teacherName: string;
  sessions: SessionRaw[];
  summaries: ContentRaw[];
  mindMaps: ContentRaw[];
  quizzes: QuizRaw[];
  attempts: AttemptRaw[];
}) {
  const [showNewSession, setShowNewSession] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");

  const subjectOptions = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.subject))).sort(),
    [sessions]
  );

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(sessions.map((s) => monthKey(s.createdAt))));
    return keys.sort().reverse();
  }, [sessions]);

  const {
    totalSesi,
    siswaTerlibat,
    rataRataDurasi,
    skorKuisRerata,
    trenData,
    distribusiSegments,
    performaBars,
  } = useMemo(() => {
    const filteredSessions = sessions.filter((s) => {
      if (subjectFilter !== "ALL" && s.subject !== subjectFilter) return false;
      if (monthFilter !== "ALL" && monthKey(s.createdAt) !== monthFilter) return false;
      return true;
    });
    const sessionIds = new Set(filteredSessions.map((s) => s.id));
    const sessionById = new Map(filteredSessions.map((s) => [s.id, s]));

    const filteredSummaries = summaries.filter((s) => sessionIds.has(s.sessionId));
    const filteredMindMaps = mindMaps.filter((m) => sessionIds.has(m.sessionId));
    const filteredQuizzes = quizzes.filter((q) => sessionIds.has(q.sessionId));
    const quizIds = new Set(filteredQuizzes.map((q) => q.id));
    const quizIdToSessionId = new Map(filteredQuizzes.map((q) => [q.id, q.sessionId]));
    const filteredAttempts = attempts.filter((a) => quizIds.has(a.quizId));

    const durations = filteredSessions
      .filter((s) => s.startedAt && s.endedAt)
      .map((s) => new Date(s.endedAt!).getTime() - new Date(s.startedAt!).getTime());
    const avgDurationMs =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

    const validAccuracies = filteredAttempts
      .map((a) => a.accuracy)
      .filter((a): a is number => a !== null);
    const avgAccuracy =
      validAccuracies.length > 0
        ? validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length
        : null;

    const dayCounts = new Map<string, number>();
    for (const s of filteredSessions) {
      const day = (s.startedAt ?? s.createdAt).slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
    const trenData = Array.from(dayCounts.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, count]) => ({
        label: new Date(day).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        count,
      }));

    const accuracyBySession = new Map<string, number[]>();
    for (const a of filteredAttempts) {
      if (a.accuracy === null) continue;
      const sessionId = quizIdToSessionId.get(a.quizId);
      if (!sessionId) continue;
      const arr = accuracyBySession.get(sessionId) ?? [];
      arr.push(a.accuracy);
      accuracyBySession.set(sessionId, arr);
    }
    const performaBars = Array.from(accuracyBySession.entries())
      .map(([sessionId, accs]) => ({
        label: sessionById.get(sessionId)?.title ?? "Sesi",
        value: accs.reduce((a, b) => a + b, 0) / accs.length,
      }))
      .slice(0, 6);

    return {
      totalSesi: filteredSessions.length,
      siswaTerlibat: new Set(filteredAttempts.map((a) => a.playerName)).size,
      rataRataDurasi: avgDurationMs !== null ? formatDurationShort(avgDurationMs) : "—",
      skorKuisRerata: avgAccuracy !== null ? `${Math.round(avgAccuracy * 100)}%` : "—",
      trenData,
      distribusiSegments: [
        { label: "Ringkasan", value: filteredSummaries.length, color: CONTENT_COLORS.ringkasan },
        { label: "Peta Pikiran", value: filteredMindMaps.length, color: CONTENT_COLORS.mindmap },
        { label: "Soal Latihan", value: filteredQuizzes.length, color: CONTENT_COLORS.quiz },
      ],
      performaBars,
    };
  }, [sessions, summaries, mindMaps, quizzes, attempts, subjectFilter, monthFilter]);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <TeacherSidebar onNewSession={() => setShowNewSession(true)} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <TeacherTopBar teacherName={teacherName} />

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-serif text-brand-dark">Dashboard Analitik</h2>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="cursor-pointer appearance-none rounded-full border border-black/10 bg-brand-card py-3 pr-10 pl-5 text-sm text-brand-dark transition-colors duration-150 hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  <option value="ALL">Semua Mata Pelajaran</option>
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 text-brand-muted" />
              </div>
              <div className="relative">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="cursor-pointer appearance-none rounded-full border border-black/10 bg-brand-card py-3 pr-10 pl-5 text-sm text-brand-dark transition-colors duration-150 hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  <option value="ALL">Semua Waktu</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 text-brand-muted" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
              <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                Total Sesi
              </p>
              <p className="font-mono text-4xl font-semibold text-brand">{totalSesi}</p>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
              <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                Siswa Terlibat
              </p>
              <p className="font-mono text-4xl font-semibold text-[#994428]">{siswaTerlibat}</p>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
              <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                Rata-Rata Durasi
              </p>
              <p className="font-mono text-4xl font-semibold text-brand-dark">{rataRataDurasi}</p>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
              <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                Skor Kuis Rerata
              </p>
              <p className="font-mono text-4xl font-semibold text-success">{skorKuisRerata}</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 flex flex-col gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-brand" />
                <h3 className="text-2xl font-semibold text-brand-dark">Tren Aktivitas Sesi</h3>
              </div>
              <div className="h-56 border-t border-black/10 pt-4">
                <TrenAktivitasChart data={trenData} />
              </div>
            </div>

            <div className="col-span-4 flex flex-col gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
              <div className="flex items-center gap-2">
                <PieChart className="size-5 text-brand" />
                <h3 className="text-2xl font-semibold text-brand-dark">Distribusi Konten</h3>
              </div>
              <DistribusiKontenChart segments={distribusiSegments} />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-brand-card p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-brand" />
              <h3 className="text-2xl font-semibold text-brand-dark">Performa Kuis per Topik</h3>
            </div>
            <PerformaKuisChart bars={performaBars} />
          </div>
        </main>
      </div>

      <NewSessionForm open={showNewSession} onClose={() => setShowNewSession(false)} />
    </div>
  );
}
