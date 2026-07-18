"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb, FileText, Network, ListChecks, Clock } from "lucide-react";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherTopBar } from "@/components/teacher/TeacherTopBar";
import { NewSessionForm } from "@/components/dashboard/NewSessionForm";

type MateriItem = {
  id: string;
  sessionId: string;
  type: "ringkasan" | "mindmap" | "quiz";
  sessionTitle: string;
  subject: string;
  grade: string;
  questionCount?: number;
  createdAt: string;
  relativeTime: string;
};

const MATERI_ICON = {
  ringkasan: { icon: FileText, tint: "bg-[rgba(255,219,208,0.4)]" },
  mindmap: { icon: Network, tint: "bg-[rgba(238,224,207,0.4)]" },
  quiz: { icon: ListChecks, tint: "bg-[rgba(237,224,214,0.5)]" },
} as const;

const MATERI_LABEL = {
  ringkasan: (title: string) => `Ringkasan: ${title}`,
  mindmap: (title: string) => `Peta Pikiran: ${title}`,
  quiz: (title: string) => `Latihan: ${title}`,
} as const;

export function RingkasanShell({
  teacherName,
  greeting,
  subtitle,
  stats,
  suggestion,
  recentMateri,
}: {
  teacherName: string;
  greeting: string;
  subtitle: string;
  stats: {
    durasiJam: number;
    materiDibuat: number;
    evaluasiAktif: number;
  };
  suggestion: string;
  recentMateri: MateriItem[];
}) {
  const [showNewSession, setShowNewSession] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <TeacherSidebar onNewSession={() => setShowNewSession(true)} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <TeacherTopBar teacherName={teacherName} />

        <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8">
          <section className="relative flex items-center justify-between overflow-hidden rounded-xl border border-black/10 bg-brand-card p-8">
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-[rgba(255,181,158,0.2)] to-transparent"
              aria-hidden="true"
            />
            <div className="relative flex max-w-xl flex-col gap-2">
              <h2 className="font-serif text-3xl text-brand-dark">{greeting}</h2>
              <p className="text-base text-brand-muted">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewSession(true)}
              className="relative shrink-0 rounded-lg bg-brand px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-brand/90"
            >
              + Sesi Baru
            </button>
          </section>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 flex flex-col gap-6">
              <h3 className="text-2xl font-semibold text-brand-dark">Kilas Balik</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col justify-between gap-2 rounded-lg border border-black/10 bg-brand-card p-5">
                  <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                    Total Durasi Mengajar (Bulan Ini)
                  </p>
                  <p className="flex items-baseline gap-2 font-mono text-brand-dark">
                    <span className="text-4xl">{stats.durasiJam}</span>
                    <span className="text-lg text-brand-muted">Jam</span>
                  </p>
                </div>
                <div className="flex flex-col justify-between gap-2 rounded-lg border border-black/10 bg-brand-card p-4">
                  <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                    Materi Dibuat
                  </p>
                  <p className="font-mono text-3xl text-brand">{stats.materiDibuat}</p>
                </div>
                <div className="flex flex-col justify-between gap-2 rounded-lg border border-black/10 bg-brand-card p-4">
                  <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase">
                    Evaluasi Aktif
                  </p>
                  <p className="font-mono text-3xl text-success">{stats.evaluasiAktif}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-lg border border-[rgba(219,193,185,0.4)] bg-brand-cream-alt p-5">
                <div className="flex gap-4">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand" />
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-brand-dark">Saran Sistem</h4>
                    <p className="text-sm leading-relaxed text-[#55433d]">{suggestion}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-7 flex flex-col gap-6">
              <h3 className="text-2xl font-semibold text-brand-dark">Materi Terakhir Dibuat</h3>

              <div className="flex flex-col gap-4">
                {recentMateri.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-black/20 p-6 text-center text-sm text-brand-muted">
                    Belum ada materi yang dibuat. Mulai sesi baru untuk menghasilkan rangkuman, mind map,
                    dan quiz.
                  </p>
                ) : (
                  recentMateri.map((item) => {
                    const { icon: Icon, tint } = MATERI_ICON[item.type];
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-black/10 bg-brand-card px-5 py-5"
                      >
                        <div className="flex gap-4">
                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded ${tint}`}
                          >
                            <Icon className="size-5 text-brand" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="font-bold text-brand-dark">
                              {MATERI_LABEL[item.type](item.sessionTitle)}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded bg-brand-cream-alt px-2 py-1 text-[10px] text-brand-muted">
                                {item.subject} Kelas {item.grade}
                              </span>
                              {item.type === "quiz" && item.questionCount !== undefined && (
                                <span className="border-l border-[#dbc1b9] pl-2 text-xs text-brand-muted">
                                  {item.questionCount} Soal
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-brand-muted">
                                <Clock className="size-3" />
                                {item.relativeTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/session/${item.sessionId}`}
                          className="shrink-0 rounded border border-black/20 px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-cream-alt"
                        >
                          Buka
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>

              <Link
                href="/riwayat"
                className="py-3 text-center text-sm font-medium text-brand-muted hover:text-brand-dark"
              >
                Lihat Semua Riwayat
              </Link>
            </div>
          </div>
        </main>
      </div>

      <NewSessionForm open={showNewSession} onClose={() => setShowNewSession(false)} />
    </div>
  );
}
