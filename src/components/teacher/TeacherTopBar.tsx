import { Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

export function TeacherTopBar({ teacherName }: { teacherName: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-end gap-6 border-b border-[rgba(219,193,185,0.3)] bg-brand-cream/90 px-6 py-4 backdrop-blur-sm">
      {/* Belum ada sistem notifikasi asli — statis dulu, bukan dipalsu seolah aktif */}
      <Bell className="size-4 text-brand-muted" aria-hidden="true" />

      <div className="flex items-center gap-3">
        <span className="text-sm text-brand-muted">{teacherName}</span>
        <div className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-brand-cream-alt text-sm font-bold text-brand">
          {getInitials(teacherName)}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
