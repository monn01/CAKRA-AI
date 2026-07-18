"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, BarChart3, History, Settings, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Ringkasan", icon: FileText },
  { href: "/analitik", label: "Analitik Siswa", icon: BarChart3 },
  { href: "/riwayat", label: "Riwayat Sesi", icon: History },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function TeacherSidebar({ onNewSession }: { onNewSession: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col overflow-y-auto border-r border-[rgba(219,193,185,0.3)] bg-brand-cream-alt px-6 py-4">
      <div className="flex flex-col gap-1 pb-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-brand">CAKRA-AI</h1>
        <p className="text-base text-brand-muted">Panel Guru</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded px-4 py-3 text-base transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                active
                  ? "border-r-4 border-brand bg-[rgba(237,224,214,0.5)] font-bold text-brand"
                  : "text-brand-muted hover:bg-[rgba(237,224,214,0.3)]"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onNewSession}
        className="flex cursor-pointer items-center justify-center gap-2 rounded bg-brand py-3 text-base font-bold text-white transition-all duration-150 hover:bg-brand/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2"
      >
        <Plus className="size-4" />
        Buat Sesi Baru
      </button>
    </aside>
  );
}
