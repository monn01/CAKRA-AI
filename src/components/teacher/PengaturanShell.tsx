"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { User, Mic, Bell, X } from "lucide-react";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherTopBar } from "@/components/teacher/TeacherTopBar";
import { NewSessionForm } from "@/components/dashboard/NewSessionForm";
import { DisplayPreferences } from "@/components/dashboard/DisplayPreferences";
import { Button } from "@/components/ui/Button";
import { getPreferredMicId, setPreferredMicId } from "@/lib/mic-preference";

type TeacherProfile = {
  name: string;
  email: string;
  school: string;
  mainSubject: string;
  notifySessionComplete: boolean;
  notifyAudioQuality: boolean;
  notifySystemUpdates: boolean;
};

export function PengaturanShell({
  teacher,
  appVersion,
  hasNewVersion,
  aiInfo,
}: {
  teacher: TeacherProfile;
  appVersion: string;
  hasNewVersion: boolean;
  aiInfo: { providerLabel: string; model: string; sttLabel: string };
}) {
  const [showNewSession, setShowNewSession] = useState(false);
  const [draft, setDraft] = useState(teacher);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionBannerOpen, setVersionBannerOpen] = useState(hasNewVersion);

  const [micDevices, setMicDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [micDeviceId, setMicDeviceId] = useState("");

  useEffect(() => {
    // Dibaca setelah mount — localStorage tidak tersedia di server, jadi tidak
    // bisa diturunkan sinkron dari props/state lain.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMicDeviceId(getPreferredMicId());

    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const mics = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Mikrofon ${i + 1}` }));
        setMicDevices(mics);
      })
      .catch(() => setMicDevices([]));
  }, []);

  function handleMicChange(deviceId: string) {
    setMicDeviceId(deviceId);
    setPreferredMicId(deviceId);
  }

  async function persist(patch: Partial<TeacherProfile> & { lastSeenAppVersion?: string }) {
    const res = await fetch("/api/teacher/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await persist({
      name: draft.name,
      school: draft.school,
      mainSubject: draft.mainSubject,
      notifySessionComplete: draft.notifySessionComplete,
      notifyAudioQuality: draft.notifyAudioQuality,
      notifySystemUpdates: draft.notifySystemUpdates,
    });

    setSaving(false);

    if (!res.ok) {
      setError("Gagal menyimpan pengaturan. Coba lagi.");
      return;
    }

    if (draft.notifySessionComplete && typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleCancel() {
    setDraft(teacher);
    setError(null);
  }

  async function dismissVersionBanner() {
    setVersionBannerOpen(false);
    await persist({ lastSeenAppVersion: appVersion });
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(teacher);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <TeacherSidebar onNewSession={() => setShowNewSession(true)} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <TeacherTopBar teacherName={teacher.name} />

        <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-3xl text-brand-dark">Pengaturan Profil & Sistem</h1>
            <p className="text-base text-brand-muted">
              Kelola preferensi akun, perangkat kelas, dan notifikasi Anda.
            </p>
          </div>

          {versionBannerOpen && (
            <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark">
              <span>
                CAKRA-AI sudah diperbarui ke v{appVersion}. Muat ulang halaman untuk pembaruan terbaru.
              </span>
              <button
                onClick={dismissVersionBanner}
                aria-label="Tutup notifikasi pembaruan"
                className="cursor-pointer rounded-md p-1 text-brand-dark transition-colors hover:bg-black/5"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Informasi Pribadi */}
            <section className="col-span-2 flex flex-col gap-6 rounded-lg border border-black/10 bg-brand-card p-6 shadow-sm">
              <h2 className="flex items-center gap-3 text-2xl font-semibold text-brand-dark">
                <User className="size-4 text-brand" />
                Informasi Pribadi
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <Field label="Nama Lengkap & Gelar">
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded border border-black/20 bg-brand-cream-alt px-4 py-2 text-base text-brand-dark outline-none focus:border-brand"
                  />
                </Field>
                <Field label="Instansi Pendidikan">
                  <input
                    value={draft.school}
                    onChange={(e) => setDraft((d) => ({ ...d, school: e.target.value }))}
                    placeholder="Misal: SDN 1 Nusantara"
                    className="w-full rounded border border-black/20 bg-brand-cream-alt px-4 py-2 text-base text-brand-dark outline-none placeholder:text-brand-muted/60 focus:border-brand"
                  />
                </Field>
                <Field label="Alamat Surel (Email)">
                  <input
                    value={draft.email}
                    disabled
                    className="w-full cursor-not-allowed rounded border border-black/10 bg-black/5 px-4 py-2 text-base text-brand-muted"
                  />
                </Field>
                <Field label="Mata Pelajaran Utama">
                  <input
                    value={draft.mainSubject}
                    onChange={(e) => setDraft((d) => ({ ...d, mainSubject: e.target.value }))}
                    placeholder="Misal: IPA"
                    className="w-full rounded border border-black/20 bg-brand-cream-alt px-4 py-2 text-base text-brand-dark outline-none placeholder:text-brand-muted/60 focus:border-brand"
                  />
                </Field>
              </div>
              <p className="text-xs text-brand-muted">
                Email dipakai untuk masuk ke Panel Guru — hubungi admin sekolah kalau perlu diganti.
              </p>
            </section>

            {/* Perangkat Kelas */}
            <section className="flex flex-col gap-6 rounded-lg border border-black/10 bg-brand-card p-6 shadow-sm">
              <h2 className="flex items-center gap-3 text-2xl font-semibold text-brand-dark">
                <Mic className="size-4 text-brand" />
                Perangkat Kelas
              </h2>

              <Field label="Sumber Mikrofon">
                <select
                  value={micDeviceId}
                  onChange={(e) => handleMicChange(e.target.value)}
                  className="w-full cursor-pointer rounded border border-black/20 bg-brand-cream-alt px-4 py-2 text-base text-brand-dark outline-none focus:border-brand"
                >
                  <option value="">Default Sistem</option>
                  {micDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-muted">
                  Dipakai untuk pemeriksaan kualitas audio saat merekam. Subtitle live (Web Speech
                  API) selalu mengikuti mikrofon default sistem — atur lewat pengaturan perangkat
                  kalau perlu diganti.
                </p>
              </Field>

              <div className="flex flex-col gap-2 rounded border border-black/10 bg-brand-cream p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-dark">Status CAKRA Box</span>
                  <span className="flex items-center gap-1 text-xs font-semibold tracking-wide text-brand-muted uppercase">
                    <span className="size-2 rounded-full bg-neutral-400" />
                    Segera Hadir
                  </span>
                </div>
                <p className="font-mono text-sm text-brand-muted">
                  Perangkat perekam khusus kelas — belum tersedia untuk deployment ini.
                </p>
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded border border-black/20 py-2 text-base text-brand-muted opacity-60"
                >
                  Putuskan Sambungan
                </button>
              </div>
            </section>

            {/* Preferensi Notifikasi */}
            <section className="flex flex-col gap-6 rounded-lg border border-black/10 bg-brand-card p-6 shadow-sm">
              <h2 className="flex items-center gap-3 text-2xl font-semibold text-brand-dark">
                <Bell className="size-4 text-brand" />
                Preferensi Notifikasi
              </h2>
              <div className="flex flex-col gap-3">
                <NotifCheckbox
                  label="Laporan Sesi Selesai"
                  helper="Tampilkan notifikasi browser saat sesi mengajar selesai direkam."
                  checked={draft.notifySessionComplete}
                  onChange={(v) => setDraft((d) => ({ ...d, notifySessionComplete: v }))}
                />
                <NotifCheckbox
                  label="Peringatan Kualitas Audio"
                  helper="Peringatan di layar kalau suara kelas terlalu pelan saat merekam."
                  checked={draft.notifyAudioQuality}
                  onChange={(v) => setDraft((d) => ({ ...d, notifyAudioQuality: v }))}
                />
                <NotifCheckbox
                  label="Pembaruan Sistem CAKRA-AI"
                  helper="Info versi baru dan pemeliharaan sistem."
                  checked={draft.notifySystemUpdates}
                  onChange={(v) => setDraft((d) => ({ ...d, notifySystemUpdates: v }))}
                />
              </div>
            </section>
          </div>

          {/* Preferensi Kuis Default */}
          <section className="flex flex-col gap-3 rounded-lg border border-black/10 bg-brand-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">
              Preferensi Kuis Default
            </h2>
            <DisplayPreferences />
          </section>

          {/* Konfigurasi AI (read-only) */}
          <section className="flex flex-col gap-3 rounded-lg border border-black/10 bg-brand-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">
              Konfigurasi AI
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Provider LLM</span>
                <span className="text-brand-dark">{aiInfo.providerLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Model</span>
                <span className="text-brand-dark">{aiInfo.model}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Speech-to-Text</span>
                <span className="text-brand-dark">{aiInfo.sttLabel}</span>
              </div>
            </div>
            <p className="text-xs text-brand-muted">
              Konfigurasi ini diatur lewat environment variable server (`.env`), bukan lewat halaman ini
              — hubungi admin sekolah kalau perlu diganti.
            </p>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm font-medium text-success">Pengaturan tersimpan.</p>}

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={handleCancel}
              disabled={!dirty}
              className="cursor-pointer rounded border border-brand-dark px-6 py-2 text-base text-brand-dark transition-all duration-150 hover:bg-brand-cream-alt active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Batalkan Perubahan
            </button>
            <Button variant="primary" size="md" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>

          <div className="flex justify-center pb-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer rounded-md px-2 py-1 text-base text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              Keluar dari Sesi
            </button>
          </div>
        </main>
      </div>

      <NewSessionForm open={showNewSession} onClose={() => setShowNewSession(false)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold tracking-wide text-[#55433d] uppercase">{label}</label>
      {children}
    </div>
  );
}

function NotifCheckbox({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded p-2 transition-colors hover:bg-black/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 cursor-pointer accent-brand"
      />
      <div className="flex flex-col">
        <span className="font-medium text-brand-dark">{label}</span>
        <span className="text-sm text-brand-muted">{helper}</span>
      </div>
    </label>
  );
}
